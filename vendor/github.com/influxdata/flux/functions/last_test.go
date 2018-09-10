package functions_test

import (
	"testing"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/functions"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/plan/plantest"
	"github.com/influxdata/flux/querytest"
)

func TestLastOperation_Marshaling(t *testing.T) {
	data := []byte(`{"id":"last","kind":"last","spec":{"column":"bar"}}`)
	op := &flux.Operation{
		ID: "last",
		Spec: &functions.LastOpSpec{
			SelectorConfig: execute.SelectorConfig{
				Column: "bar",
			},
		},
	}

	querytest.OperationMarshalingTestHelper(t, data, op)
}

func TestLast_Process(t *testing.T) {
	testCases := []struct {
		name string
		data *executetest.Table
		want []execute.Row
	}{
		{
			name: "last",
			data: &executetest.Table{
				KeyCols: []string{"t1"},
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "t1", Type: flux.TString},
					{Label: "t2", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(0), 0.0, "a", "y"},
					{execute.Time(10), 5.0, "a", "x"},
					{execute.Time(20), 9.0, "a", "y"},
					{execute.Time(30), 4.0, "a", "x"},
					{execute.Time(40), 6.0, "a", "y"},
					{execute.Time(50), 8.0, "a", "x"},
					{execute.Time(60), 1.0, "a", "y"},
					{execute.Time(70), 2.0, "a", "x"},
					{execute.Time(80), 3.0, "a", "y"},
					{execute.Time(90), 7.0, "a", "x"},
				},
			},
			want: []execute.Row{{
				Values: []interface{}{execute.Time(90), 7.0, "a", "x"},
			}},
		},
	}
	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			executetest.RowSelectorFuncTestHelper(
				t,
				new(functions.LastSelector),
				tc.data,
				tc.want,
			)
		})
	}
}

func BenchmarkLast(b *testing.B) {
	executetest.RowSelectorFuncBenchmarkHelper(b, new(functions.LastSelector), NormalTable)
}

func TestLast_PushDown_Match(t *testing.T) {
	spec := new(functions.LastProcedureSpec)
	from := new(functions.FromProcedureSpec)

	// Should not match when an aggregate is set
	from.AggregateSet = true
	plantest.PhysicalPlan_PushDown_Match_TestHelper(t, spec, from, []bool{false})

	// Should match when no aggregate is set
	from.AggregateSet = false
	plantest.PhysicalPlan_PushDown_Match_TestHelper(t, spec, from, []bool{true})
}

func TestLast_PushDown(t *testing.T) {
	spec := new(functions.LastProcedureSpec)
	root := &plan.Procedure{
		Spec: new(functions.FromProcedureSpec),
	}
	want := &plan.Procedure{
		Spec: &functions.FromProcedureSpec{
			BoundsSet: true,
			Bounds: flux.Bounds{
				Start: flux.MinTime,
				Stop:  flux.Now,
			},
			LimitSet:      true,
			PointsLimit:   1,
			DescendingSet: true,
			Descending:    true,
		},
	}

	plantest.PhysicalPlan_PushDown_TestHelper(t, spec, root, false, want)
}
func TestLast_PushDown_Duplicate(t *testing.T) {
	spec := new(functions.LastProcedureSpec)
	root := &plan.Procedure{
		Spec: &functions.FromProcedureSpec{
			BoundsSet: true,
			Bounds: flux.Bounds{
				Start: flux.MinTime,
				Stop:  flux.Now,
			},
			LimitSet:      true,
			PointsLimit:   1,
			DescendingSet: true,
			Descending:    true,
		},
	}
	want := &plan.Procedure{
		// Expect the duplicate has been reset to zero values
		Spec: new(functions.FromProcedureSpec),
	}

	plantest.PhysicalPlan_PushDown_TestHelper(t, spec, root, true, want)
}
