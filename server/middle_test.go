package server

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/bouk/httprouter"
	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/log"
	"github.com/influxdata/chronograf/mocks"
	"github.com/influxdata/chronograf/oauth2"
)

func TestRouteMatchesPrincipal(t *testing.T) {
	type fields struct {
		OrganizationsStore chronograf.OrganizationsStore
		Logger             chronograf.Logger
	}
	type args struct {
		useAuth      bool
		principal    *oauth2.Principal
		routerParams *httprouter.Params
	}
	type wants struct {
		matches bool
	}
	tests := []struct {
		name   string
		fields fields
		args   args
		wants  wants
	}{
		{
			name: "route matches request params",
			fields: fields{
				Logger: log.New(log.DebugLevel),
				OrganizationsStore: &mocks.OrganizationsStore{
					DefaultOrganizationF: func(ctx context.Context) (*chronograf.Organization, error) {
						return &chronograf.Organization{
							ID: "default",
						}, nil
					},
				},
			},
			args: args{
				useAuth: true,
				principal: &oauth2.Principal{
					Subject:      "user",
					Issuer:       "github",
					Organization: "default",
				},
				routerParams: &httprouter.Params{
					{
						Key:   "oid",
						Value: "default",
					},
				},
			},
			wants: wants{
				matches: true,
			},
		},
		{
			name: "route does not match request params",
			fields: fields{
				Logger: log.New(log.DebugLevel),
				OrganizationsStore: &mocks.OrganizationsStore{
					DefaultOrganizationF: func(ctx context.Context) (*chronograf.Organization, error) {
						return &chronograf.Organization{
							ID: "default",
						}, nil
					},
				},
			},
			args: args{
				useAuth: true,
				principal: &oauth2.Principal{
					Subject:      "user",
					Issuer:       "github",
					Organization: "default",
				},
				routerParams: &httprouter.Params{
					{
						Key:   "oid",
						Value: "other",
					},
				},
			},
			wants: wants{
				matches: false,
			},
		},
		{
			name: "missing principal",
			fields: fields{
				Logger: log.New(log.DebugLevel),
				OrganizationsStore: &mocks.OrganizationsStore{
					DefaultOrganizationF: func(ctx context.Context) (*chronograf.Organization, error) {
						return &chronograf.Organization{
							ID: "default",
						}, nil
					},
				},
			},
			args: args{
				useAuth:   true,
				principal: nil,
				routerParams: &httprouter.Params{
					{
						Key:   "oid",
						Value: "other",
					},
				},
			},
			wants: wants{
				matches: false,
			},
		},
		{
			name: "not using auth",
			fields: fields{
				Logger: log.New(log.DebugLevel),
				OrganizationsStore: &mocks.OrganizationsStore{
					DefaultOrganizationF: func(ctx context.Context) (*chronograf.Organization, error) {
						return &chronograf.Organization{
							ID: "default",
						}, nil
					},
				},
			},
			args: args{
				useAuth: false,
				principal: &oauth2.Principal{
					Subject:      "user",
					Issuer:       "github",
					Organization: "default",
				},
				routerParams: &httprouter.Params{
					{
						Key:   "oid",
						Value: "other",
					},
				},
			},
			wants: wants{
				matches: true,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := &mocks.Store{
				OrganizationsStore: tt.fields.OrganizationsStore,
			}
			var matches bool
			next := func(w http.ResponseWriter, r *http.Request) {
				matches = true
			}
			fn := RouteMatchesPrincipal(
				store,
				tt.args.useAuth,
				tt.fields.Logger,
				next,
			)

			w := httptest.NewRecorder()
			url := "http://any.url"
			r := httptest.NewRequest(
				"GET",
				url,
				nil,
			)
			if tt.args.routerParams != nil {
				r = r.WithContext(httprouter.WithParams(r.Context(), *tt.args.routerParams))
			}
			if tt.args.principal == nil {
				r = r.WithContext(context.WithValue(r.Context(), oauth2.PrincipalKey, nil))
			} else {
				r = r.WithContext(context.WithValue(r.Context(), oauth2.PrincipalKey, *tt.args.principal))
			}
			fn(w, r)

			if matches != tt.wants.matches {
				t.Errorf("%q. RouteMatchesPrincipal() = %v, expected %v", tt.name, matches, tt.wants.matches)
			}

			if !matches && w.Code != http.StatusForbidden {
				t.Errorf("%q. RouteMatchesPrincipal() Status Code = %v, expected %v", tt.name, w.Code, http.StatusForbidden)
			}

		})
	}
}

func TestRequireRequestedWithXMLHttpRequest(t *testing.T) {
	logger := log.New(log.DebugLevel)
	protected := RequireRequestedWithXMLHttpRequest(
		logger,
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusNoContent)
		}),
	)

	tests := []struct {
		name     string
		header   string
		expected int
	}{
		{name: "missing header", expected: http.StatusForbidden},
		{name: "invalid header", header: "fetch", expected: http.StatusForbidden},
		{
			name:     "valid header",
			header:   "XMLHttpRequest",
			expected: http.StatusNoContent,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "http://chronograf.test/query", nil)
			if tt.header != "" {
				req.Header.Set("X-Requested-With", tt.header)
			}

			rec := httptest.NewRecorder()
			protected.ServeHTTP(rec, req)

			if rec.Code != tt.expected {
				t.Fatalf("status=%d, want=%d", rec.Code, tt.expected)
			}
		})
	}
}

func TestSecurityHeaders(t *testing.T) {
	protected := SecurityHeaders(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))

	req := httptest.NewRequest(http.MethodGet, "http://chronograf.test/", nil)
	rec := httptest.NewRecorder()

	protected.ServeHTTP(rec, req)

	if got := rec.Header().Get("X-Frame-Options"); got != "SAMEORIGIN" {
		t.Fatalf("X-Frame-Options=%q, want %q", got, "SAMEORIGIN")
	}

	if got := rec.Header().Get("Cross-Origin-Resource-Policy"); got != "same-origin" {
		t.Fatalf("Cross-Origin-Resource-Policy=%q, want %q", got, "same-origin")
	}
}

func TestRequireSameOriginForSessionAuth(t *testing.T) {
	logger := log.New(log.DebugLevel)
	protected := RequireSameOriginForSessionAuth(
		logger,
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusNoContent)
		}),
	)

	tests := []struct {
		name       string
		method     string
		host       string
		origin     string
		referer    string
		hasSession bool
		expected   int
	}{
		{
			name:       "unsafe with matching origin is allowed",
			method:     http.MethodPost,
			host:       "chronograf.test",
			origin:     "https://chronograf.test",
			hasSession: true,
			expected:   http.StatusNoContent,
		},
		{
			name:       "unsafe with mismatched origin is blocked",
			method:     http.MethodPost,
			host:       "chronograf.test",
			origin:     "https://attacker.test",
			hasSession: true,
			expected:   http.StatusForbidden,
		},
		{
			name:       "unsafe with matching referer is allowed",
			method:     http.MethodPatch,
			host:       "chronograf.test",
			referer:    "https://chronograf.test/path",
			hasSession: true,
			expected:   http.StatusNoContent,
		},
		{
			name:       "unsafe missing origin and referer is blocked with session",
			method:     http.MethodDelete,
			host:       "chronograf.test",
			hasSession: true,
			expected:   http.StatusForbidden,
		},
		{
			name:       "unsafe without session bypasses origin guard",
			method:     http.MethodPost,
			host:       "chronograf.test",
			origin:     "https://attacker.test",
			hasSession: false,
			expected:   http.StatusNoContent,
		},
		{
			name:       "safe method bypasses origin guard",
			method:     http.MethodGet,
			host:       "chronograf.test",
			origin:     "https://attacker.test",
			hasSession: true,
			expected:   http.StatusNoContent,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, "http://chronograf.test/test", nil)
			req.Host = tt.host
			if tt.origin != "" {
				req.Header.Set("Origin", tt.origin)
			}
			if tt.referer != "" {
				req.Header.Set("Referer", tt.referer)
			}
			if tt.hasSession {
				req.AddCookie(&http.Cookie{Name: oauth2.DefaultCookieName, Value: "token"})
			}

			rec := httptest.NewRecorder()
			protected.ServeHTTP(rec, req)

			if rec.Code != tt.expected {
				t.Fatalf("status=%d, want=%d", rec.Code, tt.expected)
			}
		})
	}
}
