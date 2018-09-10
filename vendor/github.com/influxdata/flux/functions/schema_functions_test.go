package functions_test

import (
	"regexp"
	"testing"

	"github.com/influxdata/flux/ast"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/semantic"
	"github.com/influxdata/flux/values"
	"github.com/pkg/errors"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/functions"
	"github.com/influxdata/flux/querytest"
)

func TestSchemaMutions_NewQueries(t *testing.T) {
	tests := []querytest.NewQueryTestCase{
		{
			Name: "test rename query",
			Raw:  `from(bucket:"mybucket") |> rename(columns:{old:"new"}) |> sum()`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &functions.FromOpSpec{
							Bucket: "mybucket",
						},
					},
					{
						ID: "rename1",
						Spec: &functions.RenameOpSpec{
							Cols: map[string]string{
								"old": "new",
							},
						},
					},
					{
						ID: "sum2",
						Spec: &functions.SumOpSpec{
							AggregateConfig: execute.DefaultAggregateConfig,
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "rename1"},
					{Parent: "rename1", Child: "sum2"},
				},
			},
		},
		{
			Name: "test drop query",
			Raw:  `from(bucket:"mybucket") |> drop(columns:["col1", "col2", "col3"]) |> sum()`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &functions.FromOpSpec{
							Bucket: "mybucket",
						},
					},
					{
						ID: "drop1",
						Spec: &functions.DropOpSpec{
							Cols: []string{"col1", "col2", "col3"},
						},
					},
					{
						ID: "sum2",
						Spec: &functions.SumOpSpec{
							AggregateConfig: execute.DefaultAggregateConfig,
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "drop1"},
					{Parent: "drop1", Child: "sum2"},
				},
			},
		},
		{
			Name: "test keep query",
			Raw:  `from(bucket:"mybucket") |> keep(columns:["col1", "col2", "col3"]) |> sum()`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &functions.FromOpSpec{
							Bucket: "mybucket",
						},
					},
					{
						ID: "keep1",
						Spec: &functions.KeepOpSpec{
							Cols: []string{"col1", "col2", "col3"},
						},
					},
					{
						ID: "sum2",
						Spec: &functions.SumOpSpec{
							AggregateConfig: execute.DefaultAggregateConfig,
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "keep1"},
					{Parent: "keep1", Child: "sum2"},
				},
			},
		},
		{
			Name: "test duplicate query",
			Raw:  `from(bucket:"mybucket") |> duplicate(column: "col1", as: "col1_new") |> sum()`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &functions.FromOpSpec{
							Bucket: "mybucket",
						},
					},
					{
						ID: "duplicate1",
						Spec: &functions.DuplicateOpSpec{
							Col: "col1",
							As:  "col1_new",
						},
					},
					{
						ID: "sum2",
						Spec: &functions.SumOpSpec{
							AggregateConfig: execute.DefaultAggregateConfig,
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "duplicate1"},
					{Parent: "duplicate1", Child: "sum2"},
				},
			},
		},
		{
			Name: "test drop query fn param",
			Raw:  `from(bucket:"mybucket") |> drop(fn: (col) => col =~ /reg*/) |> sum()`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &functions.FromOpSpec{
							Bucket: "mybucket",
						},
					},
					{
						ID: "drop1",
						Spec: &functions.DropOpSpec{
							Predicate: &semantic.FunctionExpression{
								Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "col"}}},
								Body: &semantic.BinaryExpression{
									Operator: ast.RegexpMatchOperator,
									Left: &semantic.IdentifierExpression{
										Name: "col",
									},
									Right: &semantic.RegexpLiteral{
										Value: regexp.MustCompile(`reg*`),
									},
								},
							},
						},
					},
					{
						ID: "sum2",
						Spec: &functions.SumOpSpec{
							AggregateConfig: execute.DefaultAggregateConfig,
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "drop1"},
					{Parent: "drop1", Child: "sum2"},
				},
			},
		},
		{
			Name: "test keep query fn param",
			Raw:  `from(bucket:"mybucket") |> keep(fn: (col) => col =~ /reg*/) |> sum()`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &functions.FromOpSpec{
							Bucket: "mybucket",
						},
					},
					{
						ID: "keep1",
						Spec: &functions.KeepOpSpec{
							Predicate: &semantic.FunctionExpression{
								Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "col"}}},
								Body: &semantic.BinaryExpression{
									Operator: ast.RegexpMatchOperator,
									Left: &semantic.IdentifierExpression{
										Name: "col",
									},
									Right: &semantic.RegexpLiteral{
										Value: regexp.MustCompile(`reg*`),
									},
								},
							},
						},
					},
					{
						ID: "sum2",
						Spec: &functions.SumOpSpec{
							AggregateConfig: execute.DefaultAggregateConfig,
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "keep1"},
					{Parent: "keep1", Child: "sum2"},
				},
			},
		},
		{
			Name: "test rename query fn param",
			Raw:  `from(bucket:"mybucket") |> rename(fn: (col) => "new_name") |> sum()`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &functions.FromOpSpec{
							Bucket: "mybucket",
						},
					},
					{
						ID: "rename1",
						Spec: &functions.RenameOpSpec{
							Fn: &semantic.FunctionExpression{
								Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "col"}}},
								Body: &semantic.StringLiteral{
									Value: "new_name",
								},
							},
						},
					},
					{
						ID: "sum2",
						Spec: &functions.SumOpSpec{
							AggregateConfig: execute.DefaultAggregateConfig,
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "rename1"},
					{Parent: "rename1", Child: "sum2"},
				},
			},
		},
		{
			Name:    "test rename query invalid",
			Raw:     `from(bucket:"mybucket") |> rename(fn: (col) => "new_name", columns: {a:"b", c:"d"}) |> sum()`,
			Want:    nil,
			WantErr: true,
		},
		{
			Name:    "test drop query invalid",
			Raw:     `from(bucket:"mybucket") |> drop(fn: (col) => col == target, columns: ["a", "b"]) |> sum()`,
			Want:    nil,
			WantErr: true,
		},
		{
			Name:    "test keep query invalid",
			Raw:     `from(bucket:"mybucket") |> keep(fn: (col) => col == target, columns: ["a", "b"]) |> sum()`,
			Want:    nil,
			WantErr: true,
		},
		{
			Name:    "test duplicate query invalid",
			Raw:     `from(bucket:"mybucket") |> duplicate(columns: ["a", "b"], n: -1) |> sum()`,
			Want:    nil,
			WantErr: true,
		},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(tc.Name, func(t *testing.T) {
			t.Parallel()
			querytest.NewQueryTestHelper(t, tc)
		})
	}
}

func TestDropRenameKeep_Process(t *testing.T) {
	testCases := []struct {
		name    string
		spec    plan.ProcedureSpec
		data    []flux.Table
		want    []*executetest.Table
		wantErr error
	}{
		{
			name: "rename multiple cols",
			spec: &functions.SchemaMutationProcedureSpec{
				Mutations: []functions.SchemaMutation{
					&functions.RenameOpSpec{
						Cols: map[string]string{
							"1a": "1b",
							"2a": "2b",
							"3a": "3b",
						},
					},
				},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "1a", Type: flux.TFloat},
					{Label: "2a", Type: flux.TFloat},
					{Label: "3a", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{1.0, 2.0, 3.0},
					{11.0, 12.0, 13.0},
					{21.0, 22.0, 23.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "1b", Type: flux.TFloat},
					{Label: "2b", Type: flux.TFloat},
					{Label: "3b", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{1.0, 2.0, 3.0},
					{11.0, 12.0, 13.0},
					{21.0, 22.0, 23.0},
				},
			}},
		},

		{
			name: "drop multiple cols",
			spec: &functions.SchemaMutationProcedureSpec{
				Mutations: []functions.SchemaMutation{
					&functions.DropOpSpec{
						Cols: []string{"a", "b"},
					},
				},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "a", Type: flux.TFloat},
					{Label: "b", Type: flux.TFloat},
					{Label: "c", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{1.0, 2.0, 3.0},
					{11.0, 12.0, 13.0},
					{21.0, 22.0, 23.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "c", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{3.0},
					{13.0},
					{23.0},
				},
			}},
		},
		{
			name: "keep multiple cols",
			spec: &functions.SchemaMutationProcedureSpec{
				Mutations: []functions.SchemaMutation{
					&functions.KeepOpSpec{
						Cols: []string{"a"},
					},
				},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "a", Type: flux.TFloat},
					{Label: "b", Type: flux.TFloat},
					{Label: "c", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{1.0, 2.0, 3.0},
					{11.0, 12.0, 13.0},
					{21.0, 22.0, 23.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "a", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{1.0},
					{11.0},
					{21.0},
				},
			}},
		},
		{
			name: "duplicate single col",
			spec: &functions.SchemaMutationProcedureSpec{
				Mutations: []functions.SchemaMutation{
					&functions.DuplicateOpSpec{
						Col: "a",
						As:  "a_1",
					},
				},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "a", Type: flux.TFloat},
					{Label: "b", Type: flux.TFloat},
					{Label: "c", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{1.0, 2.0, 3.0},
					{11.0, 12.0, 13.0},
					{21.0, 22.0, 23.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "a", Type: flux.TFloat},
					{Label: "a_1", Type: flux.TFloat},
					{Label: "b", Type: flux.TFloat},
					{Label: "c", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{1.0, 1.0, 2.0, 3.0},
					{11.0, 11.0, 12.0, 13.0},
					{21.0, 21.0, 22.0, 23.0},
				},
			}},
		},
		{
			name: "rename map fn (col) => name",
			spec: &functions.SchemaMutationProcedureSpec{
				Mutations: []functions.SchemaMutation{
					&functions.RenameOpSpec{
						Fn: &semantic.FunctionExpression{
							Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "col"}}},
							Body: &semantic.StringLiteral{
								Value: "new_name",
							},
						},
					},
				},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "1a", Type: flux.TFloat},
					{Label: "2a", Type: flux.TFloat},
					{Label: "3a", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{1.0, 2.0, 3.0},
					{11.0, 12.0, 13.0},
					{21.0, 22.0, 23.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "new_name", Type: flux.TFloat},
					{Label: "new_name", Type: flux.TFloat},
					{Label: "new_name", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{1.0, 2.0, 3.0},
					{11.0, 12.0, 13.0},
					{21.0, 22.0, 23.0},
				},
			}},
		},
		{
			name: "drop predicate (col) => col ~= /reg/",
			spec: &functions.SchemaMutationProcedureSpec{
				Mutations: []functions.SchemaMutation{
					&functions.DropOpSpec{
						Predicate: &semantic.FunctionExpression{
							Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "col"}}},
							Body: &semantic.BinaryExpression{
								Operator: ast.RegexpMatchOperator,
								Left: &semantic.IdentifierExpression{
									Name: "col",
								},
								Right: &semantic.RegexpLiteral{
									Value: regexp.MustCompile(`server*`),
								},
							},
						},
					},
				},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "server1", Type: flux.TFloat},
					{Label: "local", Type: flux.TFloat},
					{Label: "server2", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{1.0, 2.0, 3.0},
					{11.0, 12.0, 13.0},
					{21.0, 22.0, 23.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "local", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{2.0},
					{12.0},
					{22.0},
				},
			}},
		},
		{
			name: "keep predicate (col) => col ~= /reg/",
			spec: &functions.SchemaMutationProcedureSpec{
				Mutations: []functions.SchemaMutation{
					&functions.KeepOpSpec{
						Predicate: &semantic.FunctionExpression{
							Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "col"}}},
							Body: &semantic.BinaryExpression{
								Operator: ast.RegexpMatchOperator,
								Left: &semantic.IdentifierExpression{
									Name: "col",
								},
								Right: &semantic.RegexpLiteral{
									Value: regexp.MustCompile(`server*`),
								},
							},
						},
					},
				},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "server1", Type: flux.TFloat},
					{Label: "local", Type: flux.TFloat},
					{Label: "server2", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{1.0, 2.0, 3.0},
					{11.0, 12.0, 13.0},
					{21.0, 22.0, 23.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "server1", Type: flux.TFloat},
					{Label: "server2", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{1.0, 3.0},
					{11.0, 13.0},
					{21.0, 23.0},
				},
			}},
		},
		{
			name: "drop and rename",
			spec: &functions.SchemaMutationProcedureSpec{
				Mutations: []functions.SchemaMutation{
					&functions.DropOpSpec{
						Cols: []string{"server1", "server2"},
					},
					&functions.RenameOpSpec{
						Cols: map[string]string{
							"local": "localhost",
						},
					},
				},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "server1", Type: flux.TFloat},
					{Label: "local", Type: flux.TFloat},
					{Label: "server2", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{1.0, 2.0, 3.0},
					{11.0, 12.0, 13.0},
					{21.0, 22.0, 23.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "localhost", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{2.0},
					{12.0},
					{22.0},
				},
			}},
		},
		{
			name: "drop no exist",
			spec: &functions.SchemaMutationProcedureSpec{
				Mutations: []functions.SchemaMutation{
					&functions.DropOpSpec{
						Cols: []string{"no_exist"},
					},
				},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "server1", Type: flux.TFloat},
					{Label: "local", Type: flux.TFloat},
					{Label: "server2", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{1.0, 2.0, 3.0},
					{11.0, 12.0, 13.0},
					{21.0, 22.0, 23.0},
				},
			}},
			want:    []*executetest.Table(nil),
			wantErr: errors.New(`drop error: column "no_exist" doesn't exist`),
		},
		{
			name: "rename no exist",
			spec: &functions.SchemaMutationProcedureSpec{
				Mutations: []functions.SchemaMutation{
					&functions.RenameOpSpec{
						Cols: map[string]string{
							"no_exist": "noexist",
						},
					},
				},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "server1", Type: flux.TFloat},
					{Label: "local", Type: flux.TFloat},
					{Label: "server2", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{1.0, 2.0, 3.0},
					{11.0, 12.0, 13.0},
					{21.0, 22.0, 23.0},
				},
			}},
			want:    []*executetest.Table(nil),
			wantErr: errors.New(`rename error: column "no_exist" doesn't exist`),
		},
		{
			name: "keep no exist",
			spec: &functions.SchemaMutationProcedureSpec{
				Mutations: []functions.SchemaMutation{
					&functions.KeepOpSpec{
						Cols: []string{"no_exist"},
					},
				},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "server1", Type: flux.TFloat},
					{Label: "local", Type: flux.TFloat},
					{Label: "server2", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{1.0, 2.0, 3.0},
					{11.0, 12.0, 13.0},
					{21.0, 22.0, 23.0},
				},
			}},
			want:    []*executetest.Table(nil),
			wantErr: errors.New(`keep error: column "no_exist" doesn't exist`),
		},
		{
			name: "duplicate no exist",
			spec: &functions.SchemaMutationProcedureSpec{
				Mutations: []functions.SchemaMutation{
					&functions.DuplicateOpSpec{
						Col: "no_exist",
						As:  "no_exist_2",
					},
				},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "server1", Type: flux.TFloat},
					{Label: "local", Type: flux.TFloat},
					{Label: "server2", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{1.0, 2.0, 3.0},
					{11.0, 12.0, 13.0},
					{21.0, 22.0, 23.0},
				},
			}},
			want:    []*executetest.Table(nil),
			wantErr: errors.New(`duplicate error: column "no_exist" doesn't exist`),
		},
		{
			name: "rename group key",
			spec: &functions.SchemaMutationProcedureSpec{
				Mutations: []functions.SchemaMutation{
					&functions.RenameOpSpec{
						Cols: map[string]string{
							"1a": "1b",
							"2a": "2b",
							"3a": "3b",
						},
					},
				},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "1a", Type: flux.TFloat},
					{Label: "2a", Type: flux.TFloat},
					{Label: "3a", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{1.0, 2.0, 3.0},
					{1.0, 12.0, 13.0},
					{1.0, 22.0, 23.0},
				},
				KeyCols:   []string{"1a"},
				KeyValues: []interface{}{1.0},
				GroupKey: execute.NewGroupKey(
					[]flux.ColMeta{{
						Label: "1a",
						Type:  flux.TFloat,
					}},
					[]values.Value{values.NewFloatValue(1.0)},
				),
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "1b", Type: flux.TFloat},
					{Label: "2b", Type: flux.TFloat},
					{Label: "3b", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{1.0, 2.0, 3.0},
					{1.0, 12.0, 13.0},
					{1.0, 22.0, 23.0},
				},
				KeyCols:   []string{"1b"},
				KeyValues: []interface{}{1.0},
				GroupKey: execute.NewGroupKey(
					[]flux.ColMeta{{
						Label: "1b",
						Type:  flux.TFloat,
					}},
					[]values.Value{values.NewFloatValue(1.0)},
				),
			}},
		},
		{
			name: "drop group key",
			spec: &functions.SchemaMutationProcedureSpec{
				Mutations: []functions.SchemaMutation{
					&functions.DropOpSpec{
						Cols: []string{"2a"},
					},
				},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "1a", Type: flux.TFloat},
					{Label: "2a", Type: flux.TFloat},
					{Label: "3a", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{1.0, 2.0, 3.0},
					{11.0, 2.0, 13.0},
					{21.0, 2.0, 23.0},
				},
				KeyCols:   []string{"2a"},
				KeyValues: []interface{}{2.0},
				GroupKey: execute.NewGroupKey(
					[]flux.ColMeta{{
						Label: "2a",
						Type:  flux.TFloat,
					}},
					[]values.Value{values.NewFloatValue(2.0)},
				),
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "1a", Type: flux.TFloat},
					{Label: "3a", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{1.0, 3.0},
					{11.0, 13.0},
					{21.0, 23.0},
				},
				KeyCols:   []string(nil),
				KeyValues: []interface{}(nil),
				GroupKey:  execute.NewGroupKey([]flux.ColMeta{}, []values.Value{}),
			}},
		},
		{
			name: "keep group key",
			spec: &functions.SchemaMutationProcedureSpec{
				Mutations: []functions.SchemaMutation{
					&functions.KeepOpSpec{
						Cols: []string{"1a"},
					},
				},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "1a", Type: flux.TFloat},
					{Label: "2a", Type: flux.TFloat},
					{Label: "3a", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{1.0, 2.0, 3.0},
					{1.0, 12.0, 3.0},
					{1.0, 22.0, 3.0},
				},
				KeyCols:   []string{"1a", "3a"},
				KeyValues: []interface{}{1.0, 3.0},
				GroupKey: execute.NewGroupKey(
					[]flux.ColMeta{
						{Label: "1a", Type: flux.TFloat},
						{Label: "3a", Type: flux.TFloat},
					},
					[]values.Value{values.NewFloatValue(1.0), values.NewFloatValue(3.0)},
				),
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "1a", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{1.0},
					{1.0},
					{1.0},
				},
				KeyCols:   []string{"1a"},
				KeyValues: []interface{}{1.0},
				GroupKey: execute.NewGroupKey(
					[]flux.ColMeta{
						{Label: "1a", Type: flux.TFloat},
					},
					[]values.Value{values.NewFloatValue(1.0)},
				),
			}},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			executetest.ProcessTestHelper(
				t,
				tc.data,
				tc.want,
				tc.wantErr,
				func(d execute.Dataset, c execute.TableBuilderCache) execute.Transformation {
					tr, err := functions.NewSchemaMutationTransformation(d, c, tc.spec)
					if err != nil {
						t.Fatal(err)
					}
					return tr
				},
			)
		})
	}
}

// TODO: determine SchemaMutationProcedureSpec pushdown/rewrite rules
/*
func TestRenameDrop_PushDown(t *testing.T) {
	m1, _ := functions.NewRenameMutator(&functions.RenameOpSpec{
		Cols: map[string]string{},
	})

	root := &plan.Procedure{
		Spec: &functions.SchemaMutationProcedureSpec{
			Mutations: []functions.SchemaMutator{m1},
		},
	}

	m2, _ := functions.NewDropKeepMutator(&functions.DropOpSpec{
		Cols: []string{},
	})

	m3, _ := functions.NewDropKeepMutator(&functions.KeepOpSpec{
		Cols: []string{},
	})

	spec := &functions.SchemaMutationProcedureSpec{
		Mutations: []functions.SchemaMutator{m2, m3},
	}

	want := &plan.Procedure{
		Spec: &functions.SchemaMutationProcedureSpec{
			Mutations: []functions.SchemaMutator{m1, m2, m3},
		},
	}
	plantest.PhysicalPlan_PushDown_TestHelper(t, spec, root, false, want)
}
*/
