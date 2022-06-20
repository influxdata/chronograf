package flux_test

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/influxdata/chronograf/flux"
)

// NewClient initializes an HTTP Client for InfluxDB.
func NewClient(urlStr string) *flux.Client {
	u, _ := url.Parse(urlStr)
	return &flux.Client{
		URL:     u,
		Timeout: 500 * time.Millisecond,
	}
}

func Test_FluxEnabled(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if !strings.HasSuffix(path, "/api/v2/query") {
			t.Error("Expected the path to contain `/api/v2/query` but was", path)
		}
		if strings.HasPrefix(path, "/enabled_v1") {
			rw.Header().Add("Content-Type", "application/json")
			rw.WriteHeader(http.StatusBadRequest)
			rw.Write([]byte(`{}`))
			return
		}
		if strings.HasPrefix(path, "/enabled_v2") {
			rw.Header().Add("Content-Type", "application/json")
			rw.WriteHeader(http.StatusUnauthorized)
			rw.Write([]byte(`{"code":"unauthorized","message":"unauthorized access"}`))
			return
		}
		rw.Header().Add("Content-Type", "text/plain")
		rw.WriteHeader(http.StatusForbidden)
		rw.Write([]byte(`Flux query service disabled.`))
	}))
	defer ts.Close()

	if enabled, _ := NewClient(ts.URL).FluxEnabled(); enabled {
		t.Errorf("Client.FluxEnabled() expected false value")
	}
	if enabled, _ := NewClient(ts.URL + "/enabled_v1").FluxEnabled(); !enabled {
		t.Errorf("Client.FluxEnabled() expected true value")
	}
	if enabled, _ := NewClient(ts.URL + "/enabled_v2").FluxEnabled(); !enabled {
		t.Errorf("Client.FluxEnabled() expected true value")
	}
}
