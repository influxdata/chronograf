package influx

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/log"
	"github.com/influxdata/influxql"
)

func TestQueryV3_ParseError(t *testing.T) {
	client := &Client{
		Logger: log.New(log.DebugLevel),
	}
	u, _ := url.Parse("http://localhost:8086")

	_, err := client.queryV3(u, chronograf.Query{
		Command: "INVALID QUERY SYNTAX !!!",
	})

	if err == nil {
		t.Fatal("Expected parsing error but got nil")
	}
	if !strings.Contains(err.Error(), "parsing error") {
		t.Errorf("Expected error to contain 'parsing error', got: %v", err)
	}
}

func TestQueryV3_ShowDatabases(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify correct endpoint for SHOW DATABASES
		if !strings.HasSuffix(r.URL.Path, "/api/v3/query_influxql") {
			t.Errorf("Expected path to end with /api/v3/query_influxql, got: %s", r.URL.Path)
		}
		// Verify query parameter
		if q := r.URL.Query().Get("q"); q != "SHOW DATABASES" {
			t.Errorf("Expected query 'SHOW DATABASES', got: %s", q)
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`[{"iox::database":"db1","deleted":false},{"iox::database":"db2","deleted":false},{"iox::database":"deleted_db","deleted":true}]`))
	}))
	defer ts.Close()

	client := &Client{
		Logger: log.New(log.DebugLevel),
	}
	u, _ := url.Parse(ts.URL)

	resp, err := client.queryV3(u, chronograf.Query{
		Command: "SHOW DATABASES",
	})

	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	// Verify response contains only non-deleted databases
	result, _ := resp.MarshalJSON()
	resultStr := string(result)
	if !strings.Contains(resultStr, "db1") {
		t.Error("Expected response to contain db1")
	}
	if !strings.Contains(resultStr, "db2") {
		t.Error("Expected response to contain db2")
	}
	if strings.Contains(resultStr, "deleted_db") {
		t.Error("Expected response to NOT contain deleted_db")
	}
}

func TestQueryV3_ShowRetentionPolicies(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify correct endpoint
		if !strings.HasSuffix(r.URL.Path, "/api/v3/query_influxql") {
			t.Errorf("Expected path to end with /api/v3/query_influxql, got: %s", r.URL.Path)
		}
		// Verify ON modifier is cleared from query (check for "ON mydb" specifically, not just "ON" which appears in "RETENTION")
		q := r.URL.Query().Get("q")
		if strings.Contains(q, "ON mydb") {
			t.Errorf("Expected 'ON mydb' modifier to be cleared, got: %s", q)
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`[{"iox::database":"mydb","name":"autogen"},{"iox::database":"mydb","name":"weekly"}]`))
	}))
	defer ts.Close()

	client := &Client{
		Logger: log.New(log.DebugLevel),
	}
	u, _ := url.Parse(ts.URL)

	resp, err := client.queryV3(u, chronograf.Query{
		Command: "SHOW RETENTION POLICIES ON mydb",
		DB:      "mydb",
	})

	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	result, _ := resp.MarshalJSON()
	resultStr := string(result)
	if !strings.Contains(resultStr, "autogen") {
		t.Error("Expected response to contain autogen")
	}
	if !strings.Contains(resultStr, "weekly") {
		t.Error("Expected response to contain weekly")
	}
}

func TestQueryV3_SelectQuery_UsesV1Endpoint(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify v1 compatibility endpoint for SELECT queries
		if !strings.HasSuffix(r.URL.Path, "/query") {
			t.Errorf("Expected path to end with /query, got: %s", r.URL.Path)
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"results":[{"statement_id":0,"series":[{"name":"cpu","columns":["time","value"],"values":[[1234567890000,42]]}]}]}`))
	}))
	defer ts.Close()

	client := &Client{
		Logger: log.New(log.DebugLevel),
	}
	u, _ := url.Parse(ts.URL)

	_, err := client.queryV3(u, chronograf.Query{
		Command: `SELECT "value" FROM "cpu"`,
		DB:      "mydb",
	})

	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
}

func TestQueryV3_ClearsRetentionPolicies(t *testing.T) {
	receivedQuery := ""
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedQuery = r.URL.Query().Get("q")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"results":[{"statement_id":0}]}`))
	}))
	defer ts.Close()

	client := &Client{
		Logger: log.New(log.DebugLevel),
	}
	u, _ := url.Parse(ts.URL)

	_, err := client.queryV3(u, chronograf.Query{
		Command: `SELECT "value" FROM "autogen"."cpu"`,
		DB:      "mydb",
	})

	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	// Retention policy should be cleared
	if strings.Contains(receivedQuery, "autogen") {
		t.Errorf("Expected retention policy to be cleared from query, got: %s", receivedQuery)
	}
}

func TestQueryV3_ShowTagValues_AddsTimeCondition(t *testing.T) {
	receivedQuery := ""
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedQuery = r.URL.Query().Get("q")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"results":[{"statement_id":0,"series":[{"name":"cpu","columns":["key","value"],"values":[["host","server1"]]}]}]}`))
	}))
	defer ts.Close()

	timeExpr, _ := influxql.ParseExpr("time > now() - 24h")
	client := &Client{
		Logger: log.New(log.DebugLevel),
		V3Config: chronograf.V3Config{
			TimeConditionExpr: timeExpr,
		},
	}
	u, _ := url.Parse(ts.URL)

	_, err := client.queryV3(u, chronograf.Query{
		Command: `SHOW TAG VALUES FROM cpu WITH KEY = "host"`,
		DB:      "mydb",
	})

	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	// Time condition should be added
	if !strings.Contains(receivedQuery, "time") {
		t.Errorf("Expected time condition to be added to query, got: %s", receivedQuery)
	}
}

func TestQueryV3_ServerError(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`error in InfluxQL statement: table not found`))
	}))
	defer ts.Close()

	client := &Client{
		Logger: log.New(log.DebugLevel),
	}
	u, _ := url.Parse(ts.URL)

	_, err := client.queryV3(u, chronograf.Query{
		Command: "SHOW DATABASES",
	})

	if err == nil {
		t.Fatal("Expected error but got nil")
	}
	// Error message should be shortened to just the relevant part
	if !strings.Contains(err.Error(), "table not found") {
		t.Errorf("Expected error to contain 'table not found', got: %v", err)
	}
}

func TestQueryV3_BadRequest(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`bad request body`))
	}))
	defer ts.Close()

	client := &Client{
		Logger: log.New(log.DebugLevel),
	}
	u, _ := url.Parse(ts.URL)

	_, err := client.queryV3(u, chronograf.Query{
		Command: "SHOW DATABASES",
	})

	if err == nil {
		t.Fatal("Expected error but got nil")
	}
	if !strings.Contains(err.Error(), "400") {
		t.Errorf("Expected error to contain status code 400, got: %v", err)
	}
}

func TestQueryV3_EpochParameter(t *testing.T) {
	receivedEpoch := ""
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedEpoch = r.URL.Query().Get("epoch")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"results":[{"statement_id":0}]}`))
	}))
	defer ts.Close()

	client := &Client{
		Logger: log.New(log.DebugLevel),
	}
	u, _ := url.Parse(ts.URL)

	// Test default epoch (ms)
	_, _ = client.queryV3(u, chronograf.Query{
		Command: `SELECT * FROM cpu`,
		DB:      "mydb",
	})
	if receivedEpoch != "ms" {
		t.Errorf("Expected default epoch 'ms', got: %s", receivedEpoch)
	}

	// Test custom epoch
	_, _ = client.queryV3(u, chronograf.Query{
		Command: `SELECT * FROM cpu`,
		DB:      "mydb",
		Epoch:   "s",
	})
	if receivedEpoch != "s" {
		t.Errorf("Expected custom epoch 's', got: %s", receivedEpoch)
	}
}

func TestQueryV3_DatabaseFromQuery(t *testing.T) {
	receivedDB := ""
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedDB = r.URL.Query().Get("db")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"results":[{"statement_id":0}]}`))
	}))
	defer ts.Close()

	client := &Client{
		Logger: log.New(log.DebugLevel),
	}
	u, _ := url.Parse(ts.URL)

	// Test with DB in query (fully qualified)
	_, _ = client.queryV3(u, chronograf.Query{
		Command: `SELECT * FROM "mydb".."cpu"`,
	})
	if receivedDB != "mydb" {
		t.Errorf("Expected database 'mydb' from query, got: %s", receivedDB)
	}
}

func TestQueryV3_SubQuery(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"results":[{"statement_id":0}]}`))
	}))
	defer ts.Close()

	client := &Client{
		Logger: log.New(log.DebugLevel),
	}
	u, _ := url.Parse(ts.URL)

	// Test with DB in query (fully qualified)
	_, err := client.queryV3(u, chronograf.Query{
		Command: `SELECT mean("cpu_usage") from (SELECT max("usage_user") + max("usage_system") AS "cpu_usage" FROM "telegraf"."cpu" WHERE time > now() - 15m GROUP BY time(2500ms), "host") WHERE time > now() - 5m and "cpu_usage" > 90 GROUP BY time(2500ms), host`,
	})
	if err != nil {
		t.Fatal("Got error: ", err)
	}
}

// Tests for helper functions

func TestClearRetentionPolicies(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
		modified bool
	}{
		{
			name:     "SELECT with retention policy",
			input:    `SELECT * FROM "autogen"."cpu"`,
			expected: `SELECT * FROM cpu`,
			modified: true,
		},
		{
			name:     "SELECT without retention policy",
			input:    `SELECT * FROM cpu`,
			expected: `SELECT * FROM cpu`,
			modified: false,
		},
		{
			name:     "SHOW TAG KEYS with retention policy",
			input:    `SHOW TAG KEYS FROM "autogen"."cpu"`,
			expected: `SHOW TAG KEYS FROM cpu`,
			modified: true,
		},
		{
			name:     "SHOW TAG VALUES with retention policy",
			input:    `SHOW TAG VALUES FROM "autogen"."cpu" WITH KEY = "host"`,
			expected: `SHOW TAG VALUES FROM cpu WITH KEY = host`,
			modified: true,
		},
		{
			name:     "SHOW FIELD KEYS with retention policy",
			input:    `SHOW FIELD KEYS FROM "autogen"."cpu"`,
			expected: `SHOW FIELD KEYS FROM cpu`,
			modified: true,
		},
		{
			name:     "SHOW DATABASES (no modification)",
			input:    `SHOW DATABASES`,
			expected: `SHOW DATABASES`,
			modified: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			stmt, err := influxql.ParseStatement(tt.input)
			if err != nil {
				t.Fatalf("Failed to parse statement: %v", err)
			}

			modified := clearRetentionPolicies(stmt)
			result := stmt.String()

			if modified != tt.modified {
				t.Errorf("clearRetentionPolicies() modified = %v, want %v", modified, tt.modified)
			}
			if result != tt.expected {
				t.Errorf("clearRetentionPolicies() result = %q, want %q", result, tt.expected)
			}
		})
	}
}

func TestParseDatabaseNameFromStatement(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "SELECT with database",
			input:    `SELECT * FROM "mydb".."cpu"`,
			expected: "mydb",
		},
		{
			name:     "SELECT without database",
			input:    `SELECT * FROM cpu`,
			expected: "",
		},
		{
			name:     "SHOW DATABASES",
			input:    `SHOW DATABASES`,
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			stmt, err := influxql.ParseStatement(tt.input)
			if err != nil {
				t.Fatalf("Failed to parse statement: %v", err)
			}

			result := parseDatabaseNameFromStatement(stmt)
			if result != tt.expected {
				t.Errorf("parseDatabaseNameFromStatement() = %q, want %q", result, tt.expected)
			}
		})
	}
}

func TestClearOnModifier(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
		modified bool
	}{
		{
			name:     "SHOW RETENTION POLICIES with ON",
			input:    `SHOW RETENTION POLICIES ON mydb`,
			expected: `SHOW RETENTION POLICIES`,
			modified: true,
		},
		{
			name:     "SHOW RETENTION POLICIES without ON",
			input:    `SHOW RETENTION POLICIES`,
			expected: `SHOW RETENTION POLICIES`,
			modified: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			stmt, err := influxql.ParseStatement(tt.input)
			if err != nil {
				t.Fatalf("Failed to parse statement: %v", err)
			}

			modified := clearOnModifier(stmt)
			result := stmt.String()

			if modified != tt.modified {
				t.Errorf("clearOnModifier() modified = %v, want %v", modified, tt.modified)
			}
			if result != tt.expected {
				t.Errorf("clearOnModifier() result = %q, want %q", result, tt.expected)
			}
		})
	}
}

func TestProcessShowDatabasesV3Response(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantDBs []string
		wantErr bool
	}{
		{
			name:    "valid response with mixed deleted states",
			input:   `[{"iox::database":"db1","deleted":false},{"iox::database":"db2","deleted":false},{"iox::database":"deleted","deleted":true}]`,
			wantDBs: []string{"db1", "db2"},
			wantErr: false,
		},
		{
			name:    "empty response",
			input:   `[]`,
			wantDBs: []string{},
			wantErr: false,
		},
		{
			name:    "all deleted",
			input:   `[{"iox::database":"deleted1","deleted":true},{"iox::database":"deleted2","deleted":true}]`,
			wantDBs: []string{},
			wantErr: false,
		},
		{
			name:    "invalid JSON",
			input:   `not valid json`,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := processShowDatabasesV3Response([]byte(tt.input))

			if tt.wantErr {
				if err == nil {
					t.Fatal("Expected error but got nil")
				}
				return
			}

			if err != nil {
				t.Fatalf("Unexpected error: %v", err)
			}

			result, _ := resp.MarshalJSON()
			resultStr := string(result)

			for _, db := range tt.wantDBs {
				if !strings.Contains(resultStr, db) {
					t.Errorf("Expected response to contain %q", db)
				}
			}
		})
	}
}

func TestProcessShowRetentionPoliciesV3Response(t *testing.T) {
	tests := []struct {
		name         string
		input        string
		wantPolicies []string
		wantErr      bool
	}{
		{
			name:         "valid response",
			input:        `[{"iox::database":"mydb","name":"autogen"},{"iox::database":"mydb","name":"weekly"}]`,
			wantPolicies: []string{"autogen", "weekly"},
			wantErr:      false,
		},
		{
			name:         "empty response",
			input:        `[]`,
			wantPolicies: []string{},
			wantErr:      false,
		},
		{
			name:    "invalid JSON",
			input:   `not valid json`,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := processShowRetentionPoliciesV3Response([]byte(tt.input))

			if tt.wantErr {
				if err == nil {
					t.Fatal("Expected error but got nil")
				}
				return
			}

			if err != nil {
				t.Fatalf("Unexpected error: %v", err)
			}

			result, _ := resp.MarshalJSON()
			resultStr := string(result)

			for _, policy := range tt.wantPolicies {
				if !strings.Contains(resultStr, policy) {
					t.Errorf("Expected response to contain %q", policy)
				}
			}
		})
	}
}

func TestProcessV1Response(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{
			name:    "valid response",
			input:   `{"results":[{"statement_id":0,"series":[{"name":"cpu","columns":["time","value"],"values":[[1234567890000,42]]}]}]}`,
			wantErr: false,
		},
		{
			name:    "empty results",
			input:   `{"results":[]}`,
			wantErr: false,
		},
		{
			name:    "invalid JSON",
			input:   `not valid json`,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := processV1Response([]byte(tt.input))

			if tt.wantErr {
				if err == nil {
					t.Fatal("Expected error but got nil")
				}
				return
			}

			if err != nil {
				t.Fatalf("Unexpected error: %v", err)
			}

			if resp == nil {
				t.Fatal("Expected non-nil response")
			}
		})
	}
}

func TestBuildSingleSeriesResponse(t *testing.T) {
	resp, err := buildSingleSeriesResponse("test", []string{"col1", "col2"}, [][]interface{}{
		{"val1", "val2"},
		{"val3", "val4"},
	})

	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	result, _ := resp.MarshalJSON()
	resultStr := string(result)

	expectedParts := []string{"test", "col1", "col2", "val1", "val2", "val3", "val4"}
	for _, part := range expectedParts {
		if !strings.Contains(resultStr, part) {
			t.Errorf("Expected response to contain %q, got: %s", part, resultStr)
		}
	}
}
