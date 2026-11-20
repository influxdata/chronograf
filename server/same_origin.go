package server

import (
	"fmt"
	"net"
	"net/http"
	"net/url"
	"regexp"
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

		// If PUBLIC_URL is defined use as gatekeeper
		if publicUrl != nil {
			if matchesPublicUrl(publicUrl, r) {
				next.ServeHTTP(w, r)
				return
			}
			logger.
				WithField("component", "same_origin_guard").
				WithField("remote_addr", r.RemoteAddr).
				WithField("method", r.Method).
				WithField("url", r.URL).
				WithField("origin", r.Header.Get("Origin")).
				WithField("referer", r.Header.Get("Referer")).
				Error("With PUBLIC_URL defined request failed to match PUBLIC_URL")
			Error(w, http.StatusForbidden, "request must match public url", logger)
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

func saneHeaderUrl(url *url.URL, forPublicUrl bool) bool {
	publicUrlSchemes := map[string]bool{"http": true, "https": true}
	if url == nil {
		return true
	}

	// Pass ipV6 but reject ipV4 host:port when host is empty
	if m, _ := regexp.MatchString(":\\d*$", url.Host); m {
		host, port, err := net.SplitHostPort(url.Host)
		if err != nil || host == "" {
			return false
		}

		iport, err := strconv.Atoi(port)
		if err != nil || iport <= 0 || iport > 65535 {
			return false
		}
	}

	if forPublicUrl {
		return url.RawQuery == "" &&
			url.Fragment == "" &&
			url.User == nil &&
			publicUrlSchemes[strings.ToLower(url.Scheme)] &&
			url.Host != ""
	}

	return url.Path == "" &&
		url.RawQuery == "" &&
		url.Fragment == "" &&
		url.User == nil &&
		publicUrlSchemes[strings.ToLower(url.Scheme)] &&
		url.Host != ""
}

func normalizeUrl(url *url.URL) (*url.URL, error) {

	url.Host = strings.ToLower(url.Host)
	url.Scheme = strings.ToLower(url.Scheme)
	result := url
	var err error

	if url.Port() == "" {
		switch strings.ToLower(url.Scheme) {
		case "http":
			result, err = url.Parse(fmt.Sprintf("%s://%s:%s", url.Scheme, url.Host, "80"))
			if err != nil {
				return nil, err
			}
			break
		case "https":
			result, err = url.Parse(fmt.Sprintf("%s://%s:%s", url.Scheme, url.Host, "443"))
			if err != nil {
				return nil, err
			}
			break
		case "":
			break
		default:
			return nil, fmt.Errorf("scheme %s not supported", url.Scheme)
		}
	}
	result.User = url.User
	result.Path = url.Path
	return result, err
}

func parseURL(us string, forPublicUrl bool) (*url.URL, error) {
	if us == "" {
		return nil, nil
	}

	u, err := url.Parse(us)

	if err != nil {
		return nil, err
	}

	if !saneHeaderUrl(u, forPublicUrl) {
		return nil, fmt.Errorf("invalid URL for Header URL or PublicUrl: %s", us)
	}

	return normalizeUrl(u)
}

func urlPortToInt(url *url.URL) (int, error) {
	var p int
	if url.Port() != "" {
		parsed, err := strconv.Atoi(url.Port())
		if err != nil {
			return -1, err
		}
		p = parsed
	}
	return p, nil
}

func matchesPublicUrl(pu *url.URL, r *http.Request) bool {

	if pu == nil {
		return false
	}

	pport, err := urlPortToInt(pu)

	if err != nil {
		return false
	}

	origin := r.Header.Get("Origin")
	if origin == "" {
		// if origin does not exist fall back to referer
		referer := r.Header.Get("Referer")
		if referer == "" {
			return false
		}
		ru, err := url.Parse(referer)
		if err != nil {
			return false
		}

		ru, err = normalizeUrl(ru)

		if err != nil {
			return false
		}

		rport, err := urlPortToInt(ru)

		if err != nil {
			return false
		}

		return ru.User == nil &&
			pu.Scheme == ru.Scheme &&
			pu.Host == ru.Host &&
			pport == rport
	}

	ou, err := parseURL(origin, false)
	if err != nil {
		return false
	}

	if !saneHeaderUrl(ou, false) {
		return false
	}

	oport, err := urlPortToInt(ou)

	if err != nil {
		return false
	}

	return pu.Scheme == ou.Scheme &&
		pu.Host == ou.Host &&
		pport == oport

	// N.B. if origin exists and check fails, do not fall back to referrer.

}

func sameHost(rawURL, expectedScheme, expectedHost string) bool {
	u, err := url.Parse(rawURL)
	if err != nil || u.Scheme == "" || u.Host == "" || u.User != nil {
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
