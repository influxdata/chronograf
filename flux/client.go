package flux

import (
	"context"
	"errors"
	"io/ioutil"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/influx"
)

// Shared transports for all clients to prevent leaking connections.
var (
	skipVerifyTransport = influx.CreateTransport(true)
	defaultTransport    = influx.CreateTransport(false)
)

// Client is how we interact with Flux.
type Client struct {
	URL                *url.URL
	InsecureSkipVerify bool
	Timeout            time.Duration
}

// Ping checks the connection of a Flux.
func (c *Client) Ping(ctx context.Context) error {
	t := 2 * time.Second
	if c.Timeout > 0 {
		t = c.Timeout
	}
	ctx, cancel := context.WithTimeout(ctx, t)
	defer cancel()
	err := c.pingTimeout(ctx)
	return err
}

func (c *Client) pingTimeout(ctx context.Context) error {
	resps := make(chan (error))
	go func() {
		resps <- c.ping(c.URL)
	}()

	select {
	case resp := <-resps:
		return resp
	case <-ctx.Done():
		return chronograf.ErrUpstreamTimeout
	}
}

// FluxEnabled returns true if the server has flux querying enabled.
func (c *Client) FluxEnabled() (bool, error) {
	url := c.URL
	url.Path = "/api/v2/query"

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

func (c *Client) ping(u *url.URL) error {
	u.Path = "ping"

	req, err := http.NewRequest("GET", u.String(), nil)
	if err != nil {
		return err
	}

	hc := &http.Client{}
	if c.InsecureSkipVerify {
		hc.Transport = skipVerifyTransport
	} else {
		hc.Transport = defaultTransport
	}

	resp, err := hc.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	if resp.StatusCode != http.StatusNoContent {
		return errors.New(string(body))
	}

	return nil
}
