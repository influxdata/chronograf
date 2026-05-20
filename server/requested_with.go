package server

import (
	"net/http"

	"github.com/influxdata/chronograf"
)

const (
	requestedWithHeaderName   = "X-Requested-With"
	xmlHttpRequestHeaderValue = "XMLHttpRequest"
)

// RequireRequestedWithXMLHttpRequest rejects requests that do not include
// X-Requested-With: XMLHttpRequest.
func RequireRequestedWithXMLHttpRequest(
	logger chronograf.Logger,
	next http.Handler,
) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get(requestedWithHeaderName) != xmlHttpRequestHeaderValue {
			logger.
				WithField("component", "request_header_guard").
				WithField("remote_addr", r.RemoteAddr).
				WithField("method", r.Method).
				WithField("url", r.URL).
				Error("Missing or invalid X-Requested-With header")
			Error(w, http.StatusForbidden, "missing required X-Requested-With header", logger)
			return
		}

		next.ServeHTTP(w, r)
	})
}
