package server

import (
	"net"
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
	expectedScheme := requestScheme(r)
	expectedHost := r.Host
	if expectedHost == "" {
		return false
	}

	if origin := r.Header.Get("Origin"); origin != "" {
		return sameHost(origin, expectedScheme, expectedHost)
	}

	if referer := r.Header.Get("Referer"); referer != "" {
		return sameHost(referer, expectedScheme, expectedHost)
	}

	return false
}

func requestScheme(r *http.Request) string {
	if xfp := strings.TrimSpace(r.Header.Get("X-Forwarded-Proto")); xfp != "" {
		return strings.ToLower(strings.TrimSpace(strings.Split(xfp, ",")[0]))
	}
	if r.TLS != nil {
		return "https"
	}
	return "http"
}

func sameHost(rawURL, expectedScheme, expectedHost string) bool {
	u, err := url.Parse(rawURL)
	if err != nil || u.Scheme == "" || u.Host == "" {
		return false
	}
	if !strings.EqualFold(u.Scheme, expectedScheme) {
		return false
	}

	originHost := u.Hostname()
	originPort := u.Port()
	if originPort == "" {
		originPort = defaultPort(u.Scheme)
	}

	hostOnly := expectedHost
	expectedPort := ""
	if h, p, err := net.SplitHostPort(expectedHost); err == nil {
		hostOnly = h
		expectedPort = p
	} else {
		expectedPort = defaultPort(expectedScheme)
	}

	if originPort == "" || expectedPort == "" {
		return false
	}

	return strings.EqualFold(originHost, hostOnly) && originPort == expectedPort
}

func defaultPort(scheme string) string {
	switch strings.ToLower(scheme) {
	case "http":
		return "80"
	case "https":
		return "443"
	default:
		return ""
	}
}
