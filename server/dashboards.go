package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/bouk/httprouter"
	"github.com/influxdata/chronograf"
)

type dashboardLinks struct {
	Self string `json:"self"` // Self link mapping to this resource
}

type dashboardResponse struct {
	chronograf.Dashboard
	Links dashboardLinks `json:"links"`
}

type getDashboardsResponse struct {
	Dashboards []dashboardResponse `json:"dashboards"`
}

func newDashboardResponse(d chronograf.Dashboard) dashboardResponse {
	base := "/chronograf/v1/dashboards"
	return dashboardResponse{
		Dashboard: d,
		Links: dashboardLinks{
			Self: fmt.Sprintf("%s/%d", base, d.ID),
		},
	}
}

// Dashboards returns all dashboards within the store
func (s *Service) Dashboards(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	dashboards, err := s.DashboardsStore.All(ctx)
	if err != nil {
		Error(w, http.StatusInternalServerError, "Error loading dashboards", s.Logger)
		return
	}

	res := getDashboardsResponse{
		Dashboards: []dashboardResponse{},
	}

	for _, dashboard := range dashboards {
		res.Dashboards = append(res.Dashboards, newDashboardResponse(dashboard))
	}

	encodeJSON(w, http.StatusOK, res, s.Logger)
}

// DashboardID returns a single specified dashboard
func (s *Service) DashboardID(w http.ResponseWriter, r *http.Request) {
	id, err := paramID("id", r)
	if err != nil {
		Error(w, http.StatusUnprocessableEntity, err.Error(), s.Logger)
		return
	}

	ctx := r.Context()
	e, err := s.DashboardsStore.Get(ctx, chronograf.DashboardID(id))
	if err != nil {
		notFound(w, id, s.Logger)
		return
	}

	res := newDashboardResponse(e)
	encodeJSON(w, http.StatusOK, res, s.Logger)
}

// NewDashboard creates and returns a new dashboard object
func (s *Service) NewDashboard(w http.ResponseWriter, r *http.Request) {
	var dashboard chronograf.Dashboard
	if err := json.NewDecoder(r.Body).Decode(&dashboard); err != nil {
		invalidJSON(w, s.Logger)
		return
	}

	if err := ValidDashboardRequest(dashboard); err != nil {
		invalidData(w, err, s.Logger)
		return
	}

	var err error
	if dashboard, err = s.DashboardsStore.Add(r.Context(), dashboard); err != nil {
		msg := fmt.Errorf("Error storing dashboard %v: %v", dashboard, err)
		unknownErrorWithMessage(w, msg, s.Logger)
		return
	}

	res := newDashboardResponse(dashboard)
	w.Header().Add("Location", res.Links.Self)
	encodeJSON(w, http.StatusCreated, res, s.Logger)
}

// RemoveDashboard deletes a dashboard
func (s *Service) RemoveDashboard(w http.ResponseWriter, r *http.Request) {
	id, err := paramID("id", r)
	if err != nil {
		Error(w, http.StatusUnprocessableEntity, err.Error(), s.Logger)
		return
	}

	ctx := r.Context()
	e, err := s.DashboardsStore.Get(ctx, chronograf.DashboardID(id))
	if err != nil {
		notFound(w, id, s.Logger)
		return
	}

	if err := s.DashboardsStore.Delete(ctx, e); err != nil {
		unknownErrorWithMessage(w, err, s.Logger)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// UpdateDashboard replaces a dashboard
func (s *Service) UpdateDashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	idParam, err := strconv.Atoi(httprouter.GetParamFromContext(ctx, "id"))
	if err != nil {
		msg := fmt.Sprintf("Could not parse dashboard ID: %s", err)
		Error(w, http.StatusInternalServerError, msg, s.Logger)
	}
	id := chronograf.DashboardID(idParam)

	_, err = s.DashboardsStore.Get(ctx, id)
	if err != nil {
		Error(w, http.StatusNotFound, fmt.Sprintf("ID %d not found", id), s.Logger)
		return
	}

	var req chronograf.Dashboard
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		invalidJSON(w, s.Logger)
		return
	}
	req.ID = id

	if err := ValidDashboardRequest(req); err != nil {
		invalidData(w, err, s.Logger)
		return
	}

	if err := s.DashboardsStore.Update(ctx, req); err != nil {
		msg := fmt.Sprintf("Error updating dashboard ID %d: %v", id, err)
		Error(w, http.StatusInternalServerError, msg, s.Logger)
		return
	}

	res := newDashboardResponse(req)
	encodeJSON(w, http.StatusOK, res, s.Logger)
}

// ValidDashboardRequest verifies that the dashboard cells have a query
func ValidDashboardRequest(d chronograf.Dashboard) error {
	if len(d.Cells) == 0 {
		return fmt.Errorf("cells are required")
	}

	for _, c := range d.Cells {
		for _, q := range c.Queries {
			if len(q) == 0 {
				return fmt.Errorf("query required")
			}
		}
	}

	return nil
}
