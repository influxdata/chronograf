package server

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/bouk/httprouter"
	"github.com/influxdata/chronograf"
	idgen "github.com/influxdata/chronograf/id"
)

const (
	// DefaultWidth is used if not specified
	DefaultWidth = 4
	// DefaultHeight is used if not specified
	DefaultHeight = 4
)

type dashboardCellLinks struct {
	Self string `json:"self"` // Self link mapping to this resource
}

type dashboardCellResponse struct {
	chronograf.DashboardCell
	Links dashboardCellLinks `json:"links"`
}

func newCellResponse(dID chronograf.DashboardID, cell chronograf.DashboardCell) dashboardCellResponse {
	base := "/chronograf/v1/dashboards"
	if cell.Queries == nil {
		cell.Queries = []chronograf.DashboardQuery{}
	}
	if cell.CellColors == nil {
		cell.CellColors = []chronograf.CellColor{}
	}

	// Copy to handle race condition
	newAxes := make(map[string]chronograf.Axis, len(cell.Axes))
	for k, v := range cell.Axes {
		newAxes[k] = v
	}

	// ensure x, y, and y2 axes always returned
	for _, lbl := range []string{"x", "y", "y2"} {
		if _, found := newAxes[lbl]; !found {
			newAxes[lbl] = chronograf.Axis{
				Bounds: []string{},
			}
		}
	}
	cell.Axes = newAxes

	return dashboardCellResponse{
		DashboardCell: cell,
		Links: dashboardCellLinks{
			Self: fmt.Sprintf("%s/%d/cells/%s", base, dID, cell.ID),
		},
	}
}

func newCellResponses(dID chronograf.DashboardID, dcells []chronograf.DashboardCell) []dashboardCellResponse {
	cells := make([]dashboardCellResponse, len(dcells))
	for i, cell := range dcells {
		cells[i] = newCellResponse(dID, cell)
	}
	return cells
}

// ValidDashboardCellRequest verifies that the dashboard cells have a query and
// have the correct axes specified
func ValidDashboardCellRequest(c *chronograf.DashboardCell) error {
	if c == nil {
		return fmt.Errorf("Chronograf dashboard cell was nil")
	}

	CorrectWidthHeight(c)
	for _, q := range c.Queries {
		if err := ValidateQueryConfig(&q.QueryConfig); err != nil {
			return err
		}
	}
	MoveTimeShift(c)
	err := HasCorrectAxes(c)
	if err != nil {
		return err
	}
	if err = HasCorrectColors(c); err != nil {
		return err
	}
	return HasCorrectLegend(c)
}

// HasCorrectAxes verifies that only permitted axes exist within a DashboardCell
func HasCorrectAxes(c *chronograf.DashboardCell) error {
	for label, axis := range c.Axes {
		if !oneOf(label, "x", "y", "y2") {
			return chronograf.ErrInvalidAxis
		}

		if !oneOf(axis.Scale, "linear", "log", "") {
			return chronograf.ErrInvalidAxis
		}

		if !oneOf(axis.Base, "10", "2", "") {
			return chronograf.ErrInvalidAxis
		}
	}

	return nil
}

// HasCorrectColors verifies that the format of each color is correct
func HasCorrectColors(c *chronograf.DashboardCell) error {
	for _, color := range c.CellColors {
		if !oneOf(color.Type, "max", "min", "threshold", "text", "background") {
			return chronograf.ErrInvalidColorType
		}
		if len(color.Hex) != 7 {
			return chronograf.ErrInvalidColor
		}
	}
	return nil
}

// HasCorrectLegend verifies that the format of the legend is correct
func HasCorrectLegend(c *chronograf.DashboardCell) error {
	// No legend set
	if c.Legend.Type == "" && c.Legend.Orientation == "" {
		return nil
	}

	if c.Legend.Type == "" || c.Legend.Orientation == "" {
		return chronograf.ErrInvalidLegend
	}
	if !oneOf(c.Legend.Orientation, "top", "bottom", "right", "left") {
		return chronograf.ErrInvalidLegendOrient
	}

	// Remember! if we add other types, update ErrInvalidLegendType
	if !oneOf(c.Legend.Type, "static") {
		return chronograf.ErrInvalidLegendType
	}
	return nil
}

// oneOf reports whether a provided string is a member of a variadic list of
// valid options
func oneOf(prop string, validOpts ...string) bool {
	for _, valid := range validOpts {
		if prop == valid {
			return true
		}
	}
	return false
}

// CorrectWidthHeight changes the cell to have at least the
// minimum width and height
func CorrectWidthHeight(c *chronograf.DashboardCell) {
	if c.W < 1 {
		c.W = DefaultWidth
	}
	if c.H < 1 {
		c.H = DefaultHeight
	}
}

// MoveTimeShift moves TimeShift from the QueryConfig to the DashboardQuery
func MoveTimeShift(c *chronograf.DashboardCell) {
	for i, query := range c.Queries {
		query.Shifts = query.QueryConfig.Shifts
		c.Queries[i] = query
	}
}

// AddQueryConfig updates a cell by converting InfluxQL into queryconfigs
// If influxql cannot be represented by a full query config, then, the
// query config's raw text is set to the command.
func AddQueryConfig(c *chronograf.DashboardCell) {
	for i, q := range c.Queries {
		qc := ToQueryConfig(q.Command)
		qc.Shifts = append([]chronograf.TimeShift(nil), q.Shifts...)
		q.Shifts = nil
		q.QueryConfig = qc
		c.Queries[i] = q
	}
}

// DashboardCells returns all cells from a dashboard within the store
func (s *Service) DashboardCells(w http.ResponseWriter, r *http.Request) {
	id, err := paramID("id", r)
	if err != nil {
		Error(w, http.StatusUnprocessableEntity, err.Error(), s.Logger)
		return
	}

	ctx := r.Context()
	e, err := s.Store.Dashboards(ctx).Get(ctx, chronograf.DashboardID(id))
	if err != nil {
		notFound(w, id, s.Logger)
		return
	}

	boards := newDashboardResponse(e)
	cells := boards.Cells
	encodeJSON(w, http.StatusOK, cells, s.Logger)
}

// NewDashboardCell adds a cell to an existing dashboard
func (s *Service) NewDashboardCell(w http.ResponseWriter, r *http.Request) {
	id, err := paramID("id", r)
	if err != nil {
		Error(w, http.StatusUnprocessableEntity, err.Error(), s.Logger)
		return
	}

	ctx := r.Context()
	dash, err := s.Store.Dashboards(ctx).Get(ctx, chronograf.DashboardID(id))
	if err != nil {
		notFound(w, id, s.Logger)
		return
	}
	var cell chronograf.DashboardCell
	if err := json.NewDecoder(r.Body).Decode(&cell); err != nil {
		invalidJSON(w, s.Logger)
		return
	}

	if err := ValidDashboardCellRequest(&cell); err != nil {
		invalidData(w, err, s.Logger)
		return
	}

	ids := &idgen.UUID{}
	cid, err := ids.Generate()
	if err != nil {
		msg := fmt.Sprintf("Error creating cell ID of dashboard %d: %v", id, err)
		Error(w, http.StatusInternalServerError, msg, s.Logger)
		return
	}
	cell.ID = cid

	dash.Cells = append(dash.Cells, cell)
	if err := s.Store.Dashboards(ctx).Update(ctx, dash); err != nil {
		msg := fmt.Sprintf("Error adding cell %s to dashboard %d: %v", cid, id, err)
		Error(w, http.StatusInternalServerError, msg, s.Logger)
		return
	}

	boards := newDashboardResponse(dash)
	for _, cell := range boards.Cells {
		if cell.ID == cid {
			encodeJSON(w, http.StatusOK, cell, s.Logger)
			return
		}
	}
}

// DashboardCellID gets a specific cell from an existing dashboard
func (s *Service) DashboardCellID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id, err := paramID("id", r)
	if err != nil {
		Error(w, http.StatusUnprocessableEntity, err.Error(), s.Logger)
		return
	}

	dash, err := s.Store.Dashboards(ctx).Get(ctx, chronograf.DashboardID(id))
	if err != nil {
		notFound(w, id, s.Logger)
		return
	}

	boards := newDashboardResponse(dash)
	cid := httprouter.GetParamFromContext(ctx, "cid")
	for _, cell := range boards.Cells {
		if cell.ID == cid {
			encodeJSON(w, http.StatusOK, cell, s.Logger)
			return
		}
	}
	notFound(w, id, s.Logger)
}

// RemoveDashboardCell removes a specific cell from an existing dashboard
func (s *Service) RemoveDashboardCell(w http.ResponseWriter, r *http.Request) {
	id, err := paramID("id", r)
	if err != nil {
		Error(w, http.StatusUnprocessableEntity, err.Error(), s.Logger)
		return
	}

	ctx := r.Context()
	dash, err := s.Store.Dashboards(ctx).Get(ctx, chronograf.DashboardID(id))
	if err != nil {
		notFound(w, id, s.Logger)
		return
	}

	cid := httprouter.GetParamFromContext(ctx, "cid")
	cellid := -1
	for i, cell := range dash.Cells {
		if cell.ID == cid {
			cellid = i
			break
		}
	}
	if cellid == -1 {
		notFound(w, id, s.Logger)
		return
	}

	dash.Cells = append(dash.Cells[:cellid], dash.Cells[cellid+1:]...)
	if err := s.Store.Dashboards(ctx).Update(ctx, dash); err != nil {
		msg := fmt.Sprintf("Error removing cell %s from dashboard %d: %v", cid, id, err)
		Error(w, http.StatusInternalServerError, msg, s.Logger)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ReplaceDashboardCell replaces a cell entirely within an existing dashboard
func (s *Service) ReplaceDashboardCell(w http.ResponseWriter, r *http.Request) {
	id, err := paramID("id", r)
	if err != nil {
		Error(w, http.StatusUnprocessableEntity, err.Error(), s.Logger)
		return
	}

	ctx := r.Context()
	dash, err := s.Store.Dashboards(ctx).Get(ctx, chronograf.DashboardID(id))
	if err != nil {
		notFound(w, id, s.Logger)
		return
	}

	cid := httprouter.GetParamFromContext(ctx, "cid")
	cellid := -1
	for i, cell := range dash.Cells {
		if cell.ID == cid {
			cellid = i
			break
		}
	}
	if cellid == -1 {
		notFound(w, cid, s.Logger)
		return
	}

	var cell chronograf.DashboardCell
	if err := json.NewDecoder(r.Body).Decode(&cell); err != nil {
		invalidJSON(w, s.Logger)
		return
	}

	if err := ValidDashboardCellRequest(&cell); err != nil {
		invalidData(w, err, s.Logger)
		return
	}
	cell.ID = cid

	dash.Cells[cellid] = cell
	if err := s.Store.Dashboards(ctx).Update(ctx, dash); err != nil {
		msg := fmt.Sprintf("Error updating cell %s in dashboard %d: %v", cid, id, err)
		Error(w, http.StatusInternalServerError, msg, s.Logger)
		return
	}

	res := newCellResponse(dash.ID, cell)
	encodeJSON(w, http.StatusOK, res, s.Logger)
}
