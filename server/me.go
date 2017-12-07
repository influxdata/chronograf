package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sort"

	"golang.org/x/net/context"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/oauth2"
	"github.com/influxdata/chronograf/organizations"
)

type meLinks struct {
	Self string `json:"self"` // Self link mapping to this resource
}

type meResponse struct {
	*chronograf.User
	Links               meLinks                   `json:"links"`
	Organizations       []chronograf.Organization `json:"organizations,omitempty"`
	CurrentOrganization *chronograf.Organization  `json:"currentOrganization,omitempty"`
}

// If new user response is nil, return an empty meResponse because it
// indicates authentication is not needed
func newMeResponse(usr *chronograf.User) meResponse {
	base := "/chronograf/v1/users"
	name := "me"
	if usr != nil {
		name = PathEscape(fmt.Sprintf("%d", usr.ID))
	}

	return meResponse{
		User: usr,
		Links: meLinks{
			Self: fmt.Sprintf("%s/%s", base, name),
		},
	}
}

// TODO: This Scheme value is hard-coded temporarily since we only currently
// support OAuth2. This hard-coding should be removed whenever we add
// support for other authentication schemes.
func getScheme(ctx context.Context) (string, error) {
	return "oauth2", nil
}

func getPrincipal(ctx context.Context) (oauth2.Principal, error) {
	principal, ok := ctx.Value(oauth2.PrincipalKey).(oauth2.Principal)
	if !ok {
		return oauth2.Principal{}, fmt.Errorf("Token not found")
	}

	return principal, nil
}

func getValidPrincipal(ctx context.Context) (oauth2.Principal, error) {
	p, err := getPrincipal(ctx)
	if err != nil {
		return p, err
	}
	if p.Subject == "" {
		return oauth2.Principal{}, fmt.Errorf("Token not found")
	}
	if p.Issuer == "" {
		return oauth2.Principal{}, fmt.Errorf("Token not found")
	}
	return p, nil
}

type meRequest struct {
	// Organization is the OrganizationID
	Organization string `json:"organization"`
}

// UpdateMe changes the user's current organization on the JWT and responds
// with the same semantics as Me
func (s *Service) UpdateMe(auth oauth2.Authenticator) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		serverCtx := serverContext(ctx)
		principal, err := auth.Validate(ctx, r)
		if err != nil {
			s.Logger.Error(fmt.Sprintf("Invalid principal: %v", err))
			Error(w, http.StatusForbidden, "invalid principal", s.Logger)
			return
		}
		var req meRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			invalidJSON(w, s.Logger)
			return
		}

		// validate that the organization exists
		orgID, err := parseOrganizationID(req.Organization)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error(), s.Logger)
			return
		}
		_, err = s.Store.Organizations(serverCtx).Get(serverCtx, chronograf.OrganizationQuery{ID: &orgID})
		if err != nil {
			Error(w, http.StatusBadRequest, err.Error(), s.Logger)
			return
		}

		// validate that user belongs to organization
		ctx = context.WithValue(ctx, organizations.ContextKey, req.Organization)

		p, err := getValidPrincipal(ctx)
		if err != nil {
			invalidData(w, err, s.Logger)
			return
		}
		if p.Organization == "" {
			defaultOrg, err := s.Store.Organizations(serverCtx).DefaultOrganization(serverCtx)
			if err != nil {
				unknownErrorWithMessage(w, err, s.Logger)
				return
			}
			p.Organization = fmt.Sprintf("%d", defaultOrg.ID)
		}
		scheme, err := getScheme(ctx)
		if err != nil {
			invalidData(w, err, s.Logger)
			return
		}
		_, err = s.Store.Users(ctx).Get(ctx, chronograf.UserQuery{
			Name:     &p.Subject,
			Provider: &p.Issuer,
			Scheme:   &scheme,
		})
		if err == chronograf.ErrUserNotFound {
			// Since a user is not a part of this organization, we should tell them that they are Forbidden (403) from accessing this resource
			Error(w, http.StatusForbidden, err.Error(), s.Logger)
			return
		}
		if err != nil {
			Error(w, http.StatusBadRequest, err.Error(), s.Logger)
			return
		}

		// TODO: change to principal.CurrentOrganization
		principal.Organization = req.Organization

		if err := auth.Authorize(ctx, w, principal); err != nil {
			Error(w, http.StatusInternalServerError, err.Error(), s.Logger)
			return
		}

		ctx = context.WithValue(ctx, oauth2.PrincipalKey, principal)

		s.Me(w, r.WithContext(ctx))
	}
}

// Me does a findOrCreate based on the username in the context
func (s *Service) Me(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	if !s.UseAuth {
		// If there's no authentication, return an empty user
		res := newMeResponse(nil)
		encodeJSON(w, http.StatusOK, res, s.Logger)
		return
	}

	p, err := getValidPrincipal(ctx)
	if err != nil {
		invalidData(w, err, s.Logger)
		return
	}
	scheme, err := getScheme(ctx)
	if err != nil {
		invalidData(w, err, s.Logger)
		return
	}

	ctx = context.WithValue(ctx, organizations.ContextKey, p.Organization)
	serverCtx := serverContext(ctx)

	if p.Organization == "" {
		defaultOrg, err := s.Store.Organizations(serverCtx).DefaultOrganization(serverCtx)
		if err != nil {
			unknownErrorWithMessage(w, err, s.Logger)
			return
		}
		p.Organization = fmt.Sprintf("%d", defaultOrg.ID)
	}

	usr, err := s.Store.Users(serverCtx).Get(serverCtx, chronograf.UserQuery{
		Name:     &p.Subject,
		Provider: &p.Issuer,
		Scheme:   &scheme,
	})
	if err != nil && err != chronograf.ErrUserNotFound {
		unknownErrorWithMessage(w, err, s.Logger)
		return
	}

	defaultOrg, err := s.Store.Organizations(serverCtx).DefaultOrganization(serverCtx)
	if err != nil {
		unknownErrorWithMessage(w, err, s.Logger)
		return
	}

	if usr != nil {
		// If the default org is private and the user has no roles, they should not have access
		if !defaultOrg.Public && len(usr.Roles) == 0 {
			Error(w, http.StatusForbidden, "This organization is private. To gain access, you must be explicitly added by an administrator.", s.Logger)
			return
		}
		orgID, err := parseOrganizationID(p.Organization)
		if err != nil {
			unknownErrorWithMessage(w, err, s.Logger)
			return
		}
		currentOrg, err := s.Store.Organizations(serverCtx).Get(serverCtx, chronograf.OrganizationQuery{ID: &orgID})
		if err == chronograf.ErrOrganizationNotFound {
			// The intent is to force a the user to go through another auth flow
			Error(w, http.StatusForbidden, "user's current organization was not found", s.Logger)
			return
		}
		if err != nil {
			unknownErrorWithMessage(w, err, s.Logger)
			return
		}

		defaultOrgID := fmt.Sprintf("%d", defaultOrg.ID)
		// If a user was added via the API, they might not yet be a member of the default organization
		// Here we check to verify that they are a user in the default organization
		if !hasRoleInDefaultOrganization(usr, defaultOrgID) {
			usr.Roles = append(usr.Roles, chronograf.Role{
				Organization: defaultOrgID,
				Name:         defaultOrg.DefaultRole,
			})
			if err := s.Store.Users(serverCtx).Update(serverCtx, usr); err != nil {
				unknownErrorWithMessage(w, err, s.Logger)
				return
			}
		}
		orgs, err := s.usersOrganizations(serverCtx, usr)
		if err != nil {
			unknownErrorWithMessage(w, err, s.Logger)
			return
		}
		res := newMeResponse(usr)
		res.Organizations = orgs
		res.CurrentOrganization = currentOrg
		encodeJSON(w, http.StatusOK, res, s.Logger)
		return
	}

	// If users must be explicitly added to the default organization, respond with 403
	// forbidden
	if !defaultOrg.Public {
		Error(w, http.StatusForbidden, "This organization is private. To gain access, you must be explicitly added by an administrator.", s.Logger)
		return
	}

	// Because we didnt find a user, making a new one
	user := &chronograf.User{
		Name:     p.Subject,
		Provider: p.Issuer,
		// TODO: This Scheme value is hard-coded temporarily since we only currently
		// support OAuth2. This hard-coding should be removed whenever we add
		// support for other authentication schemes.
		Scheme: scheme,
		Roles: []chronograf.Role{
			{
				Name: defaultOrg.DefaultRole,
				// This is the ID of the default organization
				Organization: fmt.Sprintf("%d", defaultOrg.ID),
			},
		},
		// TODO(desa): this needs a better name
		SuperAdmin: s.newUsersAreSuperAdmin(),
	}

	newUser, err := s.Store.Users(serverCtx).Add(serverCtx, user)
	if err != nil {
		msg := fmt.Errorf("error storing user %s: %v", user.Name, err)
		unknownErrorWithMessage(w, msg, s.Logger)
		return
	}

	orgs, err := s.usersOrganizations(serverCtx, newUser)
	if err != nil {
		unknownErrorWithMessage(w, err, s.Logger)
		return
	}
	orgID, err := parseOrganizationID(p.Organization)
	if err != nil {
		unknownErrorWithMessage(w, err, s.Logger)
		return
	}
	currentOrg, err := s.Store.Organizations(serverCtx).Get(serverCtx, chronograf.OrganizationQuery{ID: &orgID})
	if err != nil {
		unknownErrorWithMessage(w, err, s.Logger)
		return
	}
	res := newMeResponse(newUser)
	res.Organizations = orgs
	res.CurrentOrganization = currentOrg
	encodeJSON(w, http.StatusOK, res, s.Logger)
}

func (s *Service) firstUser() bool {
	serverCtx := serverContext(context.Background())
	numUsers, err := s.Store.Users(serverCtx).Num(serverCtx)
	if err != nil {
		return false
	}

	return numUsers == 0
}
func (s *Service) newUsersAreSuperAdmin() bool {
	if s.firstUser() {
		return true
	}
	return !s.SuperAdminFirstUserOnly
}

func (s *Service) usersOrganizations(ctx context.Context, u *chronograf.User) ([]chronograf.Organization, error) {
	if u == nil {
		// TODO(desa): better error
		return nil, fmt.Errorf("user was nil")
	}

	orgIDs := map[string]bool{}
	for _, role := range u.Roles {
		orgIDs[role.Organization] = true
	}

	orgs := []chronograf.Organization{}
	for orgID, _ := range orgIDs {
		id, err := parseOrganizationID(orgID)
		org, err := s.Store.Organizations(ctx).Get(ctx, chronograf.OrganizationQuery{ID: &id})
		if err != nil {
			return nil, err
		}
		orgs = append(orgs, *org)
	}

	sort.Slice(orgs, func(i, j int) bool {
		return orgs[i].ID < orgs[j].ID
	})

	return orgs, nil
}

func hasRoleInDefaultOrganization(u *chronograf.User, orgID string) bool {
	for _, role := range u.Roles {
		if role.Organization == orgID {
			return true
		}
	}

	return false
}
