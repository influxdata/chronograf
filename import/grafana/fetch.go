package grafana

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"path"
)

// FetchDashboards fetches all dashboard locations associated with a Grafana host.
func FetchDashboards(addr string) (DashboardResults, error) {
	u, err := url.Parse(addr)
	if err != nil {
		return nil, err
	}

	if u.Path != "" {
		return nil, fmt.Errorf("unexpected path %s", u.Path)
	}
	u.Path = path.Join(u.Path, "/api/search/")

	resp, err := http.Get(u.String())
	if err != nil {
		return nil, nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code %d", resp.StatusCode)
	}

	var results DashboardResults
	if err := json.NewDecoder(resp.Body).Decode(&results); err != nil {
		return nil, err
	}
	return results, nil
}
