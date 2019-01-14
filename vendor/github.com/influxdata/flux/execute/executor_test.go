package execute_test

import (
	"context"
	"math"
	"testing"
	"time"

	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/flux"
	"github.com/influxdata/flux/ast"
	_ "github.com/influxdata/flux/builtin"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/functions/transformations"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/plan/plantest"
	"github.com/influxdata/flux/semantic"
	"go.uber.org/zap/zaptest"
)

func init() {
	execute.RegisterSource("from-test", executetest.CreateFromSource)
	execute.RegisterTransformation(executetest.ToTestKind, executetest.CreateToTransformation)
	plan.RegisterProcedureSpecWithSideEffect(executetest.ToTestKind, executetest.NewToProcedure, executetest.ToTestKind)
}

func TestExecutor_Execute(t *testing.T) {
	testcases := []struct {
		name string
		spec *plantest.PlanSpec
		want map[string][]*executetest.Table
	}{
		{
			name: `from`,
			spec: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from-test", executetest.NewFromProcedureSpec(
						[]*executetest.Table{&executetest.Table{
							KeyCols: []string{"_start", "_stop"},
							ColMeta: []flux.ColMeta{
								{Label: "_start", Type: flux.TTime},
								{Label: "_stop", Type: flux.TTime},
								{Label: "_time", Type: flux.TTime},
								{Label: "_value", Type: flux.TFloat},
							},
							Data: [][]interface{}{
								{execute.Time(0), execute.Time(5), execute.Time(0), 1.0},
								{execute.Time(0), execute.Time(5), execute.Time(1), 2.0},
								{execute.Time(0), execute.Time(5), execute.Time(2), 3.0},
								{execute.Time(0), execute.Time(5), execute.Time(3), 4.0},
								{execute.Time(0), execute.Time(5), execute.Time(4), 5.0},
							},
						}},
					)),
					plan.CreatePhysicalNode("yield", executetest.NewYieldProcedureSpec("_result")),
				},
				Edges: [][2]int{
					{0, 1},
				},
			},
			want: map[string][]*executetest.Table{
				"_result": []*executetest.Table{{
					KeyCols: []string{"_start", "_stop"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(0), execute.Time(5), execute.Time(0), 1.0},
						{execute.Time(0), execute.Time(5), execute.Time(1), 2.0},
						{execute.Time(0), execute.Time(5), execute.Time(2), 3.0},
						{execute.Time(0), execute.Time(5), execute.Time(3), 4.0},
						{execute.Time(0), execute.Time(5), execute.Time(4), 5.0},
					},
				}},
			},
		},
		{
			name: `from with filter`,
			spec: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from-test", executetest.NewFromProcedureSpec(
						[]*executetest.Table{&executetest.Table{
							KeyCols: []string{"_start", "_stop"},
							ColMeta: []flux.ColMeta{
								{Label: "_start", Type: flux.TTime},
								{Label: "_stop", Type: flux.TTime},
								{Label: "_time", Type: flux.TTime},
								{Label: "_value", Type: flux.TFloat},
							},
							Data: [][]interface{}{
								{execute.Time(0), execute.Time(5), execute.Time(0), 1.0},
								{execute.Time(0), execute.Time(5), execute.Time(1), 2.0},
								{execute.Time(0), execute.Time(5), execute.Time(2), 3.0},
								{execute.Time(0), execute.Time(5), execute.Time(3), 4.0},
								{execute.Time(0), execute.Time(5), execute.Time(4), 5.0},
							},
						}},
					)),
					plan.CreatePhysicalNode("filter", &transformations.FilterProcedureSpec{
						Fn: &semantic.FunctionExpression{
							Block: &semantic.FunctionBlock{
								Parameters: &semantic.FunctionParameters{
									List: []*semantic.FunctionParameter{
										{
											Key: &semantic.Identifier{Name: "r"},
										},
									},
								},
								Body: &semantic.BinaryExpression{
									Operator: ast.LessThanOperator,
									Left: &semantic.MemberExpression{
										Property: "_value",
										Object: &semantic.IdentifierExpression{
											Name: "r",
										},
									},
									Right: &semantic.FloatLiteral{Value: 2.5},
								},
							},
						},
					}),
					plan.CreatePhysicalNode("yield", executetest.NewYieldProcedureSpec("_result")),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
				},
			},
			want: map[string][]*executetest.Table{
				"_result": []*executetest.Table{{
					KeyCols: []string{"_start", "_stop"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(0), execute.Time(5), execute.Time(0), 1.0},
						{execute.Time(0), execute.Time(5), execute.Time(1), 2.0},
					},
				}},
			},
		},
		{
			name: `from with filter with multiple tables`,
			spec: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from-test", executetest.NewFromProcedureSpec(
						[]*executetest.Table{
							{
								KeyCols: []string{"_start", "_stop"},
								ColMeta: []flux.ColMeta{
									{Label: "_start", Type: flux.TTime},
									{Label: "_stop", Type: flux.TTime},
									{Label: "_time", Type: flux.TTime},
									{Label: "_value", Type: flux.TFloat},
								},
								Data: [][]interface{}{
									{execute.Time(0), execute.Time(5), execute.Time(0), 1.0},
									{execute.Time(0), execute.Time(5), execute.Time(1), 2.0},
									{execute.Time(0), execute.Time(5), execute.Time(2), 3.0},
									{execute.Time(0), execute.Time(5), execute.Time(3), 4.0},
									{execute.Time(0), execute.Time(5), execute.Time(4), 5.0},
								},
							},
							{
								KeyCols: []string{"_start", "_stop"},
								ColMeta: []flux.ColMeta{
									{Label: "_start", Type: flux.TTime},
									{Label: "_stop", Type: flux.TTime},
									{Label: "_time", Type: flux.TTime},
									{Label: "_value", Type: flux.TFloat},
								},
								Data: [][]interface{}{
									{execute.Time(5), execute.Time(10), execute.Time(5), 5.0},
									{execute.Time(5), execute.Time(10), execute.Time(6), 6.0},
									{execute.Time(5), execute.Time(10), execute.Time(7), 7.0},
									{execute.Time(5), execute.Time(10), execute.Time(8), 8.0},
									{execute.Time(5), execute.Time(10), execute.Time(9), 9.0},
								},
							},
						},
					)),
					plan.CreatePhysicalNode("filter", &transformations.FilterProcedureSpec{
						Fn: &semantic.FunctionExpression{
							Block: &semantic.FunctionBlock{
								Parameters: &semantic.FunctionParameters{
									List: []*semantic.FunctionParameter{
										{
											Key: &semantic.Identifier{Name: "r"},
										},
									},
								},
								Body: &semantic.BinaryExpression{
									Operator: ast.LessThanOperator,
									Left: &semantic.MemberExpression{
										Property: "_value",
										Object: &semantic.IdentifierExpression{
											Name: "r",
										},
									},
									Right: &semantic.FloatLiteral{Value: 7.5},
								},
							},
						},
					}),
					plan.CreatePhysicalNode("yield", executetest.NewYieldProcedureSpec("_result")),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
				},
			},
			want: map[string][]*executetest.Table{
				"_result": []*executetest.Table{
					{
						KeyCols: []string{"_start", "_stop"},
						ColMeta: []flux.ColMeta{
							{Label: "_start", Type: flux.TTime},
							{Label: "_stop", Type: flux.TTime},
							{Label: "_time", Type: flux.TTime},
							{Label: "_value", Type: flux.TFloat},
						},
						Data: [][]interface{}{
							{execute.Time(0), execute.Time(5), execute.Time(0), 1.0},
							{execute.Time(0), execute.Time(5), execute.Time(1), 2.0},
							{execute.Time(0), execute.Time(5), execute.Time(2), 3.0},
							{execute.Time(0), execute.Time(5), execute.Time(3), 4.0},
							{execute.Time(0), execute.Time(5), execute.Time(4), 5.0},
						},
					},
					{
						KeyCols: []string{"_start", "_stop"},
						ColMeta: []flux.ColMeta{
							{Label: "_start", Type: flux.TTime},
							{Label: "_stop", Type: flux.TTime},
							{Label: "_time", Type: flux.TTime},
							{Label: "_value", Type: flux.TFloat},
						},
						Data: [][]interface{}{
							{execute.Time(5), execute.Time(10), execute.Time(5), 5.0},
							{execute.Time(5), execute.Time(10), execute.Time(6), 6.0},
							{execute.Time(5), execute.Time(10), execute.Time(7), 7.0},
						},
					},
				},
			},
		},
		{
			name: `multiple aggregates`,
			spec: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from-test", executetest.NewFromProcedureSpec(
						[]*executetest.Table{
							{
								KeyCols: []string{"_start", "_stop"},
								ColMeta: []flux.ColMeta{
									{Label: "_start", Type: flux.TTime},
									{Label: "_stop", Type: flux.TTime},
									{Label: "_time", Type: flux.TTime},
									{Label: "_value", Type: flux.TFloat},
								},
								Data: [][]interface{}{
									{execute.Time(0), execute.Time(5), execute.Time(0), 1.0},
									{execute.Time(0), execute.Time(5), execute.Time(1), 2.0},
									{execute.Time(0), execute.Time(5), execute.Time(2), 3.0},
									{execute.Time(0), execute.Time(5), execute.Time(3), 4.0},
									{execute.Time(0), execute.Time(5), execute.Time(4), 5.0},
								},
							},
							{
								KeyCols: []string{"_start", "_stop"},
								ColMeta: []flux.ColMeta{
									{Label: "_start", Type: flux.TTime},
									{Label: "_stop", Type: flux.TTime},
									{Label: "_time", Type: flux.TTime},
									{Label: "_value", Type: flux.TFloat},
								},
								Data: [][]interface{}{
									{execute.Time(5), execute.Time(10), execute.Time(5), 5.0},
									{execute.Time(5), execute.Time(10), execute.Time(6), 6.0},
									{execute.Time(5), execute.Time(10), execute.Time(7), 7.0},
									{execute.Time(5), execute.Time(10), execute.Time(8), 8.0},
									{execute.Time(5), execute.Time(10), execute.Time(9), 9.0},
								},
							},
						},
					)),
					plan.CreatePhysicalNode("sum", &transformations.SumProcedureSpec{
						AggregateConfig: execute.DefaultAggregateConfig,
					}),
					plan.CreatePhysicalNode("mean", &transformations.MeanProcedureSpec{
						AggregateConfig: execute.DefaultAggregateConfig,
					}),
					plan.CreatePhysicalNode("yield", executetest.NewYieldProcedureSpec("sum")),
					plan.CreatePhysicalNode("yield", executetest.NewYieldProcedureSpec("mean")),
				},
				Edges: [][2]int{
					{0, 1},
					{0, 2},
					{1, 3},
					{2, 4},
				},
			},
			want: map[string][]*executetest.Table{
				"sum": []*executetest.Table{
					{
						KeyCols: []string{"_start", "_stop"},
						ColMeta: []flux.ColMeta{
							{Label: "_start", Type: flux.TTime},
							{Label: "_stop", Type: flux.TTime},
							{Label: "_value", Type: flux.TFloat},
						},
						Data: [][]interface{}{
							{execute.Time(0), execute.Time(5), 15.0},
						},
					},
					{
						KeyCols: []string{"_start", "_stop"},
						ColMeta: []flux.ColMeta{
							{Label: "_start", Type: flux.TTime},
							{Label: "_stop", Type: flux.TTime},
							{Label: "_value", Type: flux.TFloat},
						},
						Data: [][]interface{}{
							{execute.Time(5), execute.Time(10), 35.0},
						},
					},
				},
				"mean": []*executetest.Table{
					{
						KeyCols: []string{"_start", "_stop"},
						ColMeta: []flux.ColMeta{
							{Label: "_start", Type: flux.TTime},
							{Label: "_stop", Type: flux.TTime},
							{Label: "_value", Type: flux.TFloat},
						},
						Data: [][]interface{}{
							{execute.Time(0), execute.Time(5), 3.0},
						},
					},
					{
						KeyCols: []string{"_start", "_stop"},
						ColMeta: []flux.ColMeta{
							{Label: "_start", Type: flux.TTime},
							{Label: "_stop", Type: flux.TTime},
							{Label: "_value", Type: flux.TFloat},
						},
						Data: [][]interface{}{
							{execute.Time(5), execute.Time(10), 7.0},
						},
					},
				},
			},
		},
		{
			name: `diamond join`,
			spec: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from-test", executetest.NewFromProcedureSpec(
						[]*executetest.Table{
							{
								KeyCols: []string{"_start", "_stop"},
								ColMeta: []flux.ColMeta{
									{Label: "_start", Type: flux.TTime},
									{Label: "_stop", Type: flux.TTime},
									{Label: "_time", Type: flux.TTime},
									{Label: "_value", Type: flux.TFloat},
								},
								Data: [][]interface{}{
									{execute.Time(0), execute.Time(5), execute.Time(0), 1.0},
									{execute.Time(0), execute.Time(5), execute.Time(1), 2.0},
									{execute.Time(0), execute.Time(5), execute.Time(2), 3.0},
									{execute.Time(0), execute.Time(5), execute.Time(3), 4.0},
									{execute.Time(0), execute.Time(5), execute.Time(4), 5.0},
								},
							},
							{
								KeyCols: []string{"_start", "_stop"},
								ColMeta: []flux.ColMeta{
									{Label: "_start", Type: flux.TTime},
									{Label: "_stop", Type: flux.TTime},
									{Label: "_time", Type: flux.TTime},
									{Label: "_value", Type: flux.TFloat},
								},
								Data: [][]interface{}{
									{execute.Time(5), execute.Time(10), execute.Time(5), 1.0},
									{execute.Time(5), execute.Time(10), execute.Time(6), 2.0},
									{execute.Time(5), execute.Time(10), execute.Time(7), 3.0},
									{execute.Time(5), execute.Time(10), execute.Time(8), 4.0},
									{execute.Time(5), execute.Time(10), execute.Time(9), 5.0},
								},
							},
							{
								KeyCols: []string{"_start", "_stop"},
								ColMeta: []flux.ColMeta{
									{Label: "_start", Type: flux.TTime},
									{Label: "_stop", Type: flux.TTime},
									{Label: "_time", Type: flux.TTime},
									{Label: "_value", Type: flux.TFloat},
								},
								Data: [][]interface{}{
									{execute.Time(10), execute.Time(15), execute.Time(10), 1.0},
									{execute.Time(10), execute.Time(15), execute.Time(11), 2.0},
									{execute.Time(10), execute.Time(15), execute.Time(12), 3.0},
									{execute.Time(10), execute.Time(15), execute.Time(13), 4.0},
									{execute.Time(10), execute.Time(15), execute.Time(14), 5.0},
								},
							},
						},
					)),
					plan.CreatePhysicalNode("sum", &transformations.SumProcedureSpec{
						AggregateConfig: execute.DefaultAggregateConfig,
					}),
					plan.CreatePhysicalNode("count", &transformations.CountProcedureSpec{
						AggregateConfig: execute.DefaultAggregateConfig,
					}),
					plan.CreatePhysicalNode("join", &transformations.MergeJoinProcedureSpec{
						On:         []string{"_start", "_stop"},
						TableNames: []string{"a", "b"},
					}),
					plan.CreatePhysicalNode("yield", executetest.NewYieldProcedureSpec("_result")),
				},
				Edges: [][2]int{
					{0, 1},
					{0, 2},
					{1, 3},
					{2, 3},
					{3, 4},
				},
			},
			want: map[string][]*executetest.Table{
				"_result": []*executetest.Table{
					{
						KeyCols: []string{"_start", "_stop"},
						ColMeta: []flux.ColMeta{
							{Label: "_start", Type: flux.TTime},
							{Label: "_stop", Type: flux.TTime},
							{Label: "_value_a", Type: flux.TFloat},
							{Label: "_value_b", Type: flux.TInt},
						},
						Data: [][]interface{}{
							{execute.Time(0), execute.Time(5), 15.0, int64(5)},
						},
					},
					{
						KeyCols: []string{"_start", "_stop"},
						ColMeta: []flux.ColMeta{
							{Label: "_start", Type: flux.TTime},
							{Label: "_stop", Type: flux.TTime},
							{Label: "_value_a", Type: flux.TFloat},
							{Label: "_value_b", Type: flux.TInt},
						},
						Data: [][]interface{}{
							{execute.Time(5), execute.Time(10), 15.0, int64(5)},
						},
					},
					{
						KeyCols: []string{"_start", "_stop"},
						ColMeta: []flux.ColMeta{
							{Label: "_start", Type: flux.TTime},
							{Label: "_stop", Type: flux.TTime},
							{Label: "_value_a", Type: flux.TFloat},
							{Label: "_value_b", Type: flux.TInt},
						},
						Data: [][]interface{}{
							{execute.Time(10), execute.Time(15), 15.0, int64(5)},
						},
					},
				},
			},
		},
		{
			name: "yield with successor",
			spec: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from-test", executetest.NewFromProcedureSpec(
						[]*executetest.Table{&executetest.Table{
							KeyCols: []string{"_start", "_stop"},
							ColMeta: []flux.ColMeta{
								{Label: "_start", Type: flux.TTime},
								{Label: "_stop", Type: flux.TTime},
								{Label: "_time", Type: flux.TTime},
								{Label: "_value", Type: flux.TFloat},
							},
							Data: [][]interface{}{
								{execute.Time(0), execute.Time(5), execute.Time(0), 1.0},
								{execute.Time(0), execute.Time(5), execute.Time(1), 2.0},
								{execute.Time(0), execute.Time(5), execute.Time(2), 3.0},
								{execute.Time(0), execute.Time(5), execute.Time(3), 4.0},
								{execute.Time(0), execute.Time(5), execute.Time(4), 5.0},
							},
						}},
					)),
					plan.CreatePhysicalNode("yield0", executetest.NewYieldProcedureSpec("from")),
					plan.CreatePhysicalNode("sum", &transformations.SumProcedureSpec{
						AggregateConfig: execute.DefaultAggregateConfig,
					}),
					plan.CreatePhysicalNode("yield1", executetest.NewYieldProcedureSpec("sum")),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
					{2, 3},
				},
			},
			want: map[string][]*executetest.Table{
				"from": []*executetest.Table{{
					KeyCols: []string{"_start", "_stop"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(0), execute.Time(5), execute.Time(0), 1.0},
						{execute.Time(0), execute.Time(5), execute.Time(1), 2.0},
						{execute.Time(0), execute.Time(5), execute.Time(2), 3.0},
						{execute.Time(0), execute.Time(5), execute.Time(3), 4.0},
						{execute.Time(0), execute.Time(5), execute.Time(4), 5.0},
					},
				}},
				"sum": []*executetest.Table{{
					KeyCols: []string{"_start", "_stop"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(0), execute.Time(5), 15.0},
					},
				}},
			},
		},
		{
			name: "adjacent yields",
			spec: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from-test", executetest.NewFromProcedureSpec(
						[]*executetest.Table{&executetest.Table{
							KeyCols: []string{"_start", "_stop"},
							ColMeta: []flux.ColMeta{
								{Label: "_start", Type: flux.TTime},
								{Label: "_stop", Type: flux.TTime},
								{Label: "_time", Type: flux.TTime},
								{Label: "_value", Type: flux.TFloat},
							},
							Data: [][]interface{}{
								{execute.Time(0), execute.Time(5), execute.Time(0), 1.0},
								{execute.Time(0), execute.Time(5), execute.Time(1), 2.0},
								{execute.Time(0), execute.Time(5), execute.Time(2), 3.0},
								{execute.Time(0), execute.Time(5), execute.Time(3), 4.0},
								{execute.Time(0), execute.Time(5), execute.Time(4), 5.0},
							},
						}},
					)),
					plan.CreatePhysicalNode("sum", &transformations.SumProcedureSpec{
						AggregateConfig: execute.DefaultAggregateConfig,
					}),
					plan.CreatePhysicalNode("yield0", executetest.NewYieldProcedureSpec("sum0")),
					plan.CreatePhysicalNode("yield1", executetest.NewYieldProcedureSpec("sum1")),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
					{2, 3},
				},
			},
			want: map[string][]*executetest.Table{
				"sum0": []*executetest.Table{{
					KeyCols: []string{"_start", "_stop"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(0), execute.Time(5), 15.0},
					},
				}},
				"sum1": []*executetest.Table{{
					KeyCols: []string{"_start", "_stop"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(0), execute.Time(5), 15.0},
					},
				}},
			},
		},
		{
			name: "terminal output function",
			spec: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from-test", executetest.NewFromProcedureSpec(
						[]*executetest.Table{&executetest.Table{
							KeyCols: []string{"_start", "_stop"},
							ColMeta: []flux.ColMeta{
								{Label: "_start", Type: flux.TTime},
								{Label: "_stop", Type: flux.TTime},
								{Label: "_time", Type: flux.TTime},
								{Label: "_value", Type: flux.TFloat},
							},
							Data: [][]interface{}{
								{execute.Time(0), execute.Time(5), execute.Time(0), 1.0},
								{execute.Time(0), execute.Time(5), execute.Time(1), 2.0},
								{execute.Time(0), execute.Time(5), execute.Time(2), 3.0},
								{execute.Time(0), execute.Time(5), execute.Time(3), 4.0},
								{execute.Time(0), execute.Time(5), execute.Time(4), 5.0},
							},
						}},
					)),
					plan.CreatePhysicalNode("to", &executetest.ToProcedureSpec{}),
				},
				Edges: [][2]int{{0, 1}},
			},
			want: map[string][]*executetest.Table{
				"to": []*executetest.Table{&executetest.Table{
					KeyCols: []string{"_start", "_stop"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(0), execute.Time(5), execute.Time(0), 1.0},
						{execute.Time(0), execute.Time(5), execute.Time(1), 2.0},
						{execute.Time(0), execute.Time(5), execute.Time(2), 3.0},
						{execute.Time(0), execute.Time(5), execute.Time(3), 4.0},
						{execute.Time(0), execute.Time(5), execute.Time(4), 5.0},
					},
				}},
			},
		},
	}

	for _, tc := range testcases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {

			tc.spec.Resources = flux.ResourceManagement{
				ConcurrencyQuota: 1,
				MemoryBytesQuota: math.MaxInt64,
			}

			tc.spec.Now = time.Now()

			// Construct physical query plan
			plan := plantest.CreatePlanSpec(tc.spec)

			exe := execute.NewExecutor(nil, zaptest.NewLogger(t))
			results, err := exe.Execute(context.Background(), plan, executetest.UnlimitedAllocator)
			if err != nil {
				t.Fatal(err)
			}
			got := make(map[string][]*executetest.Table, len(results))
			for name, r := range results {
				if err := r.Tables().Do(func(tbl flux.Table) error {
					cb, err := executetest.ConvertTable(tbl)
					if err != nil {
						return err
					}
					got[name] = append(got[name], cb)
					return nil
				}); err != nil {
					t.Fatal(err)
				}
			}

			for _, g := range got {
				executetest.NormalizeTables(g)
			}
			for _, w := range tc.want {
				executetest.NormalizeTables(w)
			}

			if !cmp.Equal(got, tc.want) {
				t.Error("unexpected results -want/+got", cmp.Diff(tc.want, got))
			}
		})
	}
}
