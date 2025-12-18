package influx

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"sort"
	"strings"
	"testing"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/log"
	"github.com/influxdata/influxdb/influxql"
)

func TestAppendTimeCondition(t *testing.T) {
	// Define test time condition
	testTimeCondition := "time > 0"
	testTimeExpr, err := influxql.ParseExpr(testTimeCondition)
	if err != nil {
		t.Fatalf("Failed to parse test time condition: %v", err)
	}

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "basic query without WHERE",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey"`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE ` + testTimeCondition,
		},
		{
			name:     "query without FROM clause",
			input:    `SHOW TAG VALUES WITH KEY = "tagkey"`,
			expected: `SHOW TAG VALUES WITH KEY = tagkey WHERE ` + testTimeCondition,
		},
		{
			name:     "query with tag name with where in it",
			input:    `SHOW TAG VALUES WITH KEY = "tag name with where in it"`,
			expected: `SHOW TAG VALUES WITH KEY = "tag name with where in it" WHERE ` + testTimeCondition,
		},
		{
			name:     "query with quoted table name and retention policy",
			input:    `SHOW TAG VALUES FROM "autogen"."machine_data" WITH KEY IN ("t1", "t2")`,
			expected: `SHOW TAG VALUES FROM autogen.machine_data WITH KEY IN (t1, t2) WHERE ` + testTimeCondition,
		},
		{
			name:     "query with trailing semicolon",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey";`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE ` + testTimeCondition,
		},
		{
			name:     "query with existing WHERE clause",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" WHERE ` + testTimeCondition,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE ` + testTimeCondition,
		},
		{
			name:     "query with existing WHERE clause (case insensitive)",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" where ` + testTimeCondition,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE ` + testTimeCondition,
		},
		{
			name:     "query with LIMIT clause",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" LIMIT 10`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE ` + testTimeCondition + ` LIMIT 10`,
		},
		{
			name:     "query with OFFSET clause",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" OFFSET 5`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE ` + testTimeCondition + ` OFFSET 5`,
		},
		{
			name:     "query with LIMIT and OFFSET",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" LIMIT 10 OFFSET 5`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE ` + testTimeCondition + ` LIMIT 10 OFFSET 5`,
		},
		{
			name:     "query with OFFSET and LIMIT (reverse order)",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" OFFSET 5 LIMIT 10`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE ` + testTimeCondition + ` OFFSET 5`,
		},
		{
			name:     "query with LIMIT and semicolon",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" LIMIT 10;`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE ` + testTimeCondition + ` LIMIT 10`,
		},
		{
			name:     "query with WHERE and LIMIT",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" WHERE ` + testTimeCondition + ` LIMIT 10`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE ` + testTimeCondition + ` LIMIT 10`,
		},
		{
			name:     "query with WHERE and semicolon",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" WHERE ` + testTimeCondition + `;`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE ` + testTimeCondition,
		},
		{
			name:     "query with existing WHERE clause but no time condition",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" WHERE "host" = 'server1'`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE host = 'server1' AND ` + testTimeCondition,
		},
		{
			name:     "query with complex WHERE clause containing time",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" WHERE time > now() - 1h AND "host" = 'server1'`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE time > now() - 1h AND host = 'server1'`,
		},
		{
			name:     "query with WHERE clause containing time in OR condition",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" WHERE "host" = 'server1' OR time > now() - 2h`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE host = 'server1' OR time > now() - 2h`,
		},
		{
			name:     "query with WHERE clause containing time in nested expression",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" WHERE ("host" = 'server1' AND time > now() - 1h)`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE (host = 'server1' AND time > now() - 1h)`,
		},
		{
			name:     "query with WHERE clause containing time function",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" WHERE time < now()`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE time < now()`,
		},
		{
			name:     "query with tag name containing spaces",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tag with spaces"`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = "tag with spaces" WHERE ` + testTimeCondition,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Parse the input string into a ShowTagValuesStatement
			showStmt, parseErr := parseShowTagValuesStatement(tt.input)

			if parseErr != nil {
				t.Errorf("parseShowTagValuesStatement(%q) unexpected error: %v", tt.input, parseErr)
				return
			}

			// Apply appendTimeCondition to the parsed statement
			appendTimeCondition(showStmt, testTimeExpr)

			// Convert back to string and compare
			result := showStmt.String()
			if result != tt.expected {
				t.Errorf("appendTimeCondition(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

func TestParseShowTagValuesStatement(t *testing.T) {
	tests := []struct {
		name          string
		input         string
		expectedError string
	}{
		{
			name:          "valid query with retention policy",
			input:         `SHOW TAG VALUES FROM "myrp"."mytable" WITH KEY IN ("tag1", "tag2", "tag3") WHERE time > now() - 24h`,
			expectedError: "",
		},
		{
			name:          "valid query without retention policy",
			input:         `SHOW TAG VALUES FROM "mytable" WITH KEY IN ("tag1", "tag2")`,
			expectedError: "",
		},
		{
			name:          "valid query with single tag",
			input:         `SHOW TAG VALUES FROM mytable WITH KEY = "tag1"`,
			expectedError: "",
		},
		{
			name:          "SHOW TAG VALUES without WITH",
			input:         `SHOW TAG VALUES`,
			expectedError: "parsing error: found EOF, expected WITH",
		},
		{
			name:          "query of other type",
			input:         `SELECT * FROM mytable`,
			expectedError: "not a SHOW TAG VALUES statement",
		},
		{
			name:          "empty string",
			input:         ``,
			expectedError: "parsing error: found EOF",
		},
		{
			name:          "malformed query",
			input:         `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey INVALID`,
			expectedError: "parsing error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, parseErr := parseShowTagValuesStatement(tt.input)

			if tt.expectedError != "" {
				if parseErr == nil {
					t.Errorf("parseShowTagValuesStatement(%q) expected error containing %q but got none", tt.input, tt.expectedError)
					return
				}
				if !strings.Contains(parseErr.Error(), tt.expectedError) {
					t.Errorf("parseShowTagValuesStatement(%q) expected error containing %q but got %v", tt.input, tt.expectedError, parseErr)
				}
				return
			}

			if parseErr != nil {
				t.Errorf("parseShowTagValuesStatement(%q) unexpected error: %v", tt.input, parseErr)
				return
			}
		})
	}
}

func TestExtractTablesAndTags(t *testing.T) {
	tests := []struct {
		name           string
		input          string
		expectedTables []string
		expectedTags   []string
	}{
		{
			name:           "full query with retention policy",
			input:          `SHOW TAG VALUES FROM "myrp"."mytable" WITH KEY IN ("tag1", "tag2", "tag3") WHERE time > now() - 24h`,
			expectedTables: []string{"mytable"},
			expectedTags:   []string{"tag1", "tag2", "tag3"},
		},
		{
			name:           "table only without retention policy",
			input:          `SHOW TAG VALUES FROM "mytable" WITH KEY IN ("tag1", "tag2")`,
			expectedTables: []string{"mytable"},
			expectedTags:   []string{"tag1", "tag2"},
		},
		{
			name:           "table without quotes",
			input:          `SHOW TAG VALUES FROM mytable WITH KEY IN ("tag1", "tag2")`,
			expectedTables: []string{"mytable"},
			expectedTags:   []string{"tag1", "tag2"},
		},
		{
			name:           "single tag with KEY equals",
			input:          `SHOW TAG VALUES FROM mytable WITH KEY = "tag1"`,
			expectedTables: []string{"mytable"},
			expectedTags:   []string{"tag1"},
		},
		{
			name:           "without WHERE clause",
			input:          `SHOW TAG VALUES FROM mytable WITH KEY IN ("tag1", "tag2", "tag3")`,
			expectedTables: []string{"mytable"},
			expectedTags:   []string{"tag1", "tag2", "tag3"},
		},
		{
			name:           "with LIMIT clause",
			input:          `SHOW TAG VALUES FROM mytable WITH KEY = "tag1" LIMIT 10`,
			expectedTables: []string{"mytable"},
			expectedTags:   []string{"tag1"},
		},
		{
			name:           "with OFFSET clause",
			input:          `SHOW TAG VALUES FROM mytable WITH KEY = "tag1" OFFSET 5`,
			expectedTables: []string{"mytable"},
			expectedTags:   []string{"tag1"},
		},
		{
			name:           "complex WHERE clause",
			input:          `SHOW TAG VALUES FROM mytable WITH KEY = "tag1" WHERE "tag2" = 'value'`,
			expectedTables: []string{"mytable"},
			expectedTags:   []string{"tag1"},
		},
		{
			name:           "multiple measurements",
			input:          `SHOW TAG VALUES FROM table1, table2 WITH KEY = "tag1"`,
			expectedTables: []string{"table1", "table2"},
			expectedTags:   []string{"tag1"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Parse the input string into a ShowTagValuesStatement
			showStmt, parseErr := parseShowTagValuesStatement(tt.input)

			if parseErr != nil {
				t.Errorf("parseShowTagValuesStatement(%q) unexpected error: %v", tt.input, parseErr)
				return
			}

			// Extract tables and tags from the parsed statement
			tables, tags := extractTablesAndTags(showStmt)

			if len(tables) != len(tt.expectedTables) {
				t.Errorf("extractTablesAndTags(%q) tables length = %d, want %d", tt.input, len(tables), len(tt.expectedTables))
				return
			}

			for i, table := range tables {
				if table != tt.expectedTables[i] {
					t.Errorf("extractTablesAndTags(%q) tables[%d] = %q, want %q", tt.input, i, table, tt.expectedTables[i])
				}
			}

			if len(tags) != len(tt.expectedTags) {
				t.Errorf("extractTablesAndTags(%q) tags length = %d, want %d", tt.input, len(tags), len(tt.expectedTags))
				return
			}

			for i, tag := range tags {
				if tag != tt.expectedTags[i] {
					t.Errorf("extractTablesAndTags(%q) tags[%d] = %q, want %q", tt.input, i, tag, tt.expectedTags[i])
				}
			}
		})
	}
}

func TestParseShowTagKeysAndExtractTables(t *testing.T) {
	tests := []struct {
		name           string
		input          string
		expectedTables []string
		expectsError   bool
	}{
		{
			name:           "full query with retention policy",
			input:          `SHOW TAG KEYS FROM "myrp"."mytable"`,
			expectedTables: []string{"mytable"},
		},
		{
			name:           "table only without retention policy",
			input:          `SHOW TAG KEYS FROM "mytable"`,
			expectedTables: []string{"mytable"},
		},
		{
			name:           "table without quotes",
			input:          `SHOW TAG KEYS FROM mytable`,
			expectedTables: []string{"mytable"},
		},
		{
			name:           "single tag with KEY equals",
			input:          `SHOW TAG KEYS FROM mytable`,
			expectedTables: []string{"mytable"},
		},
		{
			name:           "without WHERE clause",
			input:          `SHOW TAG KEYS FROM mytable`,
			expectedTables: []string{"mytable"},
		},
		{
			name:           "with LIMIT clause",
			input:          `SHOW TAG KEYS FROM mytable WITH KEY = "tag1" LIMIT 10`,
			expectedTables: []string{"mytable"},
		},
		{
			name:           "with OFFSET clause",
			input:          `SHOW TAG KEYS FROM mytable WITH KEY = "tag1" OFFSET 5`,
			expectedTables: []string{"mytable"},
		},
		{
			name:           "multiple measurements",
			input:          `SHOW TAG KEYS FROM table1, table2`,
			expectedTables: []string{"table1", "table2"},
		},
		{
			name:           "no tables specified",
			input:          `SHOW TAG KEYS`,
			expectedTables: nil,
		},
		{
			name:         "Error in statement",
			input:        `SHOW TAG KEY FROM table1`,
			expectsError: true,
		},
		{
			name:         "Diferent statement type",
			input:        `SELECT * FROM mytable`,
			expectsError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			showStmt, parseErr := parseShowTagKeysStatement(tt.input)

			if !tt.expectsError && parseErr != nil {
				t.Errorf("parseShowTagKeysStatement(%q) unexpected error: %v", tt.input, parseErr)
				return
			}
			if tt.expectsError {
				if parseErr == nil {
					t.Errorf("parseShowTagKeysStatement(%q) expected error but got none", tt.input)
				}
				return
			}

			// Extract tables and tags from the parsed statement
			tables := extractTables(showStmt)

			if len(tables) != len(tt.expectedTables) {
				t.Errorf("extractTablesAndTags(%q) tables length = %d, want %d", tt.input, len(tables), len(tt.expectedTables))
				return
			}

			for i, table := range tables {
				if table != tt.expectedTables[i] {
					t.Errorf("extractTablesAndTags(%q) tables[%d] = %q, want %q", tt.input, i, table, tt.expectedTables[i])
				}
			}
		})
	}
}

func TestCreateShowMeasurementsResponse(t *testing.T) {
	tests := []struct {
		name         string
		csvContent   string
		wantNil      bool
		wantContains []string
	}{
		{
			name: "valid db with two measurements",
			csvContent: `meas1;tag1;val1
meas2;tag2;val2
`,
			wantNil:      false,
			wantContains: []string{"meas1", "meas2"},
		},
		{
			name:       "empty csv file",
			csvContent: "",
			wantNil:    true,
		},
	}

	const testDB = "testdb"

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tmpDir, err := setupCSVTestDirWithContent(testDB, tt.csvContent)
			if err != nil {
				t.Fatalf("could not setup CSV test dir: %v", err)
			}
			defer os.RemoveAll(tmpDir)

			csvStore, err := NewCSVTagsStore(tmpDir, log.New(log.DebugLevel))
			if err != nil {
				t.Fatalf("could not create CSV tags store: %v", err)
			}

			resp := createShowMeasurementsResponseFromCSV(csvStore, testDB)

			if tt.wantNil {
				if resp != nil {
					t.Errorf("Expected nil response, got: %#v", resp)
				}
				return
			}

			if resp == nil {
				t.Fatal("Expected non-nil response")
			}

			// Decode JSON result
			var decoded []struct {
				StatementID int `json:"statement_id"`
				Series      []struct {
					Name    string          `json:"name"`
					Columns []string        `json:"columns"`
					Values  [][]interface{} `json:"values"`
				} `json:"series"`
			}
			rt := resp.(*responseType) // type assertion
			if err := json.Unmarshal(rt.Results, &decoded); err != nil {
				t.Fatalf("Failed to unmarshal response: %v", err)
			}

			var gotMeasurements []string
			for _, row := range decoded[0].Series[0].Values {
				if len(row) > 0 {
					if name, ok := row[0].(string); ok {
						gotMeasurements = append(gotMeasurements, name)
					}
				}
			}

			if len(gotMeasurements) != len(tt.wantContains) {
				t.Errorf("Expected %d measurements, got %d", len(tt.wantContains), len(gotMeasurements))
			}

			// Check each expected measurement is present
			for _, want := range tt.wantContains {
				found := false
				for _, got := range gotMeasurements {
					if got == want {
						found = true
						break
					}
				}
				if !found {
					t.Errorf("Missing expected measurement: %s", want)
				}
			}
		})
	}
}

func TestCreateShowTagKeysResponse(t *testing.T) {
	const testDB = "testdb"

	tests := []struct {
		name         string
		csvContent   string
		db           string
		tables       []string
		wantNil      bool
		wantResponse map[string][]string // table -> tag keys
	}{
		{
			name: "single table with two tags",
			csvContent: `meas1;tagA;val1
meas1;tagB;val2
`,
			db:      testDB,
			tables:  []string{"meas1"},
			wantNil: false,
			wantResponse: map[string][]string{
				"meas1": {"tagA", "tagB"},
			},
		},
		{
			name: "all tables auto-filled",
			csvContent: `meas1;t1;v1
meas2;t2;v2
`,
			db:      testDB,
			tables:  nil, // will trigger table listing
			wantNil: false,
			wantResponse: map[string][]string{
				"meas1": {"t1"},
				"meas2": {"t2"},
			},
		},
		{
			name: "nonexistent table returns nil",
			csvContent: `meas1;t1;v1
meas1;t1;v2
meas1;t2;v3
meas2;t3;v4
`,
			db:      testDB,
			tables:  []string{"missing-meas"},
			wantNil: true,
		},
		{
			name:       "nonexistent db returns nil",
			csvContent: "",
			db:         "missing-db",
			tables:     []string{"meas1"},
			wantNil:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tmpDir, err := setupCSVTestDirWithContent(testDB, tt.csvContent)
			if err != nil {
				t.Fatalf("could not setup CSV test dir: %v", err)
			}
			defer os.RemoveAll(tmpDir)

			csvStore, err := NewCSVTagsStore(tmpDir, log.New(log.DebugLevel))
			if err != nil {
				t.Fatalf("could not create CSV tags store: %v", err)
			}

			resp := createShowTagKeysResponseFromCSV(csvStore, tt.db, tt.tables)

			if tt.wantNil {
				if resp != nil {
					t.Errorf("Expected nil response, got: %#v", resp)
				}
				return
			}

			if resp == nil {
				t.Fatal("Expected non-nil response")
			}

			rt := resp.(*responseType)

			var decoded []struct {
				StatementID int `json:"statement_id"`
				Series      []struct {
					Name    string          `json:"name"`
					Columns []string        `json:"columns"`
					Values  [][]interface{} `json:"values"`
				} `json:"series"`
			}
			if err := json.Unmarshal(rt.Results, &decoded); err != nil {
				t.Fatalf("Failed to unmarshal response: %v", err)
			}

			got := map[string][]string{}
			for _, result := range decoded {
				for _, s := range result.Series {
					var keys []string
					for _, val := range s.Values {
						if len(val) > 0 {
							if key, ok := val[0].(string); ok {
								keys = append(keys, key)
							}
						}
					}
					got[s.Name] = keys
				}
			}

			if len(got) != len(tt.wantResponse) {
				t.Errorf("Expected %d tables, got %d", len(tt.wantResponse), len(got))
			}

			for table, expectedTags := range tt.wantResponse {
				gotTags, ok := got[table]
				if !ok {
					t.Errorf("Missing table %s in response", table)
					continue
				}
				if len(gotTags) != len(expectedTags) {
					t.Errorf("For table %s: expected %v, got %v", table, expectedTags, gotTags)
				}
				tagSet := map[string]struct{}{}
				for _, tag := range gotTags {
					tagSet[tag] = struct{}{}
				}
				for _, tag := range expectedTags {
					if _, ok := tagSet[tag]; !ok {
						t.Errorf("Missing tag %q in table %s", tag, table)
					}
				}
			}
		})
	}
}

func TestCreateShowTagValuesResponse(t *testing.T) {
	const testDB = "testdb"

	tests := []struct {
		name         string
		csvContent   string
		db           string
		tables       []string
		tags         []string
		wantNil      bool
		wantResponse map[string]map[string][]string // table -> tag -> []values
	}{
		{
			name: "all tables and all tags",
			csvContent: `meas1;tag1;a
meas1;tag1;b
meas1;tag2;x
meas2;tag1;y
`,
			db: testDB,
			wantResponse: map[string]map[string][]string{
				"meas1": {
					"tag1": {"a", "b"},
					"tag2": {"x"},
				},
				"meas2": {
					"tag1": {"y"},
				},
			},
		},
		{
			name: "filter table and tags",
			csvContent: `meas1;t1;v1
meas1;t1;v2
meas1;t2;v3
meas2;t3;v4
`,
			db:     testDB,
			tables: []string{"meas1"},
			tags:   []string{"t1"},
			wantResponse: map[string]map[string][]string{
				"meas1": {
					"t1": {"v1", "v2"},
				},
			},
		},
		{
			name: "nonexistent table returns nil",
			csvContent: `meas1;t1;v1
meas1;t1;v2
meas1;t2;v3
meas2;t3;v4
`,
			db:      testDB,
			tables:  []string{"missing-meas"},
			tags:    []string{"t1"},
			wantNil: true,
		},
		{
			name:       "nonexistent db returns nil",
			csvContent: "",
			db:         "missing-db",
			wantNil:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tmpDir, err := setupCSVTestDirWithContent(tt.db, tt.csvContent)
			if err != nil {
				t.Fatalf("could not setup CSV test dir: %v", err)
			}
			defer os.RemoveAll(tmpDir)

			csvStore, err := NewCSVTagsStore(tmpDir, log.New(log.DebugLevel))
			if err != nil {
				t.Fatalf("could not create CSV tags store: %v", err)
			}

			resp := createShowTagValuesResponseFromCSV(csvStore, tt.db, tt.tables, tt.tags)

			if tt.wantNil {
				if resp != nil {
					t.Errorf("Expected nil response, got: %#v", resp)
				}
				return
			}
			if resp == nil {
				t.Fatal("Expected non-nil response")
			}

			rt := resp.(*responseType)

			var decoded []struct {
				StatementID int `json:"statement_id"`
				Series      []struct {
					Name    string          `json:"name"`
					Columns []string        `json:"columns"`
					Values  [][]interface{} `json:"values"`
				} `json:"series"`
			}
			if err := json.Unmarshal(rt.Results, &decoded); err != nil {
				t.Fatalf("Failed to unmarshal response: %v", err)
			}

			got := map[string]map[string][]string{}
			for _, result := range decoded {
				for _, s := range result.Series {
					if got[s.Name] == nil {
						got[s.Name] = map[string][]string{}
					}
					for _, row := range s.Values {
						if len(row) == 2 {
							key, _ := row[0].(string)
							val, _ := row[1].(string)
							got[s.Name][key] = append(got[s.Name][key], val)
						}
					}
				}
			}

			if len(got) != len(tt.wantResponse) {
				t.Errorf("Expected %d tables, got %d", len(tt.wantResponse), len(got))
			}
			for table, expectedTags := range tt.wantResponse {
				gotTags, ok := got[table]
				if !ok {
					t.Errorf("Missing table %s", table)
					continue
				}
				for tag, wantVals := range expectedTags {
					gotVals, ok := gotTags[tag]
					if !ok {
						t.Errorf("Missing tag %q in table %q", tag, table)
						continue
					}
					sort.Strings(wantVals)
					sort.Strings(gotVals)
					if len(gotVals) != len(wantVals) {
						t.Errorf("Mismatch value count for %s/%s: got %v, want %v", table, tag, gotVals, wantVals)
						continue
					}
					for i := range gotVals {
						if gotVals[i] != wantVals[i] {
							t.Errorf("Mismatch values for %s/%s: got %v, want %v", table, tag, gotVals, wantVals)
							break
						}
					}
				}
			}
		})
	}
}

func TestClient_Query(t *testing.T) {
	type testCase struct {
		name          string
		query         chronograf.Query
		expectedBody  [][]interface{}
		csvContent    string
		mockMgmtReply []cdDatabase
		expectBackend bool
	}

	cases := []testCase{
		{
			name:          "SHOW DATABASES from MgmtURL",
			query:         chronograf.Query{Command: "SHOW DATABASES"},
			mockMgmtReply: []cdDatabase{{"db1"}, {"db2"}},
			expectedBody: [][]interface{}{
				{"db1"}, {"db2"},
			},
		},
		{
			name:  "SHOW MEASUREMENTS from tagValues",
			query: chronograf.Query{Command: "SHOW MEASUREMENTS", DB: "db1"},
			csvContent: `meas1;tag1;v1
meas2;tag2;v2
`,
			expectedBody: [][]interface{}{
				{"meas1"}, {"meas2"},
			},
		},
		{
			name:  "SHOW TAG KEYS FROM meas1",
			query: chronograf.Query{Command: "SHOW TAG KEYS FROM meas1", DB: "db1"},
			csvContent: `meas1;tag1;v1
meas1;tag2;v2
`,
			expectedBody: [][]interface{}{
				{"tag1"}, {"tag2"},
			},
		},
		{
			name:  "SHOW TAG VALUES FROM meas1 WITH KEY = tag1",
			query: chronograf.Query{Command: "SHOW TAG VALUES FROM meas1 WITH KEY = tag1", DB: "db1"},
			csvContent: `meas1;tag1;v1
meas1;tag1;v2
`,
			expectedBody: [][]interface{}{
				{"tag1", "v1"},
				{"tag1", "v2"},
			},
		},
		{
			name:  "SHOW TAG VALUES fallback to backend",
			query: chronograf.Query{Command: "SHOW TAG VALUES FROM unknown WITH KEY in (tag1)", DB: "db1"},
			csvContent: `meas1;tag1;v1
`,
			expectBackend: true,
			expectedBody: [][]interface{}{
				{"backend", "ok"},
			},
		},
		{
			name:          "SELECT query fallback",
			query:         chronograf.Query{Command: "SELECT * FROM x", DB: "db1"},
			expectBackend: true,
			expectedBody: [][]interface{}{
				{"backend", "ok"},
			},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			backendCalled := false

			backendSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if strings.HasPrefix(r.URL.Path, "/query") {
					backendCalled = true
					writeFakeInflux(w, [][]interface{}{{"backend", "ok"}})
				} else if strings.HasSuffix(r.URL.Path, "/databases") {
					writeFakeDatabases(w, tc.mockMgmtReply)
				}
			}))
			defer backendSrv.Close()

			client := &Client{
				Logger:  log.New(log.DebugLevel),
				SrcType: chronograf.InfluxDBv3CloudDedicated,
			}
			if tc.csvContent != "" {
				tmpDir, err := setupCSVTestDirWithContent("db1", tc.csvContent)
				if err != nil {
					t.Fatalf("could not setup CSV test dir: %v", err)
				}
				defer os.RemoveAll(tmpDir)
				csvStore, err := NewCSVTagsStore(tmpDir, log.New(log.DebugLevel))
				if err != nil {
					t.Fatalf("could not create CSV tags store: %v", err)
				}
				client.csvTagsStore = csvStore
			}

			client.URL, _ = url.Parse(backendSrv.URL)
			// Manually override MgmtURL for testing
			client.MgmtURL = client.URL

			resp, err := client.Query(context.Background(), tc.query)
			if err != nil {
				t.Fatal("Query failed: ", err)
			}

			if tc.expectBackend && !backendCalled {
				t.Errorf("Expected fallback to backend, but backend wasn't called")
			}
			if !tc.expectBackend && backendCalled {
				t.Errorf("Unexpected backend call")
			}

			values, err := decodeResponseJSON(resp)
			if err != nil {
				t.Fatalf("Failed to decode response: %v", err)
			}
			if !equalMatrix(values, tc.expectedBody) {
				t.Errorf("Unexpected result\nGot:  %#v\nWant: %#v", values, tc.expectedBody)
			}
		})
	}
}

func writeFakeInflux(w http.ResponseWriter, rows [][]interface{}) {
	res := []influxResult{{
		StatementID: 0,
		Series: []series{{
			Name:    "mock",
			Columns: make([]string, len(rows[0])),
			Values:  rows,
		}},
	}}
	raw, _ := json.Marshal(res)
	resp := &struct {
		Results json.RawMessage
		Err     string `json:"error,omitempty"`
	}{
		Results: raw,
		Err:     "",
	}
	bytes, _ := json.Marshal(resp)
	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write(bytes)
}

func writeFakeDatabases(w http.ResponseWriter, rows []cdDatabase) {
	bytes, _ := json.Marshal(rows)
	w.Header().Set("Content-Type", "application/json")
	w.Write(bytes)
}

func decodeResponseJSON(resp chronograf.Response) ([][]interface{}, error) {
	rt := resp.(*responseType)
	var decoded []influxResult
	if err := json.Unmarshal(rt.Results, &decoded); err != nil {
		return nil, err
	}
	if len(decoded) == 0 || len(decoded[0].Series) == 0 {
		return nil, nil
	}
	return decoded[0].Series[0].Values, nil
}

func equalMatrix(a, b [][]interface{}) bool {
	if len(a) != len(b) {
		return false
	}

	// Convert to string tuples for consistent sorting and comparison
	toStrings := func(m [][]interface{}) []string {
		s := make([]string, len(m))
		for i, row := range m {
			strRow := make([]string, len(row))
			for j, col := range row {
				strRow[j] = fmt.Sprintf("%v", col)
			}
			s[i] = strings.Join(strRow, "|")
		}
		sort.Strings(s)
		return s
	}

	as := toStrings(a)
	bs := toStrings(b)

	for i := range as {
		if as[i] != bs[i] {
			return false
		}
	}
	return true
}
