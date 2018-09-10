package functions_test

import (
	"errors"
	"testing"
	"time"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/functions"
	"github.com/influxdata/flux/querytest"
)

func TestPivot_NewQuery(t *testing.T) {
	tests := []querytest.NewQueryTestCase{
		{
			Name: "pivot [_measurement, _field] around _time",
			Raw:  `from(bucket:"testdb") |> range(start: -1h) |> pivot(rowKey: ["_time"], colKey: ["_measurement", "_field"], valueCol: "_value")`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &functions.FromOpSpec{
							Bucket: "testdb",
						},
					},
					{
						ID: "range1",
						Spec: &functions.RangeOpSpec{
							Start: flux.Time{
								Relative:   -1 * time.Hour,
								IsRelative: true,
							},
							Stop: flux.Time{
								IsRelative: true,
							},
							TimeCol:  "_time",
							StartCol: "_start",
							StopCol:  "_stop",
						},
					},
					{
						ID: "pivot2",
						Spec: &functions.PivotOpSpec{
							RowKey:   []string{"_time"},
							ColKey:   []string{"_measurement", "_field"},
							ValueCol: "_value",
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "range1"},
					{Parent: "range1", Child: "pivot2"},
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

func TestPivotOperation_Marshaling(t *testing.T) {
	data := []byte(`{
		"id":"pivot",
		"kind":"pivot",
		"spec":{
			"rowKey":["_time"],
			"colKey":["_measurement", "_field"], 
			"valueCol":"_value"
		}
	}`)
	op := &flux.Operation{
		ID: "pivot",
		Spec: &functions.PivotOpSpec{
			RowKey:   []string{"_time"},
			ColKey:   []string{"_measurement", "_field"},
			ValueCol: "_value",
		},
	}
	querytest.OperationMarshalingTestHelper(t, data, op)
}

func TestPivot_Process(t *testing.T) {
	testCases := []struct {
		name    string
		spec    *functions.PivotProcedureSpec
		data    []flux.Table
		want    []*executetest.Table
		wantErr error
	}{
		{
			name: "overlapping rowKey and colKey",
			spec: &functions.PivotProcedureSpec{
				RowKey:   []string{"_time", "a"},
				ColKey:   []string{"_measurement", "_field", "a"},
				ValueCol: "_value",
			},
			data:    nil,
			wantErr: errors.New("column name found in both rowKey and colKey: a"),
		},
		{
			name: "_field flatten case one table",
			spec: &functions.PivotProcedureSpec{
				RowKey:   []string{"_time"},
				ColKey:   []string{"_field"},
				ValueCol: "_value",
			},
			data: []flux.Table{
				&executetest.Table{
					KeyCols: []string{"_measurement"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "_measurement", Type: flux.TString},
						{Label: "_field", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "m1", "f1"},
						{execute.Time(1), 2.0, "m1", "f2"},
						{execute.Time(2), 3.0, "m1", "f1"},
						{execute.Time(2), 4.0, "m1", "f2"},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: []string{"_measurement"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_measurement", Type: flux.TString},
						{Label: "f1", Type: flux.TFloat},
						{Label: "f2", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(1), "m1", 1.0, 2.0},
						{execute.Time(2), "m1", 3.0, 4.0},
					},
				},
			},
		},
		{
			name: "_field flatten case two tables",
			spec: &functions.PivotProcedureSpec{
				RowKey:   []string{"_time"},
				ColKey:   []string{"_field"},
				ValueCol: "_value",
			},
			data: []flux.Table{
				&executetest.Table{
					KeyCols: []string{"_measurement"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "_measurement", Type: flux.TString},
						{Label: "_field", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "m1", "f1"},
						{execute.Time(1), 2.0, "m1", "f2"},
						{execute.Time(2), 3.0, "m1", "f1"},
						{execute.Time(2), 4.0, "m1", "f2"},
					},
				},
				&executetest.Table{
					KeyCols: []string{"_measurement"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "_measurement", Type: flux.TString},
						{Label: "_field", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "m2", "f3"},
						{execute.Time(1), 2.0, "m2", "f4"},
						{execute.Time(2), 3.0, "m2", "f3"},
						{execute.Time(2), 4.0, "m2", "f4"},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: []string{"_measurement"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_measurement", Type: flux.TString},
						{Label: "f1", Type: flux.TFloat},
						{Label: "f2", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(1), "m1", 1.0, 2.0},
						{execute.Time(2), "m1", 3.0, 4.0},
					},
				},
				{
					KeyCols: []string{"_measurement"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_measurement", Type: flux.TString},
						{Label: "f3", Type: flux.TFloat},
						{Label: "f4", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(1), "m2", 1.0, 2.0},
						{execute.Time(2), "m2", 3.0, 4.0},
					},
				},
			},
		},
		{
			name: "duplicate rowKey + colKey",
			spec: &functions.PivotProcedureSpec{
				RowKey:   []string{"_time"},
				ColKey:   []string{"_measurement", "_field"},
				ValueCol: "_value",
			},
			data: []flux.Table{
				&executetest.Table{
					KeyCols: []string{"_measurement"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "_measurement", Type: flux.TString},
						{Label: "_field", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "m1", "f1"},
						{execute.Time(1), 2.0, "m1", "f2"},
						{execute.Time(2), 3.0, "m1", "f1"},
						{execute.Time(2), 4.0, "m1", "f2"},
						{execute.Time(1), 5.0, "m1", "f1"},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: nil,
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "m1_f1", Type: flux.TFloat},
						{Label: "m1_f2", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(1), 5.0, 2.0},
						{execute.Time(2), 3.0, 4.0},
					},
				},
			},
		},
		{
			name: "dropping a column not in rowKey or groupKey",
			spec: &functions.PivotProcedureSpec{
				RowKey:   []string{"_time"},
				ColKey:   []string{"_measurement", "_field"},
				ValueCol: "_value",
			},
			data: []flux.Table{
				&executetest.Table{
					KeyCols: []string{"_measurement"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "_measurement", Type: flux.TString},
						{Label: "_field", Type: flux.TString},
						{Label: "droppedcol", Type: flux.TInt},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "m1", "f1", 1},
						{execute.Time(1), 2.0, "m1", "f2", 1},
						{execute.Time(2), 3.0, "m1", "f1", 1},
						{execute.Time(2), 4.0, "m1", "f2", 1},
						{execute.Time(1), 5.0, "m1", "f1", 1},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: nil,
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "m1_f1", Type: flux.TFloat},
						{Label: "m1_f2", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(1), 5.0, 2.0},
						{execute.Time(2), 3.0, 4.0},
					},
				},
			},
		},
		{
			name: "group key doesn't change",
			spec: &functions.PivotProcedureSpec{
				RowKey:   []string{"_time"},
				ColKey:   []string{"_measurement", "_field"},
				ValueCol: "_value",
			},
			data: []flux.Table{
				&executetest.Table{
					KeyCols: []string{"grouper"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "_measurement", Type: flux.TString},
						{Label: "_field", Type: flux.TString},
						{Label: "grouper", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "m1", "f1", "A"},
						{execute.Time(1), 2.0, "m1", "f2", "A"},
						{execute.Time(2), 3.0, "m1", "f1", "A"},
						{execute.Time(2), 4.0, "m1", "f2", "A"},
						{execute.Time(1), 5.0, "m1", "f1", "A"},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: []string{"grouper"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "grouper", Type: flux.TString},
						{Label: "m1_f1", Type: flux.TFloat},
						{Label: "m1_f2", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(1), "A", 5.0, 2.0},
						{execute.Time(2), "A", 3.0, 4.0},
					},
				},
			},
		},
		{
			name: "group key loses a member",
			spec: &functions.PivotProcedureSpec{
				RowKey:   []string{"_time"},
				ColKey:   []string{"_measurement", "_field"},
				ValueCol: "_value",
			},
			data: []flux.Table{
				&executetest.Table{
					KeyCols: []string{"grouper", "_field"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "_measurement", Type: flux.TString},
						{Label: "_field", Type: flux.TString},
						{Label: "grouper", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "m1", "f1", "A"},
						{execute.Time(2), 3.0, "m1", "f1", "A"},
					},
				},
				&executetest.Table{
					KeyCols: []string{"grouper", "_field"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "_measurement", Type: flux.TString},
						{Label: "_field", Type: flux.TString},
						{Label: "grouper", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0, "m1", "f2", "B"},
					},
				},
				&executetest.Table{
					KeyCols: []string{"grouper", "_field"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "_measurement", Type: flux.TString},
						{Label: "_field", Type: flux.TString},
						{Label: "grouper", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(2), 4.0, "m1", "f2", "A"},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: []string{"grouper"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "grouper", Type: flux.TString},
						{Label: "m1_f1", Type: flux.TFloat},
						{Label: "m1_f2", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(1), "A", 1.0, 0.0},
						{execute.Time(2), "A", 3.0, 4.0},
					},
				},
				{
					KeyCols: []string{"grouper"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "grouper", Type: flux.TString},
						{Label: "m1_f2", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(1), "B", 2.0},
					},
				},
			},
		},
		{
			name: "group key loses all members. drops _value",
			spec: &functions.PivotProcedureSpec{
				RowKey:   []string{"_time"},
				ColKey:   []string{"_measurement", "_field"},
				ValueCol: "grouper",
			},
			data: []flux.Table{
				&executetest.Table{
					KeyCols: []string{"grouper", "_field"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "_measurement", Type: flux.TString},
						{Label: "_field", Type: flux.TString},
						{Label: "grouper", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "m1", "f1", "A"},
						{execute.Time(2), 3.0, "m1", "f1", "A"},
					},
				},
				&executetest.Table{
					KeyCols: []string{"grouper", "_field"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "_measurement", Type: flux.TString},
						{Label: "_field", Type: flux.TString},
						{Label: "grouper", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0, "m1", "f2", "B"},
					},
				},
				&executetest.Table{
					KeyCols: []string{"grouper", "_field"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "_measurement", Type: flux.TString},
						{Label: "_field", Type: flux.TString},
						{Label: "grouper", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(2), 4.0, "m1", "f2", "A"},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: nil,
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "m1_f1", Type: flux.TString},
						{Label: "m1_f2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), "A", "B"},
						{execute.Time(2), "A", "A"},
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
				tc.wantErr,
				func(d execute.Dataset, c execute.TableBuilderCache) execute.Transformation {
					return functions.NewPivotTransformation(d, c, tc.spec)
				},
			)
		})
	}
}
