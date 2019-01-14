package inputs_test

import (
	"testing"
	"time"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/ast"
	"github.com/influxdata/flux/functions"
	"github.com/influxdata/flux/functions/inputs"
	"github.com/influxdata/flux/functions/transformations"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/plan/plantest"
	"github.com/influxdata/flux/semantic"
)

func yield(name string) *transformations.YieldProcedureSpec {
	return &transformations.YieldProcedureSpec{Name: name}
}

func fluxTime(t int64) flux.Time {
	return flux.Time{
		Absolute: time.Unix(0, t).UTC(),
	}
}

func makeFilterFn(exprs ...semantic.Expression) *semantic.FunctionExpression {
	body := semantic.ExprsToConjunction(exprs...)
	return &semantic.FunctionExpression{
		Block: &semantic.FunctionBlock{
			Parameters: &semantic.FunctionParameters{
				List: []*semantic.FunctionParameter{{Key: &semantic.Identifier{Name: "r"}}},
			},
			Body: body,
		},
	}
}

func TestFromRangeRule(t *testing.T) {
	var (
		fromWithBounds = &inputs.FromProcedureSpec{
			BoundsSet: true,
			Bounds: flux.Bounds{
				Start: fluxTime(5),
				Stop:  fluxTime(10),
			},
		}
		fromWithIntersectedBounds = &inputs.FromProcedureSpec{
			BoundsSet: true,
			Bounds: flux.Bounds{
				Start: fluxTime(9),
				Stop:  fluxTime(10),
			},
		}
		rangeWithBounds = &transformations.RangeProcedureSpec{
			Bounds: flux.Bounds{
				Start: fluxTime(5),
				Stop:  fluxTime(10),
			},
		}
		rangeWithDifferentBounds = &transformations.RangeProcedureSpec{
			Bounds: flux.Bounds{
				Start: fluxTime(9),
				Stop:  fluxTime(14),
			},
		}
		from  = &inputs.FromProcedureSpec{}
		mean  = &transformations.MeanProcedureSpec{}
		count = &transformations.CountProcedureSpec{}
	)

	tests := []plantest.RuleTestCase{
		{
			Name: "from range",
			// from -> range  =>  from
			Rules: []plan.Rule{&inputs.MergeFromRangeRule{}},
			Before: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from", from),
					plan.CreatePhysicalNode("range", rangeWithBounds),
				},
				Edges: [][2]int{{0, 1}},
			},
			After: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("merged_from_range", fromWithBounds),
				},
			},
		},
		{
			Name: "from range with successor node",
			// from -> range -> count  =>  from -> count
			Rules: []plan.Rule{&inputs.MergeFromRangeRule{}},
			Before: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from", from),
					plan.CreatePhysicalNode("range", rangeWithBounds),
					plan.CreatePhysicalNode("count", count),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
				},
			},
			After: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("merged_from_range", fromWithBounds),
					plan.CreatePhysicalNode("count", count),
				},
				Edges: [][2]int{{0, 1}},
			},
		},
		{
			Name: "from with multiple ranges",
			// from -> range -> range  =>  from
			Rules: []plan.Rule{&inputs.MergeFromRangeRule{}},
			Before: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from", from),
					plan.CreatePhysicalNode("range0", rangeWithBounds),
					plan.CreatePhysicalNode("range1", rangeWithDifferentBounds),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
				},
			},
			After: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("merged_from_range0_range1", fromWithIntersectedBounds),
				},
			},
		},
		{
			Name: "from range with multiple successor node",
			// count      mean
			//     \     /          count     mean
			//      range       =>      \    /
			//        |                  from
			//       from
			Rules: []plan.Rule{&inputs.MergeFromRangeRule{}},
			Before: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from", from),
					plan.CreatePhysicalNode("range", rangeWithBounds),
					plan.CreatePhysicalNode("count", count),
					plan.CreatePhysicalNode("yield0", yield("count")),
					plan.CreatePhysicalNode("mean", mean),
					plan.CreatePhysicalNode("yield1", yield("mean")),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
					{2, 3},
					{1, 4},
					{4, 5},
				},
			},
			After: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("merged_from_range", fromWithBounds),
					plan.CreatePhysicalNode("count", count),
					plan.CreatePhysicalNode("yield0", yield("count")),
					plan.CreatePhysicalNode("mean", mean),
					plan.CreatePhysicalNode("yield1", yield("mean")),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
					{0, 3},
					{3, 4},
				},
			},
		},
		{
			Name: "cannot push range into from",
			// range    count                                      range    count
			//     \    /       =>   cannot push range into a   =>     \    /
			//      from           from with multiple successors        from
			Rules: []plan.Rule{&inputs.MergeFromRangeRule{}},
			Before: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from", from),
					plan.CreatePhysicalNode("range", rangeWithBounds),
					plan.CreatePhysicalNode("yield0", yield("range")),
					plan.CreatePhysicalNode("count", count),
					plan.CreatePhysicalNode("yield1", yield("count")),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
					{0, 3},
					{3, 4},
				},
			},
			NoChange: true,
		},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(tc.Name, func(t *testing.T) {
			t.Parallel()
			plantest.RuleTestHelper(t, &tc)
		})
	}
}

func TestFromFilterRule(t *testing.T) {
	var (
		rangeWithBounds = &transformations.RangeProcedureSpec{
			Bounds: flux.Bounds{
				Start: fluxTime(5),
				Stop:  fluxTime(10),
			},
		}
		from = &inputs.FromProcedureSpec{}

		pushableExpr1 = &semantic.BinaryExpression{Operator: ast.EqualOperator,
			Left:  &semantic.MemberExpression{Object: &semantic.IdentifierExpression{Name: "r"}, Property: "_measurement"},
			Right: &semantic.StringLiteral{Value: "cpu"}}

		pushableExpr2 = &semantic.BinaryExpression{Operator: ast.EqualOperator,
			Left:  &semantic.MemberExpression{Object: &semantic.IdentifierExpression{Name: "r"}, Property: "_field"},
			Right: &semantic.StringLiteral{Value: "cpu"}}

		unpushableExpr = &semantic.BinaryExpression{Operator: ast.LessThanOperator,
			Left:  &semantic.FloatLiteral{Value: 0.5},
			Right: &semantic.MemberExpression{Object: &semantic.IdentifierExpression{Name: "r"}, Property: "_value"}}

		statementFn = &semantic.FunctionExpression{
			Block: &semantic.FunctionBlock{
				Parameters: &semantic.FunctionParameters{
					List: []*semantic.FunctionParameter{{Key: &semantic.Identifier{Name: "r"}}},
				},
				Body: &semantic.ReturnStatement{Argument: &semantic.BooleanLiteral{Value: true}},
			},
		}
	)

	tests := []plantest.RuleTestCase{
		{
			Name: "from filter",
			// from -> filter  =>  from
			Rules: []plan.Rule{inputs.MergeFromFilterRule{}},
			Before: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from", from),
					plan.CreatePhysicalNode("filter", &transformations.FilterProcedureSpec{Fn: makeFilterFn(pushableExpr1)}),
				},
				Edges: [][2]int{
					{0, 1},
				},
			},
			After: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("merged_from_filter", &inputs.FromProcedureSpec{
						FilterSet: true,
						Filter:    makeFilterFn(pushableExpr1),
					}),
				},
			},
		},
		{
			Name: "from filter filter",
			// from -> filter -> filter  =>  from    (rule applied twice)
			Rules: []plan.Rule{inputs.MergeFromFilterRule{}},
			Before: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from", from),
					plan.CreatePhysicalNode("filter1", &transformations.FilterProcedureSpec{Fn: makeFilterFn(pushableExpr1)}),
					plan.CreatePhysicalNode("filter2", &transformations.FilterProcedureSpec{Fn: makeFilterFn(pushableExpr2)}),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
				},
			},
			After: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("merged_from_filter1_filter2",
						&inputs.FromProcedureSpec{
							FilterSet: true,
							Filter:    makeFilterFn(pushableExpr1, pushableExpr2),
						}),
				},
			},
		},
		{
			Name: "from partially-pushable-filter",
			// from -> partially-pushable-filter  =>  from-with-filter -> unpushable-filter
			Rules: []plan.Rule{inputs.MergeFromFilterRule{}},
			Before: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from", from),
					plan.CreatePhysicalNode("filter", &transformations.FilterProcedureSpec{Fn: makeFilterFn(pushableExpr1, unpushableExpr)}),
				},
				Edges: [][2]int{
					{0, 1},
				},
			},
			After: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from",
						&inputs.FromProcedureSpec{
							FilterSet: true,
							Filter:    makeFilterFn(pushableExpr1),
						}),
					plan.CreatePhysicalNode("filter", &transformations.FilterProcedureSpec{Fn: makeFilterFn(unpushableExpr)}),
				},
				Edges: [][2]int{
					{0, 1},
				},
			},
		},
		{
			Name: "from range filter",
			// from -> range -> filter  =>  from
			Rules: []plan.Rule{inputs.MergeFromFilterRule{}, inputs.MergeFromRangeRule{}},
			Before: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from", from),
					plan.CreatePhysicalNode("range", rangeWithBounds),
					plan.CreatePhysicalNode("filter", &transformations.FilterProcedureSpec{Fn: makeFilterFn(pushableExpr1)}),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
				},
			},
			After: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("merged_from_range_filter", &inputs.FromProcedureSpec{
						FilterSet: true,
						Filter:    makeFilterFn(pushableExpr1),
						BoundsSet: true,
						Bounds: flux.Bounds{
							Start: fluxTime(5),
							Stop:  fluxTime(10),
						},
					}),
				},
			},
		},
		{
			Name: "from unpushable filter",
			// from -> filter  =>  from -> filter   (no change)
			Rules: []plan.Rule{inputs.MergeFromFilterRule{}},
			Before: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from", from),
					plan.CreatePhysicalNode("filter", &transformations.FilterProcedureSpec{Fn: makeFilterFn(unpushableExpr)}),
				},
				Edges: [][2]int{
					{0, 1},
				},
			},
			NoChange: true,
		},
		{
			Name: "from with statement filter",
			// from -> filter(with statement function)  =>  from -> filter(with statement function)  (no change)
			Rules: []plan.Rule{inputs.MergeFromFilterRule{}},
			Before: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from", from),
					plan.CreatePhysicalNode("filter", &transformations.FilterProcedureSpec{Fn: statementFn}),
				},
				Edges: [][2]int{
					{0, 1},
				},
			},
			NoChange: true,
		},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(tc.Name, func(t *testing.T) {
			t.Parallel()
			plantest.RuleTestHelper(t, &tc)
		})
	}
}

func TestFromDistinctRule(t *testing.T) {
	var from = &inputs.FromProcedureSpec{}
	tests := []plantest.RuleTestCase{
		{
			Name:  "from distinct",
			Rules: []plan.Rule{inputs.FromDistinctRule{}},
			Before: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from", from),
					plan.CreatePhysicalNode("distinct", &transformations.DistinctProcedureSpec{Column: "_measurement"}),
				},
				Edges: [][2]int{
					{0, 1},
				},
			},
			After: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from", &inputs.FromProcedureSpec{
						LimitSet:    true,
						PointsLimit: -1,
					}),
					plan.CreatePhysicalNode("distinct", &transformations.DistinctProcedureSpec{Column: "_measurement"}),
				},
				Edges: [][2]int{
					{0, 1},
				},
			},
		},
		{
			Name: "from incompatible-group distinct",
			// If there is an incompatible grouping, don't do the no points optimization.
			Rules: []plan.Rule{inputs.FromDistinctRule{}, inputs.MergeFromGroupRule{}},
			Before: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from", from),
					plan.CreatePhysicalNode("group", &transformations.GroupProcedureSpec{
						GroupMode: functions.GroupModeBy,
						GroupKeys: []string{"_measurement"},
					}),
					plan.CreatePhysicalNode("distinct", &transformations.DistinctProcedureSpec{Column: "_field"}),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
				},
			},
			After: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("merged_from_group", &inputs.FromProcedureSpec{
						GroupingSet: true,
						GroupMode:   functions.GroupModeBy,
						GroupKeys:   []string{"_measurement"},
					}),
					plan.CreatePhysicalNode("distinct", &transformations.DistinctProcedureSpec{Column: "_field"}),
				},
				Edges: [][2]int{
					{0, 1},
				},
			},
		},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(tc.Name, func(t *testing.T) {
			t.Parallel()
			plantest.RuleTestHelper(t, &tc)
		})
	}
}

func TestFromGroupRule(t *testing.T) {
	var (
		rangeWithBounds = &transformations.RangeProcedureSpec{
			Bounds: flux.Bounds{
				Start: fluxTime(5),
				Stop:  fluxTime(10),
			},
		}
		from = &inputs.FromProcedureSpec{}

		pushableExpr1 = &semantic.BinaryExpression{Operator: ast.EqualOperator,
			Left:  &semantic.MemberExpression{Object: &semantic.IdentifierExpression{Name: "r"}, Property: "_measurement"},
			Right: &semantic.StringLiteral{Value: "cpu"}}
	)

	tests := []plantest.RuleTestCase{
		{
			Name:  "from group",
			Rules: []plan.Rule{inputs.MergeFromGroupRule{}},
			Before: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from", from),
					plan.CreatePhysicalNode("group", &transformations.GroupProcedureSpec{
						GroupMode: functions.GroupModeBy,
						GroupKeys: []string{"_measurement"},
					}),
					plan.CreatePhysicalNode("filter", &transformations.FilterProcedureSpec{Fn: makeFilterFn(pushableExpr1)}),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
				},
			},
			After: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("merged_from_group", &inputs.FromProcedureSpec{
						GroupingSet: true,
						GroupMode:   functions.GroupModeBy,
						GroupKeys:   []string{"_measurement"},
					}),
					plan.CreatePhysicalNode("filter", &transformations.FilterProcedureSpec{Fn: makeFilterFn(pushableExpr1)}),
				},
				Edges: [][2]int{
					{0, 1},
				},
			},
		},
		{
			Name: "from group group",
			// Only push down one call to group()
			Rules: []plan.Rule{inputs.MergeFromGroupRule{}},
			Before: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from", from),
					plan.CreatePhysicalNode("group", &transformations.GroupProcedureSpec{
						GroupMode: functions.GroupModeBy,
						GroupKeys: []string{"_measurement"},
					}),
					plan.CreatePhysicalNode("group", &transformations.GroupProcedureSpec{
						GroupMode: functions.GroupModeBy,
						GroupKeys: []string{"_field"},
					}),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
				},
			},
			After: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("merged_from_group", &inputs.FromProcedureSpec{
						GroupingSet: true,
						GroupMode:   functions.GroupModeBy,
						GroupKeys:   []string{"_measurement"},
					}),
					plan.CreatePhysicalNode("group", &transformations.GroupProcedureSpec{
						GroupMode: functions.GroupModeBy,
						GroupKeys: []string{"_field"},
					}),
				},
				Edges: [][2]int{
					{0, 1},
				},
			},
		},
		{
			Name:  "from range group distinct group",
			Rules: []plan.Rule{inputs.MergeFromGroupRule{}, inputs.FromDistinctRule{}, inputs.MergeFromRangeRule{}},
			Before: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from", from),
					plan.CreatePhysicalNode("range", rangeWithBounds),
					plan.CreatePhysicalNode("group1", &transformations.GroupProcedureSpec{
						GroupMode: functions.GroupModeBy,
						GroupKeys: []string{"_measurement"},
					}),
					plan.CreatePhysicalNode("distinct", &transformations.DistinctProcedureSpec{Column: "_measurement"}),
					plan.CreatePhysicalNode("group2", &transformations.GroupProcedureSpec{GroupMode: functions.GroupModeNone}),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
					{2, 3},
					{3, 4},
				},
			},
			After: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("merged_from_range_group1", &inputs.FromProcedureSpec{
						BoundsSet:   true,
						Bounds:      flux.Bounds{Start: fluxTime(5), Stop: fluxTime(10)},
						GroupingSet: true,
						GroupMode:   functions.GroupModeBy,
						GroupKeys:   []string{"_measurement"},
						LimitSet:    true,
						PointsLimit: -1,
					}),
					plan.CreatePhysicalNode("distinct", &transformations.DistinctProcedureSpec{Column: "_measurement"}),
					plan.CreatePhysicalNode("group2", &transformations.GroupProcedureSpec{GroupMode: functions.GroupModeNone}),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
				},
			},
		},
		{
			Name: "from group except",
			// We should not push down group() with GroupModeExcept, storage does not yet support it.
			Rules: []plan.Rule{inputs.MergeFromGroupRule{}},
			Before: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from", from),
					plan.CreatePhysicalNode("group", &transformations.GroupProcedureSpec{
						GroupMode: functions.GroupModeExcept,
						GroupKeys: []string{"_time", "_value"},
					}),
				},
				Edges: [][2]int{
					{0, 1},
				},
			},
			NoChange: true,
		},
		{
			Name: "from group _time",
			// We should not push down group(columns: ["_time"])
			Rules: []plan.Rule{inputs.MergeFromGroupRule{}},
			Before: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from", from),
					plan.CreatePhysicalNode("group", &transformations.GroupProcedureSpec{
						GroupMode: functions.GroupModeExcept,
						GroupKeys: []string{"_time"},
					}),
				},
				Edges: [][2]int{
					{0, 1},
				},
			},
			NoChange: true,
		},
		{
			Name: "from group _value",
			// We should not push down group(columns: ["_value"])
			Rules: []plan.Rule{inputs.MergeFromGroupRule{}},
			Before: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreatePhysicalNode("from", from),
					plan.CreatePhysicalNode("group", &transformations.GroupProcedureSpec{
						GroupMode: functions.GroupModeExcept,
						GroupKeys: []string{"_value"},
					}),
				},
				Edges: [][2]int{
					{0, 1},
				},
			},
			NoChange: true,
		},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(tc.Name, func(t *testing.T) {
			t.Parallel()
			plantest.RuleTestHelper(t, &tc)
		})
	}
}

func TestFromRangeValidation(t *testing.T) {
	testSpec := plantest.PlanSpec{
		//       3
		//     /  \
		//    /    \
		//   1      2
		//    \    /
		//     from
		Nodes: []plan.PlanNode{
			plan.CreatePhysicalNode("from", &inputs.FromProcedureSpec{}),
			plantest.CreatePhysicalMockNode("1"),
			plantest.CreatePhysicalMockNode("2"),
			plantest.CreatePhysicalMockNode("3"),
		},
		Edges: [][2]int{
			{0, 1},
			{0, 2},
			{1, 3},
			{2, 3},
		},
	}

	ps := plantest.CreatePlanSpec(&testSpec)
	pp := plan.NewPhysicalPlanner(plan.OnlyPhysicalRules())
	_, err := pp.Plan(ps)

	if err == nil {
		t.Error("Expected from with no range to fail physical planning")
	}
}
