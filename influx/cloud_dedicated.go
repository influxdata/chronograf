package influx

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/util"
)

type fakeInfluxResponse []struct {
	StatementID int      `json:"statement_id"`
	Series      []series `json:"series"`
}

type series struct {
	Name    string          `json:"name"`
	Columns []string        `json:"columns"`
	Values  [][]interface{} `json:"values"`
}

type cdDatabase struct {
	Name string `json:"name,omitempty"`
}

type cdListDatabasesError struct {
	Code    string `json:"code,omitempty"`
	Message string `json:"message,omitempty"`
}

// validateCloudDedicatedAuth checks both the management endpoint and the database endpoint to validate authentication.
func (c *Client) validateCloudDedicatedAuth(ctx context.Context) error {
	var req *http.Request
	var err error

	// Call list databases on management api.
	if req, _, err = c.newListDatabasesRequestForCloudDedicated(ctx); err != nil {
		return fmt.Errorf("management authentication failed: %w", err)
	}
	if err = c.executeRequest(err, req); err != nil {
		return fmt.Errorf("management authentication failed: %w", err)
	}

	// Call dummy query on query api.
	if req, err = c.newDummyQueryRequestForCloudDedicated(ctx); err != nil {
		return fmt.Errorf("database authentication failed: %w", err)
	}
	if err = c.executeRequest(err, req); err != nil {
		return fmt.Errorf("database authentication failed: %w", err)
	}

	return nil
}

// showDatabasesForCloudDedicated list databases of InfluxDB Cloud Dedicated using the management api and wraps the results into chronograf.Response structure.
func (c *Client) showDatabasesForCloudDedicated(ctx context.Context) (chronograf.Response, error) {
	// Prepare request.
	req, logs, err := c.newListDatabasesRequestForCloudDedicated(ctx)
	if err != nil {
		return nil, err
	}

	// Do request.
	hc := &http.Client{}
	hc.Transport = SharedTransport(c.InsecureSkipVerify)
	resp, err := hc.Do(req)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled) {
			return nil, chronograf.ErrUpstreamTimeout
		}
		return nil, err
	}
	defer resp.Body.Close()

	// Handle non-OK status.
	if resp.StatusCode != http.StatusOK {
		var errorResponse cdListDatabasesError
		dec := json.NewDecoder(resp.Body)
		_ = dec.Decode(&errorResponse)
		return nil, fmt.Errorf("received status code %d from server: err: %s", resp.StatusCode, errorResponse.Message)
	}

	// Decode response.
	var databases []cdDatabase
	dec := json.NewDecoder(resp.Body)
	decErr := dec.Decode(&databases)
	if decErr != nil {
		logs.WithField("influx_status", resp.StatusCode).
			Error("Error parsing results from influxdb: err:", decErr)
		return nil, decErr
	}

	// Convert response.
	return constructShowDatabasesResponse(databases), nil
}

// newListDatabasesRequestForCloudDedicated constructs a new http.Request for listing databases in InfluxDB Cloud Dedicated.
func (c *Client) newListDatabasesRequestForCloudDedicated(ctx context.Context) (*http.Request, chronograf.Logger, error) {
	req, err := http.NewRequest("GET", util.AppendPath(c.MgmtURL, "/databases").String(), nil)
	if err != nil {
		return nil, nil, err
	}
	req = req.WithContext(ctx)
	logs := c.Logger.
		WithField("component", "proxy").
		WithField("host", req.Host)
	logs.Debug(req.URL.Path)

	if c.MgmtAuthorizer != nil {
		if err := c.MgmtAuthorizer.Set(req); err != nil {
			logs.Error("Error setting authorization header ", err)
			return nil, nil, err
		}
	}

	return req, logs, err
}

// constructShowDatabasesResponse constructs a chronograf.Response containing database names formatted as query result data.
func constructShowDatabasesResponse(databases []cdDatabase) chronograf.Response {
	values := make([][]interface{}, len(databases))
	for i, db := range databases {
		values[i] = []interface{}{db.Name}
	}

	response := fakeInfluxResponse{
		{
			StatementID: 0,
			Series: []series{
				{
					Name:    "databases",
					Columns: []string{"name"},
					Values:  values,
				},
			},
		},
	}

	data, _ := json.Marshal(response)
	return &responseType{
		Results: data,
		Err:     "",
		V2Err:   "",
	}
}

// newDummyQueryRequestForCloudDedicated constructs a http.Request to call a dummy query in InfluxDB Cloud Dedicated.
func (c *Client) newDummyQueryRequestForCloudDedicated(ctx context.Context) (*http.Request, error) {
	u, err := url.Parse(c.URL.String())
	if err != nil {
		return nil, err
	}
	u = util.AppendPath(u, "/query")

	form := url.Values{}
	form.Set("q", "SELECT * FROM dummy")
	req, err := http.NewRequest("POST", u.String(), strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req = req.WithContext(ctx)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	logs := c.Logger.
		WithField("component", "proxy").
		WithField("host", req.Host)
	logs.Debug("/query")

	if c.Authorizer != nil {
		if err := c.Authorizer.Set(req); err != nil {
			logs.Error("Error setting authorization header ", err)
			return nil, err
		}
	}
	return req, err
}

// appendTimeCondition appends a default "WHERE time > now() - 24h" clause to the provided SQL command if no WHERE clause exists.
func appendTimeCondition(cmd string) string {
	const timeCondition = "time > now() - 24h"
	// Remove trailing semicolon if present
	cmd = strings.TrimSuffix(cmd, ";")
	upperCmd := clearQuotedContent(strings.ToUpper(cmd))

	if strings.Contains(upperCmd, " WHERE ") {
		// Already contains a `WHERE` clause (hopefully also with a time condition)
		return cmd
	}

	// Find positions of LIMIT and OFFSET clauses
	limitPos := strings.Index(upperCmd, " LIMIT ")
	offsetPos := strings.Index(upperCmd, " OFFSET ")

	// Find the earliest position where we need to insert WHERE
	insertPos := len(cmd) // Default to end
	if limitPos != -1 && offsetPos != -1 {
		insertPos = min(limitPos, offsetPos)
	} else if limitPos != -1 {
		insertPos = limitPos
	} else if offsetPos != -1 {
		insertPos = offsetPos
	}

	// Insert WHERE condition
	if insertPos == len(cmd) {
		// No LIMIT/OFFSET, append to the end
		return cmd + " WHERE " + timeCondition
	} else {
		// Insert before LIMIT/OFFSET
		return cmd[:insertPos] + " WHERE " + timeCondition + cmd[insertPos:]
	}
}

// clearQuotedContent replaces content within double quotes in the input string with underscores.
func clearQuotedContent(cmd string) string {
	var result strings.Builder
	inQuotes := false

	for _, char := range cmd {
		if char == '"' {
			inQuotes = !inQuotes
			result.WriteByte('"')
		} else if inQuotes {
			result.WriteByte('_')
		} else {
			result.WriteByte(byte(char))
		}
	}

	return result.String()
}
