package server

import (
	"fmt"
	"net/http"

	"github.com/bouk/httprouter"
	"github.com/influxdata/chronograf"
)

type protoboardLinks struct {
	Self string `json:"self"`
}

type protoboardResponse struct {
	chronograf.Protoboard
	Links protoboardLinks `json:"links"`
}

func newProtoboardResponse(protoboard chronograf.Protoboard) protoboardResponse {
	httpAPIProtoboards := "/chronograf/v1/protoboards"
	selfLink := fmt.Sprintf("%s/%s", httpAPIProtoboards, protoboard.ID)

	return protoboardResponse{
		Protoboard: protoboard,
		Links: protoboardLinks{
			Self: selfLink,
		},
	}
}

type getProtoboardsResponse struct {
	Protoboards []protoboardResponse `json:"protoboards"`
}

// Protoboards retrieves all protoboards from store
func (s *Service) Protoboards(w http.ResponseWriter, r *http.Request) {

	ctx := r.Context()
	protoboards, err := s.Store.Protoboards(ctx).All(ctx)
	if err != nil {
		Error(w, http.StatusInternalServerError, "Error loading protoboards", s.Logger)
		return
	}

	res := getProtoboardsResponse{
		Protoboards: []protoboardResponse{},
	}

	seen := make(map[string]bool)
	for _, protoboard := range protoboards {
		// remove duplicates
		if seen[protoboard.ID] {
			continue
		}
		seen[protoboard.ID] = true

		res.Protoboards = append(res.Protoboards, newProtoboardResponse(protoboard))
	}
	encodeJSON(w, http.StatusOK, res, s.Logger)
}

// ProtoboardsID retrieves protoboard with ID from store
func (s *Service) ProtoboardsID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := httprouter.GetParamFromContext(ctx, "id")

	protoboard, err := s.Store.Protoboards(ctx).Get(ctx, id)
	if err != nil {
		Error(w, http.StatusNotFound, fmt.Sprintf("ID %s not found", id), s.Logger)
		return
	}

	res := newProtoboardResponse(protoboard)
	encodeJSON(w, http.StatusOK, res, s.Logger)
}
