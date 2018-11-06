package main

import (
	"bytes"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"math"
	"mime"
	"net/http"
	"os"
	"unicode/utf8"

	"github.com/influxdata/flux"
	_ "github.com/influxdata/flux/builtin"
	"github.com/influxdata/flux/control"
	"github.com/influxdata/flux/csv"
	"github.com/influxdata/flux/lang"
	"github.com/pkg/errors"
)

var (
	q     = flag.String("q", "", "flux script")
	httpd = flag.String("http", "", "run http server on specified port")
)

func main() {
	flag.Parse()

	if *httpd != "" {
		runHttp()
		return
	}

	if *q == "" {
		fmt.Println("query required")
		os.Exit(1)
	}

	c := lang.FluxCompiler{
		Query: *q,
	}
	d := csv.DefaultDialect()

	querier := NewQuerier()

	var buf bytes.Buffer
	_, err := querier.Query(context.Background(), &buf, c, d)
	if err != nil {
		log.Fatalf("failed to run query: %v", err)
		os.Exit(1)
	}

	fmt.Print(buf.String())
}

func runHttp() {
	querier := NewQuerier()

	http.HandleFunc("/v2/query", func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		req, err := decodeQueryRequest(r)
		if err != nil {
			log.Println("error decoding request:", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		log.Printf("handling request: %s\n", req.Query)

		pr := req.ProxyRequest()
		q, err := querier.c.Query(ctx, pr.Compiler)
		if err != nil {
			log.Println("error executing query:", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer func() {
			q.Cancel()
			q.Done()
		}()

		// Setup headers
		//stats, hasStats := results.(flux.Statisticser)
		//if hasStats {
		//	w.Header().Set("Trailer", statsTrailer)
		//}

		// NOTE: We do not write out the headers here.
		// It is possible that if the encoding step fails
		// that we can write an error header so long as
		// the encoder did not write anything.
		// As such we rely on the http.ResponseWriter behavior
		// to write an StatusOK header with the first write.

		switch r.Header.Get("Accept") {
		case "text/csv":
			fallthrough
		default:

			if hd, ok := pr.Dialect.(httpDialect); !ok {
				log.Printf("unsupported dialect %T\n", req.Dialect)
				http.Error(w, fmt.Sprintf("unsupported dialect over HTTP %T", req.Dialect), http.StatusBadRequest)
				return
			} else {
				hd.SetHeaders(w)
			}
			encoder := pr.Dialect.Encoder()
			results := flux.NewResultIteratorFromQuery(q)
			n, err := encoder.Encode(w, results)
			if err != nil {
				results.Cancel()
				if n == 0 {
					log.Println("no results:", err)
					// If the encoder did not write anything, we can write an error header.
					http.Error(w, err.Error(), http.StatusInternalServerError)
				}
			}
		}
	})

	log.Printf("http server listening %s\n", *httpd)

	http.ListenAndServe(*httpd, nil)
}

type Querier struct {
	c *control.Controller
}

func (q *Querier) Query(ctx context.Context, w io.Writer, c flux.Compiler, d flux.Dialect) (int64, error) {
	qry, err := q.c.Query(ctx, c)
	if err != nil {
		return 0, err
	}
	results := flux.NewResultIteratorFromQuery(qry)
	defer results.Cancel()

	encoder := d.Encoder()
	return encoder.Encode(w, results)
}

func NewQuerier() *Querier {
	config := control.Config{
		ConcurrencyQuota: 1,
		MemoryBytesQuota: math.MaxInt64,
	}

	c := control.New(config)

	return &Querier{
		c: c,
	}
}

// QueryRequest is a flux query request.
type QueryRequest struct {
	Spec    *flux.Spec   `json:"spec,omitempty"`
	Query   string       `json:"query"`
	Type    string       `json:"type"`
	Dialect QueryDialect `json:"dialect"`
}

// QueryDialect is the formatting options for the query response.
type QueryDialect struct {
	Header         *bool    `json:"header"`
	Delimiter      string   `json:"delimiter"`
	CommentPrefix  string   `json:"commentPrefix"`
	DateTimeFormat string   `json:"dateTimeFormat"`
	Annotations    []string `json:"annotations"`
}

// WithDefaults adds default values to the request.
func (r QueryRequest) WithDefaults() QueryRequest {
	if r.Type == "" {
		r.Type = "flux"
	}
	if r.Dialect.Delimiter == "" {
		r.Dialect.Delimiter = ","
	}
	if r.Dialect.DateTimeFormat == "" {
		r.Dialect.DateTimeFormat = "RFC3339"
	}
	if r.Dialect.Header == nil {
		header := true
		r.Dialect.Header = &header
	}
	return r
}

// Validate checks the query request and returns an error if the request is invalid.
func (r QueryRequest) Validate() error {
	if r.Query == "" && r.Spec == nil {
		return errors.New(`request body requires either spec or query`)
	}

	if r.Type != "flux" {
		return fmt.Errorf(`unknown query type: %s`, r.Type)
	}

	if len(r.Dialect.CommentPrefix) > 1 {
		return fmt.Errorf("invalid dialect comment prefix: must be length 0 or 1")
	}

	if len(r.Dialect.Delimiter) != 1 {
		return fmt.Errorf("invalid dialect delimeter: must be length 1")
	}

	rn, size := utf8.DecodeRuneInString(r.Dialect.Delimiter)
	if rn == utf8.RuneError && size == 1 {
		return fmt.Errorf("invalid dialect delimeter character")
	}

	for _, a := range r.Dialect.Annotations {
		switch a {
		case "group", "datatype", "default":
		default:
			return fmt.Errorf(`unknown dialect annotation type: %s`, a)
		}
	}

	switch r.Dialect.DateTimeFormat {
	case "RFC3339", "RFC3339Nano":
	default:
		return fmt.Errorf(`unknown dialect date time format: %s`, r.Dialect.DateTimeFormat)
	}

	return nil
}

// ProxyRequest specifies a query request and the dialect for the results.
type ProxyRequest struct {
	// Request is the basic query request
	Compiler flux.Compiler `json:"compiler"`

	// Dialect is the result encoder
	Dialect flux.Dialect `json:"dialect"`
}

// ProxyRequest returns a request to proxy from the flux.
func (r QueryRequest) ProxyRequest() *ProxyRequest {
	// Query is preferred over spec
	var compiler flux.Compiler
	if r.Query != "" {
		compiler = lang.FluxCompiler{
			Query: r.Query,
		}
	} else if r.Spec != nil {
		compiler = lang.SpecCompiler{
			Spec: r.Spec,
		}
	}

	delimiter, _ := utf8.DecodeRuneInString(r.Dialect.Delimiter)

	noHeader := false
	if r.Dialect.Header != nil {
		noHeader = !*r.Dialect.Header
	}

	cfg := csv.DefaultEncoderConfig()
	cfg.NoHeader = noHeader
	cfg.Delimiter = delimiter

	// TODO(nathanielc): Use commentPrefix and dateTimeFormat
	// once they are supported.
	return &ProxyRequest{
		Compiler: compiler,
		Dialect: csv.Dialect{
			ResultEncoderConfig: cfg,
		},
	}
}

// httpDialect is an encoding dialect that can write metadata to HTTP headers
type httpDialect interface {
	SetHeaders(w http.ResponseWriter)
}

func decodeQueryRequest(r *http.Request) (*QueryRequest, error) {
	ct := r.Header.Get("Content-Type")
	mt, _, err := mime.ParseMediaType(ct)
	if err != nil {
		return nil, err
	}

	var req QueryRequest
	switch mt {
	case "application/vnd.flux":
		if d, err := ioutil.ReadAll(r.Body); err != nil {
			return nil, err
		} else {
			req.Query = string(d)
		}
	default:
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			return nil, err
		}
	}

	req = req.WithDefaults()
	err = req.Validate()
	if err != nil {
		return nil, err
	}

	return &req, err
}
