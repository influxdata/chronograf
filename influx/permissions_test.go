package influx

import (
	"encoding/json"
	"fmt"
	"io"
	"reflect"
	"testing"

	"github.com/influxdata/chronograf"
)

func TestDifference(t *testing.T) {
	t.Parallel()
	type args struct {
		wants chronograf.Permissions
		haves chronograf.Permissions
	}
	tests := []struct {
		name       string
		args       args
		wantRevoke chronograf.Permissions
		wantAdd    chronograf.Permissions
	}{
		{
			name: "add write to permissions",
			args: args{
				wants: chronograf.Permissions{
					chronograf.Permission{
						Scope:   "database",
						Name:    "tensorflowdb",
						Allowed: []string{"READ", "WRITE"},
					},
				},
				haves: chronograf.Permissions{
					chronograf.Permission{
						Scope:   "database",
						Name:    "tensorflowdb",
						Allowed: []string{"READ"},
					},
				},
			},
			wantRevoke: nil,
			wantAdd: chronograf.Permissions{
				chronograf.Permission{
					Scope:   "database",
					Name:    "tensorflowdb",
					Allowed: []string{"READ", "WRITE"},
				},
			},
		},
		{
			name: "revoke write to permissions",
			args: args{
				wants: chronograf.Permissions{
					chronograf.Permission{
						Scope:   "database",
						Name:    "tensorflowdb",
						Allowed: []string{"READ"},
					},
				},
				haves: chronograf.Permissions{
					chronograf.Permission{
						Scope:   "database",
						Name:    "tensorflowdb",
						Allowed: []string{"READ", "WRITE"},
					},
				},
			},
			wantRevoke: nil,
			wantAdd: chronograf.Permissions{
				chronograf.Permission{
					Scope:   "database",
					Name:    "tensorflowdb",
					Allowed: []string{"READ"},
				},
			},
		},
		{
			name: "revoke all permissions",
			args: args{
				wants: chronograf.Permissions{
					chronograf.Permission{
						Scope:   "database",
						Name:    "tensorflowdb",
						Allowed: []string{},
					},
				},
				haves: chronograf.Permissions{
					chronograf.Permission{
						Scope:   "database",
						Name:    "tensorflowdb",
						Allowed: []string{"READ", "WRITE"},
					},
				},
			},
			wantRevoke: chronograf.Permissions{
				chronograf.Permission{
					Scope:   "database",
					Name:    "tensorflowdb",
					Allowed: []string{},
				},
			},
			wantAdd: nil,
		},
		{
			name: "add permissions different db",
			args: args{
				wants: chronograf.Permissions{
					chronograf.Permission{
						Scope:   "database",
						Name:    "new",
						Allowed: []string{"READ"},
					},
				},
				haves: chronograf.Permissions{
					chronograf.Permission{
						Scope:   "database",
						Name:    "old",
						Allowed: []string{"READ", "WRITE"},
					},
				},
			},
			wantRevoke: chronograf.Permissions{
				chronograf.Permission{
					Scope:   "database",
					Name:    "old",
					Allowed: []string{"READ", "WRITE"},
				},
			},
			wantAdd: chronograf.Permissions{
				chronograf.Permission{
					Scope:   "database",
					Name:    "new",
					Allowed: []string{"READ"},
				},
			},
		},
	}
	for _, tt := range tests {
		gotRevoke, gotAdd := Difference(tt.args.wants, tt.args.haves)
		if !reflect.DeepEqual(gotRevoke, tt.wantRevoke) {
			t.Errorf("%q. Difference() gotRevoke = %v, want %v", tt.name, gotRevoke, tt.wantRevoke)
		}
		if !reflect.DeepEqual(gotAdd, tt.wantAdd) {
			t.Errorf("%q. Difference() gotAdd = %v, want %v", tt.name, gotAdd, tt.wantAdd)
		}
	}
}

func TestToPriv(t *testing.T) {
	t.Parallel()
	type args struct {
		a chronograf.Allowances
	}
	tests := []struct {
		name string
		args args
		want string
	}{
		{
			name: "no privs",
			args: args{
				a: chronograf.Allowances{},
			},
			want: NoPrivileges,
		},
		{
			name: "read and write privs",
			args: args{
				a: chronograf.Allowances{"READ", "WRITE"},
			},
			want: All,
		},
		{
			name: "write privs",
			args: args{
				a: chronograf.Allowances{"WRITE"},
			},
			want: Write,
		},
		{
			name: "read privs",
			args: args{
				a: chronograf.Allowances{"READ"},
			},
			want: Read,
		},
		{
			name: "all privs",
			args: args{
				a: chronograf.Allowances{"ALL"},
			},
			want: All,
		},
		{
			name: "bad privs",
			args: args{
				a: chronograf.Allowances{"BAD"},
			},
			want: NoPrivileges,
		},
	}
	for _, tt := range tests {
		if got := ToPriv(tt.args.a); got != tt.want {
			t.Errorf("%q. ToPriv() = %v, want %v", tt.name, got, tt.want)
		}
	}
}

func TestToGrant(t *testing.T) {
	t.Parallel()
	type args struct {
		username string
		perm     chronograf.Permission
	}
	tests := []struct {
		name string
		args args
		want string
	}{
		{
			name: "grant all for all dbs",
			args: args{
				username: "biff",
				perm: chronograf.Permission{
					Scope:   chronograf.AllScope,
					Allowed: chronograf.Allowances{"ALL"},
				},
			},
			want: `GRANT ALL PRIVILEGES TO "biff"`,
		},
		{
			name: "grant all for one db",
			args: args{
				username: "biff",
				perm: chronograf.Permission{
					Scope:   chronograf.DBScope,
					Name:    "gray_sports_almanac",
					Allowed: chronograf.Allowances{"ALL"},
				},
			},
			want: `GRANT ALL ON "gray_sports_almanac" TO "biff"`,
		},
		{
			name: "bad allowance",
			args: args{
				username: "biff",
				perm: chronograf.Permission{
					Scope:   chronograf.DBScope,
					Name:    "gray_sports_almanac",
					Allowed: chronograf.Allowances{"bad"},
				},
			},
			want: "",
		},
	}
	for _, tt := range tests {
		if got := ToGrant(tt.args.username, tt.args.perm); got != tt.want {
			t.Errorf("%q. ToGrant() = %v, want %v", tt.name, got, tt.want)
		}
	}
}

func TestToRevoke(t *testing.T) {
	t.Parallel()
	type args struct {
		username string
		perm     chronograf.Permission
	}
	tests := []struct {
		name string
		args args
		want string
	}{
		{
			name: "revoke all for all dbs",
			args: args{
				username: "biff",
				perm: chronograf.Permission{
					Scope:   chronograf.AllScope,
					Allowed: chronograf.Allowances{"ALL"},
				},
			},
			want: `REVOKE ALL PRIVILEGES FROM "biff"`,
		},
		{
			name: "revoke all for one db",
			args: args{
				username: "biff",
				perm: chronograf.Permission{
					Scope:   chronograf.DBScope,
					Name:    "pleasure_paradice",
					Allowed: chronograf.Allowances{},
				},
			},
			want: `REVOKE ALL PRIVILEGES ON "pleasure_paradice" FROM "biff"`,
		},
	}
	for _, tt := range tests {
		if got := ToRevoke(tt.args.username, tt.args.perm); got != tt.want {
			t.Errorf("%q. ToRevoke() = %v, want %v", tt.name, got, tt.want)
		}
	}
}

// mockLoggerWithError is a simple logger that captures error messages passed via WithField
type mockLoggerWithError struct {
	errorMsg string
	fields   map[string]interface{}
}

func (m *mockLoggerWithError) Debug(...interface{})   {}
func (m *mockLoggerWithError) Info(...interface{})    {}
func (m *mockLoggerWithError) Error(_ ...interface{}) {}
func (m *mockLoggerWithError) WithField(key string, value interface{}) chronograf.Logger {
	if m.fields == nil {
		m.fields = make(map[string]interface{})
	}
	m.fields[key] = value
	if key == "error" {
		m.errorMsg = fmt.Sprintf("%v", value)
	}
	return m
}
func (m *mockLoggerWithError) Writer() *io.PipeWriter {
	_, w := io.Pipe()
	return w
}

func TestRetentionPolicies(t *testing.T) {
	tests := []struct {
		name        string
		input       showResults
		expected    []chronograf.RetentionPolicy
		expectedErr string
	}{
		{
			name: "5-column format with two retention policies",
			input: showResults{
				{
					Series: []struct {
						Values []value `json:"values"`
					}{
						{
							Values: []value{
								{
									"autogen",   // name
									"2160h0m0s", // duration
									"168h0m0s",  // shardGroupDuration
									float64(3),  // replicaN
									true,        // default
								},
								{
									"quarterly", // name
									"1560h0m0s", // duration
									"24h0m0s",   // shardGroupDuration
									float64(1),  // replicaN
									false,       // default
								},
							},
						},
					},
				},
			},
			expected: []chronograf.RetentionPolicy{
				{
					Name:          "autogen",
					Duration:      "2160h0m0s",
					ShardDuration: "168h0m0s",
					Replication:   3,
					Default:       true,
				},
				{
					Name:          "quarterly",
					Duration:      "1560h0m0s",
					ShardDuration: "24h0m0s",
					Replication:   1,
					Default:       false,
				},
			},
		},
		{
			name: "7-column format with two retention policies",
			input: showResults{
				{
					Series: []struct {
						Values []value `json:"values"`
					}{
						{
							Values: []value{
								{
									"autogen",   // name
									"2160h0m0s", // duration
									"168h0m0s",  // shardGroupDuration
									float64(3),  // replicaN
									"0s",        // futureWriteLimit
									"0s",        // pastWriteLimit
									true,        // default
								},
								{
									"quarterly", // name
									"1560h0m0s", // duration
									"24h0m0s",   // shardGroupDuration
									float64(1),  // replicaN
									"1h",        // futureWriteLimit
									"30m",       // pastWriteLimit
									false,       // default
								},
							},
						},
					},
				},
			},
			expected: []chronograf.RetentionPolicy{
				{
					Name:          "autogen",
					Duration:      "2160h0m0s",
					ShardDuration: "168h0m0s",
					Replication:   3,
					Default:       true,
				},
				{
					Name:          "quarterly",
					Duration:      "1560h0m0s",
					ShardDuration: "24h0m0s",
					Replication:   1,
					Default:       false,
				},
			},
		},
		{
			name: "empty input",
			input: showResults{
				{
					Series: []struct {
						Values []value `json:"values"`
					}{
						{
							Values: []value{},
						},
					},
				},
			},
			expected: []chronograf.RetentionPolicy{},
		},
		{
			name: "insufficient columns (3 columns)",
			input: showResults{
				{
					Series: []struct {
						Values []value `json:"values"`
					}{
						{
							Values: []value{
								{"autogen", "2160h0m0s", "168h0m0s"}, // Only 3 columns
							},
						},
					},
				},
			},
			expected:    []chronograf.RetentionPolicy{},
			expectedErr: "insufficient columns: expected at least 5, got 3",
		},
		{
			name: "wrong type for name (int instead of string)",
			input: showResults{
				{
					Series: []struct {
						Values []value `json:"values"`
					}{
						{
							Values: []value{
								{123, "2160h0m0s", "168h0m0s", float64(3), true},
							},
						},
					},
				},
			},
			expected:    []chronograf.RetentionPolicy{},
			expectedErr: "column 0 (name) is not a string",
		},
		{
			name: "wrong type for duration (int instead of string)",
			input: showResults{
				{
					Series: []struct {
						Values []value `json:"values"`
					}{
						{
							Values: []value{
								{"autogen", 2160, "168h0m0s", float64(3), true},
							},
						},
					},
				},
			},
			expected:    []chronograf.RetentionPolicy{},
			expectedErr: "column 1 (duration) is not a string",
		},
		{
			name: "wrong type for replication (string instead of float64)",
			input: showResults{
				{
					Series: []struct {
						Values []value `json:"values"`
					}{
						{
							Values: []value{
								{"autogen", "2160h0m0s", "168h0m0s", "3", true},
							},
						},
					},
				},
			},
			expected:    []chronograf.RetentionPolicy{},
			expectedErr: "column 3 (replication) is not a float64",
		},
		{
			name: "wrong type for default in 5-column format (string instead of bool)",
			input: showResults{
				{
					Series: []struct {
						Values []value `json:"values"`
					}{
						{
							Values: []value{
								{"autogen", "2160h0m0s", "168h0m0s", float64(3), "true"},
							},
						},
					},
				},
			},
			expected:    []chronograf.RetentionPolicy{},
			expectedErr: "column 4 (default) is not a bool",
		},
		{
			name: "wrong type for default in 7-column format (string instead of bool)",
			input: showResults{
				{
					Series: []struct {
						Values []value `json:"values"`
					}{
						{
							Values: []value{
								{"autogen", "2160h0m0s", "168h0m0s", float64(3), "0s", "0s", "true"},
							},
						},
					},
				},
			},
			expected:    []chronograf.RetentionPolicy{},
			expectedErr: "column 6 (default) is not a bool",
		},
		{
			name: "invalid column count (6 columns)",
			input: showResults{
				{
					Series: []struct {
						Values []value `json:"values"`
					}{
						{
							Values: []value{
								{"autogen", "2160h0m0s", "168h0m0s", float64(3), "0s", true},
							},
						},
					},
				},
			},
			expected:    []chronograf.RetentionPolicy{},
			expectedErr: "unexpected number of columns: 6",
		},
		{
			name: "mixed valid and invalid entries",
			input: showResults{
				{
					Series: []struct {
						Values []value `json:"values"`
					}{
						{
							Values: []value{
								{"autogen", "2160h0m0s", "168h0m0s", float64(3), true},   // valid
								{"invalid", "2160h0m0s", "168h0m0s"},                     // insufficient columns
								{"quarterly", "1560h0m0s", "24h0m0s", float64(1), false}, // valid
							},
						},
					},
				},
			},
			expected: []chronograf.RetentionPolicy{
				{
					Name:          "autogen",
					Duration:      "2160h0m0s",
					ShardDuration: "168h0m0s",
					Replication:   3,
					Default:       true,
				},
				{
					Name:          "quarterly",
					Duration:      "1560h0m0s",
					ShardDuration: "24h0m0s",
					Replication:   1,
					Default:       false,
				},
			},
			expectedErr: "insufficient columns: expected at least 5, got 3",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Use mock logger to capture error messages
			logger := &mockLoggerWithError{}
			result := tt.input.RetentionPolicies(logger)

			// Check the returned policies match expected
			if !equalRetentionPolicies(result, tt.expected) {
				t.Errorf("RetentionPolicies() = %v, want %v", result, tt.expected)
			}

			// Check the error message if one is expected
			if tt.expectedErr != "" {
				if logger.errorMsg != tt.expectedErr {
					t.Errorf("RetentionPolicies() error = %v, want %v", logger.errorMsg, tt.expectedErr)
				}
			} else if logger.errorMsg != "" {
				t.Errorf("RetentionPolicies() unexpected error = %v", logger.errorMsg)
			}
		})
	}
}

// equalRetentionPolicies compares two slices of RetentionPolicy for equality
func equalRetentionPolicies(a, b []chronograf.RetentionPolicy) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i].Name != b[i].Name ||
			a[i].Duration != b[i].Duration ||
			a[i].ShardDuration != b[i].ShardDuration ||
			a[i].Replication != b[i].Replication ||
			a[i].Default != b[i].Default {
			return false
		}
	}
	return true
}

func Test_showResults_Users(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name   string
		octets []byte
		want   []chronograf.User
	}{
		{
			name:   "admin and non-admin",
			octets: []byte(`[{"series":[{"columns":["user","admin"],"values":[["admin",true],["reader",false]]}]}]`),
			want: []chronograf.User{
				{
					Name: "admin",
					Permissions: chronograf.Permissions{
						{
							Scope:   chronograf.AllScope,
							Allowed: chronograf.Allowances{"ALL"},
						},
					},
				},
				{
					Name:        "reader",
					Permissions: chronograf.Permissions{},
				},
			},
		},
		{
			name:   "bad JSON",
			octets: []byte(`[{"series":[{"columns":["user","admin"],"values":[[1,true],["reader","false"]]}]}]`),
			want:   []chronograf.User{},
		},
	}

	for _, tt := range tests {
		r := &showResults{}
		json.Unmarshal(tt.octets, r)
		if got := r.Users(); !reflect.DeepEqual(got, tt.want) {
			t.Errorf("%q. showResults.Users() = %v, want %v", tt.name, got, tt.want)
		}
	}
}

func Test_showResults_Permissions(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name   string
		octets []byte
		want   chronograf.Permissions
	}{
		{
			name:   "write for one db",
			octets: []byte(`[{"series":[{"columns":["database","privilege"],"values":[["tensorflowdb","WRITE"]]}]}]`),
			want: chronograf.Permissions{
				chronograf.Permission{
					Scope:   "database",
					Name:    "tensorflowdb",
					Allowed: []string{"WRITE"},
				},
			},
		},
		{
			name:   "all for one db",
			octets: []byte(`[{"series":[{"columns":["database","privilege"],"values":[["tensorflowdb","ALL PRIVILEGES"]]}]}]`),
			want: chronograf.Permissions{
				chronograf.Permission{
					Scope:   "database",
					Name:    "tensorflowdb",
					Allowed: []string{"WRITE", "READ"},
				},
			},
		},
		{
			name:   "read for one db",
			octets: []byte(`[{"series":[{"columns":["database","privilege"],"values":[["tensorflowdb","READ"]]}]}]`),
			want: chronograf.Permissions{
				chronograf.Permission{
					Scope:   "database",
					Name:    "tensorflowdb",
					Allowed: []string{"READ"},
				},
			},
		},
		{
			name:   "other all for one db",
			octets: []byte(`[{"series":[{"columns":["database","privilege"],"values":[["tensorflowdb","ALL"]]}]}]`),
			want: chronograf.Permissions{
				chronograf.Permission{
					Scope:   "database",
					Name:    "tensorflowdb",
					Allowed: []string{"WRITE", "READ"},
				},
			},
		},
		{
			name:   "other all for one db",
			octets: []byte(`[{"series":[{"columns":["database","privilege"],"values":[["tensorflowdb","NO PRIVILEGES"]]}]}]`),
			want:   chronograf.Permissions{},
		},
		{
			name:   "bad JSON",
			octets: []byte(`[{"series":[{"columns":["database","privilege"],"values":[[1,"WRITE"]]}]}]`),
			want:   chronograf.Permissions{},
		},
		{
			name:   "bad JSON",
			octets: []byte(`[{"series":[{"columns":["database","privilege"],"values":[["tensorflowdb",1]]}]}]`),
			want:   chronograf.Permissions{},
		},
	}

	for _, tt := range tests {
		r := &showResults{}
		json.Unmarshal(tt.octets, r)
		if got := r.Permissions(); !reflect.DeepEqual(got, tt.want) {
			t.Errorf("%q. showResults.Users() = %v, want %v", tt.name, got, tt.want)
		}
	}
}
