package server

import (
	"net/http"

	"github.com/influxdata/chronograf"
)

type envResponse struct {
	Links                  selfLinks `json:"links"`
	TelegrafSystemInterval string    `json:"telegrafSystemInterval"`
	HostPageDisabled       bool      `json:"hostPageDisabled"`
	CustomAutoRefresh      string    `json:"customAutoRefresh,omitempty"`
	V3SupportEnabled       bool      `json:"v3SupportEnabled"`
}

func newEnvResponse(env chronograf.Environment) *envResponse {
	return &envResponse{
		Links: selfLinks{
			Self: "/chronograf/v1/env",
		},
		TelegrafSystemInterval: env.TelegrafSystemInterval.String(),
		HostPageDisabled:       env.HostPageDisabled,
		CustomAutoRefresh:      env.CustomAutoRefresh,
		V3SupportEnabled:       env.V3SupportEnabled,
	}
}

// Environment retrieves the global application configuration
func (s *Service) Environment(w http.ResponseWriter, r *http.Request) {
	res := newEnvResponse(s.Env)
	encodeJSON(w, http.StatusOK, res, s.Logger)
}
