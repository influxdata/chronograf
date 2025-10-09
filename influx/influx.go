package influx

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/util"
)

var _ chronograf.TimeSeries = &Client{}
var _ chronograf.TSDBStatus = &Client{}
var _ chronograf.Databases = &Client{}

// Shared transports for all clients to prevent leaking connections
var skipVerifyTransport *http.Transport
var defaultTransport *http.Transport

// SharedTransport returns a shared transport with requested TLS InsecureSkipVerify value
func SharedTransport(skipVerify bool) *http.Transport {
	if skipVerify {
		return skipVerifyTransport
	}
	return defaultTransport
}

func init() {
	skipVerifyTransport = util.CreateTransport(true)
	defaultTransport = util.CreateTransport(false)
}

// Client is a device for retrieving time series data from an InfluxDB instance
type Client struct {
	URL                *url.URL
	Authorizer         Authorizer
	MgmtURL            *url.URL   // (optional) URL for management API
	MgmtAuthorizer     Authorizer // (optional) Authorizer for management API
	InsecureSkipVerify bool
	SrcType            string
	Logger             chronograf.Logger
	DefaultDB          string

	csvTagsStore *CSVTagsStore // (optional) Store to load CSV tag files from source.TagsCSVPath directory
}

// Response is a partial JSON decoded InfluxQL response used
// to check for some errors
type responseType struct {
	Results json.RawMessage
	Err     string `json:"error,omitempty"`   //v1 error message
	V2Err   string `json:"message,omitempty"` //v2 error message
}

// MarshalJSON returns the raw results bytes from the response
func (r responseType) MarshalJSON() ([]byte, error) {
	return r.Results, nil
}

func (r *responseType) Error() string {
	if r.Err != "" {
		return r.Err
	}
	return r.V2Err
}

func (c *Client) query(u *url.URL, q chronograf.Query) (chronograf.Response, error) {
	u = util.AppendPath(u, "/query")

	req, err := http.NewRequest("POST", u.String(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	command := q.Command
	logs := c.Logger.
		WithField("component", "proxy").
		WithField("host", req.Host).
		WithField("command", command).
		WithField("db", q.DB).
		WithField("rp", q.RP)
	logs.Debug("query")

	params := req.URL.Query()
	params.Set("q", command)
	params.Set("db", q.DB)
	params.Set("rp", q.RP)
	params.Set("epoch", "ms")
	if q.Epoch != "" {
		params.Set("epoch", q.Epoch)
	}
	req.URL.RawQuery = params.Encode()

	if c.Authorizer != nil {
		if err := c.Authorizer.Set(req); err != nil {
			logs.Error("Error setting authorization header ", err)
			return nil, err
		}
	}

	hc := &http.Client{}
	hc.Transport = SharedTransport(c.InsecureSkipVerify)
	resp, err := hc.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var response responseType
	b, _ := io.ReadAll(resp.Body)
	logs.Debug("JSON response from InfluxDB: ", string(b))
	dec := json.NewDecoder(bytes.NewReader(b))
	decErr := dec.Decode(&response)

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("received status code %d from server: err: %s", resp.StatusCode, response.Error())
	}

	// ignore this error if we got an invalid status code
	if decErr != nil && decErr.Error() == "EOF" && resp.StatusCode != http.StatusOK {
		decErr = nil
	}

	// If we got a valid decode error, send that back
	if decErr != nil {
		logs.WithField("influx_status", resp.StatusCode).
			Error("Error parsing results from influxdb: err:", decErr)
		return nil, decErr
	}

	return &response, nil
}

type result struct {
	Response chronograf.Response
	Err      error
}

// Query issues a request to a configured InfluxDB instance for time series
// information specified by query. Queries must be "fully-qualified," and
// include both the database and retention policy. In-flight requests can be
// cancelled using the provided context.
func (c *Client) Query(ctx context.Context, q chronograf.Query) (chronograf.Response, error) {
	if c.SrcType == chronograf.InfluxDBv3Clustered || c.SrcType == chronograf.InfluxDBv3CloudDedicated {
		logs := c.Logger.
			WithField("component", "proxy").
			WithField("command", q.Command)

		cmdUpper := strings.ToUpper(q.Command)
		switch {
		case cmdUpper == "SHOW DATABASES":
			return c.showDatabasesViaMgmtApi(ctx)

		case strings.Contains(cmdUpper, "SHOW MEASUREMENTS"):
			if resp, err := c.handleShowMeasurements(q, logs); resp != nil || err != nil {
				return resp, err
			}

		case strings.Contains(cmdUpper, "SHOW TAG KEYS"):
			if resp, err := c.handleShowTagKeys(q, logs); resp != nil || err != nil {
				return resp, err
			}
		case strings.Contains(cmdUpper, "SHOW TAG VALUES"):
			if resp, err := c.handleShowTagValues(&q, logs); resp != nil || err != nil {
				return resp, err
			}
		}
	}

	resps := make(chan (result))
	go func() {
		var resp chronograf.Response
		var err error
		if c.SrcType == chronograf.InfluxDBv3Core || c.SrcType == chronograf.InfluxDBv3Enterprise {
			// v3 Core, v3 Enterprise
			resp, err = c.queryV3(c.URL, q)
		} else {
			// v1, v2, v3 Clustered, v3 Cloud Dedicated
			resp, err = c.query(c.URL, q)
		}
		resps <- result{resp, err}
	}()

	select {
	case resp := <-resps:
		return resp.Response, resp.Err
	case <-ctx.Done():
		return nil, chronograf.ErrUpstreamTimeout
	}
}

// ValidateAuth returns error when an authenticated communication with the source fails
func (c *Client) ValidateAuth(ctx context.Context, src *chronograf.Source) error {
	ctx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	// v3 Clustered, v3 Cloud Dedicated:
	if src.Type == chronograf.InfluxDBv3Clustered || src.Type == chronograf.InfluxDBv3CloudDedicated {
		return c.validateClusteredOrCloudDedicatedAuth(ctx)
	}
	// v2: use flux query
	if src.Type == chronograf.InfluxDBv2 {
		return c.validateV2Auth(ctx, src)
	}
	// v1, v3 Core, v3 Enterprise: use InfluxQL
	if _, err := c.Query(ctx, chronograf.Query{Command: "SHOW DATABASES"}); err != nil {
		return err
	}
	return nil
}

// validateV2Auth uses Flux query to validate token authentication
func (c *Client) validateV2Auth(ctx context.Context, src *chronograf.Source) error {
	u, err := url.Parse(c.URL.String())
	if err != nil {
		return err
	}
	u = util.AppendPath(u, "/api/v2/query")
	command := "buckets()"
	req, err := http.NewRequest("POST", u.String(), strings.NewReader(command))
	if err != nil {
		return err
	}
	req = req.WithContext(ctx)
	req.Header.Set("Content-Type", "application/vnd.flux")
	logs := c.Logger.
		WithField("component", "proxy").
		WithField("host", req.Host).
		WithField("command", command).
		WithField("org", src.Username)
	logs.Debug("api/v2/query")

	params := req.URL.Query()
	params.Set("org", src.Username) // org is stored in Username
	req.URL.RawQuery = params.Encode()

	if c.Authorizer != nil {
		if err := c.Authorizer.Set(req); err != nil {
			logs.Error("Error setting authorization header ", err)
			return err
		}
	}

	return c.executeRequest(err, req)
}

func (c *Client) executeRequest(err error, req *http.Request) error {
	hc := &http.Client{}
	hc.Transport = SharedTransport(c.InsecureSkipVerify)
	resp, err := hc.Do(req)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled) {
			return chronograf.ErrUpstreamTimeout
		}
		return err
	}
	defer resp.Body.Close()

	var response responseType

	if resp.StatusCode != http.StatusOK {
		dec := json.NewDecoder(resp.Body)
		dec.Decode(&response)
		return fmt.Errorf("received status code %d from server: err: %s", resp.StatusCode, response.Error())
	}

	return nil
}

// Connect caches the URL and optional Bearer Authorization for the data source
func (c *Client) Connect(ctx context.Context, src *chronograf.Source) error {
	u, err := url.Parse(src.URL)
	if err != nil {
		return err
	}
	c.Authorizer = DefaultAuthorization(src)
	// Only allow acceptance of all certs if the scheme is https AND the user opted into to the setting.
	if u.Scheme == "https" && src.InsecureSkipVerify {
		c.InsecureSkipVerify = src.InsecureSkipVerify
	}

	c.URL = u

	if src.Type == chronograf.InfluxDBv3Clustered {
		// InfluxDB Clustered also provides a management API.
		accountID := "11111111-1111-1111-1111-111111111111" // hardcoded value
		clusterID := "11111111-1111-1111-1111-111111111111" // hardcoded value
		baseURL := *c.URL
		baseURL.Path = ""
		baseURL.RawQuery = ""
		mgmtUrl := fmt.Sprintf("%s/api/v0/accounts/%s/clusters/%s", baseURL.String(), accountID, clusterID)
		if u, err = url.Parse(mgmtUrl); err != nil {
			return err
		}

		c.MgmtURL = u
		c.MgmtAuthorizer = &BearerToken{
			Token: src.ManagementToken,
		}
	}

	if src.Type == chronograf.InfluxDBv3CloudDedicated {
		if len(src.AccountID) > 0 {
			// InfluxDB Cloud Dedicated also provides a management API.
			mgmtUrl := fmt.Sprintf("https://console.influxdata.com/api/v0/accounts/%s/clusters/%s", src.AccountID, src.ClusterID)
			if u, err = url.Parse(mgmtUrl); err != nil {
				return err
			}

			c.MgmtURL = u
			c.MgmtAuthorizer = &BearerToken{
				Token: src.ManagementToken,
			}
		}
		c.DefaultDB = src.DefaultDB
		if src.TagsCSVPath != "" {
			if c.csvTagsStore, err = NewCSVTagsStore(src.TagsCSVPath, c.Logger); err != nil {
				return err
			}
		}
	}
	c.SrcType = src.Type
	return nil
}

// Users transforms InfluxDB into a user store
func (c *Client) Users(ctx context.Context) chronograf.UsersStore {
	return c
}

// Roles aren't support in OSS
func (c *Client) Roles(ctx context.Context) (chronograf.RolesStore, error) {
	return nil, fmt.Errorf("Roles not support in open-source InfluxDB.  Roles are support in Influx Enterprise")
}

// Ping hits the influxdb ping endpoint and returns the type of influx
func (c *Client) Ping(ctx context.Context) error {
	_, _, err := c.pingTimeout(ctx)
	return err
}

// Version hits the influxdb ping endpoint and returns the version of influx
func (c *Client) Version(ctx context.Context) (string, error) {
	version, _, err := c.pingTimeout(ctx)
	return version, err
}

// Type hits the influxdb ping endpoint and returns the type of influx running
func (c *Client) Type(ctx context.Context) (string, error) {
	_, tsdbType, err := c.pingTimeout(ctx)
	return tsdbType, err
}

func (c *Client) pingTimeout(ctx context.Context) (string, string, error) {
	resps := make(chan (pingResult))
	go func() {
		version, tsdbType, err := c.ping(c.URL)
		resps <- pingResult{version, tsdbType, err}
	}()

	select {
	case resp := <-resps:
		return resp.Version, resp.Type, resp.Err
	case <-ctx.Done():
		return "", "", chronograf.ErrUpstreamTimeout
	}
}

type v3PingRespBody struct {
	Version string `json:"version"`
}

type pingResult struct {
	Version string
	Type    string
	Err     error
}

func (c *Client) ping(u *url.URL) (string, string, error) {
	u = util.AppendPath(u, "/ping")

	req, err := http.NewRequest("GET", u.String(), nil)
	if err != nil {
		return "", "", err
	}

	if c.Authorizer != nil {
		err = c.Authorizer.Set(req)
		if err != nil {
			return "", "", err
		}
	}

	hc := &http.Client{}
	hc.Transport = SharedTransport(c.InsecureSkipVerify)

	resp, err := hc.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", "", err
	}

	if resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusOK {
		var err = errors.New(string(body))
		return "", "", err
	}

	if c.SrcType == chronograf.InfluxDBv3Core || c.SrcType == chronograf.InfluxDBv3Enterprise {
		// Read the version from the body
		if len(body) == 0 {
			return "", "", fmt.Errorf("empty ping response body")
		}
		var b v3PingRespBody
		err := json.Unmarshal(body, &b)
		if err != nil {
			return "", "", fmt.Errorf("failed to parse ping response body: %w", err)
		}
		if b.Version == "" {
			return "", "", fmt.Errorf("missing version in ping response body")
		}
		return b.Version, c.SrcType, nil
	}

	if !c.isV3SrcType() {
		// Check the `X-Influxdb-Build` header
		builds := resp.Header.Values("X-Influxdb-Build")
		for _, build := range builds {
			if build == "ENT" {
				return build, chronograf.InfluxDBv1Enterprise, nil
			}
		}
	}

	// Read the version from the `X-Influxdb-Version` header
	version := resp.Header.Get("X-Influxdb-Version")
	if !c.isV3SrcType() && version != "" {
		if strings.Contains(version, "-c") {
			return version, chronograf.InfluxDBv1Enterprise, nil
		} else if strings.Contains(version, "relay") {
			return version, chronograf.InfluxDBv1Relay, nil
		}
	}

	// Strip v prefix from version, some older '1.x' versions and also
	// InfluxDB 2.2.0 return version in format vx.x.x
	if strings.HasPrefix(version, "v") {
		version = version[1:]
	}

	return version, c.SrcType, nil
}

// Write POSTs line protocol to a database and retention policy
func (c *Client) Write(ctx context.Context, points []chronograf.Point) error {
	for _, point := range points {
		if err := c.writePoint(ctx, &point); err != nil {
			return err
		}
	}
	return nil
}

func (c *Client) writePoint(ctx context.Context, point *chronograf.Point) error {
	lp, err := toLineProtocol(point)
	if err != nil {
		return err
	}

	err = c.write(ctx, c.URL, point.Database, point.RetentionPolicy, lp)
	if err == nil {
		return nil
	}

	// Some influxdb errors should not be treated as errors
	if strings.Contains(err.Error(), "hinted handoff queue not empty") {
		// This is an informational message
		return nil
	}

	// If the database was not found, try to recreate it:
	if strings.Contains(err.Error(), "database not found") {
		_, err = c.CreateDB(ctx, &chronograf.Database{
			Name: point.Database,
		})
		if err != nil {
			return err
		}
		// retry the write
		return c.write(ctx, c.URL, point.Database, point.RetentionPolicy, lp)
	}

	return err
}

func (c *Client) write(ctx context.Context, u *url.URL, db, rp, lp string) error {
	u = util.AppendPath(u, "/write")
	req, err := http.NewRequest("POST", u.String(), strings.NewReader(lp))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "text/plain; charset=utf-8")
	if c.Authorizer != nil {
		if err := c.Authorizer.Set(req); err != nil {
			return err
		}
	}

	params := req.URL.Query()
	params.Set("db", db)
	params.Set("rp", rp)
	req.URL.RawQuery = params.Encode()

	hc := &http.Client{}
	hc.Transport = SharedTransport(c.InsecureSkipVerify)

	errChan := make(chan (error))
	go func() {
		resp, err := hc.Do(req)
		if err != nil {
			errChan <- err
			return
		}

		if resp.StatusCode == http.StatusNoContent {
			errChan <- nil
			return
		}
		defer resp.Body.Close()

		var response responseType
		dec := json.NewDecoder(resp.Body)
		err = dec.Decode(&response)
		if err != nil && err.Error() != "EOF" {
			errChan <- err
			return
		}

		errChan <- errors.New(response.Err)
		return
	}()

	select {
	case err := <-errChan:
		return err
	case <-ctx.Done():
		return chronograf.ErrUpstreamTimeout
	}
}
