package server

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/bouk/httprouter"
	"github.com/influxdata/chronograf"
)

type userRequest struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Provider string `json:"provider,omitempty"`
	Scheme   string `json:"scheme,omitempty"`
}

func (r *userRequest) ValidCreate() error {
	if r.Username == "" {
		return fmt.Errorf("Username required on Chronograf User request body")
	}
	if r.Provider == "" {
		return fmt.Errorf("Provider required on Chronograf User request body")
	}
	if r.Scheme == "" {
		return fmt.Errorf("Scheme required on Chronograf User request body")
	}
	return nil
}

type userResponse struct {
	Links    selfLinks `json:"links"`
	ID       string    `json:"id"`
	Username string    `json:"username,omitempty"`
	Provider string    `json:"provider,omitempty"`
	Scheme   string    `json:"scheme,omitempty"`
}

func newUserResponse(u *chronograf.User) *userResponse {
	return &userResponse{
		ID:       u.ID,
		Username: u.Username,
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

func (s *Service) NewUser(w http.ResponseWriter, r *http.Request) {
	var req userRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		invalidJSON(w, s.Logger)
		return
	}

	if err := req.ValidCreate(); err != nil {
		invalidData(w, err, s.Logger)
		return
	}

	ctx := r.Context()
	user := &chronograf.User{
		Username: req.Username,
		Provider: req.Provider,
		Scheme:   req.Scheme,
	}

	res, err := s.UsersStore.Add(ctx, user)
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error(), s.Logger)
		return
	}

	cu := newUserResponse(res)
	w.Header().Add("Location", cu.Links.Self)
	encodeJSON(w, http.StatusCreated, cu, s.Logger)
}

func (s *Service) RemoveUser(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := httprouter.GetParamFromContext(ctx, "id")

	if err := s.UsersStore.Delete(ctx, id); err != nil {
		Error(w, http.StatusBadRequest, err.Error(), s.Logger)
	}

	w.WriteHeader(http.StatusNoContent)
}
