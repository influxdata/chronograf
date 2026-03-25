package server

import (
	"net/http"
	"path"
	"regexp"
	"strings"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/oauth2"
	"github.com/influxdata/chronograf/roles"
)

var readerDashboardsPath = regexp.MustCompile(`^/sources/[^/]+/dashboards(?:/.*)?$`)

// ReaderSPARouteGuard enforces Reader SPA allowlist server-side:
// - "/" and "/sources/:id/dashboards*"
func ReaderSPARouteGuard(
	store DataStore,
	useAuth bool,
	basepath string,
	auth oauth2.Authenticator,
	logger chronograf.Logger,
	next http.Handler,
) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !useAuth || auth == nil || !isSPAHTMLNavigation(r) {
			next.ServeHTTP(w, r)
			return
		}

		routePath := normalizeSPARoutePath(r.URL.Path, basepath)
		if !isSPARouteSubjectToReaderGuard(routePath) {
			next.ServeHTTP(w, r)
			return
		}

		p, err := auth.Validate(r.Context(), r)
		if err != nil {
			// Keep current unauthenticated/login flow behavior.
			next.ServeHTTP(w, r)
			return
		}

		resolved, err := resolvePrincipalUsers(r.Context(), store, p, "")
		if err != nil || resolved.RawUser == nil {
			Error(w, http.StatusForbidden, "User is not authorized", logger)
			return
		}
		if resolved.RawUser.SuperAdmin {
			next.ServeHTTP(w, r)
			return
		}
		if resolved.ScopedUser == nil || len(resolved.ScopedUser.Roles) != 1 {
			Error(w, http.StatusForbidden, "User is not authorized", logger)
			return
		}

		role := resolved.ScopedUser.Roles[0].Name
		if role == roles.ReaderRoleName && !isReaderAllowedSPAPath(routePath) {
			http.Redirect(w, r, path.Join(basepath, "/"), http.StatusFound)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func isSPAHTMLNavigation(r *http.Request) bool {
	return r.Method == http.MethodGet && strings.Contains(r.Header.Get("Accept"), "text/html")
}

func normalizeSPARoutePath(rawPath, basepath string) string {
	clean := path.Clean(rawPath)
	if clean == "." {
		clean = "/"
	}
	if basepath == "" {
		return clean
	}

	bp := path.Clean(basepath)
	if clean == bp {
		return "/"
	}
	if strings.HasPrefix(clean, bp+"/") {
		return strings.TrimPrefix(clean, bp)
	}
	return clean
}

func isSPARouteSubjectToReaderGuard(routePath string) bool {
	if strings.HasPrefix(routePath, "/chronograf/v1") || strings.HasPrefix(routePath, "/oauth") {
		return false
	}
	switch routePath {
	case "/ping", "/nonce", "/swagger.json", "/docs", "/landing":
		return false
	}
	return !strings.HasPrefix(routePath, "/debug/pprof")
}

func isReaderAllowedSPAPath(routePath string) bool {
	if routePath == "/" {
		return true
	}
	return readerDashboardsPath.MatchString(routePath)
}
