package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"golang.org/x/net/context"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/influx"
	"github.com/influxdata/chronograf/influx/queries"
)

// QueryRequest is query that will be converted to a queryConfig
type QueryRequest struct {
	ID    string `json:"id"`
	Query string `json:"query"`
}

// QueriesRequest converts all queries to queryConfigs with the help
// of the template variables
type QueriesRequest struct {
	Queries      []QueryRequest           `json:"queries"`
	TemplateVars []chronograf.TemplateVar `json:"tempVars,omitempty"`
}

// QueryResponse is the return result of a QueryRequest including
// the raw query, the templated query, the queryConfig and the queryAST
type QueryResponse struct {
	Duration       int64                    `json:"durationMs"`
	ID             string                   `json:"id"`
	Query          string                   `json:"query"`
	QueryConfig    chronograf.QueryConfig   `json:"queryConfig"`
	QueryAST       *queries.SelectStatement `json:"queryAST,omitempty"`
	QueryTemplated *string                  `json:"queryTemplated,omitempty"`
}

// QueriesResponse is the response for a QueriesRequest
type QueriesResponse struct {
	Queries []QueryResponse `json:"queries"`
}

// Queries analyzes InfluxQL to produce front-end friendly QueryConfig
func (s *Service) Queries(w http.ResponseWriter, r *http.Request) {
	srcID, err := paramID("id", r)
	if err != nil {
		Error(w, http.StatusUnprocessableEntity, err.Error(), s.Logger)
		return
	}

	ctx := r.Context()
	src, err := s.Store.Sources(ctx).Get(ctx, srcID)
	if err != nil {
		notFound(w, srcID, s.Logger)
		return
	}

	var req QueriesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		invalidJSON(w, s.Logger)
		return
	}
	res := QueriesResponse{
		Queries: make([]QueryResponse, len(req.Queries)),
	}

	for i, q := range req.Queries {
		qr := QueryResponse{
			ID:    q.ID,
			Query: q.Query,
		}

		qc := ToQueryConfig(q.Query)
		if err := s.DefaultRP(ctx, &qc, &src); err != nil {
			Error(w, http.StatusBadRequest, err.Error(), s.Logger)
			return
		}
		qc.Shifts = []chronograf.TimeShift{}
		qr.QueryConfig = qc

		if stmt, err := queries.ParseSelect(q.Query); err == nil {
			qr.QueryAST = stmt
		}

		if dur, err := influx.ParseTime(q.Query, time.Now()); err == nil {
			ms := dur.Nanoseconds() / int64(time.Millisecond)
			if ms == 0 {
				ms = 1
			}

			qr.Duration = ms
		}

		qr.QueryConfig.ID = q.ID
		res.Queries[i] = qr
	}

	encodeJSON(w, http.StatusOK, res, s.Logger)
}

// DefaultRP will add the default retention policy to the QC if one has not been specified
func (s *Service) DefaultRP(ctx context.Context, qc *chronograf.QueryConfig, src *chronograf.Source) error {
	// Only need to find the default RP IFF the qc's rp is empty
	if qc.RetentionPolicy != "" {
		return nil
	}

	// For queries without databases, measurements, or fields we will not
	// be able to find an RP
	if qc.Database == "" || qc.Measurement == "" || len(qc.Fields) == 0 {
		return nil
	}

	db := s.Databases
	if err := db.Connect(ctx, src); err != nil {
		return fmt.Errorf("Unable to connect to source: %v", err)
	}

	rps, err := db.AllRP(ctx, qc.Database)
	if err != nil {
		return fmt.Errorf("Unable to load RPs from DB %s: %v", qc.Database, err)
	}

	for _, rp := range rps {
		if rp.Default {
			qc.RetentionPolicy = rp.Name
			return nil
		}
	}

	return nil
}
