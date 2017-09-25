package influx

import (
	"encoding/json"
	"reflect"
	"testing"

	"github.com/influxdata/chronograf"
)

func TestDifference(t *testing.T) {
	t.Parallel()
	type args struct {
		wants chronograf.SourcePermissions
		haves chronograf.SourcePermissions
	}
	tests := []struct {
		name       string
		args       args
		wantRevoke chronograf.SourcePermissions
		wantAdd    chronograf.SourcePermissions
	}{
		{
			name: "add write to permissions",
			args: args{
				wants: chronograf.SourcePermissions{
					chronograf.SourcePermission{
						Scope:   "database",
						Name:    "tensorflowdb",
						Allowed: []string{"READ", "WRITE"},
					},
				},
				haves: chronograf.SourcePermissions{
					chronograf.SourcePermission{
						Scope:   "database",
						Name:    "tensorflowdb",
						Allowed: []string{"READ"},
					},
				},
			},
			wantRevoke: nil,
			wantAdd: chronograf.SourcePermissions{
				chronograf.SourcePermission{
					Scope:   "database",
					Name:    "tensorflowdb",
					Allowed: []string{"READ", "WRITE"},
				},
			},
		},
		{
			name: "revoke write to permissions",
			args: args{
				wants: chronograf.SourcePermissions{
					chronograf.SourcePermission{
						Scope:   "database",
						Name:    "tensorflowdb",
						Allowed: []string{"READ"},
					},
				},
				haves: chronograf.SourcePermissions{
					chronograf.SourcePermission{
						Scope:   "database",
						Name:    "tensorflowdb",
						Allowed: []string{"READ", "WRITE"},
					},
				},
			},
			wantRevoke: nil,
			wantAdd: chronograf.SourcePermissions{
				chronograf.SourcePermission{
					Scope:   "database",
					Name:    "tensorflowdb",
					Allowed: []string{"READ"},
				},
			},
		},
		{
			name: "revoke all permissions",
			args: args{
				wants: chronograf.SourcePermissions{
					chronograf.SourcePermission{
						Scope:   "database",
						Name:    "tensorflowdb",
						Allowed: []string{},
					},
				},
				haves: chronograf.SourcePermissions{
					chronograf.SourcePermission{
						Scope:   "database",
						Name:    "tensorflowdb",
						Allowed: []string{"READ", "WRITE"},
					},
				},
			},
			wantRevoke: chronograf.SourcePermissions{
				chronograf.SourcePermission{
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
				wants: chronograf.SourcePermissions{
					chronograf.SourcePermission{
						Scope:   "database",
						Name:    "new",
						Allowed: []string{"READ"},
					},
				},
				haves: chronograf.SourcePermissions{
					chronograf.SourcePermission{
						Scope:   "database",
						Name:    "old",
						Allowed: []string{"READ", "WRITE"},
					},
				},
			},
			wantRevoke: chronograf.SourcePermissions{
				chronograf.SourcePermission{
					Scope:   "database",
					Name:    "old",
					Allowed: []string{"READ", "WRITE"},
				},
			},
			wantAdd: chronograf.SourcePermissions{
				chronograf.SourcePermission{
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
		perm     chronograf.SourcePermission
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
				perm: chronograf.SourcePermission{
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
				perm: chronograf.SourcePermission{
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
				perm: chronograf.SourcePermission{
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
		perm     chronograf.SourcePermission
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
				perm: chronograf.SourcePermission{
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
				perm: chronograf.SourcePermission{
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

func Test_showResults_Users(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name   string
		octets []byte
		want   []chronograf.SourceUser
	}{
		{
			name:   "admin and non-admin",
			octets: []byte(`[{"series":[{"columns":["user","admin"],"values":[["admin",true],["reader",false]]}]}]`),
			want: []chronograf.SourceUser{
				{
					Name: "admin",
					Permissions: chronograf.SourcePermissions{
						{
							Scope:   chronograf.AllScope,
							Allowed: chronograf.Allowances{"ALL"},
						},
					},
				},
				{
					Name:        "reader",
					Permissions: chronograf.SourcePermissions{},
				},
			},
		},
		{
			name:   "bad JSON",
			octets: []byte(`[{"series":[{"columns":["user","admin"],"values":[[1,true],["reader","false"]]}]}]`),
			want:   []chronograf.SourceUser{},
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
		want   chronograf.SourcePermissions
	}{
		{
			name:   "write for one db",
			octets: []byte(`[{"series":[{"columns":["database","privilege"],"values":[["tensorflowdb","WRITE"]]}]}]`),
			want: chronograf.SourcePermissions{
				chronograf.SourcePermission{
					Scope:   "database",
					Name:    "tensorflowdb",
					Allowed: []string{"WRITE"},
				},
			},
		},
		{
			name:   "all for one db",
			octets: []byte(`[{"series":[{"columns":["database","privilege"],"values":[["tensorflowdb","ALL PRIVILEGES"]]}]}]`),
			want: chronograf.SourcePermissions{
				chronograf.SourcePermission{
					Scope:   "database",
					Name:    "tensorflowdb",
					Allowed: []string{"WRITE", "READ"},
				},
			},
		},
		{
			name:   "read for one db",
			octets: []byte(`[{"series":[{"columns":["database","privilege"],"values":[["tensorflowdb","READ"]]}]}]`),
			want: chronograf.SourcePermissions{
				chronograf.SourcePermission{
					Scope:   "database",
					Name:    "tensorflowdb",
					Allowed: []string{"READ"},
				},
			},
		},
		{
			name:   "other all for one db",
			octets: []byte(`[{"series":[{"columns":["database","privilege"],"values":[["tensorflowdb","ALL"]]}]}]`),
			want: chronograf.SourcePermissions{
				chronograf.SourcePermission{
					Scope:   "database",
					Name:    "tensorflowdb",
					Allowed: []string{"WRITE", "READ"},
				},
			},
		},
		{
			name:   "other all for one db",
			octets: []byte(`[{"series":[{"columns":["database","privilege"],"values":[["tensorflowdb","NO PRIVILEGES"]]}]}]`),
			want:   chronograf.SourcePermissions{},
		},
		{
			name:   "bad JSON",
			octets: []byte(`[{"series":[{"columns":["database","privilege"],"values":[[1,"WRITE"]]}]}]`),
			want:   chronograf.SourcePermissions{},
		},
		{
			name:   "bad JSON",
			octets: []byte(`[{"series":[{"columns":["database","privilege"],"values":[["tensorflowdb",1]]}]}]`),
			want:   chronograf.SourcePermissions{},
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
