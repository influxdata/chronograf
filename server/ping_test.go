package server

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestPingStatus(t *testing.T) {
	req := httptest.NewRequest("GET", "http://hoverboards.com", nil)
	w := httptest.NewRecorder()
	srv := Service{}
	srv.Ping(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusNoContent {
		t.Errorf("TestPingStatus got status code %d want %d", resp.StatusCode, http.StatusNoContent)
	}
}

func TestPingTokenRefresh(t *testing.T) {

}
