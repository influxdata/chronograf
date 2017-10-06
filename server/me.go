package server

import (
	"fmt"
	"net/http"

	"golang.org/x/net/context"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/oauth2"
)

type meLinks struct {
	Self string `json:"self"` // Self link mapping to this resource
}

type meResponse struct {
	*chronograf.User
	Links meLinks `json:"links"`
}

// If new user response is nil, return an empty meResponse because it
// indicates authentication is not needed
func newMeResponse(usr *chronograf.User) meResponse {
	base := "/chronograf/v1/users"
	username := "me"
	if usr != nil {
		username = PathEscape(usr.Username)
	}

	return meResponse{
		User: usr,
		Links: meLinks{
			Self: fmt.Sprintf("%s/%s", base, username),
		},
	}
}

func getEmail(ctx context.Context) (string, error) {
	principal, err := getPrincipal(ctx)
	if err != nil {
		return "", err
	}
	if principal.Subject == "" {
		return "", fmt.Errorf("Token not found")
	}
	return principal.Subject, nil
}

func getPrincipal(ctx context.Context) (oauth2.Principal, error) {
	principal, ok := ctx.Value(oauth2.PrincipalKey).(oauth2.Principal)
	if !ok {
		return oauth2.Principal{}, fmt.Errorf("Token not found")
	}

	return principal, nil
}

// Me does a findOrCreate based on the email in the context
func (h *Service) Me(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	if !h.UseAuth {
		// If there's no authentication, return an empty user
		res := newMeResponse(nil)
		encodeJSON(w, http.StatusOK, res, h.Logger)
		return
	}

	email, err := getEmail(ctx)
	if err != nil {
		invalidData(w, err, h.Logger)
		return
	}

	usr, err := h.UsersStore.Get(ctx, email)
	if err == nil {
		res := newMeResponse(usr)
		encodeJSON(w, http.StatusOK, res, h.Logger)
		return
	}

	// Because we didnt find a user, making a new one
	user := &chronograf.User{
		Username: email,
	}

	newUser, err := h.UsersStore.Add(ctx, user)
	if err != nil {
		msg := fmt.Errorf("error storing user %s: %v", user.Username, err)
		unknownErrorWithMessage(w, msg, h.Logger)
		return
	}

	res := newMeResponse(newUser)
	encodeJSON(w, http.StatusOK, res, h.Logger)
}
