package influx

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
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

// TODO simon: make this expression configurable via environment variable
// const timeCondition = "time > now() - 1d"
const timeCondition = "time > 0"

var timeExpr = mustParseExpr(timeCondition)

func mustParseExpr(expr string) influxql.Expr {
	exp, err := influxql.ParseExpr(expr)
	if err != nil {
		panic(fmt.Sprintf("failed to parse expression %q: %v", expr, err))
	}
	return exp
}

// validateClusteredOrCloudDedicatedAuth checks both the management endpoint and the database endpoint to validate authentication.
// Used for InfluxDB Clustered and InfluxDB Cloud Dedicated.
func (c *Client) validateClusteredOrCloudDedicatedAuth(ctx context.Context) error {
	var req *http.Request
	var err error

	// Call list databases on management api.
	if req, _, err = c.newListDatabasesRequestViaMgmtApi(ctx); err != nil {
		return fmt.Errorf("management authentication failed: %w", err)
	}
	if err = c.executeRequest(err, req); err != nil {
		return fmt.Errorf("management authentication failed: %w", err)
	}

	// Call dummy query on query api.
	if _, err := c.Query(ctx, chronograf.Query{Command: "SELECT * FROM dummy WHERE time > now()"}); err != nil {
		return fmt.Errorf("database authentication failed: %w", err)
	}

	return nil
}

// showDatabasesViaMgmtApi lists databases using the management api and wraps the results into chronograf.Response structure.
// Used for InfluxDB Clustered and InfluxDB Cloud Dedicated.
func (c *Client) showDatabasesViaMgmtApi(ctx context.Context) (chronograf.Response, error) {
	// Prepare request.
	req, logs, err := c.newListDatabasesRequestViaMgmtApi(ctx)
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
	dbNames := make([]string, len(databases))
	for i, db := range databases {
		dbNames[i] = db.Name
	}
	return constructShowDatabasesResponse(dbNames), nil
}

// newListDatabasesRequestViaMgmtApi constructs a new http.Request for listing databases via Management API.
// Used for InfluxDB Clustered and InfluxDB Cloud Dedicated.
func (c *Client) newListDatabasesRequestViaMgmtApi(ctx context.Context) (*http.Request, chronograf.Logger, error) {
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
func constructShowDatabasesResponse(dbNames []string) chronograf.Response {
	values := make([][]interface{}, len(dbNames))
	for i, dbName := range dbNames {
		values[i] = []interface{}{dbName}
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

func (c *Client) handleShowMeasurements(q chronograf.Query, logs chronograf.Logger) (chronograf.Response, error) {
	if c.csvTagsStore == nil {
		return nil, nil
	}
	logs.Info("Returning measurements from CSV")
	return createShowMeasurementsResponseFromCSV(c.csvTagsStore, q.DB), nil
}

func (c *Client) handleShowTagKeys(q chronograf.Query, logs chronograf.Logger) (chronograf.Response, error) {
	if c.csvTagsStore == nil {
		return nil, nil
	}
	stmt, err := parseShowTagKeysStatement(q.Command)
	if err != nil {
		logs.Debug("Could not parse SHOW TAG KEYS statement: ", err)
		return nil, err
	}
	tables := extractTables(stmt)
	logs.Info("Returning tag keys from CSV")
	return createShowTagKeysResponseFromCSV(c.csvTagsStore, q.DB, tables), nil
}

func (c *Client) handleShowTagValues(q *chronograf.Query, logs chronograf.Logger) (chronograf.Response, error) {
	stmt, err := parseShowTagValuesStatement(q.Command)
	if err != nil {
		logs.Debug("Could not parse SHOW TAG VALUES statement: ", err)
		return nil, err
	}

	if c.csvTagsStore != nil {
		// Use CSV
		tables, tags := extractTablesAndTags(stmt)
		logs.Info("Returning tag values from CSV")
		resp := createShowTagValuesResponseFromCSV(c.csvTagsStore, q.DB, tables, tags)
		if resp != nil {
			return resp, nil
		}
	} else {
		// Call InfluxDB
		logs.Info("Returning tag values from InfluxDB with time condition applied")
		appendTimeCondition(stmt)
		q.Command = stmt.String()
	}
	return nil, nil
}

// parseShowTagValuesStatement parses a SHOW TAG VALUES query string into an instance of ShowTagValuesStatement.
func parseShowTagValuesStatement(query string) (*influxql.ShowTagValuesStatement, error) {
	stmt, err := influxql.ParseStatement(query)
	if err != nil {
		return nil, fmt.Errorf("parsing error: %w", err)
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
		return nil, fmt.Errorf("parsing error: %w", err)
	}
	showStmt, ok := stmt.(*influxql.ShowTagKeysStatement)
	if !ok {
		return nil, fmt.Errorf("not a SHOW TAG KEYS statement")
	}
	return showStmt, nil
}

// appendTimeCondition appends a default "WHERE time > now() - 1d" clause to the provided SHOW TAG VALUES statement if no time condition exists.
// Returns true if the statement was modified.
func appendTimeCondition(showStmt *influxql.ShowTagValuesStatement) bool {
	// Check if there's already a time condition in the WHERE clause
	if showStmt.Condition != nil && hasTimeCondition(showStmt.Condition) {
		// Already has a time condition, do nothing
		return false
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
	return true
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

func createShowMeasurementsResponseFromCSV(csvTagsStore *CSVTagsStore, db string) chronograf.Response {
	if csvTagsStore == nil {
		return nil
	}
	tablesMap := csvTagsStore.GetMeasurementsMap(db)
	if tablesMap == nil {
		return nil
	}
	data := make([][]interface{}, 0, len(tablesMap))
	for table := range tablesMap {
		data = append(data, []interface{}{table})
	}
	if len(data) == 0 {
		return nil
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

func createShowTagKeysResponseFromCSV(csvTagsStore *CSVTagsStore, db string, tables []string) chronograf.Response {
	if csvTagsStore == nil {
		return nil
	}
	tablesMap := csvTagsStore.GetMeasurementsMap(db)
	if tablesMap == nil {
		return nil
	}
	if len(tables) == 0 {
		tables = make([]string, 0, len(tablesMap))
		for k := range tablesMap {
			tables = append(tables, k)
		}
	}
	response := make(fakeInfluxResponse, 0, len(tables))
	for i, table := range tables {
		tableMap := tablesMap[table]
		data := make([][]interface{}, 0, len(tableMap))
		for tag := range tableMap {
			data = append(data, []interface{}{tag})
		}
		if len(data) == 0 {
			continue
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
	if len(response) == 0 {
		return nil
	}
	bytes, _ := json.Marshal(response)
	return &responseType{
		Results: bytes,
		Err:     "",
		V2Err:   "",
	}
}

func createShowTagValuesResponseFromCSV(csvTagsStore *CSVTagsStore, db string, tables, tags []string) chronograf.Response {
	if csvTagsStore == nil {
		return nil
	}
	tablesMap := csvTagsStore.GetMeasurementsMap(db)
	if tablesMap == nil {
		return nil
	}
	if len(tables) == 0 {
		tables = make([]string, 0, len(tablesMap))
		for k := range tablesMap {
			tables = append(tables, k)
		}
	}
	response := make(fakeInfluxResponse, 0, len(tables))
	for i, table := range tables {
		tableMap := tablesMap[table]
		data := make([][]interface{}, 0, len(tableMap)*2) //arbitrary length
		for tag, val := range tableMap {
			if len(tags) == 0 || contains(tags, tag) {
				for _, v := range val {
					data = append(data, []interface{}{tag, v})
				}
			}
		}
		if len(data) == 0 {
			continue
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
	if len(response) == 0 {
		return nil
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

// extractTables extracts all table names from a parsed SHOW TAG KEYS statement.
func extractTables(showStmt *influxql.ShowTagKeysStatement) []string {
	// Extract table names
	if showStmt.Sources != nil {
		return showStmt.Sources.Names()
	}
	return nil
}
