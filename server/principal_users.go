package server

import (
	"context"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/oauth2"
	"github.com/influxdata/chronograf/organizations"
)

type principalUsers struct {
	OrganizationID string
	RawUser        *chronograf.User
	ScopedUser     *chronograf.User
}

// resolvePrincipalUsers resolves the authenticated principal to Chronograf users:
// - RawUser from server context (for super-admin checks)
// - ScopedUser from org context (for role checks)
func resolvePrincipalUsers(ctx context.Context, store DataStore, p oauth2.Principal, defaultOrgID string) (*principalUsers, error) {
	serverCtx := serverContext(ctx)

	orgID := p.Organization
	if orgID == "" {
		if defaultOrgID != "" {
			orgID = defaultOrgID
		} else {
			defaultOrg, err := store.Organizations(serverCtx).DefaultOrganization(serverCtx)
			if err != nil {
				return nil, err
			}
			orgID = defaultOrg.ID
		}
	}

	if _, err := store.Organizations(serverCtx).Get(serverCtx, chronograf.OrganizationQuery{ID: &orgID}); err != nil {
		return nil, err
	}

	scopedCtx := context.WithValue(ctx, organizations.ContextKey, orgID)
	scheme, err := getScheme(scopedCtx)
	if err != nil {
		return nil, err
	}

	q := chronograf.UserQuery{
		Name:     &p.Subject,
		Provider: &p.Issuer,
		Scheme:   &scheme,
	}

	rawUser, err := store.Users(serverCtx).Get(serverCtx, q)
	if err != nil {
		return nil, err
	}

	resolved := &principalUsers{
		OrganizationID: orgID,
		RawUser:        rawUser,
	}
	if rawUser.SuperAdmin {
		return resolved, nil
	}

	scopedUser, err := store.Users(scopedCtx).Get(scopedCtx, q)
	if err != nil {
		return nil, err
	}
	resolved.ScopedUser = scopedUser
	return resolved, nil
}
