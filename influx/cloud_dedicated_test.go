package influx

import "testing"

func TestAppendTimeCondition(t *testing.T) {
	const timeCondition = `time > now() - 24h`

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "basic query without WHERE",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey"`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" WHERE ` + timeCondition,
		},
		{
			name:     "query without FROM clause",
			input:    `SHOW TAG VALUES WITH KEY = "tagkey"`,
			expected: `SHOW TAG VALUES WITH KEY = "tagkey" WHERE ` + timeCondition,
		},
		{
			name:     "query with tag name with where in it",
			input:    `SHOW TAG VALUES WITH KEY = "tag name with where in it"`,
			expected: `SHOW TAG VALUES WITH KEY = "tag name with where in it" WHERE ` + timeCondition,
		},
		{
			name:     "query with quoted table name",
			input:    `SHOW TAG VALUES FROM "autogen"."machine_data" WITH KEY IN ("t1", "t2")`,
			expected: `SHOW TAG VALUES FROM "autogen"."machine_data" WITH KEY IN ("t1", "t2") WHERE ` + timeCondition,
		},
		{
			name:     "query with trailing semicolon",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey";`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" WHERE ` + timeCondition,
		},
		{
			name:     "query with existing WHERE clause",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" WHERE ` + timeCondition,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" WHERE ` + timeCondition,
		},
		{
			name:     "query with existing WHERE clause (case insensitive)",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" where ` + timeCondition,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" where ` + timeCondition,
		},
		{
			name:     "query with LIMIT clause",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" LIMIT 10`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" WHERE ` + timeCondition + ` LIMIT 10`,
		},
		{
			name:     "query with OFFSET clause",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" OFFSET 5`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" WHERE ` + timeCondition + ` OFFSET 5`,
		},
		{
			name:     "query with LIMIT and OFFSET",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" LIMIT 10 OFFSET 5`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" WHERE ` + timeCondition + ` LIMIT 10 OFFSET 5`,
		},
		{
			name:     "query with OFFSET and LIMIT (reverse order)",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" OFFSET 5 LIMIT 10`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" WHERE ` + timeCondition + ` OFFSET 5 LIMIT 10`,
		},
		{
			name:     "query with LIMIT and semicolon",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" LIMIT 10;`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" WHERE ` + timeCondition + ` LIMIT 10`,
		},
		{
			name:     "query with WHERE and LIMIT",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" WHERE ` + timeCondition + ` LIMIT 10`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" WHERE ` + timeCondition + ` LIMIT 10`,
		},
		{
			name:     "query with WHERE and semicolon",
			input:    `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" WHERE ` + timeCondition + `;`,
			expected: `SHOW TAG VALUES FROM machine_data WITH KEY = "tagkey" WHERE ` + timeCondition,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := appendTimeCondition(tt.input)
			if result != tt.expected {
				t.Errorf("appendTimeCondition(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}
