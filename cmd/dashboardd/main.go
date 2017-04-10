package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/canned"
	clog "github.com/influxdata/chronograf/log"
)

var layoutStore chronograf.LayoutStore

func dashboardsHandler(w http.ResponseWriter, r *http.Request) {
	// Construct a filter sieve for both applications and measurements
	filtered := map[string]bool{}
	for _, a := range r.URL.Query()["app"] {
		filtered[a] = true
	}

	for _, m := range r.URL.Query()["measurement"] {
		filtered[m] = true
	}

	ctx := r.Context()
	layouts, _ := layoutStore.All(ctx)

	filter := func(layout *chronograf.Layout) bool {
		// If the length of the filter is zero then all values are acceptable.
		if len(filtered) == 0 {
			return true
		}

		// If filter contains either measurement or application
		return filtered[layout.Measurement] || filtered[layout.Application]
	}

	res := struct {
		Layouts []chronograf.Layout `json:"layouts"`
	}{
		Layouts: []chronograf.Layout{},
	}
	for _, layout := range layouts {
		if filter(&layout) {
			res.Layouts = append(res.Layouts, layout)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(res)
}

func main() {
	logger := clog.New(clog.DebugLevel)
	layoutStore = &canned.BinLayoutStore{
		Logger: logger,
	}

	http.HandleFunc("/dashboards/v1", dashboardsHandler)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
