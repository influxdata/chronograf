package server

import (
	"fmt"
	"net/http"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/oauth2"
)

// AuthRoute are the routes for each type of OAuth2 provider
type AuthRoute struct {
	Name     string `json:"name"`     // Name uniquely identifies the provider
	Label    string `json:"label"`    // Label is a user-facing string to present in the UI
	Login    string `json:"login"`    // Login is the route to the login redirect path
	Logout   string `json:"logout"`   // Logout is the route to the logout redirect path
	Callback string `json:"callback"` // Callback is the route the provider calls to exchange the code/state
}

// AuthRoutes contains all OAuth2 provider routes.
type AuthRoutes []AuthRoute

// Lookup searches all the routes for a specific provider
func (r *AuthRoutes) Lookup(provider string) (AuthRoute, bool) {
	for _, route := range *r {
		if route.Name == provider {
			return route, true
		}
	}
	return AuthRoute{}, false
}

type getRoutesResponse struct {
	Layouts            string                             `json:"layouts"`          // Location of the layouts endpoint
	Protoboards        string                             `json:"protoboards"`      // Location of the protoboards endpoint
	Users              string                             `json:"users"`            // Location of the users endpoint
	AllUsers           string                             `json:"allUsers"`         // Location of the raw users endpoint
	Organizations      string                             `json:"organizations"`    // Location of the organizations endpoint
	Mappings           string                             `json:"mappings"`         // Location of the application mappings endpoint
	Sources            string                             `json:"sources"`          // Location of the sources endpoint
	Me                 string                             `json:"me"`               // Location of the me endpoint
	Environment        string                             `json:"environment"`      // Location of the environement endpoint
	Dashboards         string                             `json:"dashboards"`       // Location of the dashboards endpoint
	Config             getConfigLinksResponse             `json:"config"`           // Location of the config endpoint and its various sections
	Cells              string                             `json:"cells"`            // Location of the v2 cells
	DashboardsV2       string                             `json:"dashboardsv2"`     // Location of the v2 dashboards
	Auth               []AuthRoute                        `json:"auth"`             // Location of all auth routes.
	Logout             *string                            `json:"logout,omitempty"` // Location of the logout route for all auth routes
	ExternalLinks      getExternalLinksResponse           `json:"external"`         // All external links for the client to use
	OrganizationConfig getOrganizationConfigLinksResponse `json:"orgConfig"`        // Location of the organization config endpoint
	Flux               getFluxLinksResponse               `json:"flux"`
	ValidTextTemplates string                             `json:"validateTextTemplates"` // Location of the valid text templates endpoint
}

// AllRoutes is a handler that returns all links to resources in Chronograf server, as well as
// external links for the client to know about, such as for JSON feeds or custom side nav buttons.
// Optionally, routes for authentication can be returned.
type AllRoutes struct {
	GetPrincipal func(r *http.Request) oauth2.Principal // GetPrincipal is used to retrieve the principal on http request.
	AuthRoutes   []AuthRoute                            // Location of all auth routes. If no auth, this can be empty.
	LogoutLink   string                                 // Location of the logout route for all auth routes. If no auth, this can be empty.
	StatusFeed   string                                 // External link to the JSON Feed for the News Feed on the client's Status Page
	CustomLinks  map[string]string                      // Custom external links for client's User menu, as passed in via CLI/ENV
	Logger       chronograf.Logger
}

// serveHTTP returns all top level routes and external links within chronograf
func (a *AllRoutes) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	customLinks, err := NewCustomLinks(a.CustomLinks)
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error(), a.Logger)
		return
	}

	org := "default"
	if a.GetPrincipal != nil {
		// If there is a principal, use the organization to populate the users routes
		// otherwise use the default organization
		if p := a.GetPrincipal(r); p.Organization != "" {
			org = p.Organization
		}
	}

	routes := getRoutesResponse{
		Sources:       "/chronograf/v1/sources",
		Layouts:       "/chronograf/v1/layouts",
		Protoboards:   "/chronograf/v1/protoboards",
		Users:         fmt.Sprintf("/chronograf/v1/organizations/%s/users", org),
		AllUsers:      "/chronograf/v1/users",
		Organizations: "/chronograf/v1/organizations",
		Me:            "/chronograf/v1/me",
		Environment:   "/chronograf/v1/env",
		Mappings:      "/chronograf/v1/mappings",
		Dashboards:    "/chronograf/v1/dashboards",
		DashboardsV2:  "/chronograf/v2/dashboards",
		Cells:         "/chronograf/v2/cells",
		Config: getConfigLinksResponse{
			Self: "/chronograf/v1/config",
			Auth: "/chronograf/v1/config/auth",
		},
		OrganizationConfig: getOrganizationConfigLinksResponse{
			Self:      "/chronograf/v1/org_config",
			LogViewer: "/chronograf/v1/org_config/logviewer",
		},
		Auth: make([]AuthRoute, len(a.AuthRoutes)), // We want to return at least an empty array, rather than null
		ExternalLinks: getExternalLinksResponse{
			StatusFeed:  &a.StatusFeed,
			CustomLinks: customLinks,
		},
		Flux: getFluxLinksResponse{
			Self:        "/chronograf/v1/flux",
			AST:         "/chronograf/v1/flux/ast",
			Suggestions: "/chronograf/v1/flux/suggestions",
		},
		ValidTextTemplates: "chronograf/v1/validate_text_templates",
	}

	// The JSON response will have no field present for the LogoutLink if there is no logout link.
	if a.LogoutLink != "" {
		routes.Logout = &a.LogoutLink
	}

	for i, route := range a.AuthRoutes {
		routes.Auth[i] = route
	}

	encodeJSON(w, http.StatusOK, routes, a.Logger)
}
