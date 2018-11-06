package transformations_test

import (
	"testing"

	"github.com/influxdata/flux/functions/inputs"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/ast"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/functions/transformations"
	"github.com/influxdata/flux/querytest"
	"github.com/influxdata/flux/semantic"
)

func TestMap_NewQuery(t *testing.T) {
	tests := []querytest.NewQueryTestCase{
		{
			Name: "simple static map",
			Raw:  `from(bucket:"mybucket") |> map(fn: (r) => r._value + 1)`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &inputs.FromOpSpec{
							Bucket: "mybucket",
						},
					},
					{
						ID: "map1",
						Spec: &transformations.MapOpSpec{
							MergeKey: true,
							Fn: &semantic.FunctionExpression{
								Block: &semantic.FunctionBlock{
									Parameters: &semantic.FunctionParameters{
										List: []*semantic.FunctionParameter{{Key: &semantic.Identifier{Name: "r"}}},
									},
									Body: &semantic.BinaryExpression{
										Operator: ast.AdditionOperator,
										Left: &semantic.MemberExpression{
											Object: &semantic.IdentifierExpression{
												Name: "r",
											},
											Property: "_value",
										},
										Right: &semantic.IntegerLiteral{Value: 1},
									},
								},
							},
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "map1"},
				},
			},
		},
		{
			Name: "resolve map",
			Raw:  `x = 2 from(bucket:"mybucket") |> map(fn: (r) => r._value + x)`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &inputs.FromOpSpec{
							Bucket: "mybucket",
						},
					},
					{
						ID: "map1",
						Spec: &transformations.MapOpSpec{
							MergeKey: true,
							Fn: &semantic.FunctionExpression{
								Block: &semantic.FunctionBlock{
									Parameters: &semantic.FunctionParameters{
										List: []*semantic.FunctionParameter{{Key: &semantic.Identifier{Name: "r"}}},
									},
									Body: &semantic.BinaryExpression{
										Operator: ast.AdditionOperator,
										Left: &semantic.MemberExpression{
											Object: &semantic.IdentifierExpression{
												Name: "r",
											},
											Property: "_value",
										},
										Right: &semantic.IntegerLiteral{Value: 2},
									},
								},
							},
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "map1"},
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

func TestMapOperation_Marshaling(t *testing.T) {
	data := []byte(`{
		"id":"map",
		"kind":"map",
		"spec":{
			"fn":{
				"type": "FunctionExpression",
				"block":{
					"type":"FunctionBlock",
					"parameters": {
						"type":"FunctionParameters",
						"list": [
							{"type":"FunctionParam","key":{"type":"Identifier","name":"r"}}
						]
					},
					"body":{
						"type":"BinaryExpression",
						"operator": "-",
						"left":{
							"type":"MemberExpression",
							"object": {
								"type": "IdentifierExpression",
								"name":"r"
							},
							"property": "_value"
						},
						"right":{
							"type":"FloatLiteral",
							"value": 5.6
						}
					}
				}
			}
		}
	}`)
	op := &flux.Operation{
		ID: "map",
		Spec: &transformations.MapOpSpec{
			Fn: &semantic.FunctionExpression{
				Block: &semantic.FunctionBlock{
					Parameters: &semantic.FunctionParameters{
						List: []*semantic.FunctionParameter{{Key: &semantic.Identifier{Name: "r"}}},
					},
					Body: &semantic.BinaryExpression{
						Operator: ast.SubtractionOperator,
						Left: &semantic.MemberExpression{
							Object: &semantic.IdentifierExpression{
								Name: "r",
							},
							Property: "_value",
						},
						Right: &semantic.FloatLiteral{Value: 5.6},
					},
				},
			},
		},
	}
	querytest.OperationMarshalingTestHelper(t, data, op)
}
func TestMap_Process(t *testing.T) {
	testCases := []struct {
		name string
		spec *transformations.MapProcedureSpec
		data []flux.Table
		want []*executetest.Table
	}{
		{
			name: `_value+5`,
			spec: &transformations.MapProcedureSpec{
				MergeKey: false,
				Fn: &semantic.FunctionExpression{
					Block: &semantic.FunctionBlock{
						Parameters: &semantic.FunctionParameters{
							List: []*semantic.FunctionParameter{{Key: &semantic.Identifier{Name: "r"}}},
						},
						Body: &semantic.ObjectExpression{
							Properties: []*semantic.Property{
								{
									Key: &semantic.Identifier{Name: "_time"},
									Value: &semantic.MemberExpression{
										Object: &semantic.IdentifierExpression{
											Name: "r",
										},
										Property: "_time",
									},
								},
								{
									Key: &semantic.Identifier{Name: "_value"},
									Value: &semantic.BinaryExpression{
										Operator: ast.AdditionOperator,
										Left: &semantic.MemberExpression{
											Object: &semantic.IdentifierExpression{
												Name: "r",
											},
											Property: "_value",
										},
										Right: &semantic.FloatLiteral{
											Value: 5,
										},
									},
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
					{execute.Time(1), 6.0},
					{execute.Time(2), 11.0},
				},
			}},
		},
		{
			name: `_value+5 mergeKey=true`,
			spec: &transformations.MapProcedureSpec{
				MergeKey: true,
				Fn: &semantic.FunctionExpression{
					Block: &semantic.FunctionBlock{
						Parameters: &semantic.FunctionParameters{
							List: []*semantic.FunctionParameter{{Key: &semantic.Identifier{Name: "r"}}},
						},
						Body: &semantic.ObjectExpression{
							Properties: []*semantic.Property{
								{
									Key: &semantic.Identifier{Name: "_time"},
									Value: &semantic.MemberExpression{
										Object: &semantic.IdentifierExpression{
											Name: "r",
										},
										Property: "_time",
									},
								},
								{
									Key: &semantic.Identifier{Name: "_value"},
									Value: &semantic.BinaryExpression{
										Operator: ast.AdditionOperator,
										Left: &semantic.MemberExpression{
											Object: &semantic.IdentifierExpression{
												Name: "r",
											},
											Property: "_value",
										},
										Right: &semantic.FloatLiteral{
											Value: 5,
										},
									},
								},
							},
						},
					},
				},
			},
			data: []flux.Table{&executetest.Table{
				KeyCols: []string{"_measurement", "host"},
				ColMeta: []flux.ColMeta{
					{Label: "_measurement", Type: flux.TString},
					{Label: "host", Type: flux.TString},
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{"m", "A", execute.Time(1), 1.0},
					{"m", "A", execute.Time(2), 6.0},
				},
			}},
			want: []*executetest.Table{{
				KeyCols: []string{"_measurement", "host"},
				ColMeta: []flux.ColMeta{
					{Label: "_measurement", Type: flux.TString},
					{Label: "host", Type: flux.TString},
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{"m", "A", execute.Time(1), 6.0},
					{"m", "A", execute.Time(2), 11.0},
				},
			}},
		},
		{
			name: `_value+5 mergeKey=false drop cols`,
			spec: &transformations.MapProcedureSpec{
				MergeKey: false,
				Fn: &semantic.FunctionExpression{
					Block: &semantic.FunctionBlock{
						Parameters: &semantic.FunctionParameters{
							List: []*semantic.FunctionParameter{{Key: &semantic.Identifier{Name: "r"}}},
						},
						Body: &semantic.ObjectExpression{
							Properties: []*semantic.Property{
								{
									Key: &semantic.Identifier{Name: "_time"},
									Value: &semantic.MemberExpression{
										Object: &semantic.IdentifierExpression{
											Name: "r",
										},
										Property: "_time",
									},
								},
								{
									Key: &semantic.Identifier{Name: "_value"},
									Value: &semantic.BinaryExpression{
										Operator: ast.AdditionOperator,
										Left: &semantic.MemberExpression{
											Object: &semantic.IdentifierExpression{
												Name: "r",
											},
											Property: "_value",
										},
										Right: &semantic.FloatLiteral{
											Value: 5,
										},
									},
								},
							},
						},
					},
				},
			},
			data: []flux.Table{&executetest.Table{
				KeyCols: []string{"_measurement", "host"},
				ColMeta: []flux.ColMeta{
					{Label: "_measurement", Type: flux.TString},
					{Label: "host", Type: flux.TString},
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{"m", "A", execute.Time(1), 1.0},
					{"m", "A", execute.Time(2), 6.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), 6.0},
					{execute.Time(2), 11.0},
				},
			}},
		},
		{
			name: `_value+5 mergeKey=true regroup`,
			spec: &transformations.MapProcedureSpec{
				MergeKey: true,
				Fn: &semantic.FunctionExpression{
					Block: &semantic.FunctionBlock{
						Parameters: &semantic.FunctionParameters{
							List: []*semantic.FunctionParameter{{Key: &semantic.Identifier{Name: "r"}}},
						},
						Body: &semantic.ObjectExpression{
							Properties: []*semantic.Property{
								{
									Key: &semantic.Identifier{Name: "_time"},
									Value: &semantic.MemberExpression{
										Object: &semantic.IdentifierExpression{
											Name: "r",
										},
										Property: "_time",
									},
								},
								{
									Key: &semantic.Identifier{Name: "host"},
									Value: &semantic.BinaryExpression{
										Operator: ast.AdditionOperator,
										Left: &semantic.MemberExpression{
											Object: &semantic.IdentifierExpression{
												Name: "r",
											},
											Property: "host",
										},
										Right: &semantic.StringLiteral{Value: ".local"},
									},
								},
								{
									Key: &semantic.Identifier{Name: "_value"},
									Value: &semantic.BinaryExpression{
										Operator: ast.AdditionOperator,
										Left: &semantic.MemberExpression{
											Object: &semantic.IdentifierExpression{
												Name: "r",
											},
											Property: "_value",
										},
										Right: &semantic.FloatLiteral{
											Value: 5,
										},
									},
								},
							},
						},
					},
				},
			},
			data: []flux.Table{&executetest.Table{
				KeyCols: []string{"_measurement", "host"},
				ColMeta: []flux.ColMeta{
					{Label: "_measurement", Type: flux.TString},
					{Label: "host", Type: flux.TString},
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{"m", "A", execute.Time(1), 1.0},
					{"m", "A", execute.Time(2), 6.0},
				},
			}},
			want: []*executetest.Table{{
				KeyCols: []string{"_measurement", "host"},
				ColMeta: []flux.ColMeta{
					{Label: "_measurement", Type: flux.TString},
					{Label: "host", Type: flux.TString},
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{"m", "A.local", execute.Time(1), 6.0},
					{"m", "A.local", execute.Time(2), 11.0},
				},
			}},
		},
		{
			name: `_value+5 mergeKey=true regroup fan out`,
			spec: &transformations.MapProcedureSpec{
				MergeKey: true,
				Fn: &semantic.FunctionExpression{
					Block: &semantic.FunctionBlock{
						Parameters: &semantic.FunctionParameters{
							List: []*semantic.FunctionParameter{{Key: &semantic.Identifier{Name: "r"}}},
						},
						Body: &semantic.ObjectExpression{
							Properties: []*semantic.Property{
								{
									Key: &semantic.Identifier{Name: "_time"},
									Value: &semantic.MemberExpression{
										Object: &semantic.IdentifierExpression{
											Name: "r",
										},
										Property: "_time",
									},
								},
								{
									Key: &semantic.Identifier{Name: "host"},
									Value: &semantic.BinaryExpression{
										Operator: ast.AdditionOperator,
										Left: &semantic.MemberExpression{
											Object: &semantic.IdentifierExpression{
												Name: "r",
											},
											Property: "host",
										},
										Right: &semantic.BinaryExpression{
											Operator: ast.AdditionOperator,
											Left:     &semantic.StringLiteral{Value: "."},
											Right: &semantic.MemberExpression{
												Object: &semantic.IdentifierExpression{
													Name: "r",
												},
												Property: "domain",
											},
										},
									},
								},
								{
									Key: &semantic.Identifier{Name: "_value"},
									Value: &semantic.BinaryExpression{
										Operator: ast.AdditionOperator,
										Left: &semantic.MemberExpression{
											Object: &semantic.IdentifierExpression{
												Name: "r",
											},
											Property: "_value",
										},
										Right: &semantic.FloatLiteral{
											Value: 5,
										},
									},
								},
							},
						},
					},
				},
			},
			data: []flux.Table{&executetest.Table{
				KeyCols: []string{"_measurement", "host"},
				ColMeta: []flux.ColMeta{
					{Label: "_measurement", Type: flux.TString},
					{Label: "host", Type: flux.TString},
					{Label: "domain", Type: flux.TString},
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{"m", "A", "example.com", execute.Time(1), 1.0},
					{"m", "A", "www.example.com", execute.Time(2), 6.0},
				},
			}},
			want: []*executetest.Table{
				{
					KeyCols: []string{"_measurement", "host"},
					ColMeta: []flux.ColMeta{
						{Label: "_measurement", Type: flux.TString},
						{Label: "host", Type: flux.TString},
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{"m", "A.example.com", execute.Time(1), 6.0},
					},
				},
				{
					KeyCols: []string{"_measurement", "host"},
					ColMeta: []flux.ColMeta{
						{Label: "_measurement", Type: flux.TString},
						{Label: "host", Type: flux.TString},
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{"m", "A.www.example.com", execute.Time(2), 11.0},
					},
				},
			},
		},
		{
			name: `_value*_value`,
			spec: &transformations.MapProcedureSpec{
				MergeKey: false,
				Fn: &semantic.FunctionExpression{
					Block: &semantic.FunctionBlock{
						Parameters: &semantic.FunctionParameters{
							List: []*semantic.FunctionParameter{{Key: &semantic.Identifier{Name: "r"}}},
						},
						Body: &semantic.ObjectExpression{
							Properties: []*semantic.Property{
								{
									Key: &semantic.Identifier{Name: "_time"},
									Value: &semantic.MemberExpression{
										Object: &semantic.IdentifierExpression{
											Name: "r",
										},
										Property: "_time",
									},
								},
								{
									Key: &semantic.Identifier{Name: "_value"},
									Value: &semantic.BinaryExpression{
										Operator: ast.MultiplicationOperator,
										Left: &semantic.MemberExpression{
											Object: &semantic.IdentifierExpression{
												Name: "r",
											},
											Property: "_value",
										},
										Right: &semantic.MemberExpression{
											Object: &semantic.IdentifierExpression{
												Name: "r",
											},
											Property: "_value",
										},
									},
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
					{execute.Time(1), 1.0},
					{execute.Time(2), 36.0},
				},
			}},
		},
		{
			name: "float(r._value) int",
			spec: &transformations.MapProcedureSpec{
				MergeKey: false,
				Fn: &semantic.FunctionExpression{
					Block: &semantic.FunctionBlock{
						Parameters: &semantic.FunctionParameters{
							List: []*semantic.FunctionParameter{{Key: &semantic.Identifier{Name: "r"}}},
						},
						Body: &semantic.ObjectExpression{
							Properties: []*semantic.Property{
								{
									Key: &semantic.Identifier{Name: "_time"},
									Value: &semantic.MemberExpression{
										Object: &semantic.IdentifierExpression{
											Name: "r",
										},
										Property: "_time",
									},
								},
								{
									Key: &semantic.Identifier{Name: "_value"},
									Value: &semantic.CallExpression{
										Callee: &semantic.IdentifierExpression{Name: "float"},
										Arguments: &semantic.ObjectExpression{
											Properties: []*semantic.Property{{
												Key: &semantic.Identifier{Name: "v"},
												Value: &semantic.MemberExpression{
													Object: &semantic.IdentifierExpression{
														Name: "r",
													},
													Property: "_value",
												},
											}},
										},
									},
								},
							},
						},
					},
				},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TInt},
				},
				Data: [][]interface{}{
					{execute.Time(1), int64(1)},
					{execute.Time(2), int64(6)},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), 1.0},
					{execute.Time(2), 6.0},
				},
			}},
		},
		{
			name: "float(r._value) uint",
			spec: &transformations.MapProcedureSpec{
				MergeKey: false,
				Fn: &semantic.FunctionExpression{
					Block: &semantic.FunctionBlock{
						Parameters: &semantic.FunctionParameters{
							List: []*semantic.FunctionParameter{{Key: &semantic.Identifier{Name: "r"}}},
						},
						Body: &semantic.ObjectExpression{
							Properties: []*semantic.Property{
								{
									Key: &semantic.Identifier{Name: "_time"},
									Value: &semantic.MemberExpression{
										Object: &semantic.IdentifierExpression{
											Name: "r",
										},
										Property: "_time",
									},
								},
								{
									Key: &semantic.Identifier{Name: "_value"},
									Value: &semantic.CallExpression{
										Callee: &semantic.IdentifierExpression{Name: "float"},
										Arguments: &semantic.ObjectExpression{
											Properties: []*semantic.Property{{
												Key: &semantic.Identifier{Name: "v"},
												Value: &semantic.MemberExpression{
													Object: &semantic.IdentifierExpression{
														Name: "r",
													},
													Property: "_value",
												},
											}},
										},
									},
								},
							},
						},
					},
				},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TUInt},
				},
				Data: [][]interface{}{
					{execute.Time(1), uint64(1)},
					{execute.Time(2), uint64(6)},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), 1.0},
					{execute.Time(2), 6.0},
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
					f, err := transformations.NewMapTransformation(d, c, tc.spec)
					if err != nil {
						t.Fatal(err)
					}
					return f
				},
			)
		})
	}
}
