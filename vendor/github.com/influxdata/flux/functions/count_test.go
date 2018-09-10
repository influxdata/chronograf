package functions_test

import (
	"testing"
	"time"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/functions"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/plan/plantest"
	"github.com/influxdata/flux/querytest"
)

func TestCount_NewQuery(t *testing.T) {
	tests := []querytest.NewQueryTestCase{
		{
			Name: "from with range and count",
			Raw:  `from(bucket:"mydb") |> range(start:-4h, stop:-2h) |> count()`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &functions.FromOpSpec{
							Bucket: "mydb",
						},
					},
					{
						ID: "range1",
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
						ID: "count2",
						Spec: &functions.CountOpSpec{
							AggregateConfig: execute.DefaultAggregateConfig,
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "range1"},
					{Parent: "range1", Child: "count2"},
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

func TestCountOperation_Marshaling(t *testing.T) {
	data := []byte(`{"id":"count","kind":"count"}`)
	op := &flux.Operation{
		ID:   "count",
		Spec: &functions.CountOpSpec{},
	}

	querytest.OperationMarshalingTestHelper(t, data, op)
}

func TestCount_Process(t *testing.T) {
	executetest.AggFuncTestHelper(
		t,
		new(functions.CountAgg),
		[]float64{1, 2, 3, 4, 5, 6, 7, 8, 9, 10},
		int64(10),
	)
}
func BenchmarkCount(b *testing.B) {
	executetest.AggFuncBenchmarkHelper(
		b,
		new(functions.CountAgg),
		NormalData,
		int64(len(NormalData)),
	)
}

func TestCount_PushDown_Match(t *testing.T) {
	spec := new(functions.CountProcedureSpec)
	from := new(functions.FromProcedureSpec)

	// Should not match when an aggregate is set
	from.GroupingSet = true
	plantest.PhysicalPlan_PushDown_Match_TestHelper(t, spec, from, []bool{false})

	// Should match when no aggregate is set
	from.GroupingSet = false
	plantest.PhysicalPlan_PushDown_Match_TestHelper(t, spec, from, []bool{true})
}

func TestCount_PushDown(t *testing.T) {
	spec := new(functions.CountProcedureSpec)
	root := &plan.Procedure{
		Spec: new(functions.FromProcedureSpec),
	}
	want := &plan.Procedure{
		Spec: &functions.FromProcedureSpec{
			AggregateSet:    true,
			AggregateMethod: functions.CountKind,
		},
	}

	plantest.PhysicalPlan_PushDown_TestHelper(t, spec, root, false, want)
}

func TestCount_PushDown_Duplicate(t *testing.T) {
	spec := new(functions.CountProcedureSpec)
	root := &plan.Procedure{
		Spec: &functions.FromProcedureSpec{
			AggregateSet:    true,
			AggregateMethod: functions.CountKind,
		},
	}
	want := &plan.Procedure{
		// Expect the duplicate has been reset to zero values
		Spec: new(functions.FromProcedureSpec),
	}

	plantest.PhysicalPlan_PushDown_TestHelper(t, spec, root, true, want)
}
