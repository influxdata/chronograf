package functions_test

import (
	"testing"

	"github.com/influxdata/ifql/functions"
	"github.com/influxdata/ifql/query"
	"github.com/influxdata/ifql/query/execute"
	"github.com/influxdata/ifql/query/execute/executetest"
	"github.com/influxdata/ifql/query/plan"
	"github.com/influxdata/ifql/query/plan/plantest"
	"github.com/influxdata/ifql/query/querytest"
)

func TestGroupOperation_Marshaling(t *testing.T) {
	data := []byte(`{"id":"group","kind":"group","spec":{"by":["t1","t2"],"keep":["t3","t4"]}}`)
	op := &query.Operation{
		ID: "group",
		Spec: &functions.GroupOpSpec{
			By:   []string{"t1", "t2"},
			Keep: []string{"t3", "t4"},
		},
	}
	querytest.OperationMarshalingTestHelper(t, data, op)
}

func TestGroup_Process(t *testing.T) {
	testCases := []struct {
		name string
		spec *functions.GroupProcedureSpec
		data []execute.Block
		want []*executetest.Block
	}{
		{
			name: "fan in",
			spec: &functions.GroupProcedureSpec{
				By: []string{"t1"},
			},
			data: []execute.Block{
				&executetest.Block{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  3,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
						{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0, "a", "x"},
						{execute.Time(2), 1.0, "a", "y"},
					},
				},
				&executetest.Block{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  3,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
						{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					},
					Data: [][]interface{}{
						{execute.Time(1), 4.0, "b", "x"},
						{execute.Time(2), 7.0, "b", "y"},
					},
				},
			},
			want: []*executetest.Block{
				{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  3,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0, "a"},
						{execute.Time(2), 1.0, "a"},
					},
				},
				{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  3,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					},
					Data: [][]interface{}{
						{execute.Time(1), 4.0, "b"},
						{execute.Time(2), 7.0, "b"},
					},
				},
			},
		},
		{
			name: "fan in ignoring",
			spec: &functions.GroupProcedureSpec{
				Except: []string{"t2"},
			},
			data: []execute.Block{
				&executetest.Block{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  3,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
						{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: false},
						{Label: "t3", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0, "a", "m", "x"},
						{execute.Time(2), 1.0, "a", "n", "x"},
					},
				},
				&executetest.Block{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  3,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
						{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: false},
						{Label: "t3", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					},
					Data: [][]interface{}{
						{execute.Time(1), 4.0, "b", "m", "x"},
						{execute.Time(2), 7.0, "b", "n", "x"},
					},
				},
			},
			want: []*executetest.Block{
				{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  3,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
						{Label: "t3", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0, "a", "x"},
						{execute.Time(2), 1.0, "a", "x"},
					},
				},
				{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  3,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
						{Label: "t3", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					},
					Data: [][]interface{}{
						{execute.Time(1), 4.0, "b", "x"},
						{execute.Time(2), 7.0, "b", "x"},
					},
				},
			},
		},
		{
			name: "fan in ignoring with keep",
			spec: &functions.GroupProcedureSpec{
				Except: []string{"t2"},
				Keep:   []string{"t2"},
			},
			data: []execute.Block{
				&executetest.Block{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  3,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
						{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: false},
						{Label: "t3", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0, "a", "m", "x"},
						{execute.Time(2), 1.0, "a", "n", "x"},
					},
				},
				&executetest.Block{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  3,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
						{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: false},
						{Label: "t3", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					},
					Data: [][]interface{}{
						{execute.Time(1), 4.0, "b", "m", "x"},
						{execute.Time(2), 7.0, "b", "n", "x"},
					},
				},
			},
			want: []*executetest.Block{
				{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  3,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
						{Label: "t3", Type: execute.TString, Kind: execute.TagColKind, Common: true},
						{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: false},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0, "a", "x", "m"},
						{execute.Time(2), 1.0, "a", "x", "n"},
					},
				},
				{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  3,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
						{Label: "t3", Type: execute.TString, Kind: execute.TagColKind, Common: true},
						{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: false},
					},
					Data: [][]interface{}{
						{execute.Time(1), 4.0, "b", "x", "m"},
						{execute.Time(2), 7.0, "b", "x", "n"},
					},
				},
			},
		},
		{
			name: "fan out",
			spec: &functions.GroupProcedureSpec{
				By: []string{"t1"},
			},
			data: []execute.Block{&executetest.Block{
				Bnds: execute.Bounds{
					Start: 1,
					Stop:  3,
				},
				ColMeta: []execute.ColMeta{
					{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
					{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
					{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: false},
				},
				Data: [][]interface{}{
					{execute.Time(1), 2.0, "a"},
					{execute.Time(2), 1.0, "b"},
				},
			}},
			want: []*executetest.Block{
				{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  3,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0, "a"},
					},
				},
				{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  3,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					},
					Data: [][]interface{}{
						{execute.Time(2), 1.0, "b"},
					},
				},
			},
		},
		{
			name: "fan out ignoring",
			spec: &functions.GroupProcedureSpec{
				Except: []string{"t2"},
			},
			data: []execute.Block{&executetest.Block{
				Bnds: execute.Bounds{
					Start: 1,
					Stop:  3,
				},
				ColMeta: []execute.ColMeta{
					{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
					{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
					{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: false},
					{Label: "t3", Type: execute.TString, Kind: execute.TagColKind, Common: false},
				},
				Data: [][]interface{}{
					{execute.Time(1), 2.0, "a", "m", "x"},
					{execute.Time(2), 1.0, "a", "n", "y"},
				},
			}},
			want: []*executetest.Block{
				{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  3,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
						{Label: "t3", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0, "a", "x"},
					},
				},
				{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  3,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
						{Label: "t3", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					},
					Data: [][]interface{}{
						{execute.Time(2), 1.0, "a", "y"},
					},
				},
			},
		},
		{
			name: "fan out ignoring with keep",
			spec: &functions.GroupProcedureSpec{
				Except: []string{"t2"},
				Keep:   []string{"t2"},
			},
			data: []execute.Block{&executetest.Block{
				Bnds: execute.Bounds{
					Start: 1,
					Stop:  3,
				},
				ColMeta: []execute.ColMeta{
					{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
					{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
					{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: false},
					{Label: "t3", Type: execute.TString, Kind: execute.TagColKind, Common: false},
				},
				Data: [][]interface{}{
					{execute.Time(1), 3.0, "a", "m", "x"},
					{execute.Time(2), 2.0, "a", "n", "x"},
					{execute.Time(3), 1.0, "a", "m", "y"},
					{execute.Time(4), 0.0, "a", "n", "y"},
				},
			}},
			want: []*executetest.Block{
				{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  3,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
						{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: false},
						{Label: "t3", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					},
					Data: [][]interface{}{
						{execute.Time(1), 3.0, "a", "m", "x"},
						{execute.Time(2), 2.0, "a", "n", "x"},
					},
				},
				{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  3,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
						{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: false},
						{Label: "t3", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					},
					Data: [][]interface{}{
						{execute.Time(3), 1.0, "a", "m", "y"},
						{execute.Time(4), 0.0, "a", "n", "y"},
					},
				},
			},
		},
	}
	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			executetest.ProcessTestHelper(
				t,
				tc.data,
				tc.want,
				func(d execute.Dataset, c execute.BlockBuilderCache) execute.Transformation {
					return functions.NewGroupTransformation(d, c, tc.spec)
				},
			)
		})
	}
}

func TestGroup_PushDown(t *testing.T) {
	spec := &functions.GroupProcedureSpec{
		By:   []string{"t1", "t2"},
		Keep: []string{"t3"},
	}
	root := &plan.Procedure{
		Spec: new(functions.FromProcedureSpec),
	}
	want := &plan.Procedure{
		Spec: &functions.FromProcedureSpec{
			GroupingSet: true,
			MergeAll:    false,
			GroupKeys:   []string{"t1", "t2"},
			GroupKeep:   []string{"t3"},
		},
	}

	plantest.PhysicalPlan_PushDown_TestHelper(t, spec, root, false, want)
}
func TestGroup_PushDown_Duplicate(t *testing.T) {
	spec := &functions.GroupProcedureSpec{
		By:   []string{"t1", "t2"},
		Keep: []string{"t3"},
	}
	root := &plan.Procedure{
		Spec: &functions.FromProcedureSpec{
			GroupingSet: true,
			MergeAll:    true,
			GroupKeep:   []string{"t4"},
		},
	}
	want := &plan.Procedure{
		// Expect the duplicate has been reset to zero values
		Spec: new(functions.FromProcedureSpec),
	}

	plantest.PhysicalPlan_PushDown_TestHelper(t, spec, root, true, want)
}
