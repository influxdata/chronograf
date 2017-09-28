package server

import (
	"net/http"

	"github.com/bouk/httprouter"
	"github.com/influxdata/chronograf"
)

type chronografUserLinks struct {
	Self string `json:"self"` // Self link mapping to this resource
}

type chronografUserResponse struct {
	Links    chronografUserLinks `json:"links"`
	ID       string              `json:"id"`
	Provider string              `json:"provider,omitempty"`
	Scheme   string              `json:"scheme,omitempty"`
}

func newChronografUserResponse(u *chronograf.User) *chronografUserResponse {
	return &chronografUserResponse{
		ID:       u.ID,
		Provider: u.Provider,
		Scheme:   u.Scheme,
		Links: chronografUserLinks{
			Self: "/chronograf/v1/users/" + u.ID,
		},
	}
}

func (s *Service) UserID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	id := httprouter.GetParamFromContext(ctx, "id")
	user, err := s.UsersStore.Get(ctx, id)
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error(), s.Logger)
		return
	}

	res := newChronografUserResponse(user)
	encodeJSON(w, http.StatusOK, res, s.Logger)
}
