package main

import (
	"fmt"
	"html"
	"log"
	"net/http"
)

func main() {
	type Service struct {
	}
	http.Handle("/dashboards/v1", fooHandler)

	http.HandleFunc("/bar", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello, %q", html.EscapeString(r.URL.Path))
	})

	log.Fatal(http.ListenAndServe(":8080", nil))
}
