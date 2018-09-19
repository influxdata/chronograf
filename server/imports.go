package server

import (
	"net/http"

	"github.com/influxdata/chronograf/import/grafana"
)

// BrowseGrafana returns all Grafana dashboard results
func (s *Service) BrowseGrafana(w http.ResponseWriter, r *http.Request) {
	addr := r.URL.Query().Get("addr")
	if addr == "" {
		Error(w, http.StatusBadRequest, "empty address", s.Logger)
		return
	}
	results, err := grafana.FetchDashboards(addr)
	if err != nil {
		// TODO(edd): Improve this.
		Error(w, http.StatusInternalServerError, err.Error(), s.Logger)
		return
	}

	encodeJSON(w, http.StatusOK, results, s.Logger)
}

// GetGrafanaDashboard returns all Grafana dashboard results
func (s *Service) GetGrafanaDashboard(w http.ResponseWriter, r *http.Request) {
	addr := r.URL.Query().Get("addr")
	if addr == "" {
		Error(w, http.StatusBadRequest, "empty address", s.Logger)
		return
	}
	results, err := grafana.FetchDashboard(addr)
	if err != nil {
		// TODO(edd): Improve this.
		Error(w, http.StatusInternalServerError, err.Error(), s.Logger)
		return
	}

	encodeJSON(w, http.StatusOK, results, s.Logger)
}
