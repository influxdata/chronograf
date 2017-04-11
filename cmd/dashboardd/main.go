package main

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/canned"
	clog "github.com/influxdata/chronograf/log"
)

var layoutStore chronograf.LayoutStore

// cors is a middleware allowing CORS based on the sent origin
func cors(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if origin := r.Header.Get("Origin"); origin != "" {
			w.Header().Set(`Access-Control-Allow-Origin`, origin)
			w.Header().Set(`Access-Control-Allow-Methods`, strings.Join([]string{
				`GET`,
				`OPTIONS`,
			}, ", "))

			w.Header().Set(`Access-Control-Allow-Headers`, strings.Join([]string{
				`Accept`,
				`Accept-Encoding`,
				`Content-Length`,
				`Content-Type`,
			}, ", "))

			w.Header().Set(`Access-Control-Expose-Headers`, strings.Join([]string{
				`Date`,
			}, ", "))
		}

		if r.Method == "OPTIONS" {
			return
		}

		next.ServeHTTP(w, r)
	}
}

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

	http.HandleFunc("/", cors(dashboardsHandler))
	logger.Info("Starting dashboardd...")
	logger.Error(http.ListenAndServe(":8080", nil))
}
