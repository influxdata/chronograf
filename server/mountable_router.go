package server

import (
	"net/http"

	"github.com/influxdata/chronograf"
)

var _ chronograf.Router = &MountableRouter{}

type MountableRouter struct {
	Prefix   string
	Delegate chronograf.Router
}

func (mr *MountableRouter) DELETE(path string, handler http.HandlerFunc) {
}

func (mr *MountableRouter) GET(path string, handler http.HandlerFunc) {
	mr.Delegate.GET(mr.Prefix+path, handler)
}

func (mr *MountableRouter) POST(path string, handler http.HandlerFunc) {
	mr.Delegate.POST(mr.Prefix+path, handler)
}

func (mr *MountableRouter) PUT(path string, handler http.HandlerFunc) {
	mr.Delegate.PUT(mr.Prefix+path, handler)
}

func (mr *MountableRouter) PATCH(path string, handler http.HandlerFunc) {
}

func (mr *MountableRouter) Handler(method string, path string, handler http.Handler) {
}

func (mr *MountableRouter) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	mr.Delegate.ServeHTTP(rw, r)
}
