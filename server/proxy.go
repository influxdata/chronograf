package server

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
)

// KapacitorProxy proxies requests to kapacitor using the path query parameter.
func (h *Service) KapacitorProxy(w http.ResponseWriter, r *http.Request) {
	srcID, err := paramID("id", r)
	if err != nil {
		Error(w, http.StatusUnprocessableEntity, err.Error(), h.Logger)
		return
	}

	id, err := paramID("kid", r)
	if err != nil {
		Error(w, http.StatusUnprocessableEntity, err.Error(), h.Logger)
		return
	}

	path := r.URL.Query().Get("path")
	if path == "" {
		Error(w, http.StatusUnprocessableEntity, "path query parameter required", h.Logger)
		return
	}

	ctx := r.Context()
	srv, err := h.ServersStore.Get(ctx, id)
	if err != nil || srv.SrcID != srcID {
		notFound(w, id, h.Logger)
		return
	}

	u, err := url.Parse(srv.URL)
	if err != nil {
		msg := fmt.Sprintf("Error parsing kapacitor url: %v", err)
		Error(w, http.StatusUnprocessableEntity, msg, h.Logger)
		return
	}

	u.Path = path

	director := func(req *http.Request) {
		req.URL = u
		// Because we are acting as a proxy, kapacitor needs to have the basic auth information set as
		// a header directly
		if srv.Username != "" && srv.Password != "" {
			req.SetBasicAuth(srv.Username, srv.Password)
		}
	}
	proxy := &httputil.ReverseProxy{
		Director: director,
	}
	proxy.ServeHTTP(w, r)
}

// KapacitorProxyPost proxies POST to kapacitor
func (h *Service) KapacitorProxyPost(w http.ResponseWriter, r *http.Request) {
	h.KapacitorProxy(w, r)
}

// KapacitorProxyPatch proxies PATCH to kapacitor
func (h *Service) KapacitorProxyPatch(w http.ResponseWriter, r *http.Request) {
	h.KapacitorProxy(w, r)
}

// KapacitorProxyGet proxies GET to kapacitor
func (h *Service) KapacitorProxyGet(w http.ResponseWriter, r *http.Request) {
	h.KapacitorProxy(w, r)
}

// KapacitorProxyDelete proxies DELETE to kapacitor
func (h *Service) KapacitorProxyDelete(w http.ResponseWriter, r *http.Request) {
	h.KapacitorProxy(w, r)
}
