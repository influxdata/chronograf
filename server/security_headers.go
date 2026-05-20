package server

import "net/http"

const (
	xFrameOptionsHeaderName              = "X-Frame-Options"
	xFrameOptionsHeaderValue             = "SAMEORIGIN"
	crossOriginResourcePolicyHeaderName  = "Cross-Origin-Resource-Policy"
	crossOriginResourcePolicyHeaderValue = "same-origin"
)

// SecurityHeaders sets defense-in-depth browser isolation headers.
func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		headers := w.Header()
		headers.Set(xFrameOptionsHeaderName, xFrameOptionsHeaderValue)
		headers.Set(crossOriginResourcePolicyHeaderName, crossOriginResourcePolicyHeaderValue)
		next.ServeHTTP(w, r)
	})
}
