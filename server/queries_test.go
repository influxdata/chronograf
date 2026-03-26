package server

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/bouk/httprouter"
	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/mocks"
	"github.com/influxdata/chronograf/roles"
)

func TestService_Queries(t *testing.T) {
	tests := []struct {
		name         string
		SourcesStore chronograf.SourcesStore
		ID           string
		w            *httptest.ResponseRecorder
		r            *http.Request
		want         string
	}{
		{
			name: "bad json",
			SourcesStore: &mocks.SourcesStore{
				GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
					return chronograf.Source{
						ID: ID,
					}, nil
				},
			},
			ID:   "1",
			w:    httptest.NewRecorder(),
			r:    httptest.NewRequest("POST", "/queries", bytes.NewReader([]byte(`howdy`))),
			want: `{"code":400,"message":"Unparsable JSON"}`,
		},
		{
			name: "bad id",
			ID:   "howdy",
			w:    httptest.NewRecorder(),
			r:    httptest.NewRequest("POST", "/queries", bytes.NewReader([]byte{})),
			want: `{"code":422,"message":"Error converting ID howdy"}`,
		},
		{
			name: "query with no template vars",
			SourcesStore: &mocks.SourcesStore{
				GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
					return chronograf.Source{
						ID: ID,
					}, nil
				},
			},
			ID: "1",
			w:  httptest.NewRecorder(),
			r: httptest.NewRequest("POST", "/queries", bytes.NewReader([]byte(`{
					"queries": [
					  {
						"query": "SELECT \"pingReq\" FROM db.\"monitor\".\"httpd\" WHERE time > now() - 1m",
						"id": "82b60d37-251e-4afe-ac93-ca20a3642b11"
					  }
					]}`))),
			want: `{"queries":[{"durationMs":59999,"id":"82b60d37-251e-4afe-ac93-ca20a3642b11","query":"SELECT \"pingReq\" FROM db.\"monitor\".\"httpd\" WHERE time \u003e now() - 1m","queryConfig":{"id":"82b60d37-251e-4afe-ac93-ca20a3642b11","database":"db","measurement":"httpd","retentionPolicy":"monitor","fields":[{"value":"pingReq","type":"field","alias":""}],"tags":{},"groupBy":{"time":"","tags":[]},"areTagsAccepted":false,"rawText":null,"range":{"upper":"","lower":"now() - 1m"},"shifts":[]},"queryAST":{"condition":{"expr":"binary","op":"\u003e","lhs":{"expr":"reference","val":"time"},"rhs":{"expr":"binary","op":"-","lhs":{"expr":"call","name":"now"},"rhs":{"expr":"literal","val":"1m","type":"duration"}}},"fields":[{"column":{"expr":"reference","val":"pingReq"}}],"sources":[{"database":"db","retentionPolicy":"monitor","name":"httpd","type":"measurement"}]}}]}
`,
		},
		{
			name: "query with unparsable query",
			SourcesStore: &mocks.SourcesStore{
				GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
					return chronograf.Source{
						ID: ID,
					}, nil
				},
			},
			ID: "1",
			w:  httptest.NewRecorder(),
			r: httptest.NewRequest("POST", "/queries", bytes.NewReader([]byte(`{
					"queries": [
					  {
						"query": "SHOW DATABASES",
						"id": "82b60d37-251e-4afe-ac93-ca20a3642b11"
					  }
					]}`))),
			want: `{"queries":[{"durationMs":0,"id":"82b60d37-251e-4afe-ac93-ca20a3642b11","query":"SHOW DATABASES","queryConfig":{"id":"82b60d37-251e-4afe-ac93-ca20a3642b11","database":"","measurement":"","retentionPolicy":"","fields":[],"tags":{},"groupBy":{"time":"","tags":[]},"areTagsAccepted":false,"rawText":"SHOW DATABASES","range":null,"shifts":[]}}]}
`,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.r = tt.r.WithContext(httprouter.WithParams(
				context.Background(),
				httprouter.Params{
					{
						Key:   "id",
						Value: tt.ID,
					},
				}))
			s := &Service{
				Store: &mocks.Store{
					SourcesStore: tt.SourcesStore,
				},
				Logger: &mocks.TestLogger{},
			}
			s.Queries(tt.w, tt.r)
			got := tt.w.Body.String()
			if got != tt.want {
				t.Errorf("got:\n%s\nwant:\n%s\n", got, tt.want)
			}
		})
	}
}

func TestService_Queries_ReaderGuardResponses(t *testing.T) {
	tests := []struct {
		name       string
		body       string
		wantStatus int
		wantBody   string
	}{
		{
			name: "rejects unsafe query",
			body: `{
		"queries": [{"id":"1","query":"DROP DATABASE mydb"}]
	}`,
			wantStatus: http.StatusForbidden,
			wantBody:   readerInfluxQLForbiddenMsg,
		},
		{
			name: "returns bad request for invalid query",
			body: `{
		"queries": [{"id":"1","query":"SELECT"}]
	}`,
			wantStatus: http.StatusBadRequest,
			wantBody:   "invalid InfluxQL query",
		},
		{
			name: "rejects oversized body",
			body: `{
		"queries": [{"id":"1","query":"` + strings.Repeat("a", int(readerInfluxQLMaxBodyBytes)) + `"}]
	}`,
			wantStatus: http.StatusForbidden,
			wantBody:   readerInfluxQLForbiddenMsg,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			r := httptest.NewRequest("POST", "/queries", bytes.NewReader([]byte(tt.body)))

			ctx := httprouter.WithParams(
				context.Background(),
				httprouter.Params{{Key: "id", Value: "1"}},
			)
			ctx = context.WithValue(ctx, roles.ContextKey, roles.ReaderRoleName)
			r = r.WithContext(ctx)

			s := &Service{
				Store: &mocks.Store{
					SourcesStore: &mocks.SourcesStore{
						GetF: func(ctx context.Context, id int) (chronograf.Source, error) {
							return chronograf.Source{ID: id}, nil
						},
					},
				},
				Logger: &mocks.TestLogger{},
			}

			s.Queries(w, r)
			if w.Code != tt.wantStatus {
				t.Fatalf("expected status %d, got %d", tt.wantStatus, w.Code)
			}
			if tt.wantBody != "" && !strings.Contains(w.Body.String(), tt.wantBody) {
				t.Fatalf("expected response to contain %q, got %s", tt.wantBody, w.Body.String())
			}
		})
	}
}
