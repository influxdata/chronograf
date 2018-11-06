package transformations_test

import (
	"testing"
	"time"

	"github.com/influxdata/flux/functions/inputs"

	"github.com/influxdata/flux/values"
	"github.com/pkg/errors"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/functions/transformations"
	"github.com/influxdata/flux/querytest"
)

func TestRange_NewQuery(t *testing.T) {
	tests := []querytest.NewQueryTestCase{
		{
			Name: "from with database with range",
			Raw:  `from(bucket:"mybucket") |> range(start:-4h, stop:-2h) |> sum()`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &inputs.FromOpSpec{
							Bucket: "mybucket",
						},
					},
					{
						ID: "range1",
						Spec: &transformations.RangeOpSpec{
							Start: flux.Time{
								Relative:   -4 * time.Hour,
								IsRelative: true,
							},
							Stop: flux.Time{
								Relative:   -2 * time.Hour,
								IsRelative: true,
							},
							TimeColumn:  "_time",
							StartColumn: "_start",
							StopColumn:  "_stop",
						},
					},
					{
						ID: "sum2",
						Spec: &transformations.SumOpSpec{
							AggregateConfig: execute.DefaultAggregateConfig,
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "range1"},
					{Parent: "range1", Child: "sum2"},
				},
			},
		},
		{
			Name: "from csv with range",
			Raw:  `fromCSV(csv: "1,2") |> range(start:-4h, stop:-2h, timeColumn: "_start") |> sum()`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "fromCSV0",
						Spec: &inputs.FromCSVOpSpec{
							CSV: "1,2",
						},
					},
					{
						ID: "range1",
						Spec: &transformations.RangeOpSpec{
							Start: flux.Time{
								Relative:   -4 * time.Hour,
								IsRelative: true,
							},
							Stop: flux.Time{
								Relative:   -2 * time.Hour,
								IsRelative: true,
							},
							TimeColumn:  "_start",
							StartColumn: "_start",
							StopColumn:  "_stop",
						},
					},
					{
						ID: "sum2",
						Spec: &transformations.SumOpSpec{
							AggregateConfig: execute.DefaultAggregateConfig,
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "fromCSV0", Child: "range1"},
					{Parent: "range1", Child: "sum2"},
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

func TestRangeOperation_Marshaling(t *testing.T) {
	data := []byte(`{"id":"range","kind":"range","spec":{"start":"-1h","stop":"2017-10-10T00:00:00Z"}}`)
	op := &flux.Operation{
		ID: "range",
		Spec: &transformations.RangeOpSpec{
			Start: flux.Time{
				Relative:   -1 * time.Hour,
				IsRelative: true,
			},
			Stop: flux.Time{
				Absolute: time.Date(2017, 10, 10, 0, 0, 0, 0, time.UTC),
			},
		},
	}

	querytest.OperationMarshalingTestHelper(t, data, op)
}

func TestRange_Process(t *testing.T) {
	testCases := []struct {
		name     string
		spec     *transformations.RangeProcedureSpec
		data     []flux.Table
		want     []*executetest.Table
		groupKey func() flux.GroupKey
		now      values.Time
		wantErr  error
	}{
		{
			name: "from csv",
			spec: &transformations.RangeProcedureSpec{
				Bounds: flux.Bounds{
					Start: flux.Time{
						IsRelative: true,
						Relative:   -5 * time.Minute,
					},
					Stop: flux.Time{
						IsRelative: true,
						Relative:   -2 * time.Minute,
					},
				},
				TimeColumn:  "_time",
				StartColumn: "_start",
				StopColumn:  "_stop",
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(time.Minute.Nanoseconds()), 10.0},
					{execute.Time(2 * time.Minute.Nanoseconds()), 5.0},
					{execute.Time(3 * time.Minute.Nanoseconds()), 9.0},
					{execute.Time(4 * time.Minute.Nanoseconds()), 4.0},
					{execute.Time(5 * time.Minute.Nanoseconds()), 6.0},
					{execute.Time(6 * time.Minute.Nanoseconds()), 8.0},
					{execute.Time(7 * time.Minute.Nanoseconds()), 1.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
				},
				Data: [][]interface{}{
					{execute.Time(2 * time.Minute.Nanoseconds()), 5.0, execute.Time(2 * time.Minute.Nanoseconds()), execute.Time(5 * time.Minute.Nanoseconds())},
					{execute.Time(3 * time.Minute.Nanoseconds()), 9.0, execute.Time(2 * time.Minute.Nanoseconds()), execute.Time(5 * time.Minute.Nanoseconds())},
					{execute.Time(4 * time.Minute.Nanoseconds()), 4.0, execute.Time(2 * time.Minute.Nanoseconds()), execute.Time(5 * time.Minute.Nanoseconds())},
				},
			}},
			now: values.Time(7 * time.Minute.Nanoseconds()),
		},
		{
			name: "invalid column",
			spec: &transformations.RangeProcedureSpec{
				Bounds: flux.Bounds{
					Start: flux.Time{
						IsRelative: true,
						Relative:   -5 * time.Minute,
					},
					Stop: flux.Time{
						IsRelative: true,
						Relative:   -2 * time.Minute,
					},
				},
				TimeColumn:  "_value",
				StartColumn: "_start",
				StopColumn:  "_stop",
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(time.Minute.Nanoseconds()), 10.0},
					{execute.Time(3 * time.Minute.Nanoseconds()), 9.0},
					{execute.Time(7 * time.Minute.Nanoseconds()), 1.0},
					{execute.Time(2 * time.Minute.Nanoseconds()), 5.0},
					{execute.Time(4 * time.Minute.Nanoseconds()), 4.0},
					{execute.Time(6 * time.Minute.Nanoseconds()), 8.0},
					{execute.Time(5 * time.Minute.Nanoseconds()), 6.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}(nil),
			}},
			wantErr: errors.New("range error: provided column _value is not of type time"),
			now:     values.Time(7 * time.Minute.Nanoseconds()),
		},
		{
			name: "specified column",
			spec: &transformations.RangeProcedureSpec{
				Bounds: flux.Bounds{
					Start: flux.Time{
						IsRelative: true,
						Relative:   -2 * time.Minute,
					},
					Stop: flux.Time{
						IsRelative: true,
					},
				},
				TimeColumn:  "_start",
				StartColumn: "_start",
				StopColumn:  "_stop",
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(0), execute.Time(time.Minute.Nanoseconds()), 10.0},
					{execute.Time(time.Minute.Nanoseconds()), execute.Time(3 * time.Minute.Nanoseconds()), 9.0},
					{execute.Time(2 * time.Minute.Nanoseconds()), execute.Time(7 * time.Minute.Nanoseconds()), 1.0},
					{execute.Time(3 * time.Minute.Nanoseconds()), execute.Time(4 * time.Minute.Nanoseconds()), 4.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "_stop", Type: flux.TTime},
				},
				Data: [][]interface{}{
					{execute.Time(time.Minute.Nanoseconds()), execute.Time(3 * time.Minute.Nanoseconds()), 9.0, execute.Time(3 * time.Minute.Nanoseconds())},
					{execute.Time(2 * time.Minute.Nanoseconds()), execute.Time(7 * time.Minute.Nanoseconds()), 1.0, execute.Time(3 * time.Minute.Nanoseconds())},
				},
			}},
			now: values.Time(3 * time.Minute.Nanoseconds()),
		},
		{
			name: "group key no overlap",
			spec: &transformations.RangeProcedureSpec{
				Bounds: flux.Bounds{
					Start: flux.Time{
						IsRelative: true,
						Relative:   -2 * time.Minute,
					},
					Stop: flux.Time{
						IsRelative: true,
					},
				},
				TimeColumn:  "_start",
				StartColumn: "_start",
				StopColumn:  "_stop",
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				KeyCols:   []string{"_start", "_stop"},
				KeyValues: []interface{}{execute.Time(10 * time.Minute.Nanoseconds()), execute.Time(20 * time.Minute.Nanoseconds())},
				Data: [][]interface{}{
					{execute.Time(10 * time.Minute.Nanoseconds()), execute.Time(20 * time.Minute.Nanoseconds()), execute.Time(11 * time.Minute.Nanoseconds()), 10.0},
					{execute.Time(10 * time.Minute.Nanoseconds()), execute.Time(20 * time.Minute.Nanoseconds()), execute.Time(12 * time.Minute.Nanoseconds()), 9.0},
					{execute.Time(10 * time.Minute.Nanoseconds()), execute.Time(20 * time.Minute.Nanoseconds()), execute.Time(13 * time.Minute.Nanoseconds()), 1.0},
					{execute.Time(10 * time.Minute.Nanoseconds()), execute.Time(20 * time.Minute.Nanoseconds()), execute.Time(14 * time.Minute.Nanoseconds()), 4.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				KeyCols:   []string{"_start", "_stop"},
				KeyValues: []interface{}{execute.Time(10 * time.Minute.Nanoseconds()), execute.Time(20 * time.Minute.Nanoseconds())},
				Data:      [][]interface{}(nil),
			}},
			now: values.Time(3 * time.Minute.Nanoseconds()),
		},
		{
			name: "group key overlap",
			spec: &transformations.RangeProcedureSpec{
				Bounds: flux.Bounds{
					Start: flux.Time{
						Absolute: time.Unix(12*time.Minute.Nanoseconds(), 0),
					},
					Stop: flux.Time{
						Absolute: time.Unix(14*time.Minute.Nanoseconds(), 0),
					},
				},
				TimeColumn:  "_time",
				StartColumn: "_start",
				StopColumn:  "_stop",
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				KeyCols:   []string{"_start", "_stop"},
				KeyValues: []interface{}{execute.Time(10 * time.Minute.Nanoseconds()), execute.Time(20 * time.Minute.Nanoseconds())},
				Data: [][]interface{}{
					{execute.Time(10 * time.Minute.Nanoseconds()), execute.Time(20 * time.Minute.Nanoseconds()), execute.Time(11 * time.Minute.Nanoseconds()), 11.0},
					{execute.Time(10 * time.Minute.Nanoseconds()), execute.Time(20 * time.Minute.Nanoseconds()), execute.Time(12 * time.Minute.Nanoseconds()), 9.0},
					{execute.Time(10 * time.Minute.Nanoseconds()), execute.Time(20 * time.Minute.Nanoseconds()), execute.Time(13 * time.Minute.Nanoseconds()), 1.0},
					{execute.Time(10 * time.Minute.Nanoseconds()), execute.Time(20 * time.Minute.Nanoseconds()), execute.Time(14 * time.Minute.Nanoseconds()), 4.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				KeyCols:   []string{"_start", "_stop"},
				KeyValues: []interface{}{execute.Time(10 * time.Minute.Nanoseconds()), execute.Time(20 * time.Minute.Nanoseconds())},
				Data: [][]interface{}{
					{execute.Time(12 * time.Minute.Nanoseconds()), execute.Time(14 * time.Minute.Nanoseconds()), execute.Time(12 * time.Minute.Nanoseconds()), 9.0},
					{execute.Time(12 * time.Minute.Nanoseconds()), execute.Time(14 * time.Minute.Nanoseconds()), execute.Time(13 * time.Minute.Nanoseconds()), 1.0},
				},
			}},
			groupKey: func() flux.GroupKey {
				t1 := values.NewTime(values.Time(10 * time.Minute.Nanoseconds()))
				t2 := values.NewTime(values.Time(20 * time.Minute.Nanoseconds()))

				vs := []values.Value{t1, t2}
				return execute.NewGroupKey(
					[]flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
					},
					vs,
				)
			},
		},
		{
			name: "empty bounds start == stop",
			spec: &transformations.RangeProcedureSpec{
				Bounds: flux.Bounds{
					Start: flux.Time{
						Absolute: time.Date(2018, 1, 1, 0, 0, 0, 0, time.UTC),
					},
					Stop: flux.Time{
						Absolute: time.Date(2018, 1, 1, 0, 0, 0, 0, time.UTC),
					},
				},

				TimeColumn:  "_time",
				StartColumn: "_start",
				StopColumn:  "_stop",
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(time.Minute.Nanoseconds()), 10.0},
					{execute.Time(3 * time.Minute.Nanoseconds()), 9.0},
					{execute.Time(7 * time.Minute.Nanoseconds()), 1.0},
					{execute.Time(2 * time.Minute.Nanoseconds()), 5.0},
					{execute.Time(4 * time.Minute.Nanoseconds()), 4.0},
					{execute.Time(6 * time.Minute.Nanoseconds()), 8.0},
					{execute.Time(5 * time.Minute.Nanoseconds()), 6.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
				},
				Data: [][]interface{}(nil),
			}},
			now: values.Time(7 * time.Minute.Nanoseconds()),
		},
		{
			name: "empty bounds start > stop",
			spec: &transformations.RangeProcedureSpec{
				Bounds: flux.Bounds{
					Start: flux.Time{
						IsRelative: true,
						Relative:   -2 * time.Minute,
					},
					Stop: flux.Time{
						IsRelative: true,
						Relative:   -5 * time.Minute,
					},
				},
				TimeColumn:  "_time",
				StartColumn: "_start",
				StopColumn:  "_stop",
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(time.Minute.Nanoseconds()), 10.0},
					{execute.Time(3 * time.Minute.Nanoseconds()), 9.0},
					{execute.Time(7 * time.Minute.Nanoseconds()), 1.0},
					{execute.Time(2 * time.Minute.Nanoseconds()), 5.0},
					{execute.Time(4 * time.Minute.Nanoseconds()), 4.0},
					{execute.Time(6 * time.Minute.Nanoseconds()), 8.0},
					{execute.Time(5 * time.Minute.Nanoseconds()), 6.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
				},
				Data: [][]interface{}(nil),
			}},
			now: values.Time(7 * time.Minute.Nanoseconds()),
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			if tc.groupKey != nil && tc.want != nil {
				// populate group keys for the test case
				for _, table := range tc.data {
					tbl, ok := table.(*executetest.Table)
					if !ok {
						t.Fatal("failed to set group key")
					}
					tbl.GroupKey = tc.groupKey()
				}
				for _, table := range tc.want {
					table.GroupKey = tc.groupKey()
				}
			}
			executetest.ProcessTestHelper(
				t,
				tc.data,
				tc.want,
				tc.wantErr,
				func(d execute.Dataset, c execute.TableBuilderCache) execute.Transformation {
					var b execute.Bounds
					if tc.spec.Bounds.Start.IsRelative {
						b.Start = execute.Time(tc.spec.Bounds.Start.Time(tc.now.Time()).UnixNano())
					} else {
						b.Start = execute.Time(tc.spec.Bounds.Start.Absolute.Unix())
					}
					if tc.spec.Bounds.Stop.IsRelative {
						b.Stop = execute.Time(tc.spec.Bounds.Stop.Time(tc.now.Time()).UnixNano())
					} else {
						if tc.spec.Bounds.Stop.Absolute.Unix() == 0 {
							tc.spec.Bounds.Stop.Absolute = tc.now.Time()
						} else {
							b.Stop = execute.Time(tc.spec.Bounds.Stop.Absolute.Unix())
						}
					}

					tr, err := transformations.NewRangeTransformation(d, c, tc.spec, b)
					if err != nil {
						t.Fatal(err)
					}
					return tr
				},
			)
		})
	}
}
