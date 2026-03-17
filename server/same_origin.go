package server

import (
	"net/http"
	"net/url"
	"strings"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/oauth2"
)

// RequireSameOriginForSessionAuth validates Origin/Referer for unsafe methods
// when the request carries the session cookie used for browser auth.
func RequireSameOriginForSessionAuth(logger chronograf.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !isUnsafeMethod(r.Method) || !hasSessionCookie(r) {
			next.ServeHTTP(w, r)
			return
		}

		if !isRequestSameOrigin(r) {
			logger.
				WithField("component", "same_origin_guard").
				WithField("remote_addr", r.RemoteAddr).
				WithField("method", r.Method).
				WithField("url", r.URL).
				WithField("origin", r.Header.Get("Origin")).
				WithField("referer", r.Header.Get("Referer")).
				Error("Cross-origin unsafe request blocked")
			Error(w, http.StatusForbidden, "cross-origin request blocked", logger)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func isUnsafeMethod(method string) bool {
	switch method {
	case http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete:
		return true
	default:
		return false
	}
}

func hasSessionCookie(r *http.Request) bool {
	_, err := r.Cookie(oauth2.DefaultCookieName)
	return err == nil
}

func isRequestSameOrigin(r *http.Request) bool {
	expectedHost := r.Host
	if expectedHost == "" {
		return false
	}

	if origin := r.Header.Get("Origin"); origin != "" {
		return sameHost(origin, expectedHost)
	}

	if referer := r.Header.Get("Referer"); referer != "" {
		return sameHost(referer, expectedHost)
	}

	return false
}

func sameHost(rawURL, expectedHost string) bool {
	u, err := url.Parse(rawURL)
	if err != nil {
		return false
	}

	return strings.EqualFold(u.Host, expectedHost)
}
