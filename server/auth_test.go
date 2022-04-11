package server

import (
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/influxdata/chronograf"
	clog "github.com/influxdata/chronograf/log"
	"github.com/influxdata/chronograf/mocks"
	"github.com/influxdata/chronograf/oauth2"
	"github.com/influxdata/chronograf/roles"
	"github.com/stretchr/testify/require"
)

func TestAuthorizedToken(t *testing.T) {
	var tests = []struct {
		Desc        string
		Code        int
		Principal   oauth2.Principal
		ValidateErr error
		Expected    string
	}{
		{
			Desc:        "Error in validate",
			Code:        http.StatusForbidden,
			ValidateErr: errors.New("error"),
		},
		{
			Desc: "Authorized ok",
			Code: http.StatusOK,
			Principal: oauth2.Principal{
				Subject: "Principal Strickland",
			},
			Expected: "Principal Strickland",
		},
	}
	for _, test := range tests {
		// next is a sentinel StatusOK and
		// principal recorder.
		var principal oauth2.Principal
		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			principal = r.Context().Value(oauth2.PrincipalKey).(oauth2.Principal)
		})
		req, _ := http.NewRequest("GET", "", nil)
		w := httptest.NewRecorder()

		a := &mocks.Authenticator{
			Principal:   test.Principal,
			ValidateErr: test.ValidateErr,
		}

		logger := clog.New(clog.DebugLevel)
		handler := AuthorizedToken(a, logger, next)
		handler.ServeHTTP(w, req)
		if w.Code != test.Code {
			t.Errorf("Status code expected: %d actual %d", test.Code, w.Code)
		} else if principal != test.Principal {
			t.Errorf("Principal mismatch expected: %s actual %s", test.Principal, principal)
		}
	}
}

type TestAuthorizedUser_fields struct {
	UsersStore         chronograf.UsersStore
	OrganizationsStore chronograf.OrganizationsStore
	Logger             chronograf.Logger
}
type TestAuthorizedUser_args struct {
	principal  *oauth2.Principal
	scheme     string
	useAuth    bool
	role       string
	authHeader string
}
type TestAuthorizedUser_pairs struct {
	name                   string
	fields                 TestAuthorizedUser_fields
	args                   TestAuthorizedUser_args
	hasOrganizationContext bool
	hasSuperAdminContext   bool
	hasRoleContext         bool
	hasServerContext       bool
	authorized             bool
}

func createUserWithXroleIsYauthorized(x string, y string) TestAuthorizedUser_pairs {
	var userRoleName string
	var userRoles []chronograf.Role
	if x != "" {
		userRoleName = x
		userRoles = []chronograf.Role{
			{
				Name:         x,
				Organization: "1337",
			},
		}
	} else {
		userRoleName = "no role"
		userRoles = []chronograf.Role{}
	}
	return TestAuthorizedUser_pairs{
		name: fmt.Sprintf("User with %s role is %s authorized", userRoleName, y),
		fields: TestAuthorizedUser_fields{
			UsersStore: &mocks.UsersStore{
				GetF: func(ctx context.Context, q chronograf.UserQuery) (*chronograf.User, error) {
					if q.Name == nil || q.Provider == nil || q.Scheme == nil {
						return nil, fmt.Errorf("Invalid user query: missing Name, Provider, and/or Scheme")
					}
					return &chronograf.User{
						ID:       1337,
						Name:     "billysteve",
						Provider: "google",
						Scheme:   "oauth2",
						Roles:    userRoles,
					}, nil
				},
			},
			OrganizationsStore: &mocks.OrganizationsStore{
				DefaultOrganizationF: func(ctx context.Context) (*chronograf.Organization, error) {
					return &chronograf.Organization{
						ID: "0",
					}, nil
				},
				GetF: func(ctx context.Context, q chronograf.OrganizationQuery) (*chronograf.Organization, error) {
					if q.ID == nil {
						return nil, fmt.Errorf("Invalid organization query: missing ID")
					}
					return &chronograf.Organization{
						ID:   "1337",
						Name: "The ShillBillThrilliettas",
					}, nil
				},
			},
			Logger: clog.New(clog.DebugLevel),
		},
		args: TestAuthorizedUser_args{
			principal: &oauth2.Principal{
				Subject:      "billysteve",
				Issuer:       "google",
				Organization: "1337",
			},
			scheme:  "oauth2",
			role:    y,
			useAuth: true,
		},
		authorized:             true,
		hasOrganizationContext: true,
		hasSuperAdminContext:   false,
		hasRoleContext:         true,
		hasServerContext:       false,
	}
}

func createUserWithXroleIsYunauthorized(x string, y string) TestAuthorizedUser_pairs {
	var userRoleName string
	var userRoles []chronograf.Role
	if x != "" {
		userRoleName = x
		userRoles = []chronograf.Role{
			{
				Name:         x,
				Organization: "1337",
			},
		}
	} else {
		userRoleName = "no role"
		userRoles = []chronograf.Role{}
	}
	return TestAuthorizedUser_pairs{
		name: fmt.Sprintf("User with %s role is %s unauthorized", userRoleName, y),
		fields: TestAuthorizedUser_fields{
			UsersStore: &mocks.UsersStore{
				GetF: func(ctx context.Context, q chronograf.UserQuery) (*chronograf.User, error) {
					if q.Name == nil || q.Provider == nil || q.Scheme == nil {
						return nil, fmt.Errorf("Invalid user query: missing Name, Provider, and/or Scheme")
					}
					return &chronograf.User{
						ID:       1337,
						Name:     "billysteve",
						Provider: "google",
						Scheme:   "oauth2",
						Roles:    userRoles,
					}, nil
				},
			},
			OrganizationsStore: &mocks.OrganizationsStore{
				DefaultOrganizationF: func(ctx context.Context) (*chronograf.Organization, error) {
					return &chronograf.Organization{
						ID: "0",
					}, nil
				},
				GetF: func(ctx context.Context, q chronograf.OrganizationQuery) (*chronograf.Organization, error) {
					if q.ID == nil {
						return nil, fmt.Errorf("Invalid organization query: missing ID")
					}
					return &chronograf.Organization{
						ID:   "1337",
						Name: "The ShillBillThrilliettas",
					}, nil
				},
			},
			Logger: clog.New(clog.DebugLevel),
		},
		args: TestAuthorizedUser_args{
			principal: &oauth2.Principal{
				Subject:      "billysteve",
				Issuer:       "google",
				Organization: "1337",
			},
			scheme:  "oauth2",
			role:    y,
			useAuth: true,
		},
		authorized: false,
	}
}

func TestAuthorizedUser(t *testing.T) {
	type fields = TestAuthorizedUser_fields
	type args = TestAuthorizedUser_args
	tests := []TestAuthorizedUser_pairs{
		{
			name: "Use superadmin token",
			fields: fields{
				UsersStore: &mocks.UsersStore{},
				OrganizationsStore: &mocks.OrganizationsStore{
					DefaultOrganizationF: func(ctx context.Context) (*chronograf.Organization, error) {
						return &chronograf.Organization{
							ID: "0",
						}, nil
					},
				},
				Logger: clog.New(clog.DebugLevel),
			},
			args: args{
				useAuth:    true,
				authHeader: genToken(t),
			},
			hasOrganizationContext: true,
			hasSuperAdminContext:   false,
			hasRoleContext:         false,
			hasServerContext:       true,
			authorized:             true,
		},
		{
			name: "Not using auth",
			fields: fields{
				UsersStore: &mocks.UsersStore{},
				OrganizationsStore: &mocks.OrganizationsStore{
					DefaultOrganizationF: func(ctx context.Context) (*chronograf.Organization, error) {
						return &chronograf.Organization{
							ID: "0",
						}, nil
					},
				},
				Logger: clog.New(clog.DebugLevel),
			},
			args: args{
				useAuth: false,
			},
			hasOrganizationContext: true,
			hasSuperAdminContext:   false,
			hasRoleContext:         false,
			hasServerContext:       true,
			authorized:             true,
		},
		createUserWithXroleIsYauthorized(roles.MemberRoleName, roles.MemberRoleName),
		createUserWithXroleIsYauthorized(roles.ReaderRoleName, roles.MemberRoleName),
		createUserWithXroleIsYauthorized(roles.ViewerRoleName, roles.MemberRoleName),
		createUserWithXroleIsYauthorized(roles.EditorRoleName, roles.MemberRoleName),
		createUserWithXroleIsYauthorized(roles.AdminRoleName, roles.MemberRoleName),

		createUserWithXroleIsYunauthorized(roles.MemberRoleName, roles.ReaderRoleName),
		createUserWithXroleIsYauthorized(roles.ReaderRoleName, roles.ReaderRoleName),
		createUserWithXroleIsYauthorized(roles.ViewerRoleName, roles.ReaderRoleName),
		createUserWithXroleIsYauthorized(roles.EditorRoleName, roles.ReaderRoleName),
		createUserWithXroleIsYauthorized(roles.AdminRoleName, roles.ReaderRoleName),

		createUserWithXroleIsYunauthorized(roles.MemberRoleName, roles.ViewerRoleName),
		createUserWithXroleIsYunauthorized(roles.ReaderRoleName, roles.ViewerRoleName),
		createUserWithXroleIsYauthorized(roles.ViewerRoleName, roles.ViewerRoleName),
		createUserWithXroleIsYauthorized(roles.EditorRoleName, roles.ViewerRoleName),
		createUserWithXroleIsYauthorized(roles.AdminRoleName, roles.ViewerRoleName),

		createUserWithXroleIsYunauthorized(roles.MemberRoleName, roles.EditorRoleName),
		createUserWithXroleIsYunauthorized(roles.ReaderRoleName, roles.EditorRoleName),
		createUserWithXroleIsYunauthorized(roles.ViewerRoleName, roles.EditorRoleName),
		createUserWithXroleIsYauthorized(roles.EditorRoleName, roles.EditorRoleName),
		createUserWithXroleIsYauthorized(roles.AdminRoleName, roles.EditorRoleName),

		createUserWithXroleIsYunauthorized(roles.MemberRoleName, roles.AdminRoleName),
		createUserWithXroleIsYunauthorized(roles.ReaderRoleName, roles.AdminRoleName),
		createUserWithXroleIsYunauthorized(roles.ViewerRoleName, roles.AdminRoleName),
		createUserWithXroleIsYunauthorized(roles.EditorRoleName, roles.AdminRoleName),
		createUserWithXroleIsYauthorized(roles.AdminRoleName, roles.AdminRoleName),

		createUserWithXroleIsYunauthorized("unknown", roles.MemberRoleName),
		createUserWithXroleIsYunauthorized("unknown", roles.ReaderRoleName),
		createUserWithXroleIsYunauthorized("unknown", roles.ViewerRoleName),
		createUserWithXroleIsYunauthorized("unknown", roles.EditorRoleName),
		createUserWithXroleIsYunauthorized("unknown", roles.AdminRoleName),

		createUserWithXroleIsYunauthorized("", roles.MemberRoleName),
		createUserWithXroleIsYunauthorized("", roles.ReaderRoleName),
		createUserWithXroleIsYunauthorized("", roles.ViewerRoleName),
		createUserWithXroleIsYunauthorized("", roles.EditorRoleName),
		createUserWithXroleIsYunauthorized("", roles.AdminRoleName),

		createUserWithXroleIsYunauthorized(roles.MemberRoleName, "superadmin"),
		createUserWithXroleIsYunauthorized(roles.ReaderRoleName, "superadmin"),
		createUserWithXroleIsYunauthorized(roles.ViewerRoleName, "superadmin"),
		createUserWithXroleIsYunauthorized(roles.EditorRoleName, "superadmin"),
		createUserWithXroleIsYunauthorized(roles.AdminRoleName, "superadmin"),
		{
			name: "SuperAdmin is Reader authorized",
			fields: fields{
				UsersStore: &mocks.UsersStore{
					GetF: func(ctx context.Context, q chronograf.UserQuery) (*chronograf.User, error) {
						if q.Name == nil || q.Provider == nil || q.Scheme == nil {
							return nil, fmt.Errorf("Invalid user query: missing Name, Provider, and/or Scheme")
						}
						return &chronograf.User{
							ID:         1337,
							Name:       "billysteve",
							Provider:   "google",
							Scheme:     "oauth2",
							SuperAdmin: true,
							Roles: []chronograf.Role{
								{
									Name:         roles.MemberRoleName,
									Organization: "1337",
								},
							},
						}, nil
					},
				},
				OrganizationsStore: &mocks.OrganizationsStore{
					DefaultOrganizationF: func(ctx context.Context) (*chronograf.Organization, error) {
						return &chronograf.Organization{
							ID: "0",
						}, nil
					},
					GetF: func(ctx context.Context, q chronograf.OrganizationQuery) (*chronograf.Organization, error) {
						if q.ID == nil {
							return nil, fmt.Errorf("Invalid organization query: missing ID")
						}
						return &chronograf.Organization{
							ID:   "1337",
							Name: "The ShillBillThrilliettas",
						}, nil
					},
				},
				Logger: clog.New(clog.DebugLevel),
			},
			args: args{
				principal: &oauth2.Principal{
					Subject:      "billysteve",
					Issuer:       "google",
					Organization: "1337",
				},
				scheme:  "oauth2",
				role:    "reader",
				useAuth: true,
			},
			authorized:             true,
			hasOrganizationContext: true,
			hasSuperAdminContext:   true,
			hasRoleContext:         true,
			hasServerContext:       false,
		},
		{
			name: "SuperAdmin is Viewer authorized",
			fields: fields{
				UsersStore: &mocks.UsersStore{
					GetF: func(ctx context.Context, q chronograf.UserQuery) (*chronograf.User, error) {
						if q.Name == nil || q.Provider == nil || q.Scheme == nil {
							return nil, fmt.Errorf("Invalid user query: missing Name, Provider, and/or Scheme")
						}
						return &chronograf.User{
							ID:         1337,
							Name:       "billysteve",
							Provider:   "google",
							Scheme:     "oauth2",
							SuperAdmin: true,
							Roles: []chronograf.Role{
								{
									Name:         roles.MemberRoleName,
									Organization: "1337",
								},
							},
						}, nil
					},
				},
				OrganizationsStore: &mocks.OrganizationsStore{
					DefaultOrganizationF: func(ctx context.Context) (*chronograf.Organization, error) {
						return &chronograf.Organization{
							ID: "0",
						}, nil
					},
					GetF: func(ctx context.Context, q chronograf.OrganizationQuery) (*chronograf.Organization, error) {
						if q.ID == nil {
							return nil, fmt.Errorf("Invalid organization query: missing ID")
						}
						return &chronograf.Organization{
							ID:   "1337",
							Name: "The ShillBillThrilliettas",
						}, nil
					},
				},
				Logger: clog.New(clog.DebugLevel),
			},
			args: args{
				principal: &oauth2.Principal{
					Subject:      "billysteve",
					Issuer:       "google",
					Organization: "1337",
				},
				scheme:  "oauth2",
				role:    "viewer",
				useAuth: true,
			},
			authorized:             true,
			hasOrganizationContext: true,
			hasSuperAdminContext:   true,
			hasRoleContext:         true,
			hasServerContext:       false,
		},
		{
			name: "SuperAdmin is Editor authorized",
			fields: fields{
				UsersStore: &mocks.UsersStore{
					GetF: func(ctx context.Context, q chronograf.UserQuery) (*chronograf.User, error) {
						if q.Name == nil || q.Provider == nil || q.Scheme == nil {
							return nil, fmt.Errorf("Invalid user query: missing Name, Provider, and/or Scheme")
						}
						return &chronograf.User{
							ID:         1337,
							Name:       "billysteve",
							Provider:   "google",
							Scheme:     "oauth2",
							SuperAdmin: true,
							Roles: []chronograf.Role{
								{
									Name:         roles.MemberRoleName,
									Organization: "1337",
								},
							},
						}, nil
					},
				},
				OrganizationsStore: &mocks.OrganizationsStore{
					DefaultOrganizationF: func(ctx context.Context) (*chronograf.Organization, error) {
						return &chronograf.Organization{
							ID: "0",
						}, nil
					},
					GetF: func(ctx context.Context, q chronograf.OrganizationQuery) (*chronograf.Organization, error) {
						if q.ID == nil {
							return nil, fmt.Errorf("Invalid organization query: missing ID")
						}
						return &chronograf.Organization{
							ID:   "1337",
							Name: "The ShillBillThrilliettas",
						}, nil
					},
				},
				Logger: clog.New(clog.DebugLevel),
			},
			args: args{
				principal: &oauth2.Principal{
					Subject:      "billysteve",
					Issuer:       "google",
					Organization: "1337",
				},
				scheme:  "oauth2",
				role:    "editor",
				useAuth: true,
			},
			authorized:             true,
			hasOrganizationContext: true,
			hasSuperAdminContext:   true,
			hasRoleContext:         true,
			hasServerContext:       false,
		},
		{
			name: "SuperAdmin is Admin authorized",
			fields: fields{
				UsersStore: &mocks.UsersStore{
					GetF: func(ctx context.Context, q chronograf.UserQuery) (*chronograf.User, error) {
						if q.Name == nil || q.Provider == nil || q.Scheme == nil {
							return nil, fmt.Errorf("Invalid user query: missing Name, Provider, and/or Scheme")
						}
						return &chronograf.User{
							ID:         1337,
							Name:       "billysteve",
							Provider:   "google",
							Scheme:     "oauth2",
							SuperAdmin: true,
							Roles: []chronograf.Role{
								{
									Name:         roles.MemberRoleName,
									Organization: "1337",
								},
							},
						}, nil
					},
				},
				OrganizationsStore: &mocks.OrganizationsStore{
					DefaultOrganizationF: func(ctx context.Context) (*chronograf.Organization, error) {
						return &chronograf.Organization{
							ID: "0",
						}, nil
					},
					GetF: func(ctx context.Context, q chronograf.OrganizationQuery) (*chronograf.Organization, error) {
						if q.ID == nil {
							return nil, fmt.Errorf("Invalid organization query: missing ID")
						}
						return &chronograf.Organization{
							ID:   "1337",
							Name: "The ShillBillThrilliettas",
						}, nil
					},
				},
				Logger: clog.New(clog.DebugLevel),
			},
			args: args{
				principal: &oauth2.Principal{
					Subject:      "billysteve",
					Issuer:       "google",
					Organization: "1337",
				},
				scheme:  "oauth2",
				role:    "admin",
				useAuth: true,
			},
			authorized:             true,
			hasOrganizationContext: true,
			hasSuperAdminContext:   true,
			hasRoleContext:         true,
			hasServerContext:       false,
		},
		{
			name: "SuperAdmin is SuperAdmin authorized",
			fields: fields{
				UsersStore: &mocks.UsersStore{
					GetF: func(ctx context.Context, q chronograf.UserQuery) (*chronograf.User, error) {
						if q.Name == nil || q.Provider == nil || q.Scheme == nil {
							return nil, fmt.Errorf("Invalid user query: missing Name, Provider, and/or Scheme")
						}
						return &chronograf.User{
							ID:         1337,
							Name:       "billysteve",
							Provider:   "google",
							Scheme:     "oauth2",
							SuperAdmin: true,
							Roles: []chronograf.Role{
								{
									Name:         roles.MemberRoleName,
									Organization: "1337",
								},
							},
						}, nil
					},
				},
				OrganizationsStore: &mocks.OrganizationsStore{
					DefaultOrganizationF: func(ctx context.Context) (*chronograf.Organization, error) {
						return &chronograf.Organization{
							ID: "0",
						}, nil
					},
					GetF: func(ctx context.Context, q chronograf.OrganizationQuery) (*chronograf.Organization, error) {
						if q.ID == nil {
							return nil, fmt.Errorf("Invalid organization query: missing ID")
						}
						return &chronograf.Organization{
							ID:   "1337",
							Name: "The ShillBillThrilliettas",
						}, nil
					},
				},
				Logger: clog.New(clog.DebugLevel),
			},
			args: args{
				principal: &oauth2.Principal{
					Subject:      "billysteve",
					Issuer:       "google",
					Organization: "1337",
				},
				scheme:  "oauth2",
				role:    "superadmin",
				useAuth: true,
			},
			authorized:             true,
			hasOrganizationContext: true,
			hasSuperAdminContext:   true,
			hasRoleContext:         true,
			hasServerContext:       false,
		},
		{
			name: "Invalid principal – principal is nil",
			fields: fields{
				UsersStore: &mocks.UsersStore{
					GetF: func(ctx context.Context, q chronograf.UserQuery) (*chronograf.User, error) {
						if q.Name == nil || q.Provider == nil || q.Scheme == nil {
							return nil, fmt.Errorf("Invalid user query: missing Name, Provider, and/or Scheme")
						}
						return &chronograf.User{
							ID:       1337,
							Name:     "billysteve",
							Provider: "google",
							Scheme:   "oauth2",
							Roles: []chronograf.Role{
								{
									Name:         roles.AdminRoleName,
									Organization: "1337",
								},
							},
						}, nil
					},
				},
				OrganizationsStore: &mocks.OrganizationsStore{
					DefaultOrganizationF: func(ctx context.Context) (*chronograf.Organization, error) {
						return &chronograf.Organization{
							ID: "0",
						}, nil
					},
					GetF: func(ctx context.Context, q chronograf.OrganizationQuery) (*chronograf.Organization, error) {
						if q.ID == nil {
							return nil, fmt.Errorf("Invalid organization query: missing ID")
						}
						return &chronograf.Organization{
							ID:   "1337",
							Name: "The ShillBillThrilliettas",
						}, nil
					},
				},
				Logger: clog.New(clog.DebugLevel),
			},
			args: args{
				principal: nil,
				scheme:    "oauth2",
				role:      "admin",
				useAuth:   true,
			},
			authorized: false,
		},
		{
			name: "Invalid principal - missing organization",
			fields: fields{
				UsersStore: &mocks.UsersStore{
					GetF: func(ctx context.Context, q chronograf.UserQuery) (*chronograf.User, error) {
						if q.Name == nil || q.Provider == nil || q.Scheme == nil {
							return nil, fmt.Errorf("Invalid user query: missing Name, Provider, and/or Scheme")
						}
						return &chronograf.User{
							ID:       1337,
							Name:     "billysteve",
							Provider: "google",
							Scheme:   "oauth2",
							Roles: []chronograf.Role{
								{
									Name:         roles.AdminRoleName,
									Organization: "1337",
								},
							},
						}, nil
					},
				},
				OrganizationsStore: &mocks.OrganizationsStore{
					DefaultOrganizationF: func(ctx context.Context) (*chronograf.Organization, error) {
						return &chronograf.Organization{
							ID: "0",
						}, nil
					},
					GetF: func(ctx context.Context, q chronograf.OrganizationQuery) (*chronograf.Organization, error) {
						if q.ID == nil {
							return nil, fmt.Errorf("Invalid organization query: missing ID")
						}
						return &chronograf.Organization{
							ID:   "1337",
							Name: "The ShillBillThrilliettas",
						}, nil
					},
				},
				Logger: clog.New(clog.DebugLevel),
			},
			args: args{
				principal: &oauth2.Principal{
					Subject: "billysteve",
					Issuer:  "google",
				},
				scheme:  "oauth2",
				role:    "admin",
				useAuth: true,
			},
			authorized: false,
		},
		{
			name: "Invalid principal - organization id not uint64",
			fields: fields{
				UsersStore: &mocks.UsersStore{
					GetF: func(ctx context.Context, q chronograf.UserQuery) (*chronograf.User, error) {
						if q.Name == nil || q.Provider == nil || q.Scheme == nil {
							return nil, fmt.Errorf("Invalid user query: missing Name, Provider, and/or Scheme")
						}
						return &chronograf.User{
							ID:       1337,
							Name:     "billysteve",
							Provider: "google",
							Scheme:   "oauth2",
							Roles: []chronograf.Role{
								{
									Name:         roles.AdminRoleName,
									Organization: "1337",
								},
							},
						}, nil
					},
				},
				OrganizationsStore: &mocks.OrganizationsStore{
					DefaultOrganizationF: func(ctx context.Context) (*chronograf.Organization, error) {
						return &chronograf.Organization{
							ID: "0",
						}, nil
					},
					GetF: func(ctx context.Context, q chronograf.OrganizationQuery) (*chronograf.Organization, error) {
						if q.ID == nil {
							return nil, fmt.Errorf("Invalid organization query: missing ID")
						}
						return &chronograf.Organization{
							ID:   "1337",
							Name: "The ShillBillThrilliettas",
						}, nil
					},
				},
				Logger: clog.New(clog.DebugLevel),
			},
			args: args{
				principal: &oauth2.Principal{
					Subject:      "billysteve",
					Issuer:       "google",
					Organization: "1ee7",
				},
				scheme:  "oauth2",
				role:    "admin",
				useAuth: true,
			},
			authorized: false,
		},
		{
			name: "Failed to retrieve organization",
			fields: fields{
				UsersStore: &mocks.UsersStore{
					GetF: func(ctx context.Context, q chronograf.UserQuery) (*chronograf.User, error) {
						if q.Name == nil || q.Provider == nil || q.Scheme == nil {
							return nil, fmt.Errorf("Invalid user query: missing Name, Provider, and/or Scheme")
						}
						return &chronograf.User{
							ID:       1337,
							Name:     "billysteve",
							Provider: "google",
							Scheme:   "oauth2",
							Roles: []chronograf.Role{
								{
									Name:         roles.AdminRoleName,
									Organization: "1337",
								},
							},
						}, nil
					},
				},
				OrganizationsStore: &mocks.OrganizationsStore{
					DefaultOrganizationF: func(ctx context.Context) (*chronograf.Organization, error) {
						return &chronograf.Organization{
							ID: "0",
						}, nil
					},
					GetF: func(ctx context.Context, q chronograf.OrganizationQuery) (*chronograf.Organization, error) {
						if q.ID == nil {
							return nil, fmt.Errorf("Invalid organization query: missing ID")
						}
						switch *q.ID {
						case "1338":
							return &chronograf.Organization{
								ID:   "1338",
								Name: "The ShillBillThrilliettas",
							}, nil
						default:
							return nil, chronograf.ErrOrganizationNotFound
						}
					},
				},
				Logger: clog.New(clog.DebugLevel),
			},
			args: args{
				principal: &oauth2.Principal{
					Subject:      "billysteve",
					Issuer:       "google",
					Organization: "1337",
				},
				scheme:  "oauth2",
				role:    "admin",
				useAuth: true,
			},
			authorized: false,
		},
		{
			name: "Failed to retrieve user",
			fields: fields{
				UsersStore: &mocks.UsersStore{
					GetF: func(ctx context.Context, q chronograf.UserQuery) (*chronograf.User, error) {
						if q.Name == nil || q.Provider == nil || q.Scheme == nil {
							return nil, fmt.Errorf("Invalid user query: missing Name, Provider, and/or Scheme")
						}
						switch *q.Name {
						case "billysteve":
							return &chronograf.User{
								ID:       1337,
								Name:     "billysteve",
								Provider: "google",
								Scheme:   "oauth2",
								Roles: []chronograf.Role{
									{
										Name:         roles.AdminRoleName,
										Organization: "1337",
									},
								},
							}, nil
						default:
							return nil, chronograf.ErrUserNotFound
						}
					},
				},
				OrganizationsStore: &mocks.OrganizationsStore{
					DefaultOrganizationF: func(ctx context.Context) (*chronograf.Organization, error) {
						return &chronograf.Organization{
							ID: "0",
						}, nil
					},
					GetF: func(ctx context.Context, q chronograf.OrganizationQuery) (*chronograf.Organization, error) {
						if q.ID == nil {
							return nil, fmt.Errorf("Invalid organization query: missing ID")
						}
						return &chronograf.Organization{
							ID:   "1337",
							Name: "The ShillBillThrilliettas",
						}, nil
					},
				},
				Logger: clog.New(clog.DebugLevel),
			},
			args: args{
				principal: &oauth2.Principal{
					Subject:      "billietta",
					Issuer:       "google",
					Organization: "1337",
				},
				scheme:  "oauth2",
				role:    "admin",
				useAuth: true,
			},
			authorized: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var authorized bool
			var hasServerCtx bool
			var hasSuperAdminCtx bool
			var hasOrganizationCtx bool
			var hasRoleCtx bool
			next := func(w http.ResponseWriter, r *http.Request) {
				ctx := r.Context()
				hasServerCtx = hasServerContext(ctx)
				hasSuperAdminCtx = hasSuperAdminContext(ctx)
				_, hasOrganizationCtx = hasOrganizationContext(ctx)
				_, hasRoleCtx = hasRoleContext(ctx)
				authorized = true
			}
			fn := AuthorizedUser(
				&Store{
					UsersStore:         tt.fields.UsersStore,
					OrganizationsStore: tt.fields.OrganizationsStore,
				},
				tt.args.useAuth,
				tt.args.role,
				tt.fields.Logger,
				next,
			)

			w := httptest.NewRecorder()
			r := httptest.NewRequest(
				"GET",
				"http://any.url", // can be any valid URL as we are bypassing mux
				nil,
			)
			if tt.args.authHeader != "" {
				r.Header.Set("Authorization", tt.args.authHeader)
			}
			if tt.args.principal == nil {
				r = r.WithContext(context.WithValue(r.Context(), oauth2.PrincipalKey, nil))
			} else {
				r = r.WithContext(context.WithValue(r.Context(), oauth2.PrincipalKey, *tt.args.principal))
			}
			fn(w, r)

			if authorized != tt.authorized {
				t.Errorf("%q. AuthorizedUser() = %v, expected %v", tt.name, authorized, tt.authorized)
			}

			if !authorized && w.Code != http.StatusForbidden {
				t.Errorf("%q. AuthorizedUser() Status Code = %v, expected %v", tt.name, w.Code, http.StatusForbidden)
			}

			if hasServerCtx != tt.hasServerContext {
				t.Errorf("%q. AuthorizedUser().Context().Server = %v, expected %v", tt.name, hasServerCtx, tt.hasServerContext)
			}

			if hasSuperAdminCtx != tt.hasSuperAdminContext {
				t.Errorf("%q. AuthorizedUser().Context().SuperAdmin = %v, expected %v", tt.name, hasSuperAdminCtx, tt.hasSuperAdminContext)
			}

			if hasOrganizationCtx != tt.hasOrganizationContext {
				t.Errorf("%q. AuthorizedUser.Context().Organization = %v, expected %v", tt.name, hasOrganizationCtx, tt.hasOrganizationContext)
			}

			if hasRoleCtx != tt.hasRoleContext {
				t.Errorf("%q. AuthorizedUser().Context().Role = %v, expected %v", tt.name, hasRoleCtx, tt.hasRoleContext)
			}

		})
	}
}

func TestRawStoreAccess(t *testing.T) {
	type fields struct {
		Logger chronograf.Logger
	}
	type args struct {
		principal     *oauth2.Principal
		serverContext bool
		user          *chronograf.User
	}
	type wants struct {
		authorized       bool
		hasServerContext bool
	}
	tests := []struct {
		name   string
		fields fields
		args   args
		wants  wants
	}{
		{
			name: "middleware already has server context",
			fields: fields{
				Logger: clog.New(clog.DebugLevel),
			},
			args: args{
				serverContext: true,
			},
			wants: wants{
				authorized:       true,
				hasServerContext: true,
			},
		},
		{
			name: "user on context is a SuperAdmin",
			fields: fields{
				Logger: clog.New(clog.DebugLevel),
			},
			args: args{
				user: &chronograf.User{
					SuperAdmin: true,
				},
			},
			wants: wants{
				authorized:       true,
				hasServerContext: true,
			},
		},
		{
			name: "user on context is a not SuperAdmin",
			fields: fields{
				Logger: clog.New(clog.DebugLevel),
			},
			args: args{
				user: &chronograf.User{
					SuperAdmin: false,
				},
			},
			wants: wants{
				authorized:       false,
				hasServerContext: false,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var authorized bool
			var hasServerCtx bool
			next := func(w http.ResponseWriter, r *http.Request) {
				ctx := r.Context()
				hasServerCtx = hasServerContext(ctx)
				authorized = true
			}
			fn := RawStoreAccess(
				tt.fields.Logger,
				next,
			)

			w := httptest.NewRecorder()
			url := "http://any.url"
			r := httptest.NewRequest(
				"GET",
				url,
				nil,
			)
			if tt.args.principal == nil {
				r = r.WithContext(context.WithValue(r.Context(), oauth2.PrincipalKey, nil))
			} else {
				r = r.WithContext(context.WithValue(r.Context(), oauth2.PrincipalKey, *tt.args.principal))
			}

			if tt.args.serverContext {
				r = r.WithContext(serverContext(r.Context()))
			}
			if tt.args.user != nil {
				r = r.WithContext(context.WithValue(r.Context(), UserContextKey, tt.args.user))
			}
			fn(w, r)

			if authorized != tt.wants.authorized {
				t.Errorf("%q. RawStoreAccess() = %v, expected %v", tt.name, authorized, tt.wants.authorized)
			}

			if !authorized && w.Code != http.StatusForbidden {
				t.Errorf("%q. RawStoreAccess() Status Code = %v, expected %v", tt.name, w.Code, http.StatusForbidden)
			}

			if hasServerCtx != tt.wants.hasServerContext {
				t.Errorf("%q. RawStoreAccess().Context().Server = %v, expected %v", tt.name, hasServerCtx, tt.wants.hasServerContext)
			}
		})
	}
}

func TestValidSignature(t *testing.T) {
	require.True(t, validSignature(mocks.NewLogger(), genToken(t)))
}

func genToken(t *testing.T) string {
	key, err := rsa.GenerateKey(rand.Reader, 1024)
	require.NoError(t, err)

	signerMessage = "abc123"
	sha256 := crypto.SHA256
	h := sha256.New()
	h.Write([]byte(signerMessage))
	d := h.Sum(nil)

	x, err := rsa.SignPKCS1v15(rand.Reader, key, sha256, d)
	require.NoError(t, err)

	publicKey = key.Public().(*rsa.PublicKey)

	return base64.StdEncoding.EncodeToString(x)
}
