package server

import (
	"net/http"

	"github.com/bouk/httprouter"
	"github.com/influxdata/chronograf"
)

type userResponse struct {
	Links    selfLinks `json:"links"`
	ID       string    `json:"id"`
	Provider string    `json:"provider,omitempty"`
	Scheme   string    `json:"scheme,omitempty"`
}

func newUserResponse(u *chronograf.User) *userResponse {
	return &userResponse{
		ID:       u.ID,
		Provider: u.Provider,
		Scheme:   u.Scheme,
		Links: selfLinks{
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

	res := newUserResponse(user)
	encodeJSON(w, http.StatusOK, res, s.Logger)
}
