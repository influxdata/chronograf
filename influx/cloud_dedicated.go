package influx

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/util"
	"github.com/influxdata/influxdb/influxql"
)

type influxResult struct {
	StatementID int      `json:"statement_id"`
	Series      []series `json:"series"`
}
type fakeInfluxResponse []influxResult

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

// parseShowTagValuesStatement parses a SHOW TAG VALUES query string into an instance of ShowTagValuesStatement.
func parseShowTagValuesStatement(query string) (*influxql.ShowTagValuesStatement, error) {
	stmt, err := influxql.ParseStatement(query)
	if err != nil {
		return nil, fmt.Errorf("failed to parse statement: %w", err)
	}
	showStmt, ok := stmt.(*influxql.ShowTagValuesStatement)
	if !ok {
		return nil, fmt.Errorf("not a SHOW TAG VALUES statement")
	}
	return showStmt, nil
}

// parseShowTagKeysStatement parses a SHOW TAG KEYS query string into an instance of ShowTagKeysStatement.
func parseShowTagKeysStatement(query string) (*influxql.ShowTagKeysStatement, error) {
	stmt, err := influxql.ParseStatement(query)
	if err != nil {
		return nil, fmt.Errorf("failed to parse statement: %w", err)
	}
	showStmt, ok := stmt.(*influxql.ShowTagKeysStatement)
	if !ok {
		return nil, fmt.Errorf("not a SHOW TAG KEYS statement")
	}
	return showStmt, nil
}

// appendTimeCondition appends a default "WHERE time > now() - 1d" clause to the provided SHOW TAG VALUES statement if no time condition exists.
func appendTimeCondition(showStmt *influxql.ShowTagValuesStatement) error {
	const timeCondition = "time > now() - 1d"

	// Check if there's already a time condition in the WHERE clause
	if showStmt.Condition != nil && hasTimeCondition(showStmt.Condition) {
		// Already has a time condition, do nothing
		return nil
	}

	// Create the time condition expression
	timeExpr, err := influxql.ParseExpr(timeCondition)
	if err != nil {
		// Expression parsing fails (should not happen)
		return err
	}

	// Add or modify the WHERE clause
	if showStmt.Condition == nil {
		// No existing WHERE clause, add our time condition
		showStmt.Condition = timeExpr
	} else {
		// Existing WHERE clause without time condition, combine with AND
		showStmt.Condition = &influxql.BinaryExpr{
			Op:  influxql.AND,
			LHS: showStmt.Condition,
			RHS: timeExpr,
		}
	}

	return nil
}

// hasTimeCondition recursively checks if an InfluxQL expression contains a reference to the "time" field.
func hasTimeCondition(expr influxql.Expr) bool {
	if expr == nil {
		return false
	}

	switch e := expr.(type) {
	case *influxql.VarRef:
		return strings.EqualFold(e.Val, "time")
	case *influxql.BinaryExpr:
		return hasTimeCondition(e.LHS) || hasTimeCondition(e.RHS)
	case *influxql.ParenExpr:
		return hasTimeCondition(e.Expr)
	case *influxql.Call:
		for _, arg := range e.Args {
			if hasTimeCondition(arg) {
				return true
			}
		}
		return false
	default:
		return false
	}
}

// ReadTagValuesFromCSV reads tag values from a CSV file and returns a TagsStore.
func ReadTagValuesFromCSV(csvFilePath string) (TagsStore, error) {
	// Open the CSV file
	file, err := os.Open(csvFilePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open CSV file: %w", err)
	}
	defer file.Close()

	// Create a CSV reader
	reader := csv.NewReader(file)
	reader.Comma = ';'

	data := make(TagsStore)
	for {
		record, err := reader.Read()
		if err != nil {
			if err.Error() == "EOF" {
				break // End of file reached
			}
			return nil, fmt.Errorf("failed to read CSV record: %w", err)
		}

		if len(record) < 3 {
			continue // Skip records that do not have enough fields
		}

		db, meas, tag, val := record[0], record[1], record[2], record[3]
		if _, ok := data[db]; !ok {
			data[db] = make(map[string]map[string][]string)
		}
		if _, ok := data[db][meas]; !ok {
			data[db][meas] = make(map[string][]string)
		}
		data[db][meas][tag] = append(data[db][meas][tag], val)
	}
	return data, nil
}

func createShowMeasurementsResponse(tagValues TagsStore, db string) chronograf.Response {
	if _, ok := tagValues[db]; !ok {
		return nil
	}
	data := make([][]interface{}, 0, len(tagValues[db]))
	for table := range tagValues[db] {
		data = append(data, []interface{}{table})
	}
	response := fakeInfluxResponse{
		influxResult{
			StatementID: 0,
			Series: []series{
				{
					Name:    "measurements",
					Columns: []string{"name"},
					Values:  data,
				},
			},
		},
	}
	bytes, _ := json.Marshal(response)
	return &responseType{
		Results: bytes,
		Err:     "",
		V2Err:   "",
	}
}

func createTagKeysResponse(tagValues TagsStore, db string, tables []string) chronograf.Response {
	if _, ok := tagValues[db]; !ok {
		return nil
	}
	if len(tables) == 0 {
		tables = make([]string, 0, len(tagValues[db]))
		for k := range tagValues[db] {
			tables = append(tables, k)
		}
	}
	response := make(fakeInfluxResponse, 0, len(tables))
	for i, table := range tables {
		data := make([][]interface{}, 0, len(tagValues[db][table]))
		for tag := range tagValues[db][table] {
			data = append(data, []interface{}{tag})
		}
		response = append(response, influxResult{
			StatementID: i,
			Series: []series{
				{
					Name:    table,
					Columns: []string{"tagKey"},
					Values:  data,
				},
			},
		})
	}
	bytes, _ := json.Marshal(response)
	return &responseType{
		Results: bytes,
		Err:     "",
		V2Err:   "",
	}
}

func createTagValuesResponse(tagValues TagsStore, db string, tables, tags []string) chronograf.Response {
	if _, ok := tagValues[db]; !ok {
		return nil
	}
	if len(tables) == 0 {
		tables = make([]string, 0, len(tagValues[db]))
		for k := range tagValues[db] {
			tables = append(tables, k)
		}
	}
	response := make(fakeInfluxResponse, 0, len(tables))
	for i, table := range tables {
		data := make([][]interface{}, 0, len(tagValues[db][table])*2) //arbitrary lenght
		for tag, val := range tagValues[db][table] {
			if len(tags) == 0 || contains(tags, tag) {
				for _, v := range val {
					data = append(data, []interface{}{tag, v})
				}
			}
		}
		response = append(response, influxResult{
			StatementID: i,
			Series: []series{
				{
					Name:    table,
					Columns: []string{"key", "value"},
					Values:  data,
				},
			},
		})
	}
	bytes, _ := json.Marshal(response)
	return &responseType{
		Results: bytes,
		Err:     "",
		V2Err:   "",
	}
}

// contains checks if a string is present in a slice of strings.
func contains(slice []string, str string) bool {
	for _, item := range slice {
		if item == str {
			return true
		}
	}
	return false
}

// extractTablesAndTags extracts all table names and relevant tag keys from a parsed SHOW TAG VALUES statement.
func extractTablesAndTags(showStmt *influxql.ShowTagValuesStatement) (tables []string, tags []string) {
	// Extract table names
	if showStmt.Sources != nil {
		tables = showStmt.Sources.Names()
	}

	// Extract tag keys
	if showStmt.TagKeyExpr != nil {
		switch expr := showStmt.TagKeyExpr.(type) {
		case *influxql.ListLiteral:
			// Handle WITH KEY IN ("tag1", "tag2")
			for _, val := range expr.Vals {
				tags = append(tags, val)
			}
		case *influxql.StringLiteral:
			// Handle WITH KEY = "tag"
			tags = append(tags, expr.Val)
		}
	}

	return tables, tags
}

// extractTablesAndTags extracts all table names and relevant tag keys from a parsed SHOW TAG VALUES statement.
func extractTables(showStmt *influxql.ShowTagKeysStatement) []string {
	// Extract table names
	if showStmt.Sources != nil {
		return showStmt.Sources.Names()
	}
	return nil
}
