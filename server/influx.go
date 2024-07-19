package server

import (
	"bytes"
	"crypto/tls"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"

	"github.com/influxdata/chronograf"
	uuid "github.com/influxdata/chronograf/id"
	"github.com/influxdata/chronograf/influx"
	"github.com/influxdata/chronograf/util"
)

// ValidInfluxRequest checks if queries specify a command.
func ValidInfluxRequest(p chronograf.Query) error {
	if p.Command == "" {
		return fmt.Errorf("query field required")
	}
	return nil
}

type postInfluxResponse struct {
	Results interface{} `json:"results"`        // results from influx
	UUID    string      `json:"uuid,omitempty"` // uuid passed from client to identify results
}

// Influx proxies requests to influxdb.
func (s *Service) Influx(w http.ResponseWriter, r *http.Request) {
	id, err := paramID("id", r)
	if err != nil {
		Error(w, http.StatusUnprocessableEntity, err.Error(), s.Logger)
		return
	}

	var req chronograf.Query
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		invalidJSON(w, s.Logger)
		return
	}
	if err = ValidInfluxRequest(req); err != nil {
		invalidData(w, err, s.Logger)
		return
	}

	ctx := r.Context()
	src, err := s.Store.Sources(ctx).Get(ctx, id)
	if err != nil {
		notFound(w, id, s.Logger)
		return
	}

	ts, err := s.TimeSeries(src)
	if err != nil {
		msg := fmt.Sprintf("Unable to connect to source %d: %v", id, err)
		Error(w, http.StatusBadRequest, msg, s.Logger)
		return
	}

	if err = ts.Connect(ctx, &src); err != nil {
		msg := fmt.Sprintf("Unable to connect to source %d: %v", id, err)
		Error(w, http.StatusBadRequest, msg, s.Logger)
		return
	}

	// inspect request command to specify additional request parameters
	setupQueryFromCommand(&req)
	response, err := ts.Query(ctx, req)
	if err != nil {
		if err == chronograf.ErrUpstreamTimeout {
			msg := "Timeout waiting for Influx response"
			Error(w, http.StatusRequestTimeout, msg, s.Logger)
			return
		}
		// TODO: Here I want to return the error code from influx.
		Error(w, http.StatusBadRequest, err.Error(), s.Logger)
		return
	}

	uniqueID := req.UUID
	if uniqueID == "" {
		newUUID, err := (&uuid.UUID{}).Generate()
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to create a unique identifier", s.Logger)
			return
		}
		uniqueID = newUUID
	}

	res := postInfluxResponse{
		Results: response,
		UUID:    uniqueID,
	}
	encodeJSON(w, http.StatusOK, res, s.Logger)
}

func (s *Service) Write(w http.ResponseWriter, r *http.Request) {
	id, err := paramID("id", r)
	if err != nil {
		Error(w, http.StatusUnprocessableEntity, err.Error(), s.Logger)
		return
	}

	ctx := r.Context()
	src, err := s.Store.Sources(ctx).Get(ctx, id)
	if err != nil {
		notFound(w, id, s.Logger)
		return
	}

	u, err := url.Parse(src.URL)
	if err != nil {
		msg := fmt.Sprintf("Error parsing source url: %v", err)
		Error(w, http.StatusUnprocessableEntity, msg, s.Logger)
		return
	}
	query := r.URL.Query()
	version := query.Get("v")
	query.Del("v")
	if strings.HasPrefix(version, "2") {
		u = util.AppendPath(u, "/api/v2/write")
		// v2 organization name is stored in username (org does not matter against v1)
		query.Set("org", src.Username)
		query.Set("bucket", query.Get("db"))
		query.Del("db")
	} else {
		u = util.AppendPath(u, "/write")
	}
	u.RawQuery = query.Encode()

	director := func(req *http.Request) {
		// Set the Host header of the original source URL
		req.Host = u.Host
		req.URL = u
		// Because we are acting as a proxy, influxdb needs to have the
		// basic auth or bearer token information set as a header directly
		auth := influx.DefaultAuthorization(&src)
		auth.Set(req)
	}

	proxy := &httputil.ReverseProxy{
		Director: director,
	}

	// The connection to influxdb is using a self-signed certificate.
	// This modifies uses the same values as http.DefaultTransport but specifies
	// InsecureSkipVerify
	if src.InsecureSkipVerify {
		proxy.Transport = &http.Transport{
			Proxy: http.ProxyFromEnvironment,
			DialContext: (&net.Dialer{
				Timeout:   30 * time.Second,
				KeepAlive: 30 * time.Second,
				DualStack: true,
			}).DialContext,
			MaxIdleConns:          100,
			IdleConnTimeout:       90 * time.Second,
			TLSHandshakeTimeout:   10 * time.Second,
			ExpectContinueTimeout: 1 * time.Second,
			TLSClientConfig:       &tls.Config{InsecureSkipVerify: true},
		}
	}

	proxy.ServeHTTP(w, r)
}

// setupQueryFromCommand set query parameters from its command
func setupQueryFromCommand(req *chronograf.Query) {
	// normalize whitespaces
	req.Command = strings.Join(strings.Fields(req.Command), " ")

	// set active database (and retention policy) from the query
	useDb := func(dbSpec string) error {
		dbSpecReader := csv.NewReader(bytes.NewReader(([]byte)(dbSpec)))
		dbSpecReader.Comma = '.'
		if dbrp, err := dbSpecReader.Read(); err == nil {
			if len(dbrp) > 0 {
				req.DB = dbrp[0]
			}
			if len(dbrp) > 1 {
				req.RP = dbrp[1]
			}
			return nil
		} else {
			return err
		}
	}

	// allow to set active database with USE command or via ON clause, examples:
	//  use mydb
	//  use "mydb"
	//  USE "mydb"."myrp"
	//  use "mydb.myrp"
	//  use mydb.myrp
	//  show tag keys on "mydb"
	//  SHOW TAG KEYS ON "mydb"
	command := strings.ToLower(req.Command)
	if strings.HasPrefix(command, "use ") {
		if nextCommand := strings.IndexRune(req.Command, ';'); nextCommand > 4 {
			dbSpec := strings.TrimSpace(req.Command[4:nextCommand])
			if useDb(dbSpec) == nil {
				req.Command = strings.TrimSpace(req.Command[nextCommand+1:])
			}
		}
	} else if strings.Contains(command, " on ") {
		fields := strings.Fields(req.Command)
		for i, field := range fields {
			if strings.ToLower(field) == "on" {
				if i < len(fields)-1 {
					_ = useDb(fields[i+1])
				}
				break
			}
		}
	}
}
