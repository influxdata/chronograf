package server

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"time"

	"github.com/bouk/httprouter"
	"github.com/influxdata/chronograf/influx"
	"github.com/influxdata/flux"
	"github.com/influxdata/flux/ast"
	_ "github.com/influxdata/flux/builtin"
	"github.com/influxdata/flux/complete"
)

// Params are params
type Params map[string]string

// SuggestionsResponse provides a list of available Flux functions
type SuggestionsResponse struct {
	Functions []SuggestionResponse `json:"funcs"`
}

// SuggestionResponse provides the parameters available for a given Flux function
type SuggestionResponse struct {
	Name   string `json:"name"`
	Params Params `json:"params"`
}

type fluxLinks struct {
	Self        string `json:"self"`        // Self link mapping to this resource
	Suggestions string `json:"suggestions"` // URL for flux builder function suggestions
}

type fluxResponse struct {
	Links fluxLinks `json:"links"`
}

// Flux returns a list of links for the Flux API
func (s *Service) Flux(w http.ResponseWriter, r *http.Request) {
	httpAPIFlux := "/chronograf/v1/flux"
	res := fluxResponse{
		Links: fluxLinks{
			Self:        fmt.Sprintf("%s", httpAPIFlux),
			Suggestions: fmt.Sprintf("%s/suggestions", httpAPIFlux),
		},
	}

	encodeJSON(w, http.StatusOK, res, s.Logger)
}

// FluxSuggestions returns a list of available Flux functions for the Flux Builder
func (s *Service) FluxSuggestions(w http.ResponseWriter, r *http.Request) {
	completer := complete.DefaultCompleter()
	names := completer.FunctionNames()
	var functions []SuggestionResponse
	for _, name := range names {
		suggestion, err := completer.FunctionSuggestion(name)
		if err != nil {
			Error(w, http.StatusNotFound, err.Error(), s.Logger)
			return
		}

		filteredParams := make(Params)
		for key, value := range suggestion.Params {
			if key == "table" {
				continue
			}

			filteredParams[key] = value
		}

		functions = append(functions, SuggestionResponse{
			Name:   name,
			Params: filteredParams,
		})
	}
	res := SuggestionsResponse{Functions: functions}

	encodeJSON(w, http.StatusOK, res, s.Logger)
}

// FluxSuggestion returns the function parameters for the requested function
func (s *Service) FluxSuggestion(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	name := httprouter.GetParamFromContext(ctx, "name")
	completer := complete.DefaultCompleter()

	suggestion, err := completer.FunctionSuggestion(name)
	if err != nil {
		Error(w, http.StatusNotFound, err.Error(), s.Logger)
	}

	encodeJSON(w, http.StatusOK, SuggestionResponse{Name: name, Params: suggestion.Params}, s.Logger)
}

type ASTRequest struct {
	Body string `json:"body"`
}

type ASTResponse struct {
	Valid bool         `json:"valid"`
	AST   *ast.Package `json:"ast"`
	Error string       `json:"error"`
}

func (s *Service) FluxAST(w http.ResponseWriter, r *http.Request) {
	var request ASTRequest
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		invalidJSON(w, s.Logger)
	}

	parsed, err := flux.Parse(request.Body)

	if err != nil {
		msg := err.Error()
		resp := ASTResponse{Valid: true, AST: nil, Error: msg}
		encodeJSON(w, http.StatusBadRequest, resp, s.Logger)
	} else {
		resp := ASTResponse{Valid: true, AST: parsed, Error: ""}
		encodeJSON(w, http.StatusOK, resp, s.Logger)
	}

}

// ProxyFlux proxies requests to influxdb using the path query parameter.
func (s *Service) ProxyFlux(w http.ResponseWriter, r *http.Request) {
	id, err := paramID("id", r)
	if err != nil {
		Error(w, http.StatusUnprocessableEntity, err.Error(), s.Logger)
		return
	}

	path := r.URL.Query().Get("path")
	if path == "" {
		Error(w, http.StatusUnprocessableEntity, "path query parameter required", s.Logger)
		return
	}

	ctx := r.Context()
	src, err := s.Store.Sources(ctx).Get(ctx, id)
	if err != nil {
		notFound(w, id, s.Logger)
		return
	}

	fluxEnabled, err := hasFlux(ctx, src)
	if err != nil {
		msg := fmt.Sprintf("Error flux service unavailable: %v", err)
		Error(w, http.StatusServiceUnavailable, msg, s.Logger)
		return
	}

	if !fluxEnabled {
		msg := fmt.Sprintf("Error flux not enabled: %v", err)
		Error(w, http.StatusBadRequest, msg, s.Logger)
		return
	}

	// To preserve any HTTP query arguments to the kapacitor path,
	// we concat and parse them into u.
	uri := singleJoiningSlash(src.URL, path)
	u, err := url.Parse(uri)
	if err != nil {
		msg := fmt.Sprintf("Error parsing flux url: %v", err)
		Error(w, http.StatusUnprocessableEntity, msg, s.Logger)
		return
	}

	director := func(req *http.Request) {
		// Set the Host header of the original Flux URL
		req.Host = u.Host
		req.URL = u

		// Use authorization method based on whether it is OSS or Enterprise
		auth := influx.DefaultAuthorization(&src)
		auth.Set(req)
	}

	// TODO: this was copied from services we may not needs this?
	// Without a FlushInterval the HTTP Chunked response for kapacitor logs is
	// buffered and flushed every 30 seconds.
	proxy := &httputil.ReverseProxy{
		Director:      director,
		FlushInterval: time.Second,
	}

	// The connection to kapacitor is using a self-signed certificate.
	// This modifies uses the same values as http.DefaultTransport but specifies
	// InsecureSkipVerify
	if src.InsecureSkipVerify {
		proxy.Transport = &http.Transport{
			Proxy: http.ProxyFromEnvironment,
			DialContext: (&net.Dialer{
				Timeout:   30 * time.Second,
				KeepAlive: 30 * time.Second,
				DualStack: true,
			}).DialContext,
			MaxIdleConns:          100,
			IdleConnTimeout:       90 * time.Second,
			TLSHandshakeTimeout:   10 * time.Second,
			ExpectContinueTimeout: 1 * time.Second,
			TLSClientConfig:       &tls.Config{InsecureSkipVerify: true},
		}
	}
	proxy.ServeHTTP(w, r)
}
