package influxql

// Response contains the collection of results for a query.
type Response struct {
	Results []Result `json:"results,omitempty"`
	Err     string   `json:"error,omitempty"`
}

// Result represents a resultset returned from a single statement.
// Rows represents a list of rows that can be sorted consistently by name/tag.
type Result struct {
	// StatementID is just the statement's position in the query. It's used
	// to combine statement results if they're being buffered in memory.
	StatementID int       `json:"statement_id"`
	Series      []*Series `json:"series,omitempty"`
	Partial     bool      `json:"partial,omitempty"`
	Err         string    `json:"error,omitempty"`
}

// Series represents a series of rows that share the same group key returned from the execution of a statement.
type Series struct {
	Name    string            `json:"name,omitempty"`
	Tags    map[string]string `json:"tags,omitempty"`
	Columns []string          `json:"columns,omitempty"`
	Values  [][]interface{}   `json:"values,omitempty"`
	Partial bool              `json:"partial,omitempty"`
}
