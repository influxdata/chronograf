package server

import "net/http"

// Ping responds with HTTP status 204 (no content)
func (h *Service) Ping(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNoContent)
}
