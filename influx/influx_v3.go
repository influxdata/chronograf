package influx

import (
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"net/url"
	"strings"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/util"
	"github.com/influxdata/influxdb/influxql"
)

// v3Database represents a database entry from InfluxDB v3 API response to `SHOW DATABASES`
type v3Database struct {
	Database string `json:"iox::database"`
	Deleted  bool   `json:"deleted"`
}

// v3RetentionPolicy represents a retention policy entry from InfluxDB v3 API response to `SHOW RETENTION POLICIES`
type v3RetentionPolicy struct {
	Database string `json:"iox::database"`
	Name     string `json:"name"`
}

func (c *Client) isV3SrcType() bool {
	return chronograf.IsV3SrcType(c.SrcType)
}

// queryV3 executes InfluxQL queries against InfluxDB v3 server
func (c *Client) queryV3(u *url.URL, q chronograf.Query) (chronograf.Response, error) {
	// Parse query
	cmd := q.Command
	stmt, err := influxql.ParseStatement(cmd)
	if err != nil {
		return nil, fmt.Errorf("parsing error: %w", err)
	}

	// Select query endpoint
	var path string
	switch stmt.(type) {
	case *influxql.ShowDatabasesStatement,
		*influxql.ShowRetentionPoliciesStatement:
		// `SHOW DATABASES` and `SHOW RETENTION POLICIES` are queried on the v3 query endpoint
		path = "/api/v3/query_influxql"
	default:
		// v1 compatibility query endpoint
		path = "/query"
	}

	// Prepare request
	u = util.AppendPath(u, path)
	req, err := http.NewRequest("GET", u.String(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	logs := c.Logger.
		WithField("queryID", rand.Uint32()).
		WithField("component", "proxy")
	logs.
		WithField("host", req.Host).
		WithField("path", path).
		WithField("command", cmd).
		WithField("db", q.DB).
		Debug("query")

	// If the database is not specified, then get it from the query
	if q.DB == "" {
		if db := parseDatabaseNameFromStatement(stmt); db != "" {
			q.DB = db
			logs.WithField("db", q.DB).Debug("database parsed from query")
		}
	}

	// Clear retention policies from queries since they're not supported in v3 queries
	if clearRetentionPolicies(stmt) {
		cmd = stmt.String()
		logs.WithField("command", cmd).Debug("retention policies cleared from query")
	}

	switch s := stmt.(type) {
	case *influxql.ShowTagValuesStatement:
		// Ensure time condition is added to `SHOW TAG VALUES` queries
		if appendTimeCondition(s) {
			cmd = stmt.String()
			logs.WithField("command", cmd).Debug("time condition added to SHOW TAG VALUES query")
		}
	case *influxql.ShowRetentionPoliciesStatement:
		// Clear ON <database> modifier from `SHOW RETENTION POLICIES` since not supported in v3
		if clearOnModifier(s) {
			cmd = stmt.String()
			logs.WithField("command", cmd).Debug("ON modifier cleared from SHOW RETENTION POLICIES query")
		}
	}

	// Query parameters
	params := req.URL.Query()
	params.Set("q", cmd)
	params.Set("db", q.DB)
	params.Set("epoch", "ms")
	if q.Epoch != "" {
		params.Set("epoch", q.Epoch)
	}
	req.URL.RawQuery = params.Encode()

	// Authorization
	if c.Authorizer != nil {
		if err := c.Authorizer.Set(req); err != nil {
			logs.Error("Error setting authorization header ", err)
			return nil, err
		}
	}

	// Do the request
	hc := &http.Client{}
	hc.Transport = SharedTransport(c.InsecureSkipVerify)
	resp, err := hc.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	b, _ := io.ReadAll(resp.Body)
	bodyString := string(b)
	logs.Debug("JSON response from InfluxDB: ", bodyString)

	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusInternalServerError {
			// Shorten the error message to the point
			errPrefix := "error in InfluxQL statement:"
			if strings.HasPrefix(bodyString, errPrefix) {
				return nil, fmt.Errorf("%s", bodyString[len(errPrefix):])
			}
		}
		return nil, fmt.Errorf("received status code %d: %s", resp.StatusCode, bodyString)
	}

	switch stmt.(type) {
	case *influxql.ShowDatabasesStatement:
		// Handle `SHOW DATABASES`
		return processShowDatabasesV3Response(b)

	case *influxql.ShowRetentionPoliciesStatement:
		// Handle `SHOW RETENTION POLICIES`
		return processShowRetentionPoliciesV3Response(b)

	default:
		// Handle response form v1 compatibility endpoint
		return processV1Response(b)
	}
}

// processShowDatabasesV3Response parses InfluxDB v3 SHOW DATABASES response and returns non-deleted database names aS InfluxQL response
func processShowDatabasesV3Response(responseBody []byte) (chronograf.Response, error) {
	var databases []v3Database
	if err := json.Unmarshal(responseBody, &databases); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}
	// Convert response, filtering out deleted databases.
	dbNames := make([]string, 0)
	for _, db := range databases {
		if !db.Deleted {
			dbNames = append(dbNames, db.Database)
		}
	}
	return constructShowDatabasesResponse(dbNames), nil
}

// processShowRetentionPoliciesV3Response parses InfluxDB v3 SHOW RETENTION POLICIES response and returns it as InfluxQL response
func processShowRetentionPoliciesV3Response(responseBody []byte) (chronograf.Response, error) {
	var policies []v3RetentionPolicy
	if err := json.Unmarshal(responseBody, &policies); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	// Convert to InfluxQL response format with only "name" column
	values := make([][]interface{}, len(policies))
	for i, policy := range policies {
		values[i] = []interface{}{policy.Name}
	}

	return buildSingleSeriesResponse("", []string{"name"}, values)
}

// processV1Response parses a v1 compatibility API response and returns it as chronograf.Response
func processV1Response(responseBody []byte) (chronograf.Response, error) {
	var response responseType
	if err := json.Unmarshal(responseBody, &response); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}
	return &response, nil
}

// clearMeasurementRP clears the retention policy from a measurement if it exists.
// Returns true if the retention policy was cleared.
func clearMeasurementRP(source influxql.Source) bool {
	if mm, ok := source.(*influxql.Measurement); ok && mm.RetentionPolicy != "" {
		mm.RetentionPolicy = ""
		mm.Database = ""
		return true
	}
	return false
}

// clearRetentionPolicies removes retention policy references from InfluxQL statements
// since they're not supported in InfluxDB v3. Returns true if the statement was modified.
func clearRetentionPolicies(stmt influxql.Statement) bool {
	modified := false

	var sources influxql.Sources
	switch s := stmt.(type) {
	case *influxql.ShowMeasurementsStatement:
		return clearMeasurementRP(s.Source)
	case *influxql.ShowTagKeysStatement:
		sources = s.Sources
	case *influxql.ShowTagValuesStatement:
		sources = s.Sources
	case *influxql.ShowFieldKeysStatement:
		sources = s.Sources
	case *influxql.SelectStatement:
		sources = s.Sources
	default:
		return false
	}

	if sources != nil {
		for _, source := range sources {
			if clearMeasurementRP(source) {
				modified = true
			}
		}
	}

	return modified
}

// parseDatabaseNameFromStatement extracts the database name from InfluxQL query statement if present.
// Returns empty string if not found.
func parseDatabaseNameFromStatement(stmt influxql.Statement) string {
	switch s := stmt.(type) {
	case *influxql.SelectStatement:
		if len(s.Sources) > 0 {
			for _, source := range s.Sources {
				if measurement, ok := source.(*influxql.Measurement); ok {
					return measurement.Database
				}
			}
		}
	}

	return ""
}

// clearOnModifier clears ON <database> modifiers from show retention policies in the source.
// Returns true if the retention policy was cleared.
func clearOnModifier(stmt influxql.Statement) bool {
	if mm, ok := stmt.(*influxql.ShowRetentionPoliciesStatement); ok && mm.Database != "" {
		mm.Database = ""
		return true
	}
	return false
}

// buildSeriesResponse creates a standardized InfluxQL response with multiple series
func buildSeriesResponse(seriesResults []series) (chronograf.Response, error) {
	response := fakeInfluxResponse{
		{
			StatementID: 0,
			Series:      seriesResults,
		},
	}

	data, err := json.Marshal(response)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal response: %w", err)
	}

	return &responseType{
		Results: data,
	}, nil
}

// buildSingleSeriesResponse creates a standardized InfluxQL response with a single series
func buildSingleSeriesResponse(name string, columns []string, values [][]interface{}) (chronograf.Response, error) {
	seriesResults := []series{
		{
			Name:    name,
			Columns: columns,
			Values:  values,
		},
	}
	return buildSeriesResponse(seriesResults)
}
