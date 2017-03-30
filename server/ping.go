package server

import "net/http"

// Ping responds with HTTP status 204 (no content) and if auth is available
// refreshes the token within the cookie.
func (h *Service) Ping(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNoContent)
	if h.UseAuth {
		// TODO: refresh token
	}
}
