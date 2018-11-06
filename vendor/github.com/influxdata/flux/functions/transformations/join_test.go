package transformations_test

import (
	"sort"
	"testing"
	"time"

	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/functions/inputs"
	"github.com/influxdata/flux/functions/transformations"
	"github.com/influxdata/flux/querytest"
)

func TestJoin_NewQuery(t *testing.T) {
	tests := []querytest.NewQueryTestCase{
		{
			Name: "basic two-way join",
			Raw: `
				a = from(bucket:"dbA") |> range(start:-1h)
				b = from(bucket:"dbB") |> range(start:-1h)
				join(tables:{a:a,b:b}, on:["host"])`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &inputs.FromOpSpec{
							Bucket: "dbA",
						},
					},
					{
						ID: "range1",
						Spec: &transformations.RangeOpSpec{
							Start: flux.Time{
								Relative:   -1 * time.Hour,
								IsRelative: true,
							},
							Stop: flux.Time{
								IsRelative: true,
							},
							TimeColumn:  "_time",
							StartColumn: "_start",
							StopColumn:  "_stop",
						},
					},
					{
						ID: "from2",
						Spec: &inputs.FromOpSpec{
							Bucket: "dbB",
						},
					},
					{
						ID: "range3",
						Spec: &transformations.RangeOpSpec{
							Start: flux.Time{
								Relative:   -1 * time.Hour,
								IsRelative: true,
							},
							Stop: flux.Time{
								IsRelative: true,
							},
							TimeColumn:  "_time",
							StartColumn: "_start",
							StopColumn:  "_stop",
						},
					},
					{
						ID: "join4",
						Spec: &transformations.JoinOpSpec{
							On:         []string{"host"},
							TableNames: map[flux.OperationID]string{"range1": "a", "range3": "b"},
							Method:     "inner",
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "range1"},
					{Parent: "from2", Child: "range3"},
					{Parent: "range1", Child: "join4"},
					{Parent: "range3", Child: "join4"},
				},
			},
		},
		{
			Name: "from with join with complex ast",
			Raw: `
				a = from(bucket:"flux") |> range(start:-1h)
				b = from(bucket:"flux") |> range(start:-1h)
				join(tables:{a:a,b:b}, on:["t1"])
			`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &inputs.FromOpSpec{
							Bucket: "flux",
						},
					},
					{
						ID: "range1",
						Spec: &transformations.RangeOpSpec{
							Start: flux.Time{
								Relative:   -1 * time.Hour,
								IsRelative: true,
							},
							Stop: flux.Time{
								IsRelative: true,
							},
							TimeColumn:  "_time",
							StartColumn: "_start",
							StopColumn:  "_stop",
						},
					},
					{
						ID: "from2",
						Spec: &inputs.FromOpSpec{
							Bucket: "flux",
						},
					},
					{
						ID: "range3",
						Spec: &transformations.RangeOpSpec{
							Start: flux.Time{
								Relative:   -1 * time.Hour,
								IsRelative: true,
							},
							Stop: flux.Time{
								IsRelative: true,
							},
							TimeColumn:  "_time",
							StartColumn: "_start",
							StopColumn:  "_stop",
						},
					},
					{
						ID: "join4",
						Spec: &transformations.JoinOpSpec{
							On:         []string{"t1"},
							TableNames: map[flux.OperationID]string{"range1": "a", "range3": "b"},
							Method:     "inner",
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "range1"},
					{Parent: "from2", Child: "range3"},
					{Parent: "range1", Child: "join4"},
					{Parent: "range3", Child: "join4"},
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

func TestJoinOperation_Marshaling(t *testing.T) {
	data := []byte(`{
		"id":"join",
		"kind":"join",
		"spec":{
			"on":["t1","t2"],
			"tableNames":{"sum1":"a","count3":"b"}
		}
	}`)
	op := &flux.Operation{
		ID: "join",
		Spec: &transformations.JoinOpSpec{
			On:         []string{"t1", "t2"},
			TableNames: map[flux.OperationID]string{"sum1": "a", "count3": "b"},
		},
	}
	querytest.OperationMarshalingTestHelper(t, data, op)
}

func TestMergeJoin_Process(t *testing.T) {
	tableNames := []string{"a", "b"}

	testCases := []struct {
		skip  bool
		name  string
		spec  *transformations.MergeJoinProcedureSpec
		data0 []*executetest.Table // data from parent 0
		data1 []*executetest.Table // data from parent 1
		want  []*executetest.Table
	}{
		{
			name: "simple inner",
			spec: &transformations.MergeJoinProcedureSpec{
				On:         []string{"_time"},
				TableNames: tableNames,
			},
			data0: []*executetest.Table{
				{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0},
						{execute.Time(2), 2.0},
						{execute.Time(3), 3.0},
					},
				},
			},
			data1: []*executetest.Table{
				{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(1), 10.0},
						{execute.Time(2), 20.0},
						{execute.Time(3), 30.0},
					},
				},
			},
			want: []*executetest.Table{
				{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value_a", Type: flux.TFloat},
						{Label: "_value_b", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, 10.0},
						{execute.Time(2), 2.0, 20.0},
						{execute.Time(3), 3.0, 30.0},
					},
				},
			},
		},
		{
			name: "simple inner with ints",
			spec: &transformations.MergeJoinProcedureSpec{
				On:         []string{"_time"},
				TableNames: tableNames,
			},
			data0: []*executetest.Table{
				{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TInt},
					},
					Data: [][]interface{}{
						{execute.Time(1), int64(1)},
						{execute.Time(2), int64(2)},
						{execute.Time(3), int64(3)},
					},
				},
			},
			data1: []*executetest.Table{
				{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TInt},
					},
					Data: [][]interface{}{
						{execute.Time(1), int64(10)},
						{execute.Time(2), int64(20)},
						{execute.Time(3), int64(30)},
					},
				},
			},
			want: []*executetest.Table{
				{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value_a", Type: flux.TInt},
						{Label: "_value_b", Type: flux.TInt},
					},
					Data: [][]interface{}{
						{execute.Time(1), int64(1), int64(10)},
						{execute.Time(2), int64(2), int64(20)},
						{execute.Time(3), int64(3), int64(30)},
					},
				},
			},
		},
		{
			name: "inner with unsorted tables",
			spec: &transformations.MergeJoinProcedureSpec{
				On:         []string{"_time"},
				TableNames: tableNames,
			},
			data0: []*executetest.Table{
				{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(2), 1.0},
						{execute.Time(1), 2.0},
						{execute.Time(3), 3.0},
					},
				},
			},
			data1: []*executetest.Table{
				{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(3), 10.0},
						{execute.Time(2), 30.0},
						{execute.Time(1), 20.0},
					},
				},
			},
			want: []*executetest.Table{
				{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value_a", Type: flux.TFloat},
						{Label: "_value_b", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0, 20.0},
						{execute.Time(2), 1.0, 30.0},
						{execute.Time(3), 3.0, 10.0},
					},
				},
			},
		},
		{
			name: "inner with missing values",
			spec: &transformations.MergeJoinProcedureSpec{
				On:         []string{"_time"},
				TableNames: tableNames,
			},
			data0: []*executetest.Table{
				{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0},
						{execute.Time(2), 2.0},
						{execute.Time(3), 3.0},
					},
				},
			},
			data1: []*executetest.Table{
				{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(1), 10.0},
						{execute.Time(3), 30.0},
					},
				},
			},
			want: []*executetest.Table{
				{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value_a", Type: flux.TFloat},
						{Label: "_value_b", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, 10.0},
						{execute.Time(3), 3.0, 30.0},
					},
				},
			},
		},
		{
			name: "inner with multiple matches",
			spec: &transformations.MergeJoinProcedureSpec{
				On:         []string{"_time"},
				TableNames: tableNames,
			},
			data0: []*executetest.Table{
				{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0},
						{execute.Time(2), 2.0},
						{execute.Time(3), 3.0},
					},
				},
			},
			data1: []*executetest.Table{
				{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(1), 10.0},
						{execute.Time(1), 10.1},
						{execute.Time(2), 20.0},
						{execute.Time(3), 30.0},
						{execute.Time(3), 30.1},
					},
				},
			},
			want: []*executetest.Table{
				{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value_a", Type: flux.TFloat},
						{Label: "_value_b", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, 10.0},
						{execute.Time(1), 1.0, 10.1},
						{execute.Time(2), 2.0, 20.0},
						{execute.Time(3), 3.0, 30.0},
						{execute.Time(3), 3.0, 30.1},
					},
				},
			},
		},
		{
			name: "inner with common tags",
			spec: &transformations.MergeJoinProcedureSpec{
				On:         []string{"_time", "t1"},
				TableNames: tableNames,
			},
			data0: []*executetest.Table{
				{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "a"},
						{execute.Time(2), 2.0, "a"},
						{execute.Time(3), 3.0, "a"},
					},
				},
			},
			data1: []*executetest.Table{
				{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 10.0, "a"},
						{execute.Time(2), 20.0, "a"},
						{execute.Time(3), 30.0, "a"},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value_a", Type: flux.TFloat},
						{Label: "_value_b", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, 10.0, "a"},
						{execute.Time(2), 2.0, 20.0, "a"},
						{execute.Time(3), 3.0, 30.0, "a"},
					},
				},
			},
		},
		{
			name: "inner with extra attributes",
			spec: &transformations.MergeJoinProcedureSpec{
				On:         []string{"_time", "t1"},
				TableNames: tableNames,
			},
			data0: []*executetest.Table{
				{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "a"},
						{execute.Time(1), 1.5, "b"},
						{execute.Time(2), 2.0, "a"},
						{execute.Time(2), 2.5, "b"},
						{execute.Time(3), 3.0, "a"},
						{execute.Time(3), 3.5, "b"},
					},
				},
			},
			data1: []*executetest.Table{
				{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 10.0, "a"},
						{execute.Time(1), 10.1, "b"},
						{execute.Time(2), 20.0, "a"},
						{execute.Time(2), 20.1, "b"},
						{execute.Time(3), 30.0, "a"},
						{execute.Time(3), 30.1, "b"},
					},
				},
			},
			want: []*executetest.Table{
				{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value_a", Type: flux.TFloat},
						{Label: "_value_b", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, 10.0, "a"},
						{execute.Time(1), 1.5, 10.1, "b"},
						{execute.Time(2), 2.0, 20.0, "a"},
						{execute.Time(2), 2.5, 20.1, "b"},
						{execute.Time(3), 3.0, 30.0, "a"},
						{execute.Time(3), 3.5, 30.1, "b"},
					},
				},
			},
		},
		{
			name: "inner with tags and extra attributes",
			spec: &transformations.MergeJoinProcedureSpec{
				On:         []string{"_time", "t1", "t2"},
				TableNames: tableNames,
			},
			data0: []*executetest.Table{
				{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "a", "x"},
						{execute.Time(1), 1.5, "a", "y"},
						{execute.Time(2), 2.0, "a", "x"},
						{execute.Time(2), 2.5, "a", "y"},
						{execute.Time(3), 3.0, "a", "x"},
						{execute.Time(3), 3.5, "a", "y"},
					},
				},
			},
			data1: []*executetest.Table{
				{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 10.0, "a", "x"},
						{execute.Time(1), 10.1, "a", "y"},
						{execute.Time(2), 20.0, "a", "x"},
						{execute.Time(2), 20.1, "a", "y"},
						{execute.Time(3), 30.0, "a", "x"},
						{execute.Time(3), 30.1, "a", "y"},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value_a", Type: flux.TFloat},
						{Label: "_value_b", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, 10.0, "a", "x"},
						{execute.Time(1), 1.5, 10.1, "a", "y"},
						{execute.Time(2), 2.0, 20.0, "a", "x"},
						{execute.Time(2), 2.5, 20.1, "a", "y"},
						{execute.Time(3), 3.0, 30.0, "a", "x"},
						{execute.Time(3), 3.5, 30.1, "a", "y"},
					},
				},
			},
		},
		{
			name: "inner with multiple values, tags and extra attributes",
			spec: &transformations.MergeJoinProcedureSpec{
				On:         []string{"_time", "t1", "t2"},
				TableNames: tableNames,
			},
			data0: []*executetest.Table{
				{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "a", "x"},
						{execute.Time(2), 2.0, "a", "x"},
						{execute.Time(2), 2.5, "a", "y"},
						{execute.Time(3), 3.5, "a", "y"},
					},
				},
			},
			data1: []*executetest.Table{
				{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 10.0, "a", "x"},
						{execute.Time(1), 10.1, "a", "x"},
						{execute.Time(2), 20.0, "a", "x"},
						{execute.Time(2), 20.1, "a", "y"},
						{execute.Time(3), 30.0, "a", "y"},
						{execute.Time(3), 30.1, "a", "y"},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value_a", Type: flux.TFloat},
						{Label: "_value_b", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, 10.0, "a", "x"},
						{execute.Time(1), 1.0, 10.1, "a", "x"},
						{execute.Time(2), 2.0, 20.0, "a", "x"},
						{execute.Time(2), 2.5, 20.1, "a", "y"},
						{execute.Time(3), 3.5, 30.0, "a", "y"},
						{execute.Time(3), 3.5, 30.1, "a", "y"},
					},
				},
			},
		},
		{
			name: "inner with multiple tables in each stream",
			spec: &transformations.MergeJoinProcedureSpec{
				On:         []string{"_time"},
				TableNames: tableNames,
			},
			data0: []*executetest.Table{
				{
					KeyCols: []string{"_value"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0},
					},
				},
				{
					KeyCols: []string{"_value"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(2), 2.0},
					},
				},
				{
					KeyCols: []string{"_value"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(3), 3.0},
					},
				},
			},
			data1: []*executetest.Table{
				{
					KeyCols: []string{"_value"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0},
					},
				},
				{
					KeyCols: []string{"_value"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(2), 2.0},
					},
				},
				{
					KeyCols: []string{"_value"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(3), 3.0},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: []string{"_value_a", "_value_b"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value_a", Type: flux.TFloat},
						{Label: "_value_b", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, 1.0},
					},
				},
				{
					KeyCols: []string{"_value_a", "_value_b"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value_a", Type: flux.TFloat},
						{Label: "_value_b", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(2), 2.0, 2.0},
					},
				},
				{
					KeyCols: []string{"_value_a", "_value_b"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value_a", Type: flux.TFloat},
						{Label: "_value_b", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(3), 3.0, 3.0},
					},
				},
			},
		},
		{
			name: "inner with multiple unsorted tables in each stream",
			spec: &transformations.MergeJoinProcedureSpec{
				On:         []string{"_time"},
				TableNames: tableNames,
			},
			data0: []*executetest.Table{
				{
					KeyCols: []string{"_key"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_key", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(3), "a"},
						{execute.Time(1), "a"},
					},
				},
				{
					KeyCols: []string{"_key"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_key", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(4), "b"},
						{execute.Time(2), "b"},
					},
				},
				{
					KeyCols: []string{"_key"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_key", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(5), "c"},
						{execute.Time(2), "c"},
					},
				},
			},
			data1: []*executetest.Table{
				{
					KeyCols: []string{"_key"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_key", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(8), "a"},
					},
				},
				{
					KeyCols: []string{"_key"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_key", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(5), "b"},
						{execute.Time(7), "b"},
						{execute.Time(6), "b"},
					},
				},
				{
					KeyCols: []string{"_key"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_key", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), "c"},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: []string{"_key_a", "_key_b"},
					ColMeta: []flux.ColMeta{
						{Label: "_key_a", Type: flux.TString},
						{Label: "_key_b", Type: flux.TString},
						{Label: "_time", Type: flux.TTime},
					},
					Data: [][]interface{}{
						{"a", "c", execute.Time(1)},
					},
				},
				{
					KeyCols: []string{"_key_a", "_key_b"},
					ColMeta: []flux.ColMeta{
						{Label: "_key_a", Type: flux.TString},
						{Label: "_key_b", Type: flux.TString},
						{Label: "_time", Type: flux.TTime},
					},
					Data: [][]interface{}{
						{"c", "b", execute.Time(5)},
					},
				},
			},
		},
		{
			name: "inner with different (but intersecting) group keys",
			spec: &transformations.MergeJoinProcedureSpec{
				On:         []string{"_time", "t2"},
				TableNames: tableNames,
			},
			data0: []*executetest.Table{
				{
					KeyCols: []string{"t1", "t2"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "a", "x"},
						{execute.Time(2), 2.0, "a", "x"},
						{execute.Time(3), 3.0, "a", "x"},
					},
				},
				{
					KeyCols: []string{"t1", "t2"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.5, "a", "y"},
						{execute.Time(2), 2.5, "a", "y"},
						{execute.Time(3), 3.5, "a", "y"},
					},
				},
			},
			data1: []*executetest.Table{
				{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 10.0, "a", "x"},
						{execute.Time(1), 10.1, "a", "y"},
						{execute.Time(2), 20.0, "a", "x"},
						{execute.Time(2), 20.1, "a", "y"},
						{execute.Time(3), 30.0, "a", "x"},
						{execute.Time(3), 30.1, "a", "y"},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: []string{"t1_a", "t1_b", "t2"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value_a", Type: flux.TFloat},
						{Label: "_value_b", Type: flux.TFloat},
						{Label: "t1_a", Type: flux.TString},
						{Label: "t1_b", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, 10.0, "a", "a", "x"},
						{execute.Time(2), 2.0, 20.0, "a", "a", "x"},
						{execute.Time(3), 3.0, 30.0, "a", "a", "x"},
					},
				},
				{
					KeyCols: []string{"t1_a", "t1_b", "t2"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value_a", Type: flux.TFloat},
						{Label: "_value_b", Type: flux.TFloat},
						{Label: "t1_a", Type: flux.TString},
						{Label: "t1_b", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.5, 10.1, "a", "a", "y"},
						{execute.Time(2), 2.5, 20.1, "a", "a", "y"},
						{execute.Time(3), 3.5, 30.1, "a", "a", "y"},
					},
				},
			},
		},
		{
			name: "inner with different (and not intersecting) group keys",
			spec: &transformations.MergeJoinProcedureSpec{
				On:         []string{"_time", "t2"},
				TableNames: tableNames,
			},
			data0: []*executetest.Table{
				{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "a", "x"},
						{execute.Time(2), 2.0, "a", "x"},
						{execute.Time(3), 3.0, "a", "x"},
						{execute.Time(1), 1.5, "a", "y"},
						{execute.Time(2), 2.5, "a", "y"},
						{execute.Time(3), 3.5, "a", "y"},
					},
				},
			},
			data1: []*executetest.Table{
				{
					KeyCols: []string{"t2"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 10.0, "a", "x"},
						{execute.Time(2), 20.0, "a", "x"},
						{execute.Time(3), 30.0, "a", "x"},
					},
				},
				{
					KeyCols: []string{"t2"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 10.1, "a", "y"},
						{execute.Time(2), 20.1, "a", "y"},
						{execute.Time(3), 30.1, "a", "y"},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: []string{"t1_a", "t2"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value_a", Type: flux.TFloat},
						{Label: "_value_b", Type: flux.TFloat},
						{Label: "t1_a", Type: flux.TString},
						{Label: "t1_b", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, 10.0, "a", "a", "x"},
						{execute.Time(2), 2.0, 20.0, "a", "a", "x"},
						{execute.Time(3), 3.0, 30.0, "a", "a", "x"},
					},
				},
				{
					KeyCols: []string{"t1_a", "t2"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value_a", Type: flux.TFloat},
						{Label: "_value_b", Type: flux.TFloat},
						{Label: "t1_a", Type: flux.TString},
						{Label: "t1_b", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.5, 10.1, "a", "a", "y"},
						{execute.Time(2), 2.5, 20.1, "a", "a", "y"},
						{execute.Time(3), 3.5, 30.1, "a", "a", "y"},
					},
				},
			},
		},
		{
			name: "inner where join key does not intersect with group keys",
			spec: &transformations.MergeJoinProcedureSpec{
				On:         []string{"_time"},
				TableNames: tableNames,
			},
			data0: []*executetest.Table{
				{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "a", "x"},
						{execute.Time(2), 2.0, "a", "x"},
						{execute.Time(3), 3.0, "a", "x"},
					},
				},
			},
			data1: []*executetest.Table{
				{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 10.0, "a", "x"},
						{execute.Time(2), 20.0, "a", "x"},
						{execute.Time(3), 30.0, "a", "x"},
						{execute.Time(1), 10.1, "a", "y"},
						{execute.Time(2), 20.1, "a", "y"},
						{execute.Time(3), 30.1, "a", "y"},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: []string{"t1_a", "t1_b"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value_a", Type: flux.TFloat},
						{Label: "_value_b", Type: flux.TFloat},
						{Label: "t1_a", Type: flux.TString},
						{Label: "t1_b", Type: flux.TString},
						{Label: "t2_a", Type: flux.TString},
						{Label: "t2_b", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, 10.0, "a", "a", "x", "x"},
						{execute.Time(1), 1.0, 10.1, "a", "a", "x", "y"},
						{execute.Time(2), 2.0, 20.0, "a", "a", "x", "x"},
						{execute.Time(2), 2.0, 20.1, "a", "a", "x", "y"},
						{execute.Time(3), 3.0, 30.0, "a", "a", "x", "x"},
						{execute.Time(3), 3.0, 30.1, "a", "a", "x", "y"},
					},
				},
			},
		},
		{
			name: "inner with default on parameter",
			spec: &transformations.MergeJoinProcedureSpec{
				TableNames: tableNames,
			},
			data0: []*executetest.Table{
				{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "a_tag", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "a"},
						{execute.Time(2), 2.0, "a"},
						{execute.Time(3), 3.0, "a"},
					},
				},
			},
			data1: []*executetest.Table{
				{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "b_tag", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "b"},
						{execute.Time(2), 2.0, "b"},
						{execute.Time(3), 3.0, "b"},
					},
				},
			},
			want: []*executetest.Table{
				{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "a_tag", Type: flux.TString},
						{Label: "b_tag", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "a", "b"},
						{execute.Time(2), 2.0, "a", "b"},
						{execute.Time(3), 3.0, "a", "b"},
					},
				},
			},
		},
		{
			name: "inner satisfying eviction condition",
			spec: &transformations.MergeJoinProcedureSpec{
				TableNames: tableNames,
				On:         []string{"_time", "tag"},
			},
			data0: []*executetest.Table{
				{
					KeyCols: []string{"tag"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "tag", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "a"},
					},
				},
				{
					KeyCols: []string{"tag"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "tag", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(2), 2.0, "b"},
					},
				},
				{
					KeyCols: []string{"tag"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "tag", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(3), 3.0, "c"},
					},
				},
			},
			data1: []*executetest.Table{
				{
					KeyCols: []string{"tag"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "tag", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "a"},
					},
				},
				{
					KeyCols: []string{"tag"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "tag", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(2), 2.0, "b"},
					},
				},
				{
					KeyCols: []string{"tag"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "tag", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(3), 3.0, "c"},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: []string{"tag"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value_a", Type: flux.TFloat},
						{Label: "_value_b", Type: flux.TFloat},
						{Label: "tag", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, 1.0, "a"},
					},
				},
				{
					KeyCols: []string{"tag"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value_a", Type: flux.TFloat},
						{Label: "_value_b", Type: flux.TFloat},
						{Label: "tag", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(2), 2.0, 2.0, "b"},
					},
				},
				{
					KeyCols: []string{"tag"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value_a", Type: flux.TFloat},
						{Label: "_value_b", Type: flux.TFloat},
						{Label: "tag", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(3), 3.0, 3.0, "c"},
					},
				},
			},
		},
	}
	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			if tc.skip {
				t.Skip()
			}

			id0 := executetest.RandomDatasetID()
			id1 := executetest.RandomDatasetID()

			parents := []execute.DatasetID{
				execute.DatasetID(id0),
				execute.DatasetID(id1),
			}

			tableNames := make(map[execute.DatasetID]string, len(tc.spec.TableNames))
			for i, name := range tc.spec.TableNames {
				tableNames[parents[i]] = name
			}

			d := executetest.NewDataset(executetest.RandomDatasetID())
			c := transformations.NewMergeJoinCache(executetest.UnlimitedAllocator, parents, tableNames, tc.spec.On)
			c.SetTriggerSpec(execute.DefaultTriggerSpec)
			jt := transformations.NewMergeJoinTransformation(d, c, tc.spec, parents, tableNames)

			l := len(tc.data0)
			if len(tc.data1) > l {
				l = len(tc.data1)
			}
			for i := 0; i < l; i++ {
				if i < len(tc.data0) {
					if err := jt.Process(parents[0], tc.data0[i]); err != nil {
						t.Fatal(err)
					}
				}
				if i < len(tc.data1) {
					if err := jt.Process(parents[1], tc.data1[i]); err != nil {
						t.Fatal(err)
					}
				}
			}

			got, err := executetest.TablesFromCache(c)
			if err != nil {
				t.Fatal(err)
			}

			executetest.NormalizeTables(got)
			executetest.NormalizeTables(tc.want)

			sort.Sort(executetest.SortedTables(got))
			sort.Sort(executetest.SortedTables(tc.want))

			if !cmp.Equal(tc.want, got) {
				t.Errorf("unexpected tables -want/+got\n%s", cmp.Diff(tc.want, got))
			}
		})
	}
}
