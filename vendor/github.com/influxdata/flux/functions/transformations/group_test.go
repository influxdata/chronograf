package transformations_test

import (
	"testing"
	"time"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/functions"
	"github.com/influxdata/flux/functions/inputs"
	"github.com/influxdata/flux/functions/transformations"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/plan/plantest"
	"github.com/influxdata/flux/querytest"
)

func TestGroupOperation_Marshaling(t *testing.T) {
	data := []byte(`{"id":"group","kind":"group","spec":{"mode":"by","columns":["t1","t2"]}}`)
	op := &flux.Operation{
		ID: "group",
		Spec: &transformations.GroupOpSpec{
			Mode:    "by",
			Columns: []string{"t1", "t2"},
		},
	}
	querytest.OperationMarshalingTestHelper(t, data, op)
}

func TestGroup_NewQuery(t *testing.T) {
	tests := []querytest.NewQueryTestCase{
		{
			Name: "group with no arguments",
			// group() defaults to group(columns: [], mode: "by")
			Raw: `from(bucket: "telegraf") |> range(start: -1m) |> group()`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID:   "from0",
						Spec: &inputs.FromOpSpec{Bucket: "telegraf"},
					},
					{
						ID: "range1",
						Spec: &transformations.RangeOpSpec{
							Start: flux.Time{
								Relative:   -1 * time.Minute,
								IsRelative: true,
							},
							Stop:        flux.Time{IsRelative: true},
							TimeColumn:  "_time",
							StartColumn: "_start",
							StopColumn:  "_stop",
						},
					},
					{
						ID:   "group2",
						Spec: &transformations.GroupOpSpec{Mode: "by", Columns: []string{}},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "range1"},
					{Parent: "range1", Child: "group2"},
				},
			},
		},
		{
			Name: "group all",
			Raw:  `from(bucket: "telegraf") |> range(start: -1m) |> group(columns:[], mode: "except")`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID:   "from0",
						Spec: &inputs.FromOpSpec{Bucket: "telegraf"},
					},
					{
						ID: "range1",
						Spec: &transformations.RangeOpSpec{
							Start: flux.Time{
								Relative:   -1 * time.Minute,
								IsRelative: true,
							},
							Stop:        flux.Time{IsRelative: true},
							TimeColumn:  "_time",
							StartColumn: "_start",
							StopColumn:  "_stop",
						},
					},
					{
						ID:   "group2",
						Spec: &transformations.GroupOpSpec{Mode: "except", Columns: []string{}},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "range1"},
					{Parent: "range1", Child: "group2"},
				},
			},
		},
		{
			Name: "group none",
			Raw:  `from(bucket: "telegraf") |> range(start: -1m) |> group(columns: [], mode: "by")`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID:   "from0",
						Spec: &inputs.FromOpSpec{Bucket: "telegraf"},
					},
					{
						ID: "range1",
						Spec: &transformations.RangeOpSpec{
							Start: flux.Time{
								Relative:   -1 * time.Minute,
								IsRelative: true,
							},
							Stop:        flux.Time{IsRelative: true},
							TimeColumn:  "_time",
							StartColumn: "_start",
							StopColumn:  "_stop",
						},
					},
					{
						ID:   "group2",
						Spec: &transformations.GroupOpSpec{Mode: "by", Columns: []string{}},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "range1"},
					{Parent: "range1", Child: "group2"},
				},
			},
		},
		{
			Name: "group by",
			Raw:  `from(bucket: "telegraf") |> range(start: -1m) |> group(columns: ["host"], mode: "by")`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID:   "from0",
						Spec: &inputs.FromOpSpec{Bucket: "telegraf"},
					},
					{
						ID: "range1",
						Spec: &transformations.RangeOpSpec{
							Start: flux.Time{
								Relative:   -1 * time.Minute,
								IsRelative: true,
							},
							Stop:        flux.Time{IsRelative: true},
							TimeColumn:  "_time",
							StartColumn: "_start",
							StopColumn:  "_stop",
						},
					},
					{
						ID: "group2",
						Spec: &transformations.GroupOpSpec{
							Columns: []string{"host"},
							Mode:    "by",
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "range1"},
					{Parent: "range1", Child: "group2"},
				},
			},
		},
		{
			Name: "group except",
			Raw:  `from(bucket: "telegraf") |> range(start: -1m) |> group(columns: ["host"], mode: "except")`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID:   "from0",
						Spec: &inputs.FromOpSpec{Bucket: "telegraf"},
					},
					{
						ID: "range1",
						Spec: &transformations.RangeOpSpec{
							Start: flux.Time{
								Relative:   -1 * time.Minute,
								IsRelative: true,
							},
							Stop:        flux.Time{IsRelative: true},
							TimeColumn:  "_time",
							StartColumn: "_start",
							StopColumn:  "_stop",
						},
					},
					{
						ID: "group2",
						Spec: &transformations.GroupOpSpec{
							Columns: []string{"host"},
							Mode:    "except",
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "range1"},
					{Parent: "range1", Child: "group2"},
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

func TestGroup_Process(t *testing.T) {
	testCases := []struct {
		name string
		spec *transformations.GroupProcedureSpec
		data []flux.Table
		want []*executetest.Table
	}{
		{
			name: "fan in",
			spec: &transformations.GroupProcedureSpec{
				GroupMode: functions.GroupModeBy,
				GroupKeys: []string{"t1"},
			},
			data: []flux.Table{
				&executetest.Table{
					KeyCols: []string{"t1", "t2"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0, "a", "x"},
					},
				},
				&executetest.Table{
					KeyCols: []string{"t1", "t2"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(2), 1.0, "a", "y"},
					},
				},
				&executetest.Table{
					KeyCols: []string{"t1", "t2"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 4.0, "b", "x"},
					},
				},
				&executetest.Table{
					KeyCols: []string{"t1", "t2"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(2), 7.0, "b", "y"},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0, "a", "x"},
						{execute.Time(2), 1.0, "a", "y"},
					},
				},
				{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 4.0, "b", "x"},
						{execute.Time(2), 7.0, "b", "y"},
					},
				},
			},
		},
		{
			name: "fan in ignoring",
			spec: &transformations.GroupProcedureSpec{
				GroupMode: functions.GroupModeExcept,
				GroupKeys: []string{"_time", "_value", "t2"},
			},
			data: []flux.Table{
				&executetest.Table{
					KeyCols: []string{"t1", "t2", "t3"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
						{Label: "t3", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0, "a", "m", "x"},
					},
				},
				&executetest.Table{
					KeyCols: []string{"t1", "t2", "t3"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
						{Label: "t3", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(2), 1.0, "a", "n", "x"},
					},
				},
				&executetest.Table{
					KeyCols: []string{"t1", "t2", "t3"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
						{Label: "t3", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 4.0, "b", "m", "x"},
					},
				},
				&executetest.Table{
					KeyCols: []string{"t1", "t2", "t3"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
						{Label: "t3", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(2), 7.0, "b", "n", "x"},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: []string{"t1", "t3"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
						{Label: "t3", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0, "a", "m", "x"},
						{execute.Time(2), 1.0, "a", "n", "x"},
					},
				},
				{
					KeyCols: []string{"t1", "t3"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
						{Label: "t3", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 4.0, "b", "m", "x"},
						{execute.Time(2), 7.0, "b", "n", "x"},
					},
				},
			},
		},
		{
			// TODO(nathanielc): When we have support for null, the missing column
			// needs to be added with null values for any missing values.
			// Right now the order of input tables determines whether the column is included.
			name: "fan in missing columns",
			spec: &transformations.GroupProcedureSpec{
				GroupMode: functions.GroupModeBy,
				GroupKeys: []string{"t1"},
			},
			data: []flux.Table{
				&executetest.Table{
					KeyCols: []string{"t1", "t2"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(2), 1.0, "a", "y"},
					},
				},
				&executetest.Table{
					KeyCols: []string{"t1", "t3", "t2"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t3", Type: flux.TInt},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0, "a", int64(5), "x"},
					},
				},
				&executetest.Table{
					KeyCols: []string{"t1", "t2"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(2), 7.0, "b", "y"},
					},
				},
				&executetest.Table{
					KeyCols: []string{"t1", "t3", "t2"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t3", Type: flux.TInt},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 4.0, "b", int64(7), "x"},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
						{Label: "t3", Type: flux.TInt},
					},
					Data: [][]interface{}{
						{execute.Time(2), 1.0, "a", "y", int64(0)},
						{execute.Time(1), 2.0, "a", "x", int64(5)},
					},
				},
				{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
						{Label: "t3", Type: flux.TInt},
					},
					Data: [][]interface{}{
						{execute.Time(2), 7.0, "b", "y", int64(0)},
						{execute.Time(1), 4.0, "b", "x", int64(7)},
					},
				},
			},
		},
		{
			name: "fan out",
			spec: &transformations.GroupProcedureSpec{
				GroupMode: functions.GroupModeBy,
				GroupKeys: []string{"t1"},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "t1", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(1), 2.0, "a"},
					{execute.Time(2), 1.0, "b"},
				},
			}},
			want: []*executetest.Table{
				{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0, "a"},
					},
				},
				{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(2), 1.0, "b"},
					},
				},
			},
		},
		{
			name: "fan out ignoring",
			spec: &transformations.GroupProcedureSpec{
				GroupMode: functions.GroupModeExcept,
				GroupKeys: []string{"_time", "_value", "t2"},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "t1", Type: flux.TString},
					{Label: "t2", Type: flux.TString},
					{Label: "t3", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(1), 2.0, "a", "m", "x"},
					{execute.Time(2), 1.0, "a", "n", "y"},
				},
			}},
			want: []*executetest.Table{
				{
					KeyCols: []string{"t1", "t3"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
						{Label: "t3", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0, "a", "m", "x"},
					},
				},
				{
					KeyCols: []string{"t1", "t3"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
						{Label: "t3", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(2), 1.0, "a", "n", "y"},
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
				nil,
				func(d execute.Dataset, c execute.TableBuilderCache) execute.Transformation {
					return transformations.NewGroupTransformation(d, c, tc.spec)
				},
			)
		})
	}
}

func TestMergeGroupRule(t *testing.T) {
	var (
		from      = &inputs.FromProcedureSpec{}
		groupNone = &transformations.GroupProcedureSpec{
			GroupMode: functions.GroupModeBy,
			GroupKeys: []string{},
		}
		groupBy = &transformations.GroupProcedureSpec{
			GroupMode: functions.GroupModeBy,
			GroupKeys: []string{"foo", "bar", "buz"},
		}
		groupExcept = &transformations.GroupProcedureSpec{
			GroupMode: functions.GroupModeExcept,
			GroupKeys: []string{"foo", "bar", "buz"},
		}
		groupNotByNorExcept = &transformations.GroupProcedureSpec{
			GroupMode: functions.GroupModeNone,
			GroupKeys: []string{},
		}
		filter = &transformations.FilterProcedureSpec{}
	)

	tests := []plantest.RuleTestCase{
		{
			Name:  "single group",
			Rules: []plan.Rule{&transformations.MergeGroupRule{}},
			Before: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreateLogicalNode("from", from),
					plan.CreateLogicalNode("group", groupBy),
				},
				Edges: [][2]int{
					{0, 1},
				},
			},
			NoChange: true,
		},
		{
			Name:  "double group",
			Rules: []plan.Rule{&transformations.MergeGroupRule{}},
			Before: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreateLogicalNode("from", from),
					plan.CreateLogicalNode("group0", groupNone),
					plan.CreateLogicalNode("group1", groupBy),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
				},
			},
			After: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreateLogicalNode("from", from),
					plan.CreateLogicalNode("merged_group0_group1", groupBy),
				},
				Edges: [][2]int{
					{0, 1},
				},
			},
		},
		{
			Name:  "triple group",
			Rules: []plan.Rule{&transformations.MergeGroupRule{}},
			Before: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreateLogicalNode("from", from),
					plan.CreateLogicalNode("group0", groupNone),
					plan.CreateLogicalNode("group1", groupBy),
					plan.CreateLogicalNode("group2", groupExcept),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
					{2, 3},
				},
			},
			After: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreateLogicalNode("from", from),
					plan.CreateLogicalNode("merged_group0_group1_group2", groupExcept),
				},
				Edges: [][2]int{
					{0, 1},
				},
			},
		},
		{
			Name:  "double group not by nor except",
			Rules: []plan.Rule{&transformations.MergeGroupRule{}},
			Before: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreateLogicalNode("from", from),
					plan.CreateLogicalNode("group0", groupNone),
					plan.CreateLogicalNode("group1", groupNotByNorExcept),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
				},
			},
			NoChange: true,
		},
		{
			// the last group by/except always overrides the group key
			Name:  "triple group not by nor except",
			Rules: []plan.Rule{&transformations.MergeGroupRule{}},
			Before: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreateLogicalNode("from", from),
					plan.CreateLogicalNode("group0", groupNone),
					plan.CreateLogicalNode("group1", groupNotByNorExcept),
					plan.CreateLogicalNode("group2", groupExcept),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
					{2, 3},
				},
			},
			After: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreateLogicalNode("from", from),
					plan.CreateLogicalNode("merged_group0_group1_group2", groupExcept),
				},
				Edges: [][2]int{
					{0, 1},
				},
			},
		},
		{
			Name:  "quad group not by nor except",
			Rules: []plan.Rule{&transformations.MergeGroupRule{}},
			Before: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreateLogicalNode("from", from),
					plan.CreateLogicalNode("group0", groupNone),
					plan.CreateLogicalNode("group1", groupNotByNorExcept),
					plan.CreateLogicalNode("group2", groupExcept),
					plan.CreateLogicalNode("group3", groupNotByNorExcept),
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
					plan.CreateLogicalNode("from", from),
					plan.CreateLogicalNode("merged_group0_group1_group2", groupExcept),
					plan.CreateLogicalNode("group3", groupNotByNorExcept),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
				},
			},
		},
		{
			Name:  "from group group filter",
			Rules: []plan.Rule{transformations.MergeGroupRule{}},
			Before: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreateLogicalNode("from", from),
					plan.CreateLogicalNode("group0", groupExcept),
					plan.CreateLogicalNode("group1", groupBy),
					plan.CreateLogicalNode("filter", filter),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
					{2, 3},
				},
			},
			After: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plan.CreateLogicalNode("from", from),
					plan.CreateLogicalNode("merged_group0_group1", groupBy),
					plan.CreateLogicalNode("filter", filter),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
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
