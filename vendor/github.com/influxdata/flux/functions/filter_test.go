package functions_test

import (
	"regexp"
	"testing"
	"time"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/ast"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/functions"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/plan/plantest"
	"github.com/influxdata/flux/querytest"
	"github.com/influxdata/flux/semantic"
)

func TestFilter_NewQuery(t *testing.T) {
	tests := []querytest.NewQueryTestCase{
		{
			Name: "from with database filter and range",
			Raw:  `from(bucket:"mybucket") |> filter(fn: (r) => r["t1"]=="val1" and r["t2"]=="val2") |> range(start:-4h, stop:-2h) |> count()`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &functions.FromOpSpec{
							Bucket: "mybucket",
						},
					},
					{
						ID: "filter1",
						Spec: &functions.FilterOpSpec{
							Fn: &semantic.FunctionExpression{
								Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "r"}}},
								Body: &semantic.LogicalExpression{
									Operator: ast.AndOperator,
									Left: &semantic.BinaryExpression{
										Operator: ast.EqualOperator,
										Left: &semantic.MemberExpression{
											Object:   &semantic.IdentifierExpression{Name: "r"},
											Property: "t1",
										},
										Right: &semantic.StringLiteral{Value: "val1"},
									},
									Right: &semantic.BinaryExpression{
										Operator: ast.EqualOperator,
										Left: &semantic.MemberExpression{
											Object:   &semantic.IdentifierExpression{Name: "r"},
											Property: "t2",
										},
										Right: &semantic.StringLiteral{Value: "val2"},
									},
								},
							},
						},
					},
					{
						ID: "range2",
						Spec: &functions.RangeOpSpec{
							Start: flux.Time{
								Relative:   -4 * time.Hour,
								IsRelative: true,
							},
							Stop: flux.Time{
								Relative:   -2 * time.Hour,
								IsRelative: true,
							},
							TimeCol:  "_time",
							StartCol: "_start",
							StopCol:  "_stop",
						},
					},
					{
						ID: "count3",
						Spec: &functions.CountOpSpec{
							AggregateConfig: execute.DefaultAggregateConfig,
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "filter1"},
					{Parent: "filter1", Child: "range2"},
					{Parent: "range2", Child: "count3"},
				},
			},
		},
		{
			Name: "from with database filter (and with or) and range",
			Raw: `from(bucket:"mybucket")
						|> filter(fn: (r) =>
								(
									(r["t1"]=="val1")
									and
									(r["t2"]=="val2")
								)
								or
								(r["t3"]=="val3")
							)
						|> range(start:-4h, stop:-2h)
						|> count()`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &functions.FromOpSpec{
							Bucket: "mybucket",
						},
					},
					{
						ID: "filter1",
						Spec: &functions.FilterOpSpec{
							Fn: &semantic.FunctionExpression{
								Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "r"}}},
								Body: &semantic.LogicalExpression{
									Operator: ast.OrOperator,
									Left: &semantic.LogicalExpression{
										Operator: ast.AndOperator,
										Left: &semantic.BinaryExpression{
											Operator: ast.EqualOperator,
											Left: &semantic.MemberExpression{
												Object:   &semantic.IdentifierExpression{Name: "r"},
												Property: "t1",
											},
											Right: &semantic.StringLiteral{Value: "val1"},
										},
										Right: &semantic.BinaryExpression{
											Operator: ast.EqualOperator,
											Left: &semantic.MemberExpression{
												Object:   &semantic.IdentifierExpression{Name: "r"},
												Property: "t2",
											},
											Right: &semantic.StringLiteral{Value: "val2"},
										},
									},
									Right: &semantic.BinaryExpression{
										Operator: ast.EqualOperator,
										Left: &semantic.MemberExpression{
											Object:   &semantic.IdentifierExpression{Name: "r"},
											Property: "t3",
										},
										Right: &semantic.StringLiteral{Value: "val3"},
									},
								},
							},
						},
					},
					{
						ID: "range2",
						Spec: &functions.RangeOpSpec{
							Start: flux.Time{
								Relative:   -4 * time.Hour,
								IsRelative: true,
							},
							Stop: flux.Time{
								Relative:   -2 * time.Hour,
								IsRelative: true,
							},
							TimeCol:  "_time",
							StartCol: "_start",
							StopCol:  "_stop",
						},
					},
					{
						ID: "count3",
						Spec: &functions.CountOpSpec{
							AggregateConfig: execute.DefaultAggregateConfig,
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "filter1"},
					{Parent: "filter1", Child: "range2"},
					{Parent: "range2", Child: "count3"},
				},
			},
		},
		{
			Name: "from with database filter including fields",
			Raw: `from(bucket:"mybucket")
						|> filter(fn: (r) =>
							(r["t1"] =="val1")
							and
							(r["_field"] == 10)
						)
						|> range(start:-4h, stop:-2h)
						|> count()`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &functions.FromOpSpec{
							Bucket: "mybucket",
						},
					},
					{
						ID: "filter1",
						Spec: &functions.FilterOpSpec{
							Fn: &semantic.FunctionExpression{
								Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "r"}}},
								Body: &semantic.LogicalExpression{
									Operator: ast.AndOperator,
									Left: &semantic.BinaryExpression{
										Operator: ast.EqualOperator,
										Left: &semantic.MemberExpression{
											Object:   &semantic.IdentifierExpression{Name: "r"},
											Property: "t1",
										},
										Right: &semantic.StringLiteral{Value: "val1"},
									},
									Right: &semantic.BinaryExpression{
										Operator: ast.EqualOperator,
										Left: &semantic.MemberExpression{
											Object:   &semantic.IdentifierExpression{Name: "r"},
											Property: "_field",
										},
										Right: &semantic.IntegerLiteral{Value: 10},
									},
								},
							},
						},
					},
					{
						ID: "range2",
						Spec: &functions.RangeOpSpec{
							Start: flux.Time{
								Relative:   -4 * time.Hour,
								IsRelative: true,
							},
							Stop: flux.Time{
								Relative:   -2 * time.Hour,
								IsRelative: true,
							},
							TimeCol:  "_time",
							StartCol: "_start",
							StopCol:  "_stop",
						},
					},
					{
						ID: "count3",
						Spec: &functions.CountOpSpec{
							AggregateConfig: execute.DefaultAggregateConfig,
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "filter1"},
					{Parent: "filter1", Child: "range2"},
					{Parent: "range2", Child: "count3"},
				},
			},
		},
		{
			Name: "from with database filter with no parens including fields",
			Raw: `from(bucket:"mybucket")
						|> filter(fn: (r) =>
							r["t1"]=="val1"
							and
							r["_field"] == 10
						)
						|> range(start:-4h, stop:-2h)
						|> count()`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &functions.FromOpSpec{
							Bucket: "mybucket",
						},
					},
					{
						ID: "filter1",
						Spec: &functions.FilterOpSpec{
							Fn: &semantic.FunctionExpression{
								Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "r"}}},
								Body: &semantic.LogicalExpression{
									Operator: ast.AndOperator,
									Left: &semantic.BinaryExpression{
										Operator: ast.EqualOperator,
										Left: &semantic.MemberExpression{
											Object:   &semantic.IdentifierExpression{Name: "r"},
											Property: "t1",
										},
										Right: &semantic.StringLiteral{Value: "val1"},
									},
									Right: &semantic.BinaryExpression{
										Operator: ast.EqualOperator,
										Left: &semantic.MemberExpression{
											Object:   &semantic.IdentifierExpression{Name: "r"},
											Property: "_field",
										},
										Right: &semantic.IntegerLiteral{Value: 10},
									},
								},
							},
						},
					},
					{
						ID: "range2",
						Spec: &functions.RangeOpSpec{
							Start: flux.Time{
								Relative:   -4 * time.Hour,
								IsRelative: true,
							},
							Stop: flux.Time{
								Relative:   -2 * time.Hour,
								IsRelative: true,
							},
							TimeCol:  "_time",
							StartCol: "_start",
							StopCol:  "_stop",
						},
					},
					{
						ID: "count3",
						Spec: &functions.CountOpSpec{
							AggregateConfig: execute.DefaultAggregateConfig,
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "filter1"},
					{Parent: "filter1", Child: "range2"},
					{Parent: "range2", Child: "count3"},
				},
			},
		},
		{
			Name: "from with database filter with no parens including regex and field",
			Raw: `from(bucket:"mybucket")
						|> filter(fn: (r) =>
							r["t1"]==/val1/
							and
							r["_field"] == 10.5
						)
						|> range(start:-4h, stop:-2h)
						|> count()`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &functions.FromOpSpec{
							Bucket: "mybucket",
						},
					},
					{
						ID: "filter1",
						Spec: &functions.FilterOpSpec{
							Fn: &semantic.FunctionExpression{
								Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "r"}}},
								Body: &semantic.LogicalExpression{
									Operator: ast.AndOperator,
									Left: &semantic.BinaryExpression{
										Operator: ast.EqualOperator,
										Left: &semantic.MemberExpression{
											Object:   &semantic.IdentifierExpression{Name: "r"},
											Property: "t1",
										},
										Right: &semantic.RegexpLiteral{Value: regexp.MustCompile("val1")},
									},
									Right: &semantic.BinaryExpression{
										Operator: ast.EqualOperator,
										Left: &semantic.MemberExpression{
											Object:   &semantic.IdentifierExpression{Name: "r"},
											Property: "_field",
										},
										Right: &semantic.FloatLiteral{Value: 10.5},
									},
								},
							},
						},
					},
					{
						ID: "range2",
						Spec: &functions.RangeOpSpec{
							Start: flux.Time{
								Relative:   -4 * time.Hour,
								IsRelative: true,
							},
							Stop: flux.Time{
								Relative:   -2 * time.Hour,
								IsRelative: true,
							},
							TimeCol:  "_time",
							StartCol: "_start",
							StopCol:  "_stop",
						},
					},
					{
						ID: "count3",
						Spec: &functions.CountOpSpec{
							AggregateConfig: execute.DefaultAggregateConfig,
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "filter1"},
					{Parent: "filter1", Child: "range2"},
					{Parent: "range2", Child: "count3"},
				},
			},
		},
		{
			Name: "from with database regex with escape",
			Raw: `from(bucket:"mybucket")
						|> filter(fn: (r) =>
							r["t1"]==/va\/l1/
						)`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &functions.FromOpSpec{
							Bucket: "mybucket",
						},
					},
					{
						ID: "filter1",
						Spec: &functions.FilterOpSpec{
							Fn: &semantic.FunctionExpression{
								Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "r"}}},
								Body: &semantic.BinaryExpression{
									Operator: ast.EqualOperator,
									Left: &semantic.MemberExpression{
										Object:   &semantic.IdentifierExpression{Name: "r"},
										Property: "t1",
									},
									Right: &semantic.RegexpLiteral{Value: regexp.MustCompile(`va/l1`)},
								},
							},
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "filter1"},
				},
			},
		},
		{
			Name: "from with database with two regex",
			Raw: `from(bucket:"mybucket")
						|> filter(fn: (r) =>
							r["t1"]==/va\/l1/
							and
							r["t2"] != /val2/
						)`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &functions.FromOpSpec{
							Bucket: "mybucket",
						},
					},
					{
						ID: "filter1",
						Spec: &functions.FilterOpSpec{
							Fn: &semantic.FunctionExpression{
								Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "r"}}},
								Body: &semantic.LogicalExpression{
									Operator: ast.AndOperator,
									Left: &semantic.BinaryExpression{
										Operator: ast.EqualOperator,
										Left: &semantic.MemberExpression{
											Object:   &semantic.IdentifierExpression{Name: "r"},
											Property: "t1",
										},
										Right: &semantic.RegexpLiteral{Value: regexp.MustCompile(`va/l1`)},
									},
									Right: &semantic.BinaryExpression{
										Operator: ast.NotEqualOperator,
										Left: &semantic.MemberExpression{
											Object:   &semantic.IdentifierExpression{Name: "r"},
											Property: "t2",
										},
										Right: &semantic.RegexpLiteral{Value: regexp.MustCompile(`val2`)},
									},
								},
							},
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "filter1"},
				},
			},
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
func TestFilterOperation_Marshaling(t *testing.T) {
	data := []byte(`{
		"id":"filter",
		"kind":"filter",
		"spec":{
			"fn":{
				"type": "ArrowFunctionExpression",
				"params": [{"type":"FunctionParam","key":{"type":"Identifier","name":"r"}}],
				"body":{
					"type":"BinaryExpression",
					"operator": "!=",
					"left":{
						"type":"MemberExpression",
						"object": {
							"type": "IdentifierExpression",
							"name":"r"
						},
						"property": "_measurement"
					},
					"right":{
						"type":"StringLiteral",
						"value":"mem"
					}
				}
			}
		}
	}`)
	op := &flux.Operation{
		ID: "filter",
		Spec: &functions.FilterOpSpec{
			Fn: &semantic.FunctionExpression{
				Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "r"}}},
				Body: &semantic.BinaryExpression{
					Operator: ast.NotEqualOperator,
					Left: &semantic.MemberExpression{
						Object:   &semantic.IdentifierExpression{Name: "r"},
						Property: "_measurement",
					},
					Right: &semantic.StringLiteral{Value: "mem"},
				},
			},
		},
	}
	querytest.OperationMarshalingTestHelper(t, data, op)
}

func TestFilter_Process(t *testing.T) {
	testCases := []struct {
		name string
		spec *functions.FilterProcedureSpec
		data []flux.Table
		want []*executetest.Table
	}{
		{
			name: `_value>5`,
			spec: &functions.FilterProcedureSpec{
				Fn: &semantic.FunctionExpression{
					Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "r"}}},
					Body: &semantic.BinaryExpression{
						Operator: ast.GreaterThanOperator,
						Left: &semantic.MemberExpression{
							Object:   &semantic.IdentifierExpression{Name: "r"},
							Property: "_value",
						},
						Right: &semantic.FloatLiteral{Value: 5},
					},
				},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), 1.0},
					{execute.Time(2), 6.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(2), 6.0},
				},
			}},
		},
		{
			name: "_value>5 multiple blocks",
			spec: &functions.FilterProcedureSpec{
				Fn: &semantic.FunctionExpression{
					Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "r"}}},
					Body: &semantic.BinaryExpression{
						Operator: ast.GreaterThanOperator,
						Left: &semantic.MemberExpression{
							Object:   &semantic.IdentifierExpression{Name: "r"},
							Property: "_value",
						},
						Right: &semantic.FloatLiteral{
							Value: 5,
						},
					},
				},
			},
			data: []flux.Table{
				&executetest.Table{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "t1", Type: flux.TString},
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{"a", execute.Time(1), 3.0},
						{"a", execute.Time(2), 6.0},
						{"a", execute.Time(2), 1.0},
					},
				},
				&executetest.Table{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "t1", Type: flux.TString},
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{"b", execute.Time(3), 3.0},
						{"b", execute.Time(3), 2.0},
						{"b", execute.Time(4), 8.0},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "t1", Type: flux.TString},
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{"a", execute.Time(2), 6.0},
					},
				},
				{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "t1", Type: flux.TString},
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{"b", execute.Time(4), 8.0},
					},
				},
			},
		},
		{
			name: "_value>5 and t1 = a and t2 = y",
			spec: &functions.FilterProcedureSpec{
				Fn: &semantic.FunctionExpression{
					Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "r"}}},
					Body: &semantic.LogicalExpression{
						Operator: ast.AndOperator,
						Left: &semantic.BinaryExpression{
							Operator: ast.GreaterThanOperator,
							Left: &semantic.MemberExpression{
								Object:   &semantic.IdentifierExpression{Name: "r"},
								Property: "_value",
							},
							Right: &semantic.FloatLiteral{
								Value: 5,
							},
						},
						Right: &semantic.LogicalExpression{
							Operator: ast.AndOperator,
							Left: &semantic.BinaryExpression{
								Operator: ast.EqualOperator,
								Left: &semantic.MemberExpression{
									Object:   &semantic.IdentifierExpression{Name: "r"},
									Property: "t1",
								},
								Right: &semantic.StringLiteral{
									Value: "a",
								},
							},
							Right: &semantic.BinaryExpression{
								Operator: ast.EqualOperator,
								Left: &semantic.MemberExpression{
									Object:   &semantic.IdentifierExpression{Name: "r"},
									Property: "t2",
								},
								Right: &semantic.StringLiteral{
									Value: "y",
								},
							},
						},
					},
				},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "t1", Type: flux.TString},
					{Label: "t2", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(1), 1.0, "a", "x"},
					{execute.Time(2), 6.0, "a", "x"},
					{execute.Time(3), 8.0, "a", "y"},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "t1", Type: flux.TString},
					{Label: "t2", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(3), 8.0, "a", "y"},
				},
			}},
		},
	}
	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			executetest.ProcessTestHelper(
				t,
				tc.data,
				tc.want,
				nil,
				func(d execute.Dataset, c execute.TableBuilderCache) execute.Transformation {
					f, err := functions.NewFilterTransformation(d, c, tc.spec)
					if err != nil {
						t.Fatal(err)
					}
					return f
				},
			)
		})
	}
}

func TestFilter_PushDown(t *testing.T) {
	spec := &functions.FilterProcedureSpec{
		Fn: &semantic.FunctionExpression{
			Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "r"}}},
			Body: &semantic.BinaryExpression{
				Operator: ast.NotEqualOperator,
				Left: &semantic.MemberExpression{
					Object:   &semantic.IdentifierExpression{Name: "r"},
					Property: "_measurement",
				},
				Right: &semantic.StringLiteral{Value: "mem"},
			},
		},
	}
	root := &plan.Procedure{
		Spec: new(functions.FromProcedureSpec),
	}
	want := &plan.Procedure{
		Spec: &functions.FromProcedureSpec{
			FilterSet: true,
			Filter: &semantic.FunctionExpression{
				Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "r"}}},
				Body: &semantic.BinaryExpression{
					Operator: ast.NotEqualOperator,
					Left: &semantic.MemberExpression{
						Object:   &semantic.IdentifierExpression{Name: "r"},
						Property: "_measurement",
					},
					Right: &semantic.StringLiteral{Value: "mem"},
				},
			},
		},
	}

	plantest.PhysicalPlan_PushDown_TestHelper(t, spec, root, false, want)
}

func TestFilter_PushDown_MergeExpressions(t *testing.T) {
	testCases := []struct {
		name string
		spec *functions.FilterProcedureSpec
		root *plan.Procedure
		want *plan.Procedure
	}{
		{
			name: "merge with from",
			spec: &functions.FilterProcedureSpec{
				Fn: &semantic.FunctionExpression{
					Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "r"}}},
					Body: &semantic.BinaryExpression{
						Operator: ast.NotEqualOperator,
						Left: &semantic.MemberExpression{
							Object:   &semantic.IdentifierExpression{Name: "r"},
							Property: "_measurement",
						},
						Right: &semantic.StringLiteral{Value: "cpu"},
					},
				},
			},
			root: &plan.Procedure{
				Spec: &functions.FromProcedureSpec{
					FilterSet: true,
					Filter: &semantic.FunctionExpression{
						Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "r"}}},
						Body: &semantic.BinaryExpression{
							Operator: ast.NotEqualOperator,
							Left: &semantic.MemberExpression{
								Object:   &semantic.IdentifierExpression{Name: "r"},
								Property: "_measurement",
							},
							Right: &semantic.StringLiteral{Value: "mem"},
						},
					},
				},
			},
			want: &plan.Procedure{
				Spec: &functions.FromProcedureSpec{
					FilterSet: true,
					Filter: &semantic.FunctionExpression{
						Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "r"}}},
						Body: &semantic.LogicalExpression{
							Operator: ast.AndOperator,
							Left: &semantic.BinaryExpression{
								Operator: ast.NotEqualOperator,
								Left: &semantic.MemberExpression{
									Object:   &semantic.IdentifierExpression{Name: "r"},
									Property: "_measurement",
								},
								Right: &semantic.StringLiteral{Value: "mem"},
							},
							Right: &semantic.BinaryExpression{
								Operator: ast.NotEqualOperator,
								Left: &semantic.MemberExpression{
									Object:   &semantic.IdentifierExpression{Name: "r"},
									Property: "_measurement",
								},
								Right: &semantic.StringLiteral{Value: "cpu"},
							},
						},
					},
				},
			},
		},
		{
			name: "merge with filter",
			spec: &functions.FilterProcedureSpec{
				Fn: &semantic.FunctionExpression{
					Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "r"}}},
					Body: &semantic.BinaryExpression{
						Operator: ast.NotEqualOperator,
						Left: &semantic.MemberExpression{
							Object:   &semantic.IdentifierExpression{Name: "r"},
							Property: "_measurement",
						},
						Right: &semantic.StringLiteral{Value: "cpu"},
					},
				},
			},
			root: &plan.Procedure{
				Spec: &functions.FilterProcedureSpec{
					Fn: &semantic.FunctionExpression{
						Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "r"}}},
						Body: &semantic.BinaryExpression{
							Operator: ast.NotEqualOperator,
							Left: &semantic.MemberExpression{
								Object:   &semantic.IdentifierExpression{Name: "r"},
								Property: "_measurement",
							},
							Right: &semantic.StringLiteral{Value: "mem"},
						},
					},
				},
			},
			want: &plan.Procedure{
				Spec: &functions.FilterProcedureSpec{
					Fn: &semantic.FunctionExpression{
						Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "r"}}},
						Body: &semantic.LogicalExpression{
							Operator: ast.AndOperator,
							Left: &semantic.BinaryExpression{
								Operator: ast.NotEqualOperator,
								Left: &semantic.MemberExpression{
									Object:   &semantic.IdentifierExpression{Name: "r"},
									Property: "_measurement",
								},
								Right: &semantic.StringLiteral{Value: "mem"},
							},
							Right: &semantic.BinaryExpression{
								Operator: ast.NotEqualOperator,
								Left: &semantic.MemberExpression{
									Object:   &semantic.IdentifierExpression{Name: "r"},
									Property: "_measurement",
								},
								Right: &semantic.StringLiteral{Value: "cpu"},
							},
						},
					},
				},
			},
		},
	}

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			plantest.PhysicalPlan_PushDown_TestHelper(t, tc.spec, tc.root, false, tc.want)
		})
	}
}
