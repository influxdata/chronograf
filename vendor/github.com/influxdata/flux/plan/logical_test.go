package plan_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/ast"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/functions/inputs"
	"github.com/influxdata/flux/functions/outputs"
	"github.com/influxdata/flux/functions/transformations"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/plan/plantest"
	"github.com/influxdata/flux/semantic"
	"github.com/influxdata/flux/semantic/semantictest"
)

func compile(fluxText string, now time.Time) (*flux.Spec, error) {
	return flux.Compile(context.Background(), fluxText, now)
}

func TestPlan_LogicalPlanFromSpec(t *testing.T) {
	// Test for equality on these attributes
	type testAttrs struct {
		ID   plan.NodeID
		Spec plan.ProcedureSpec
		Kind plan.ProcedureKind
	}

	standardYield := func(name string) *transformations.YieldProcedureSpec {
		return &transformations.YieldProcedureSpec{Name: name}
	}
	generatedYield := func(name string) *plan.GeneratedYieldProcedureSpec {
		return &plan.GeneratedYieldProcedureSpec{Name: name}
	}

	now := time.Now().UTC()

	var (
		toHTTPOpSpec = outputs.ToHTTPOpSpec{
			URL:        "/my/url",
			Method:     "POST",
			NameColumn: "_measurement",
			Headers: map[string]string{
				"Content-Type": "application/vnd.influx",
				"User-Agent":   "fluxd/dev",
			},
			Timeout:      time.Second,
			TimeColumn:   "_time",
			ValueColumns: []string{"_value"},
		}
		toKafkaOpSpec = outputs.ToKafkaOpSpec{
			Brokers:      []string{"broker"},
			Topic:        "topic",
			NameColumn:   "_measurement",
			TimeColumn:   "_time",
			ValueColumns: []string{"_value"},
		}
	)

	var (
		fromSpec = &inputs.FromProcedureSpec{
			Bucket: "my-bucket",
		}
		rangeSpec = &transformations.RangeProcedureSpec{
			Bounds: flux.Bounds{
				Start: flux.Time{
					IsRelative: true,
					Relative:   -1 * time.Hour,
				},
				Stop: flux.Time{
					IsRelative: true,
				},
				Now: now,
			},
			TimeColumn:  "_time",
			StartColumn: "_start",
			StopColumn:  "_stop",
		}
		filterSpec = &transformations.FilterProcedureSpec{
			Fn: &semantic.FunctionExpression{
				Block: &semantic.FunctionBlock{
					Parameters: &semantic.FunctionParameters{
						List: []*semantic.FunctionParameter{
							{
								Key: &semantic.Identifier{Name: "r"},
							},
						},
					},
					Body: &semantic.BooleanLiteral{Value: true},
				},
			},
		}
		joinSpec = &transformations.MergeJoinProcedureSpec{
			TableNames: []string{"a", "b"},
			On:         []string{"_time"},
		}
		toHTTPSpec = &outputs.ToHTTPProcedureSpec{
			Spec: &toHTTPOpSpec,
		}
		toKafkaSpec = &outputs.ToKafkaProcedureSpec{
			Spec: &toKafkaOpSpec,
		}
		sumSpec = &transformations.SumProcedureSpec{
			AggregateConfig: execute.AggregateConfig{
				Columns: []string{"_value"},
			},
		}
		meanSpec = &transformations.MeanProcedureSpec{
			AggregateConfig: execute.AggregateConfig{
				Columns: []string{"_value"},
			},
		}
	)

	testcases := []struct {
		// Name of the test
		name string

		// Flux query string to translate
		query string

		// Expected logical query plan
		plan *plantest.PlanSpec

		// Whether or not an error is expected
		wantErr bool
	}{
		{
			name:  `from range with yield`,
			query: `from(bucket: "my-bucket") |> range(start:-1h) |> yield()`,
			plan: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreateLogicalNode("from0", fromSpec),
					plan.CreateLogicalNode("range1", rangeSpec),
					plan.CreateLogicalNode("yield2", standardYield("_result")),
				},

				Edges: [][2]int{
					{0, 1},
					{1, 2},
				},
			},
		},
		{
			name:  `from range without yield`,
			query: `from(bucket: "my-bucket") |> range(start:-1h)`,
			plan: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreateLogicalNode("from0", fromSpec),
					plan.CreateLogicalNode("range1", rangeSpec),
					plan.CreateLogicalNode("generated_yield", generatedYield("_result")),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
				},
			},
		},
		{
			name:  `from range filter`,
			query: `from(bucket: "my-bucket") |> range(start:-1h) |> filter(fn: (r) => true)`,
			plan: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreateLogicalNode("from0", fromSpec),
					plan.CreateLogicalNode("range1", rangeSpec),
					plan.CreateLogicalNode("filter2", filterSpec),
					plan.CreateLogicalNode("generated_yield", generatedYield("_result")),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
					{2, 3},
				},
			},
		},
		{
			name:  `Non-yield side effect`,
			query: `from(bucket: "my-bucket") |> range(start:-1h) |> toHTTP(url: "/my/url")`,
			plan: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreateLogicalNode("from0", fromSpec),
					plan.CreateLogicalNode("range1", rangeSpec),
					plan.CreateLogicalNode("toHTTP2", toHTTPSpec),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
				},
			},
		},
		{
			// from() |> range() |> toHTTP()
			// from() |> range() |> toKafka()
			name: `Multiple non-yield side effect`,
			query: `
				from(bucket: "my-bucket") |> range(start:-1h) |> toHTTP(url: "/my/url")
				from(bucket: "my-bucket") |> range(start:-1h) |> toKafka(brokers: ["broker"], topic: "topic")`,
			plan: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					// First plan
					plan.CreateLogicalNode("from0", fromSpec),
					plan.CreateLogicalNode("range1", rangeSpec),
					plan.CreateLogicalNode("toHTTP2", toHTTPSpec),
					// Second plan
					plan.CreateLogicalNode("from3", fromSpec),
					plan.CreateLogicalNode("range4", rangeSpec),
					plan.CreateLogicalNode("toKafka5", toKafkaSpec),
				},
				Edges: [][2]int{
					// First plan
					{0, 1},
					{1, 2},
					// Second plan
					{3, 4},
					{4, 5},
				},
			},
		},
		{
			name: `side effect and a generated yield`,
			query: `
				from(bucket: "my-bucket") |> range(start:-1h) |> toHTTP(url: "/my/url")
				from(bucket: "my-bucket") |> range(start:-1h)`,
			plan: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					// First plan
					plan.CreateLogicalNode("from0", fromSpec),
					plan.CreateLogicalNode("range1", rangeSpec),
					plan.CreateLogicalNode("toHTTP2", toHTTPSpec),
					// Second plan
					plan.CreateLogicalNode("from3", fromSpec),
					plan.CreateLogicalNode("range4", rangeSpec),
					plan.CreateLogicalNode("generated_yield", generatedYield("_result")),
				},
				Edges: [][2]int{
					// First plan
					{0, 1},
					{1, 2},
					// Second plan
					{3, 4},
					{4, 5},
				},
			},
		},
		{
			// yield    yield
			//   |       |
			//  sum     mean
			//     \    /
			//      join
			//    /      \
			// range     range
			//   |         |
			// from      from
			name: `diamond join`,
			query: `
				A = from(bucket: "my-bucket") |> range(start:-1h)
				B = from(bucket: "my-bucket") |> range(start:-1h)
				C = join(tables: {a: A, b: B}, on: ["_time"])
				C |> sum() |> yield(name: "sum")
				C |> mean() |> yield(name: "mean")`,
			plan: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreateLogicalNode("from0", fromSpec),
					plan.CreateLogicalNode("range1", rangeSpec),
					plan.CreateLogicalNode("from2", fromSpec),
					plan.CreateLogicalNode("range3", rangeSpec),
					plan.CreateLogicalNode("join4", joinSpec),
					plan.CreateLogicalNode("sum5", sumSpec),
					plan.CreateLogicalNode("yield6", standardYield("sum")),
					plan.CreateLogicalNode("mean7", meanSpec),
					plan.CreateLogicalNode("yield8", standardYield("mean")),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 4},
					{2, 3},
					{3, 4},
					{4, 5},
					{5, 6},
					{4, 7},
					{7, 8},
				},
			},
		},
		{
			name: "multi-generated yields",
			query: `
				from(bucket: "my-bucket") |> sum()
				from(bucket: "my-bucket") |> mean()`,
			wantErr: true,
		},
	}

	opts := append(
		semantictest.CmpOptions,
		cmp.AllowUnexported(outputs.ToKafkaProcedureSpec{}),
		cmpopts.IgnoreUnexported(outputs.ToKafkaProcedureSpec{}),
	)

	for _, tc := range testcases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			// Compile query to Flux query spec
			spec, err := compile(tc.query, now)
			if err != nil {
				t.Fatal(err)
			}

			thePlanner := plan.NewLogicalPlanner()

			// Convert flux spec to initial logical plan
			gotPlan, err := thePlanner.Plan(spec)
			if !tc.wantErr && err != nil {
				t.Fatal(err)
			}
			if tc.wantErr {
				if err == nil {
					t.Fatal("expected error, but got none")
				}
			} else {
				wantPlan := plantest.CreatePlanSpec(tc.plan)

				gotAttrs := make([]testAttrs, 0, 10)
				gotPlan.BottomUpWalk(func(node plan.PlanNode) error {
					gotAttrs = append(gotAttrs, testAttrs{
						ID:   node.ID(),
						Spec: node.ProcedureSpec(),
						Kind: node.Kind(),
					})
					return nil
				})

				wantAttrs := make([]testAttrs, 0, 10)
				wantPlan.BottomUpWalk(func(node plan.PlanNode) error {
					wantAttrs = append(wantAttrs, testAttrs{
						ID:   node.ID(),
						Spec: node.ProcedureSpec(),
						Kind: node.Kind(),
					})
					return nil
				})

				// Compare acutal vs expected logical plan nodes
				if !cmp.Equal(wantAttrs, gotAttrs, opts...) {
					t.Errorf("plan nodes do not have expected attributes, -want/+got:\n%v", cmp.Diff(wantAttrs, gotAttrs, opts...))
				}
			}
		})
	}
}

type MergeFiltersRule struct {
}

func (MergeFiltersRule) Name() string {
	return "mergeFilters"
}

func (MergeFiltersRule) Pattern() plan.Pattern {
	return plan.Pat(transformations.FilterKind,
		plan.Pat(transformations.FilterKind,
			plan.Any()))
}

func (MergeFiltersRule) Rewrite(pn plan.PlanNode) (plan.PlanNode, bool, error) {
	specTop := pn.ProcedureSpec()

	filterSpecTop := specTop.(*transformations.FilterProcedureSpec)
	filterSpecBottom := pn.Predecessors()[0].ProcedureSpec().(*transformations.FilterProcedureSpec)
	mergedFilterSpec := mergeFilterSpecs(filterSpecTop, filterSpecBottom)

	newNode, err := plan.MergeLogicalPlanNodes(pn, pn.Predecessors()[0], mergedFilterSpec)
	if err != nil {
		return pn, false, err
	}

	return newNode, true, nil
}

func mergeFilterSpecs(a, b *transformations.FilterProcedureSpec) plan.ProcedureSpec {
	fn := a.Fn.Copy().(*semantic.FunctionExpression)

	aExp, aOK := a.Fn.Block.Body.(semantic.Expression)
	bExp, bOK := b.Fn.Block.Body.(semantic.Expression)

	if !aOK || !bOK {
		// Note that this is just a unit test, so "return" statements are not handled.
		panic("function body not expression")
	}

	fn.Block.Body = &semantic.LogicalExpression{
		Operator: ast.AndOperator,
		Left:     aExp,
		Right:    bExp,
	}

	return &transformations.FilterProcedureSpec{
		Fn: fn,
	}
}

type PushFilterThroughMapRule struct {
}

func (PushFilterThroughMapRule) Name() string {
	return "pushFilterThroughMap"
}

func (PushFilterThroughMapRule) Pattern() plan.Pattern {
	return plan.Pat(transformations.FilterKind,
		plan.Pat(transformations.MapKind,
			plan.Any()))
}

func (PushFilterThroughMapRule) Rewrite(pn plan.PlanNode) (plan.PlanNode, bool, error) {
	// It will not always be possible to push a filter through a map... but this is just a unit test.

	swapped, err := plan.SwapPlanNodes(pn, pn.Predecessors()[0])
	if err != nil {
		return nil, false, err
	}

	return swapped, true, nil
}

func TestLogicalPlanner(t *testing.T) {
	testcases := []struct {
		name     string
		flux     string
		wantPlan plantest.PlanSpec
	}{{
		name: "with merge-able filters",
		flux: `
			from(bucket: "telegraf") |>
				filter(fn: (r) => r._measurement == "cpu") |>
				filter(fn: (r) => r._value > 0.5) |>
				filter(fn: (r) => r._value < 0.9) |>
				yield(name: "result")`,
		wantPlan: plantest.PlanSpec{
			Nodes: []plan.PlanNode{
				plan.CreateLogicalNode("from0", &inputs.FromProcedureSpec{Bucket: "telegraf"}),
				plan.CreateLogicalNode("merged_filter1_filter2_filter3", &transformations.FilterProcedureSpec{Fn: &semantic.FunctionExpression{
					Block: &semantic.FunctionBlock{
						Parameters: &semantic.FunctionParameters{
							List: []*semantic.FunctionParameter{{Key: &semantic.Identifier{Name: "r"}}},
						},
						Body: &semantic.LogicalExpression{Operator: ast.AndOperator,
							Left: &semantic.LogicalExpression{Operator: ast.AndOperator,
								Left: &semantic.BinaryExpression{Operator: ast.LessThanOperator,
									Left:  &semantic.MemberExpression{Object: &semantic.IdentifierExpression{Name: "r"}, Property: "_value"},
									Right: &semantic.FloatLiteral{Value: 0.9}},
								Right: &semantic.BinaryExpression{Operator: ast.GreaterThanOperator,
									Left:  &semantic.MemberExpression{Object: &semantic.IdentifierExpression{Name: "r"}, Property: "_value"},
									Right: &semantic.FloatLiteral{Value: 0.5}}},
							Right: &semantic.BinaryExpression{Operator: ast.EqualOperator,
								Left:  &semantic.MemberExpression{Object: &semantic.IdentifierExpression{Name: "r"}, Property: "_measurement"},
								Right: &semantic.StringLiteral{Value: "cpu"}}}}},
				}),
				plan.CreateLogicalNode("yield4", &transformations.YieldProcedureSpec{Name: "result"}),
			},
			Edges: [][2]int{
				{0, 1},
				{1, 2},
			},
		},
	},
		{
			name: "with swappable map and filter",
			flux: `from(bucket: "telegraf") |> map(fn: (r) => r._value * 2.0) |> filter(fn: (r) => r._value < 10.0) |> yield(name: "result")`,
			wantPlan: plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreateLogicalNode("from0", &inputs.FromProcedureSpec{Bucket: "telegraf"}),
					plan.CreateLogicalNode("filter2_copy", &transformations.FilterProcedureSpec{Fn: &semantic.FunctionExpression{
						Block: &semantic.FunctionBlock{
							Parameters: &semantic.FunctionParameters{
								List: []*semantic.FunctionParameter{{Key: &semantic.Identifier{Name: "r"}}},
							},
							Body: &semantic.BinaryExpression{Operator: ast.LessThanOperator,
								Left:  &semantic.MemberExpression{Object: &semantic.IdentifierExpression{Name: "r"}, Property: "_value"},
								Right: &semantic.FloatLiteral{Value: 10}},
						},
					}}),
					plan.CreateLogicalNode("map1", &transformations.MapProcedureSpec{
						Fn: &semantic.FunctionExpression{
							Block: &semantic.FunctionBlock{
								Parameters: &semantic.FunctionParameters{
									List: []*semantic.FunctionParameter{{Key: &semantic.Identifier{Name: "r"}}}},
								Body: &semantic.BinaryExpression{Operator: ast.MultiplicationOperator,
									Left:  &semantic.MemberExpression{Object: &semantic.IdentifierExpression{Name: "r"}, Property: "_value"},
									Right: &semantic.FloatLiteral{Value: 2}}}},
						MergeKey: true,
					}),
					plan.CreateLogicalNode("yield3", &transformations.YieldProcedureSpec{Name: "result"}),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
					{2, 3},
				},
			}},
		{
			name: "rules working together",
			flux: `
				from(bucket: "telegraf") |>
					filter(fn: (r) => r._value != 0) |>
					map(fn: (r) => r._value * 10) |>
					filter(fn: (r) => r._value < 100) |>
					yield(name: "result")`,
			wantPlan: plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreateLogicalNode("from0", &inputs.FromProcedureSpec{Bucket: "telegraf"}),
					plan.CreateLogicalNode("merged_filter1_filter3_copy", &transformations.FilterProcedureSpec{Fn: &semantic.FunctionExpression{
						Block: &semantic.FunctionBlock{
							Parameters: &semantic.FunctionParameters{
								List: []*semantic.FunctionParameter{{Key: &semantic.Identifier{Name: "r"}}}},
							Body: &semantic.LogicalExpression{Operator: ast.AndOperator,
								Left: &semantic.BinaryExpression{Operator: ast.LessThanOperator,
									Left:  &semantic.MemberExpression{Object: &semantic.IdentifierExpression{Name: "r"}, Property: "_value"},
									Right: &semantic.IntegerLiteral{Value: 100}},
								Right: &semantic.BinaryExpression{Operator: ast.NotEqualOperator,
									Left:  &semantic.MemberExpression{Object: &semantic.IdentifierExpression{Name: "r"}, Property: "_value"},
									Right: &semantic.IntegerLiteral{}}},
						}}}),
					plan.CreateLogicalNode("map2", &transformations.MapProcedureSpec{Fn: &semantic.FunctionExpression{
						Block: &semantic.FunctionBlock{
							Parameters: &semantic.FunctionParameters{
								List: []*semantic.FunctionParameter{{Key: &semantic.Identifier{Name: "r"}}}},
							Body: &semantic.BinaryExpression{Operator: ast.MultiplicationOperator,
								Left:  &semantic.MemberExpression{Object: &semantic.IdentifierExpression{Name: "r"}, Property: "_value"},
								Right: &semantic.IntegerLiteral{Value: 10}}}},
						MergeKey: true,
					}),
					plan.CreateLogicalNode("yield4", &transformations.YieldProcedureSpec{Name: "result"}),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
					{2, 3},
				},
			},
		},
	}

	for _, tc := range testcases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			fluxSpec, err := compile(tc.flux, time.Now().UTC())
			if err != nil {
				t.Fatalf("could not compile flux query: %v", err)
			}

			logicalPlanner := plan.NewLogicalPlanner(plan.OnlyLogicalRules(MergeFiltersRule{}, PushFilterThroughMapRule{}))
			logicalPlan, err := logicalPlanner.Plan(fluxSpec)
			if err != nil {
				t.Fatal(err)
			}

			wantPlan := plantest.CreatePlanSpec(&tc.wantPlan)
			if err := plantest.ComparePlans(wantPlan, logicalPlan, plantest.CompareLogicalPlanNodes); err != nil {
				t.Error(err)
			}
		})
	}
}
