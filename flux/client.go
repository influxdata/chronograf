package flux

import (
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/influxdata/chronograf/util"
)

// Shared transports for all clients to prevent leaking connections.
var (
	skipVerifyTransport = util.CreateTransport(true)
	defaultTransport    = util.CreateTransport(false)
)

// Client is how we interact with Flux.
type Client struct {
	URL                *url.URL
	InsecureSkipVerify bool
	Timeout            time.Duration
}

// FluxEnabled returns true if the server has flux querying enabled.
func (c *Client) FluxEnabled() (bool, error) {
	url := util.AppendPath(c.URL, "/api/v2/query")

	req, err := http.NewRequest("POST", url.String(), nil)
	if err != nil {
		return false, err
	}
	hc := &http.Client{
		Timeout: c.Timeout,
	}
	if c.InsecureSkipVerify {
		hc.Transport = skipVerifyTransport
	} else {
		hc.Transport = defaultTransport
	}

	resp, err := hc.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	contentType := resp.Header.Get("Content-Type")
	// 1.x: When flux is enabled, the response has 'Content-Type' set to 'application/json' and a body
	// of `{"error":"mime: no media type"}`. Otherwise it is 'text/plain; charset=utf-8' with
	// `Flux query service disabled.` in the body.
	// 2.x: Flux is always enabled, the 401 response with 'application/json; charset=utf-8' content type and body
	// {"code":"unauthorized","message":"unauthorized access"} is received
	return strings.HasPrefix(contentType, "application/json"), nil
}
