package server

import (
	"bytes"
	"context"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/bouk/httprouter"

	"github.com/influxdata/chronograf/log"
	"github.com/influxdata/chronograf/mocks"

	"github.com/influxdata/chronograf"
)

func TestService_Influx(t *testing.T) {
	type fields struct {
		SourcesStore chronograf.SourcesStore
		TimeSeries   TimeSeriesClient
	}
	type args struct {
		w *httptest.ResponseRecorder
		r *http.Request
	}
	type want struct {
		StatusCode  int
		ContentType string
		Body        string
	}
	tests := []struct {
		name   string
		fields fields
		args   args
		ID     string
		want   want
	}{
		{
			name: "Proxies request to Influxdb",
			fields: fields{
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID:  1337,
							URL: "http://any.url",
						}, nil
					},
				},
				TimeSeries: &mocks.TimeSeries{
					ConnectF: func(ctx context.Context, src *chronograf.Source) error {
						return nil
					},
					QueryF: func(ctx context.Context, query chronograf.Query) (chronograf.Response, error) {
						return mocks.NewResponse(
								`{"results":[{"statement_id":0,"series":[{"name":"cpu","columns":["key","value"],"values":[["cpu","cpu-total"],["cpu","cpu0"],["cpu","cpu1"],["cpu","cpu2"],["cpu","cpu3"],["host","pineapples-MBP"],["host","pineapples-MacBook-Pro.local"]]}]}]}`,
								nil,
							),
							nil
					},
				},
			},
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"POST",
					"http://any.url",
					ioutil.NopCloser(
						bytes.NewReader([]byte(
							`{"db":"bob", "rp":"joe", "uuid": "bob", "query":"SELECT mean(\"usage_user\") FROM cpu WHERE \"cpu\" = 'cpu-total' AND time > now() - 10m GROUP BY host;"}`,
						)),
					),
				),
			},
			ID: "1",
			want: want{
				StatusCode:  http.StatusOK,
				ContentType: "application/json",
				Body: `{"results":{"results":[{"statement_id":0,"series":[{"name":"cpu","columns":["key","value"],"values":[["cpu","cpu-total"],["cpu","cpu0"],["cpu","cpu1"],["cpu","cpu2"],["cpu","cpu3"],["host","pineapples-MBP"],["host","pineapples-MacBook-Pro.local"]]}]}]},"uuid":"bob"}
`,
			},
		},
	}

	for _, tt := range tests {
		tt.args.r = tt.args.r.WithContext(httprouter.WithParams(
			context.Background(),
			httprouter.Params{
				{
					Key:   "id",
					Value: tt.ID,
				},
			},
		))
		h := &Service{
			Store: &mocks.Store{
				SourcesStore: tt.fields.SourcesStore,
			},
			TimeSeriesClient: tt.fields.TimeSeries,
		}
		h.Influx(tt.args.w, tt.args.r)

		resp := tt.args.w.Result()
		contentType := resp.Header.Get("Content-Type")
		body, _ := ioutil.ReadAll(resp.Body)

		if resp.StatusCode != tt.want.StatusCode {
			t.Errorf("%q. Influx() = got %v, want %v", tt.name, resp.StatusCode, tt.want.StatusCode)
		}
		if contentType != tt.want.ContentType {
			t.Errorf("%q. Influx() = got %v, want %v", tt.name, contentType, tt.want.ContentType)
		}
		if string(body) != tt.want.Body {
			t.Errorf("%q. Influx() =\ngot  ***%v***\nwant ***%v***\n", tt.name, string(body), tt.want.Body)
		}

	}
}

// TestService_Influx_UseCommand test preprocessing of use command
func TestService_Influx_UseCommand(t *testing.T) {
	tests := []struct {
		name string
		db   string
		rp   string
	}{
		{
			name: "/* no command */",
		},
		{
			name: "USE mydb",
			db:   "mydb",
		},
		{
			name: "USE mydb.myrp",
			db:   "mydb",
			rp:   "myrp",
		},
		{
			name: `use "mydb"`,
			db:   "mydb",
		},
		{
			name: `use "mydb.myrp"`,
			db:   "mydb.myrp",
		},
		{
			name: `USE "mydb"."myrp"`,
			db:   "mydb",
			rp:   "myrp",
		},
	}

	h := &Service{
		Store: &mocks.Store{
			SourcesStore: &mocks.SourcesStore{
				GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
					return chronograf.Source{
						ID:  1337,
						URL: "http://any.url",
					}, nil
				},
			},
		},
		TimeSeriesClient: &mocks.TimeSeries{
			ConnectF: func(ctx context.Context, src *chronograf.Source) error {
				return nil
			},
			QueryF: func(ctx context.Context, query chronograf.Query) (chronograf.Response, error) {
				return mocks.NewResponse(
						fmt.Sprintf(`{"db":"%s","rp":"%s"}`, query.DB, query.RP),
						nil,
					),
					nil
			},
		},
		Logger: log.New(log.ErrorLevel),
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			prefixCommand := strings.ReplaceAll(tt.name, "\"", "\\\"")
			w := httptest.NewRecorder()
			r := httptest.NewRequest(
				"POST",
				"http://any.url",
				ioutil.NopCloser(
					bytes.NewReader([]byte(
						`{"uuid": "tst", "query":"`+prefixCommand+` ; DROP MEASUREMENT test"}`,
					)),
				),
			)
			r = r.WithContext(httprouter.WithParams(
				context.Background(),
				httprouter.Params{
					{
						Key:   "id",
						Value: "1",
					},
				},
			))

			h.Influx(w, r)

			resp := w.Result()
			body, _ := ioutil.ReadAll(resp.Body)

			want := fmt.Sprintf(`{"results":{"db":"%s","rp":"%s"},"uuid":"tst"}`, tt.db, tt.rp)
			got := strings.TrimSpace(string(body))
			if got != want {
				t.Errorf("%q. Influx() =\ngot  ***%v***\nwant ***%v***\n", tt.name, got, want)
			}

		})
	}
}

// TestService_Influx_CommandWithOnClause tests preprocessing of command with ON clause
func TestService_Influx_CommandWithOnClause(t *testing.T) {
	tests := []struct {
		name string
		db   string
		rp   string
	}{
		{
			name: "/* no command */",
		},
		{
			name: "SHOW MEASUREMENTS",
		},
		{
			name: "SHOW TAG KEYS ON mydb",
			db:   "mydb",
		},
		{
			name: "SHOW TAG KEYS ON mydb FROM table",
			db:   "mydb",
		},
		{
			name: "USE anotherdb; SHOW TAG KEYS ON mydb",
			db:   "anotherdb",
		},
		{
			name: `show tag keys on "mydb"`,
			db:   "mydb",
		},
		{
			name: `show tag keys on "mydb" from "table"`,
			db:   "mydb",
		},
		{
			name: `show tag keys on "my_db" from "table"`,
			db:   "my_db",
		},
		{
			name: `show tag keys on "my-db" from "table"`,
			db:   "my-db",
		},
		{
			name: `show tag keys on "my/db" from "table"`,
			db:   "my/db",
		},
		{
			name: `show tag keys on "my db" from "table"`,
			db:   "my db",
		},
	}

	h := &Service{
		Store: &mocks.Store{
			SourcesStore: &mocks.SourcesStore{
				GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
					return chronograf.Source{
						ID:  1337,
						URL: "http://any.url",
					}, nil
				},
			},
		},
		TimeSeriesClient: &mocks.TimeSeries{
			ConnectF: func(ctx context.Context, src *chronograf.Source) error {
				return nil
			},
			QueryF: func(ctx context.Context, query chronograf.Query) (chronograf.Response, error) {
				return mocks.NewResponse(
						fmt.Sprintf(`{"db":"%s","rp":"%s"}`, query.DB, query.RP),
						nil,
					),
					nil
			},
		},
		Logger: log.New(log.ErrorLevel),
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			prefixCommand := strings.ReplaceAll(tt.name, "\"", "\\\"")
			w := httptest.NewRecorder()
			r := httptest.NewRequest(
				"POST",
				"http://any.url",
				ioutil.NopCloser(
					bytes.NewReader([]byte(
						`{"uuid": "tst", "query":"`+prefixCommand+` ; DROP MEASUREMENT test"}`,
					)),
				),
			)
			r = r.WithContext(httprouter.WithParams(
				context.Background(),
				httprouter.Params{
					{
						Key:   "id",
						Value: "1",
					},
				},
			))

			h.Influx(w, r)

			resp := w.Result()
			body, _ := ioutil.ReadAll(resp.Body)

			want := fmt.Sprintf(`{"results":{"db":"%s","rp":"%s"},"uuid":"tst"}`, tt.db, tt.rp)
			got := strings.TrimSpace(string(body))
			if got != want {
				t.Errorf("%q. Influx() =\ngot  ***%v***\nwant ***%v***\n", tt.name, got, want)
			}

		})
	}
}

func TestService_Influx_Write(t *testing.T) {
	calledPath := ""
	ts := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		calledPath = r.URL.Path
		rw.WriteHeader(http.StatusOK)
		rw.Write([]byte(`{"message":"hi"}`))
	}))
	defer ts.Close()

	testPairs := []struct {
		version string
		ctx     string
		path    string
	}{
		{version: "1.8.3", ctx: "", path: "/write"},
		{version: "1.8.3", ctx: "/ctx", path: "/ctx/write"},
		{version: "2.2.0", ctx: "", path: "/api/v2/write"},
		{version: "2.2.0", ctx: "/ctx", path: "/ctx/api/v2/write"},
	}

	for _, testPair := range testPairs {
		calledPath = ""
		w := httptest.NewRecorder()
		r := httptest.NewRequest(
			"POST",
			"http://any.url?v="+testPair.version,
			ioutil.NopCloser(
				bytes.NewReader([]byte(
					`temperature v=1.0`,
				)),
			),
		)
		r = r.WithContext(httprouter.WithParams(
			context.Background(),
			httprouter.Params{
				{
					Key:   "id",
					Value: "1",
				},
			},
		))

		h := &Service{
			Store: &mocks.Store{
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID:  1337,
							URL: ts.URL + testPair.ctx,
						}, nil
					},
				},
			},
			Logger: log.New(log.ErrorLevel),
		}
		h.Write(w, r)

		resp := w.Result()
		ioutil.ReadAll(resp.Body)

		if calledPath != testPair.path {
			t.Errorf("Path received: %v, want: %v ", calledPath, testPair.path)
		}
	}
}
