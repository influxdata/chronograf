package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"runtime"
	"strconv"
	"sync/atomic"
	"time"

	"github.com/influxdata/ifql"
	"github.com/influxdata/ifql/functions"
	"github.com/influxdata/ifql/functions/storage"
	"github.com/influxdata/ifql/functions/storage/pb"
	"github.com/influxdata/ifql/id"
	"github.com/influxdata/ifql/idfile"
	"github.com/influxdata/ifql/query"
	"github.com/influxdata/ifql/query/execute"
	"github.com/influxdata/ifql/tracing"
	"github.com/influxdata/influxdb/models"
	client "github.com/influxdata/usage-client/v1"
	"github.com/jessevdk/go-flags"
	opentracing "github.com/opentracing/opentracing-go"
	uuid "github.com/satori/go.uuid"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var version string
var commit string
var date string
var startTime = time.Now()
var queryCount int64

type options struct {
	Hosts             []string       `long:"host" short:"h" description:"influx hosts to query from. Can be specified more than once for multiple hosts." default:"localhost:8082" env:"HOSTS" env-delim:","`
	Addr              string         `long:"bind-address" short:"b" description:"The address to listen on for HTTP requests" default:":8093" env:"BIND_ADDRESS"`
	IDFile            flags.Filename `long:"id-file" description:"Path to file that persists ifqld id" env:"ID_FILE" default:"./ifqld.id"`
	ReportingDisabled bool           `short:"r" long:"reporting-disabled" description:"Disable reporting of usage stats (os,arch,version,cluster_id,uptime,queryCount) once every 4hrs" env:"REPORTING_DISABLED"`
	Verbose           bool           `short:"v" long:"verbose" description:"Log more verbose debugging output"`
	ConcurrencyQuota  int            `short:"c" long:"concurrency-quota" description:"Maximum concurrency allowed" env:"CONCURRENCY_QUOTA"`
	MemoryBytesQuota  int            `short:"m" long:"memory-quota" description:"Approximate maximum memory usage allowed in bytes" env:"MEMORY_BYTES_QUOTA"`
}

var (
	orgID id.ID
)

func init() {
	orgID.DecodeFromString("bbbb")
}

var opts = options{
	ConcurrencyQuota: runtime.NumCPU() * 2,
}
var controller *ifql.Controller

var functionCounter = prometheus.NewCounterVec(
	prometheus.CounterOpts{
		Name: "ifql_function_count",
		Help: "How times a function was used in a query",
	},
	[]string{"function"},
)

var queryCounter = prometheus.NewCounter(prometheus.CounterOpts{
	Name: "ifql_query_count",
	Help: "Number of queries executed",
})

func init() {
	prometheus.MustRegister(functionCounter)
	prometheus.MustRegister(queryCounter)
}

func main() {
	parser := flags.NewParser(&opts, flags.Default)
	parser.ShortDescription = `IFQLD`
	parser.LongDescription = `Options for the IFQLD server`

	if _, err := parser.Parse(); err != nil {
		code := 1
		if fe, ok := err.(*flags.Error); ok {
			if fe.Type == flags.ErrHelp {
				code = 0
			}
		}
		os.Exit(code)
	}
	config := ifql.Config{
		Dependencies:     make(execute.Dependencies),
		ConcurrencyQuota: opts.ConcurrencyQuota,
		MemoryBytesQuota: opts.MemoryBytesQuota,
	}

	if err := injectDeps(config.Dependencies); err != nil {
		log.Fatal(err)
	}

	c, err := ifql.NewController(config)
	if err != nil {
		log.Fatal(err)
	}
	controller = c

	http.Handle("/metrics", promhttp.Handler())
	http.Handle("/query", http.HandlerFunc(HandleQuery))
	http.Handle("/queries", http.HandlerFunc(HandleQueries))

	if !opts.ReportingDisabled {
		id := ID(string(opts.IDFile))
		go reportUsageStats(id)
	}

	if tr := tracing.Open("ifqld"); tr != nil {
		defer tr.Close()
	}

	log.Printf("Starting version %s on %s\n", version, opts.Addr)
	log.Fatal(http.ListenAndServe(opts.Addr, nil))
}

func injectDeps(deps execute.Dependencies) error {
	sr, err := pb.NewReader(storage.NewStaticLookup(opts.Hosts))
	if err != nil {
		return err
	}

	return functions.InjectFromDependencies(deps, storage.Dependencies{
		Reader: sr,
	})
}

// HandleQuery interprets and executes ifql syntax and returns results
func HandleQuery(w http.ResponseWriter, req *http.Request) {
	span, ctx := opentracing.StartSpanFromContext(req.Context(), "query")
	defer span.Finish()

	atomic.AddInt64(&queryCount, 1)
	queryCounter.Inc()

	var (
		q   *ifql.Query
		err error
	)
	if req.Header.Get("Content-type") == "application/json" {
		spec := new(query.Spec)
		if err := json.NewDecoder(req.Body).Decode(spec); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(fmt.Sprintf("Error parsing query spec %s", err.Error())))
			log.Println("Error:", err)
			return
		}

		q, err = controller.Query(ctx, orgID, spec)
	} else {
		queryStr := req.FormValue("q")
		if queryStr == "" {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("must pass query in q parameter"))
			return
		}
		if opts.Verbose {
			log.Print(queryStr)
		}

		analyze := req.FormValue("analyze") != ""
		if analyze {
			spec, err := query.Compile(ctx, queryStr)
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				w.Write([]byte(fmt.Sprintf("Error compiling query %s", err.Error())))
				return
			}
			encodeJSON(w, http.StatusOK, spec)
			return
		}

		q, err = controller.QueryWithCompile(ctx, orgID, queryStr)
	}
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(fmt.Sprintf("Error constructing query %s", err.Error())))
		return
	}
	defer q.Done()

	funcs, err := q.Spec().Functions()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(fmt.Sprintf("Error analyzing query %s", err.Error())))
		return
	}

	if opts.Verbose {
		if octets, err := json.MarshalIndent(q.Spec, "", "    "); err == nil {
			log.Print(string(octets))
		}
	}

	for _, f := range funcs {
		functionCounter.WithLabelValues(f).Inc()
	}

	results, ok := <-q.Ready()
	if !ok {
		err := q.Err()
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(fmt.Sprintf("Error executing query %s", err.Error())))
		return
	}
	switch req.Header.Get("Accept") {
	case "application/json":
		writeJSONChunks(results, w)
	default:
		writeLineResults(results, w)
	}
}

type QueriesResponse struct {
	Queries []Query
}

type Query struct {
	ID    string
	State string
}

// HandleQueries returns the running queries
func HandleQueries(w http.ResponseWriter, req *http.Request) {
	qs := controller.Queries()
	var queries QueriesResponse
	queries.Queries = make([]Query, len(qs))
	for i, q := range qs {
		queries.Queries[i] = Query{
			ID:    strconv.FormatUint(uint64(q.ID()), 10),
			State: q.State().String(),
		}
	}
	err := json.NewEncoder(w).Encode(queries)
	if err != nil {
		log.Println(err)
	}
}

func iterateResults(r execute.Result, f func(measurement, fieldName string, tags map[string]string, value interface{}, t time.Time)) {
	blocks := r.Blocks()

	err := blocks.Do(func(b execute.Block) error {

		times := b.Times()
		times.DoTime(func(ts []execute.Time, rr execute.RowReader) {
			for i, time := range ts {
				var measurement, fieldName string
				tags := map[string]string{}
				var value interface{}

				for j, c := range rr.Cols() {
					if c.IsTag() {
						if c.Label == "_measurement" {
							measurement = rr.AtString(i, j)
						} else if c.Label == "_field" {
							fieldName = rr.AtString(i, j)
						} else {
							tags[c.Label] = rr.AtString(i, j)
						}
					} else {
						switch c.Type {
						case execute.TBool:
							value = rr.AtBool(i, j)
						case execute.TInt:
							value = rr.AtInt(i, j)
						case execute.TUInt:
							value = rr.AtUInt(i, j)
						case execute.TFloat:
							value = rr.AtFloat(i, j)
						case execute.TString:
							value = rr.AtString(i, j)
						case execute.TTime:
							value = rr.AtTime(i, j)
						default:
							value = "unknown"
						}
					}
				}

				if measurement == "" {
					measurement = "measurement"
				}
				if fieldName == "" {
					fieldName = "value"
				}
				f(measurement, fieldName, tags, value, time.Time())
			}
		})
		return nil
	})
	if err != nil {
		log.Println("Error iterating through results:", err)
	}
}

type header struct {
	Result   string            `json:"result"`
	SeriesID int64             `json:"seriesID"`
	Tags     map[string]string `json:"tags"`
}

type chunk struct {
	Points []point `json:"points"`
}

type point struct {
	Value   interface{}       `json:"value"`
	Time    int64             `json:"time"`
	Context map[string]string `json:"context,omitempty"`
}

func writeJSONChunks(results map[string]execute.Result, w http.ResponseWriter) {
	seriesID := int64(0)
	for name, r := range results {
		blocks := r.Blocks()

		err := blocks.Do(func(b execute.Block) error {
			seriesID++

			// output header
			h := header{Result: name, SeriesID: seriesID, Tags: b.Tags()}
			bb, err := json.Marshal(h)
			if err != nil {
				return err
			}
			_, err = w.Write(bb)
			if err != nil {
				return err
			}
			_, err = w.Write([]byte("\n"))
			if err != nil {
				return err
			}

			times := b.Times()
			times.DoTime(func(ts []execute.Time, rr execute.RowReader) {
				ch := chunk{Points: make([]point, len(ts))}
				for i, time := range ts {
					ch.Points[i].Time = time.Time().UnixNano()

					for j, c := range rr.Cols() {
						if !c.Common && c.Type == execute.TString {
							if ch.Points[i].Context == nil {
								ch.Points[i].Context = make(map[string]string)
							}
							ch.Points[i].Context[c.Label] = rr.AtString(i, j)
						} else if c.IsValue() {
							switch c.Type {
							case execute.TFloat:
								ch.Points[i].Value = rr.AtFloat(i, j)
							case execute.TInt:
								ch.Points[i].Value = rr.AtInt(i, j)
							case execute.TString:
								ch.Points[i].Value = rr.AtString(i, j)
							case execute.TUInt:
								ch.Points[i].Value = rr.AtUInt(i, j)
							case execute.TBool:
								ch.Points[i].Value = rr.AtBool(i, j)
							default:
								ch.Points[i].Value = "unknown"
							}
						}
					}
				}

				// write it out
				b, err := json.Marshal(ch)
				if err != nil {
					log.Println("error marshaling chunk: ", err.Error())
					return
				}
				_, err = w.Write(b)
				if err != nil {
					log.Println("error writing chunk: ", err.Error())
					return
				}
				_, err = w.Write([]byte("\n"))
				if err != nil {
					log.Println("error writing newline: ", err.Error())
					return
				}
				w.(http.Flusher).Flush()
			})
			return nil
		})
		if err != nil {
			log.Println("Error iterating through results:", err)
		}
	}
}

func writeLineResults(results map[string]execute.Result, w http.ResponseWriter) {
	for _, r := range results {
		iterateResults(r, func(m, f string, tags map[string]string, val interface{}, t time.Time) {
			p, err := models.NewPoint(m, models.NewTags(tags), map[string]interface{}{f: val}, t)
			if err != nil {
				log.Println("error creating new point", err)
				return
			}
			w.Write([]byte(p.String()))
			w.Write([]byte("\n"))
		})
	}
}

// ID returns the id of the running ifqld process
func ID(filepath string) string {
	id, err := idfile.ID(filepath)
	if err != nil {
		id = uuid.NewV4().String()
	}
	return id
}

// reportUsageStats starts periodic server reporting.
func reportUsageStats(id string) {
	reporter := client.New("")
	u := &client.Usage{
		Product: "ifqld",
		Data: []client.UsageData{
			{
				Tags: client.Tags{
					"version": version,
					"arch":    runtime.GOARCH,
					"os":      runtime.GOOS,
				},
				Values: client.Values{
					"cluster_id": id,
					"queryCount": atomic.LoadInt64(&queryCount),
					"uptime":     time.Since(startTime).Seconds(),
				},
			},
		},
	}
	_, _ = reporter.Save(u)

	ticker := time.NewTicker(4 * time.Hour)
	defer ticker.Stop()
	for {
		<-ticker.C
		u.Data[0].Values["uptime"] = time.Since(startTime).Seconds()
		u.Data[0].Values["queryCount"] = atomic.LoadInt64(&queryCount)
		go reporter.Save(u)
	}
}

func encodeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	// already wrote to client
	_ = json.NewEncoder(w).Encode(v)
}
