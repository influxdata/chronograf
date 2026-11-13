package server

import (
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/oauth2"
)

// RequireSameOriginForSessionAuth validates Origin/Referer for unsafe methods
// when the request carries the session cookie used for browser auth.
// when Origin matches publicUrl the validation will be bypassed
func RequireSameOriginForSessionAuth(logger chronograf.Logger, next http.Handler, publicUrl *url.URL) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !isUnsafeMethod(r.Method) || !hasSessionCookie(r) {
			next.ServeHTTP(w, r)
			return
		}

		// Bypass if origin matches publicUrl
		if matchesPublicUrl(publicUrl, r) {
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

func sanePublicUrl(url *url.URL) bool {
	publicUrlSchemes := map[string]bool{"http": true, "https": true}

	if url == nil {
		return false
	}

	host, port, err := net.SplitHostPort(url.Host)

	if err != nil {
		return false
	}

	iPort, err := strconv.Atoi(port)

	return host != "" && publicUrlSchemes[strings.ToLower(url.Scheme)] && iPort > 0 && iPort < 65536
}

func parseURL(us string) (*url.URL, error) {
	if us == "" {
		return nil, nil
	}

	u, err := url.Parse(us)

	if err != nil {
		return nil, err
	}

	u.Host = strings.ToLower(u.Host)
	if u.Port() == "" {
		switch strings.ToLower(u.Scheme) {
		case "http":
			result, err := url.Parse(fmt.Sprintf("%s://%s:%s", u.Scheme, u.Host, "80"))
			if err != nil {
				return nil, err
			}
			return result, nil
		case "https":
			result, err := url.Parse(fmt.Sprintf("%s://%s:%s", u.Scheme, u.Host, "443"))
			if err != nil {
				return nil, err
			}
			return result, nil
		case "":
			return u, nil
		default:
			return nil, fmt.Errorf("scheme %s not supported", u.Scheme)
		}
	}
	return u, nil
}

func matchesPublicUrl(pu *url.URL, r *http.Request) bool {

	if pu == nil {
		return false
	}
	origin := r.Header.Get("Origin")
	if origin == "" {
		// if origin does not exist fall back to referer
		referer := r.Header.Get("Referer")
		if referer == "" {
			return false
		}
		ru, err := parseURL(referer)
		if err != nil {
			return false
		}

		return pu.Scheme == ru.Scheme &&
			pu.Host == ru.Host &&
			pu.Port() == ru.Port()
	}

	ou, err := parseURL(origin)
	if err != nil {
		return false
	}

	return pu.Scheme == ou.Scheme &&
		pu.Host == ou.Host &&
		pu.Port() == ou.Port()

	// N.B. if origin exists and check fails, do not fall back to referrer.

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
