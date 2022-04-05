package server

import (
	_ "embed"
	"net/http"
)

//go:embed swagger.json
var swagger []byte

// Spec servers the swagger.json file from bindata
func Spec() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write(swagger)
	})
}
