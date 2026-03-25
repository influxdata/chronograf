package server

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/log"
	"github.com/influxdata/chronograf/mocks"
	"github.com/influxdata/chronograf/oauth2"
	"github.com/influxdata/chronograf/roles"
)

func TestReaderSPARouteGuard(t *testing.T) {
	readerRole := []chronograf.Role{{Name: roles.ReaderRoleName, Organization: "org-1"}}
	viewerRole := []chronograf.Role{{Name: roles.ViewerRoleName, Organization: "org-1"}}

	store := &mocks.Store{
		OrganizationsStore: &mocks.OrganizationsStore{
			DefaultOrganizationF: func(ctx context.Context) (*chronograf.Organization, error) {
				return &chronograf.Organization{ID: "org-1"}, nil
			},
			GetF: func(ctx context.Context, q chronograf.OrganizationQuery) (*chronograf.Organization, error) {
				return &chronograf.Organization{ID: "org-1"}, nil
			},
		},
		UsersStore: &mocks.UsersStore{
			GetF: func(ctx context.Context, q chronograf.UserQuery) (*chronograf.User, error) {
				u := &chronograf.User{
					ID:       1,
					Name:     "user",
					Provider: "issuer",
					Scheme:   "oauth2",
				}
				if orgID, ok := hasOrganizationContext(ctx); ok && orgID == "org-1" {
					u.Roles = readerRole
				} else {
					u.Roles = viewerRole
				}
				return u, nil
			},
		},
	}

	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	auth := &mocks.Authenticator{
		Principal: oauth2.Principal{
			Subject:      "user",
			Issuer:       "issuer",
			Organization: "org-1",
		},
	}

	h := ReaderSPARouteGuard(store, true, "", auth, log.New(log.DebugLevel), next)

	tests := []struct {
		name       string
		path       string
		accept     string
		wantStatus int
		wantLoc    string
	}{
		{
			name:       "reader allowed dashboards",
			path:       "/sources/1/dashboards",
			accept:     "text/html",
			wantStatus: http.StatusOK,
		},
		{
			name:       "reader redirected from disallowed spa route",
			path:       "/sources/1/manage-sources",
			accept:     "text/html",
			wantStatus: http.StatusFound,
			wantLoc:    "/",
		},
		{
			name:       "api routes ignored",
			path:       "/chronograf/v1/sources",
			accept:     "text/html",
			wantStatus: http.StatusOK,
		},
		{
			name:       "non-html request ignored",
			path:       "/sources/1/manage-sources",
			accept:     "application/json",
			wantStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, tt.path, nil)
			req.Header.Set("Accept", tt.accept)
			w := httptest.NewRecorder()

			h.ServeHTTP(w, req)

			if w.Code != tt.wantStatus {
				t.Fatalf("status=%d want=%d", w.Code, tt.wantStatus)
			}
			if tt.wantLoc != "" && w.Header().Get("Location") != tt.wantLoc {
				t.Fatalf("location=%q want=%q", w.Header().Get("Location"), tt.wantLoc)
			}
		})
	}
}

func TestReaderSPARouteGuard_BasepathRedirect(t *testing.T) {
	store := &mocks.Store{
		OrganizationsStore: &mocks.OrganizationsStore{
			DefaultOrganizationF: func(ctx context.Context) (*chronograf.Organization, error) {
				return &chronograf.Organization{ID: "org-1"}, nil
			},
			GetF: func(ctx context.Context, q chronograf.OrganizationQuery) (*chronograf.Organization, error) {
				return &chronograf.Organization{ID: "org-1"}, nil
			},
		},
		UsersStore: &mocks.UsersStore{
			GetF: func(ctx context.Context, q chronograf.UserQuery) (*chronograf.User, error) {
				return &chronograf.User{
					ID:       1,
					Name:     "user",
					Provider: "issuer",
					Scheme:   "oauth2",
					Roles:    []chronograf.Role{{Name: roles.ReaderRoleName, Organization: "org-1"}},
				}, nil
			},
		},
	}
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	auth := &mocks.Authenticator{
		Principal: oauth2.Principal{
			Subject:      "user",
			Issuer:       "issuer",
			Organization: "org-1",
		},
	}

	h := ReaderSPARouteGuard(store, true, "/chronograf", auth, log.New(log.DebugLevel), next)

	req := httptest.NewRequest(http.MethodGet, "/chronograf/sources/1/manage-sources", nil)
	req.Header.Set("Accept", "text/html")
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusFound {
		t.Fatalf("status=%d want=%d", w.Code, http.StatusFound)
	}
	if loc := w.Header().Get("Location"); loc != "/chronograf" {
		t.Fatalf("location=%q want=%q", loc, "/chronograf")
	}
}
