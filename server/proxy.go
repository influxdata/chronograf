package server

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"

	"github.com/hws522/chronograf/influx"
)

// Proxy proxies requests to services using the path query parameter.
func (s *Service) Proxy(w http.ResponseWriter, r *http.Request) {
	srcID, err := paramID("id", r)
	if err != nil {
		Error(w, http.StatusUnprocessableEntity, err.Error(), s.Logger)
		return
	}

	id, err := paramID("kid", r)
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
	srv, err := s.Store.Servers(ctx).Get(ctx, id)
	if err != nil || srv.SrcID != srcID {
		notFound(w, id, s.Logger)
		return
	}

	// To preserve any HTTP query arguments to the kapacitor path,
	// we concat and parse them into u.
	uri := singleJoiningSlash(srv.URL, path)
	u, err := url.Parse(uri)
	if err != nil {
		msg := fmt.Sprintf("Error parsing kapacitor url: %v", err)
		Error(w, http.StatusUnprocessableEntity, msg, s.Logger)
		return
	}

	director := func(req *http.Request) {
		// Set the Host header of the original Kapacitor URL
		req.Host = u.Host
		req.URL = u

		// Because we are acting as a proxy, kapacitor needs to have the basic auth information set as
		// a header directly
		if srv.Username != "" && srv.Password != "" {
			req.SetBasicAuth(srv.Username, srv.Password)
		}
	}

	// Without a FlushInterval the HTTP Chunked response for kapacitor logs is
	// buffered and flushed every 30 seconds.
	proxy := &httputil.ReverseProxy{
		Director:      director,
		FlushInterval: time.Second,
	}

	// The connection to kapacitor might use a self-signed certificate, that's why srv.InsecureSkipVerify
	proxy.Transport = influx.SharedTransport(srv.InsecureSkipVerify)
	proxy.ServeHTTP(w, r)
}

// ProxyPost proxies POST to service
func (s *Service) ProxyPost(w http.ResponseWriter, r *http.Request) {
	s.Proxy(w, r)
}

// ProxyPatch proxies PATCH to Service
func (s *Service) ProxyPatch(w http.ResponseWriter, r *http.Request) {
	s.Proxy(w, r)
}

// ProxyGet proxies GET to service
func (s *Service) ProxyGet(w http.ResponseWriter, r *http.Request) {
	s.Proxy(w, r)
}

// ProxyDelete proxies DELETE to service
func (s *Service) ProxyDelete(w http.ResponseWriter, r *http.Request) {
	s.Proxy(w, r)
}

func singleJoiningSlash(a, b string) string {
	aslash := strings.HasSuffix(a, "/")
	bslash := strings.HasPrefix(b, "/")
	if aslash && bslash {
		return a + b[1:]
	}
	if !aslash && !bslash {
		return a + "/" + b
	}
	return a + b
}
