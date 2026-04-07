package server

import (
	"context"
	"encoding/base64"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/bouk/httprouter"
	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/mocks"
)

func TestService_Proxy_AuthHeaderForwarding(t *testing.T) {
	tests := []struct {
		name                       string
		incomingCookie             string
		incomingAuthorization      string
		incomingProxyAuthorization string
		storedUsername             string
		storedPassword             string
		wantCookie                 string
		wantAuthorization          string
		wantProxyAuthorization     string
	}{
		{
			name:                       "strips incoming cookie and auth headers",
			incomingCookie:             "session=victim-session",
			incomingAuthorization:      "Bearer victim-token",
			incomingProxyAuthorization: "Basic dmljdGltOnRva2Vu",
		},
		{
			name:           "does not set authorization when upstream credentials are empty",
			incomingCookie: "session=victim-session",
		},
		{
			name:              "uses stored basic auth when configured",
			incomingCookie:    "session=victim-session",
			storedUsername:    "kap-user",
			storedPassword:    "kap-pass",
			wantAuthorization: "Basic " + base64.StdEncoding.EncodeToString([]byte("kap-user:kap-pass")),
		},
		{
			name:                  "stored basic auth overrides incoming bearer auth",
			incomingAuthorization: "Bearer victim-token",
			storedUsername:        "kap-user",
			storedPassword:        "kap-pass",
			wantAuthorization:     "Basic " + base64.StdEncoding.EncodeToString([]byte("kap-user:kap-pass")),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var gotCookie string
			var gotAuthorization string
			var gotProxyAuthorization string

			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				gotCookie = r.Header.Get("Cookie")
				gotAuthorization = r.Header.Get("Authorization")
				gotProxyAuthorization = r.Header.Get("Proxy-Authorization")
				w.WriteHeader(http.StatusNoContent)
			}))
			defer upstream.Close()

			svc := &Service{
				Store: &mocks.Store{
					ServersStore: &mocks.ServersStore{
						GetF: func(ctx context.Context, id int) (chronograf.Server, error) {
							return chronograf.Server{
								ID:       id,
								SrcID:    1,
								URL:      upstream.URL,
								Username: tt.storedUsername,
								Password: tt.storedPassword,
							}, nil
						},
					},
				},
			}

			req := httptest.NewRequest(
				http.MethodGet,
				"/chronograf/v1/sources/1/services/2/proxy?path=/kapacitor/v1/ping",
				nil,
			)
			if tt.incomingCookie != "" {
				req.Header.Set("Cookie", tt.incomingCookie)
			}
			if tt.incomingAuthorization != "" {
				req.Header.Set("Authorization", tt.incomingAuthorization)
			}
			if tt.incomingProxyAuthorization != "" {
				req.Header.Set("Proxy-Authorization", tt.incomingProxyAuthorization)
			}

			req = req.WithContext(httprouter.WithParams(
				context.Background(),
				httprouter.Params{
					{Key: "id", Value: "1"},
					{Key: "kid", Value: "2"},
				},
			))

			rr := httptest.NewRecorder()
			svc.ProxyGet(rr, req)

			if rr.Code != http.StatusNoContent {
				t.Fatalf("expected status %d, got %d", http.StatusNoContent, rr.Code)
			}
			if gotCookie != tt.wantCookie {
				t.Fatalf("expected forwarded Cookie %q, got %q", tt.wantCookie, gotCookie)
			}
			if gotAuthorization != tt.wantAuthorization {
				t.Fatalf(
					"expected forwarded Authorization %q, got %q",
					tt.wantAuthorization,
					gotAuthorization,
				)
			}
			if gotProxyAuthorization != tt.wantProxyAuthorization {
				t.Fatalf(
					"expected forwarded Proxy-Authorization %q, got %q",
					tt.wantProxyAuthorization,
					gotProxyAuthorization,
				)
			}
		})
	}
}
