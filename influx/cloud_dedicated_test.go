package influx

import (
	"strings"
	"testing"
)

func TestAppendTimeCondition(t *testing.T) {
	const timeCondition = `time > now() - 1d`

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "basic query without WHERE",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey"`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE ` + timeCondition,
		},
		{
			name:     "query without FROM clause",
			input:    `SHOW TAG VALUES WITH KEY = "tagkey"`,
			expected: `SHOW TAG VALUES WITH KEY = tagkey WHERE ` + timeCondition,
		},
		{
			name:     "query with tag name with where in it",
			input:    `SHOW TAG VALUES WITH KEY = "tag name with where in it"`,
			expected: `SHOW TAG VALUES WITH KEY = "tag name with where in it" WHERE ` + timeCondition,
		},
		{
			name:     "query with quoted table name and retention policy",
			input:    `SHOW TAG VALUES FROM "autogen"."machine_data" WITH KEY IN ("t1", "t2")`,
			expected: `SHOW TAG VALUES FROM autogen.machine_data WITH KEY IN (t1, t2) WHERE ` + timeCondition,
		},
		{
			name:     "query with trailing semicolon",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey";`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE ` + timeCondition,
		},
		{
			name:     "query with existing WHERE clause",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" WHERE ` + timeCondition,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE ` + timeCondition,
		},
		{
			name:     "query with existing WHERE clause (case insensitive)",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" where ` + timeCondition,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE ` + timeCondition,
		},
		{
			name:     "query with LIMIT clause",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" LIMIT 10`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE ` + timeCondition + ` LIMIT 10`,
		},
		{
			name:     "query with OFFSET clause",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" OFFSET 5`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE ` + timeCondition + ` OFFSET 5`,
		},
		{
			name:     "query with LIMIT and OFFSET",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" LIMIT 10 OFFSET 5`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE ` + timeCondition + ` LIMIT 10 OFFSET 5`,
		},
		{
			name:     "query with OFFSET and LIMIT (reverse order)",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" OFFSET 5 LIMIT 10`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE ` + timeCondition + ` OFFSET 5`,
		},
		{
			name:     "query with LIMIT and semicolon",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" LIMIT 10;`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE ` + timeCondition + ` LIMIT 10`,
		},
		{
			name:     "query with WHERE and LIMIT",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" WHERE ` + timeCondition + ` LIMIT 10`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE ` + timeCondition + ` LIMIT 10`,
		},
		{
			name:     "query with WHERE and semicolon",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" WHERE ` + timeCondition + `;`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE ` + timeCondition,
		},
		{
			name:     "query with existing WHERE clause but no time condition",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" WHERE "host" = 'server1'`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = tagkey WHERE host = 'server1' AND ` + timeCondition,
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
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = "tag with spaces" WHERE ` + timeCondition,
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
			err := appendTimeCondition(showStmt)
			if err != nil {
				t.Errorf("appendTimeCondition(%q) unexpected error: %v", tt.input, err)
				return
			}

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
			expectedError: "failed to parse statement: found EOF, expected WITH",
		},
		{
			name:          "query of other type",
			input:         `SELECT * FROM mytable`,
			expectedError: "not a SHOW TAG VALUES statement",
		},
		{
			name:          "empty string",
			input:         ``,
			expectedError: "failed to parse statement: found EOF",
		},
		{
			name:          "malformed query",
			input:         `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey INVALID`,
			expectedError: "failed to parse statement",
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
