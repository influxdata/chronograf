package transformations_test

import (
	"sort"
	"strconv"
	"testing"
	"time"

	"github.com/influxdata/flux/functions/inputs"

	"github.com/influxdata/flux/values"

	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/functions/transformations"
	"github.com/influxdata/flux/querytest"
)

func TestWindow_NewQuery(t *testing.T) {
	tests := []querytest.NewQueryTestCase{
		{
			Name: "from with window",
			Raw:  `from(bucket:"mybucket") |> window(start:-4h, every:1h)`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &inputs.FromOpSpec{
							Bucket: "mybucket",
						},
					},
					{
						ID: "window1",
						Spec: &transformations.WindowOpSpec{
							Start: flux.Time{
								Relative:   -4 * time.Hour,
								IsRelative: true,
							},
							Every:       flux.Duration(time.Hour),
							Period:      flux.Duration(time.Hour),
							TimeColumn:  execute.DefaultTimeColLabel,
							StartColumn: execute.DefaultStartColLabel,
							StopColumn:  execute.DefaultStopColLabel,
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "window1"},
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

func TestWindowOperation_Marshaling(t *testing.T) {
	//TODO: Test marshalling of triggerspec
	data := []byte(`{"id":"window","kind":"window","spec":{"every":"1m","period":"1h","start":"-4h","round":"1s"}}`)
	op := &flux.Operation{
		ID: "window",
		Spec: &transformations.WindowOpSpec{
			Every:  flux.Duration(time.Minute),
			Period: flux.Duration(time.Hour),
			Start: flux.Time{
				Relative:   -4 * time.Hour,
				IsRelative: true,
			},
			Round: flux.Duration(time.Second),
		},
	}

	querytest.OperationMarshalingTestHelper(t, data, op)
}

func TestFixedWindow_PassThrough(t *testing.T) {
	executetest.TransformationPassThroughTestHelper(t, func(d execute.Dataset, c execute.TableBuilderCache) execute.Transformation {
		fw := transformations.NewFixedWindowTransformation(
			d,
			c,
			execute.Bounds{},
			execute.Window{
				Every:  execute.Duration(time.Minute),
				Period: execute.Duration(time.Minute),
			},
			execute.DefaultTimeColLabel,
			execute.DefaultStartColLabel,
			execute.DefaultStopColLabel,
			false,
		)
		return fw
	})
}

var EmptyBounds = &execute.Bounds{
	Start: execute.Time(0),
	Stop:  execute.Time(0),
}

func newEmptyWindowTable(start execute.Time, stop execute.Time, cols []flux.ColMeta) *executetest.Table {
	return &executetest.Table{
		KeyCols:   []string{"_start", "_stop"},
		KeyValues: []interface{}{start, stop},
		ColMeta:   cols,
		Data:      [][]interface{}(nil),
		GroupKey: execute.NewGroupKey(
			[]flux.ColMeta{
				{Label: "_start", Type: flux.TTime},
				{Label: "_stop", Type: flux.TTime},
			},
			[]values.Value{
				values.NewTime(start),
				values.NewTime(stop),
			},
		),
	}
}

func TestFixedWindow_Process(t *testing.T) {
	// test columns which all expected data will use
	testCols := []flux.ColMeta{
		{Label: "_start", Type: flux.TTime},
		{Label: "_stop", Type: flux.TTime},
		{Label: "_time", Type: flux.TTime},
		{Label: "_value", Type: flux.TFloat},
	}
	testCases := []struct {
		name          string
		valueCol      flux.ColMeta
		start         execute.Time
		every, period execute.Duration
		createEmpty   bool
		num           int
		bounds        *execute.Bounds
		want          func(start execute.Time) []*executetest.Table
	}{
		{
			name:     "nonoverlapping_nonaligned",
			valueCol: flux.ColMeta{Label: "_value", Type: flux.TFloat},
			// Use a time that is *not* aligned with the every/period durations of the window
			start:       execute.Time(time.Date(2017, 10, 10, 10, 10, 10, 10, time.UTC).UnixNano()),
			every:       execute.Duration(time.Minute),
			period:      execute.Duration(time.Minute),
			createEmpty: true,
			num:         15,
			want: func(start execute.Time) []*executetest.Table {
				return []*executetest.Table{
					{
						KeyCols: []string{"_start", "_stop"},
						ColMeta: []flux.ColMeta{
							{Label: "_start", Type: flux.TTime},
							{Label: "_stop", Type: flux.TTime},
							{Label: "_time", Type: flux.TTime},
							{Label: "_value", Type: flux.TFloat},
						},
						Data: [][]interface{}{
							{start, start + execute.Time(time.Minute), start, 0.0},
							{start, start + execute.Time(time.Minute), start + execute.Time(10*time.Second), 1.0},
							{start, start + execute.Time(time.Minute), start + execute.Time(20*time.Second), 2.0},
							{start, start + execute.Time(time.Minute), start + execute.Time(30*time.Second), 3.0},
							{start, start + execute.Time(time.Minute), start + execute.Time(40*time.Second), 4.0},
							{start, start + execute.Time(time.Minute), start + execute.Time(50*time.Second), 5.0},
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
							{start + execute.Time(1*time.Minute), start + execute.Time(2*time.Minute), start + execute.Time(60*time.Second), 6.0},
							{start + execute.Time(1*time.Minute), start + execute.Time(2*time.Minute), start + execute.Time(70*time.Second), 7.0},
							{start + execute.Time(1*time.Minute), start + execute.Time(2*time.Minute), start + execute.Time(80*time.Second), 8.0},
							{start + execute.Time(1*time.Minute), start + execute.Time(2*time.Minute), start + execute.Time(90*time.Second), 9.0},
							{start + execute.Time(1*time.Minute), start + execute.Time(2*time.Minute), start + execute.Time(100*time.Second), 10.0},
							{start + execute.Time(1*time.Minute), start + execute.Time(2*time.Minute), start + execute.Time(110*time.Second), 11.0},
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
							{start + execute.Time(2*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(120*time.Second), 12.0},
							{start + execute.Time(2*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(130*time.Second), 13.0},
							{start + execute.Time(2*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(140*time.Second), 14.0},
						},
					},
					newEmptyWindowTable(start+execute.Time(3*time.Minute), start+execute.Time(4*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(4*time.Minute), start+execute.Time(5*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(5*time.Minute), start+execute.Time(6*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(6*time.Minute), start+execute.Time(7*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(7*time.Minute), start+execute.Time(8*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(8*time.Minute), start+execute.Time(9*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(9*time.Minute), start+execute.Time(10*time.Minute), testCols),
				}
			},
		},

		{
			name:     "nonoverlapping_aligned",
			valueCol: flux.ColMeta{Label: "_value", Type: flux.TFloat},
			// Use a time that is aligned with the every/period durations of the window
			start:       execute.Time(time.Date(2017, 10, 10, 10, 0, 0, 0, time.UTC).UnixNano()),
			every:       execute.Duration(time.Minute),
			period:      execute.Duration(time.Minute),
			createEmpty: true,
			num:         15,
			want: func(start execute.Time) []*executetest.Table {
				return []*executetest.Table{
					{
						KeyCols: []string{"_start", "_stop"},
						ColMeta: []flux.ColMeta{
							{Label: "_start", Type: flux.TTime},
							{Label: "_stop", Type: flux.TTime},
							{Label: "_time", Type: flux.TTime},
							{Label: "_value", Type: flux.TFloat},
						},
						Data: [][]interface{}{
							{start, start + execute.Time(time.Minute), start, 0.0},
							{start, start + execute.Time(time.Minute), start + execute.Time(10*time.Second), 1.0},
							{start, start + execute.Time(time.Minute), start + execute.Time(20*time.Second), 2.0},
							{start, start + execute.Time(time.Minute), start + execute.Time(30*time.Second), 3.0},
							{start, start + execute.Time(time.Minute), start + execute.Time(40*time.Second), 4.0},
							{start, start + execute.Time(time.Minute), start + execute.Time(50*time.Second), 5.0},
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
							{start + execute.Time(1*time.Minute), start + execute.Time(2*time.Minute), start + execute.Time(60*time.Second), 6.0},
							{start + execute.Time(1*time.Minute), start + execute.Time(2*time.Minute), start + execute.Time(70*time.Second), 7.0},
							{start + execute.Time(1*time.Minute), start + execute.Time(2*time.Minute), start + execute.Time(80*time.Second), 8.0},
							{start + execute.Time(1*time.Minute), start + execute.Time(2*time.Minute), start + execute.Time(90*time.Second), 9.0},
							{start + execute.Time(1*time.Minute), start + execute.Time(2*time.Minute), start + execute.Time(100*time.Second), 10.0},
							{start + execute.Time(1*time.Minute), start + execute.Time(2*time.Minute), start + execute.Time(110*time.Second), 11.0},
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
							{start + execute.Time(2*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(120*time.Second), 12.0},
							{start + execute.Time(2*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(130*time.Second), 13.0},
							{start + execute.Time(2*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(140*time.Second), 14.0},
						},
					},
					{
						KeyCols:   []string{"_start", "_stop"},
						KeyValues: []interface{}{start + execute.Time(3*time.Minute), start + execute.Time(4*time.Minute)},
						ColMeta: []flux.ColMeta{
							{Label: "_start", Type: flux.TTime},
							{Label: "_stop", Type: flux.TTime},
							{Label: "_time", Type: flux.TTime},
							{Label: "_value", Type: flux.TFloat},
						},
						GroupKey: execute.NewGroupKey(
							[]flux.ColMeta{
								{Label: "_start", Type: flux.TTime},
								{Label: "_stop", Type: flux.TTime},
							},
							[]values.Value{
								values.NewTime(start + execute.Time(3*time.Minute)),
								values.NewTime(start + execute.Time(4*time.Minute)),
							},
						),
					},
					newEmptyWindowTable(start+execute.Time(4*time.Minute), start+execute.Time(5*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(5*time.Minute), start+execute.Time(6*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(6*time.Minute), start+execute.Time(7*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(7*time.Minute), start+execute.Time(8*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(8*time.Minute), start+execute.Time(9*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(9*time.Minute), start+execute.Time(10*time.Minute), testCols),
				}
			},
		},
		{
			name:     "overlapping_nonaligned",
			valueCol: flux.ColMeta{Label: "_value", Type: flux.TFloat},
			// Use a time that is *not* aligned with the every/period durations of the window
			start:       execute.Time(time.Date(2017, 10, 10, 10, 10, 10, 10, time.UTC).UnixNano()),
			every:       execute.Duration(time.Minute),
			period:      execute.Duration(2 * time.Minute),
			createEmpty: true,
			num:         15,
			want: func(start execute.Time) []*executetest.Table {
				return []*executetest.Table{
					{
						KeyCols: []string{"_start", "_stop"},
						ColMeta: []flux.ColMeta{
							{Label: "_start", Type: flux.TTime},
							{Label: "_stop", Type: flux.TTime},
							{Label: "_time", Type: flux.TTime},
							{Label: "_value", Type: flux.TFloat},
						},
						Data: [][]interface{}{
							{start, start + execute.Time(time.Minute), start, 0.0},
							{start, start + execute.Time(time.Minute), start + execute.Time(10*time.Second), 1.0},
							{start, start + execute.Time(time.Minute), start + execute.Time(20*time.Second), 2.0},
							{start, start + execute.Time(time.Minute), start + execute.Time(30*time.Second), 3.0},
							{start, start + execute.Time(time.Minute), start + execute.Time(40*time.Second), 4.0},
							{start, start + execute.Time(time.Minute), start + execute.Time(50*time.Second), 5.0},
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
							{start, start + execute.Time(2*time.Minute), start, 0.0},
							{start, start + execute.Time(2*time.Minute), start + execute.Time(10*time.Second), 1.0},
							{start, start + execute.Time(2*time.Minute), start + execute.Time(20*time.Second), 2.0},
							{start, start + execute.Time(2*time.Minute), start + execute.Time(30*time.Second), 3.0},
							{start, start + execute.Time(2*time.Minute), start + execute.Time(40*time.Second), 4.0},
							{start, start + execute.Time(2*time.Minute), start + execute.Time(50*time.Second), 5.0},
							{start, start + execute.Time(2*time.Minute), start + execute.Time(60*time.Second), 6.0},
							{start, start + execute.Time(2*time.Minute), start + execute.Time(70*time.Second), 7.0},
							{start, start + execute.Time(2*time.Minute), start + execute.Time(80*time.Second), 8.0},
							{start, start + execute.Time(2*time.Minute), start + execute.Time(90*time.Second), 9.0},
							{start, start + execute.Time(2*time.Minute), start + execute.Time(100*time.Second), 10.0},
							{start, start + execute.Time(2*time.Minute), start + execute.Time(110*time.Second), 11.0},
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
							{start + execute.Time(1*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(60*time.Second), 6.0},
							{start + execute.Time(1*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(70*time.Second), 7.0},
							{start + execute.Time(1*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(80*time.Second), 8.0},
							{start + execute.Time(1*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(90*time.Second), 9.0},
							{start + execute.Time(1*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(100*time.Second), 10.0},
							{start + execute.Time(1*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(110*time.Second), 11.0},
							{start + execute.Time(1*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(120*time.Second), 12.0},
							{start + execute.Time(1*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(130*time.Second), 13.0},
							{start + execute.Time(1*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(140*time.Second), 14.0},
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
							{start + execute.Time(2*time.Minute), start + execute.Time(4*time.Minute), start + execute.Time(120*time.Second), 12.0},
							{start + execute.Time(2*time.Minute), start + execute.Time(4*time.Minute), start + execute.Time(130*time.Second), 13.0},
							{start + execute.Time(2*time.Minute), start + execute.Time(4*time.Minute), start + execute.Time(140*time.Second), 14.0},
						},
					},
					newEmptyWindowTable(start+execute.Time(3*time.Minute), start+execute.Time(5*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(4*time.Minute), start+execute.Time(6*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(5*time.Minute), start+execute.Time(7*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(6*time.Minute), start+execute.Time(8*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(7*time.Minute), start+execute.Time(9*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(8*time.Minute), start+execute.Time(10*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(9*time.Minute), start+execute.Time(10*time.Minute), testCols),
				}
			},
		},
		{
			name:     "overlapping_aligned",
			valueCol: flux.ColMeta{Label: "_value", Type: flux.TFloat},
			// Use a time that is aligned with the every/period durations of the window
			start:       execute.Time(time.Date(2017, 10, 10, 10, 0, 0, 0, time.UTC).UnixNano()),
			every:       execute.Duration(time.Minute),
			period:      execute.Duration(2 * time.Minute),
			createEmpty: true,
			num:         15,
			want: func(start execute.Time) []*executetest.Table {
				return []*executetest.Table{
					{
						KeyCols: []string{"_start", "_stop"},
						ColMeta: []flux.ColMeta{
							{Label: "_start", Type: flux.TTime},
							{Label: "_stop", Type: flux.TTime},
							{Label: "_time", Type: flux.TTime},
							{Label: "_value", Type: flux.TFloat},
						},
						Data: [][]interface{}{
							{start, start + execute.Time(time.Minute), start, 0.0},
							{start, start + execute.Time(time.Minute), start + execute.Time(10*time.Second), 1.0},
							{start, start + execute.Time(time.Minute), start + execute.Time(20*time.Second), 2.0},
							{start, start + execute.Time(time.Minute), start + execute.Time(30*time.Second), 3.0},
							{start, start + execute.Time(time.Minute), start + execute.Time(40*time.Second), 4.0},
							{start, start + execute.Time(time.Minute), start + execute.Time(50*time.Second), 5.0},
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
							{start, start + execute.Time(2*time.Minute), start, 0.0},
							{start, start + execute.Time(2*time.Minute), start + execute.Time(10*time.Second), 1.0},
							{start, start + execute.Time(2*time.Minute), start + execute.Time(20*time.Second), 2.0},
							{start, start + execute.Time(2*time.Minute), start + execute.Time(30*time.Second), 3.0},
							{start, start + execute.Time(2*time.Minute), start + execute.Time(40*time.Second), 4.0},
							{start, start + execute.Time(2*time.Minute), start + execute.Time(50*time.Second), 5.0},
							{start, start + execute.Time(2*time.Minute), start + execute.Time(60*time.Second), 6.0},
							{start, start + execute.Time(2*time.Minute), start + execute.Time(70*time.Second), 7.0},
							{start, start + execute.Time(2*time.Minute), start + execute.Time(80*time.Second), 8.0},
							{start, start + execute.Time(2*time.Minute), start + execute.Time(90*time.Second), 9.0},
							{start, start + execute.Time(2*time.Minute), start + execute.Time(100*time.Second), 10.0},
							{start, start + execute.Time(2*time.Minute), start + execute.Time(110*time.Second), 11.0},
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
							{start + execute.Time(1*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(60*time.Second), 6.0},
							{start + execute.Time(1*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(70*time.Second), 7.0},
							{start + execute.Time(1*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(80*time.Second), 8.0},
							{start + execute.Time(1*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(90*time.Second), 9.0},
							{start + execute.Time(1*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(100*time.Second), 10.0},
							{start + execute.Time(1*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(110*time.Second), 11.0},
							{start + execute.Time(1*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(120*time.Second), 12.0},
							{start + execute.Time(1*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(130*time.Second), 13.0},
							{start + execute.Time(1*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(140*time.Second), 14.0},
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
							{start + execute.Time(2*time.Minute), start + execute.Time(4*time.Minute), start + execute.Time(120*time.Second), 12.0},
							{start + execute.Time(2*time.Minute), start + execute.Time(4*time.Minute), start + execute.Time(130*time.Second), 13.0},
							{start + execute.Time(2*time.Minute), start + execute.Time(4*time.Minute), start + execute.Time(140*time.Second), 14.0},
						},
					},
					newEmptyWindowTable(start+execute.Time(3*time.Minute), start+execute.Time(5*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(4*time.Minute), start+execute.Time(6*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(5*time.Minute), start+execute.Time(7*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(6*time.Minute), start+execute.Time(8*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(7*time.Minute), start+execute.Time(9*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(8*time.Minute), start+execute.Time(10*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(9*time.Minute), start+execute.Time(10*time.Minute), testCols),
				}
			},
		},
		{
			name:     "underlapping_nonaligned",
			valueCol: flux.ColMeta{Label: "_value", Type: flux.TFloat},
			// Use a time that is *not* aligned with the every/period durations of the window
			start:       execute.Time(time.Date(2017, 10, 10, 10, 10, 10, 10, time.UTC).UnixNano()),
			every:       execute.Duration(2 * time.Minute),
			period:      execute.Duration(time.Minute),
			createEmpty: true,
			num:         24,
			want: func(start execute.Time) []*executetest.Table {
				return []*executetest.Table{
					{
						KeyCols: []string{"_start", "_stop"},
						ColMeta: []flux.ColMeta{
							{Label: "_start", Type: flux.TTime},
							{Label: "_stop", Type: flux.TTime},
							{Label: "_time", Type: flux.TTime},
							{Label: "_value", Type: flux.TFloat},
						},
						Data: [][]interface{}{
							{start + 1*execute.Time(time.Minute), start + 2*execute.Time(time.Minute), start + execute.Time(60*time.Second), 6.0},
							{start + 1*execute.Time(time.Minute), start + 2*execute.Time(time.Minute), start + execute.Time(70*time.Second), 7.0},
							{start + 1*execute.Time(time.Minute), start + 2*execute.Time(time.Minute), start + execute.Time(80*time.Second), 8.0},
							{start + 1*execute.Time(time.Minute), start + 2*execute.Time(time.Minute), start + execute.Time(90*time.Second), 9.0},
							{start + 1*execute.Time(time.Minute), start + 2*execute.Time(time.Minute), start + execute.Time(100*time.Second), 10.0},
							{start + 1*execute.Time(time.Minute), start + 2*execute.Time(time.Minute), start + execute.Time(110*time.Second), 11.0},
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
							{start + execute.Time(3*time.Minute), start + execute.Time(4*time.Minute), start + execute.Time(180*time.Second), 18.0},
							{start + execute.Time(3*time.Minute), start + execute.Time(4*time.Minute), start + execute.Time(190*time.Second), 19.0},
							{start + execute.Time(3*time.Minute), start + execute.Time(4*time.Minute), start + execute.Time(200*time.Second), 20.0},
							{start + execute.Time(3*time.Minute), start + execute.Time(4*time.Minute), start + execute.Time(210*time.Second), 21.0},
							{start + execute.Time(3*time.Minute), start + execute.Time(4*time.Minute), start + execute.Time(220*time.Second), 22.0},
							{start + execute.Time(3*time.Minute), start + execute.Time(4*time.Minute), start + execute.Time(230*time.Second), 23.0},
						},
					},
					newEmptyWindowTable(start+execute.Time(5*time.Minute), start+execute.Time(6*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(7*time.Minute), start+execute.Time(8*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(9*time.Minute), start+execute.Time(10*time.Minute), testCols),
				}
			},
		},
		{
			name:     "underlapping_aligned",
			valueCol: flux.ColMeta{Label: "_value", Type: flux.TFloat},
			// Use a time that is  aligned with the every/period durations of the window
			start:       execute.Time(time.Date(2017, 10, 10, 10, 0, 0, 0, time.UTC).UnixNano()),
			every:       execute.Duration(2 * time.Minute),
			period:      execute.Duration(time.Minute),
			createEmpty: true,
			num:         24,
			want: func(start execute.Time) []*executetest.Table {
				return []*executetest.Table{
					{
						KeyCols: []string{"_start", "_stop"},
						ColMeta: []flux.ColMeta{
							{Label: "_start", Type: flux.TTime},
							{Label: "_stop", Type: flux.TTime},
							{Label: "_time", Type: flux.TTime},
							{Label: "_value", Type: flux.TFloat},
						},
						Data: [][]interface{}{
							{start + 1*execute.Time(time.Minute), start + 2*execute.Time(time.Minute), start + execute.Time(60*time.Second), 6.0},
							{start + 1*execute.Time(time.Minute), start + 2*execute.Time(time.Minute), start + execute.Time(70*time.Second), 7.0},
							{start + 1*execute.Time(time.Minute), start + 2*execute.Time(time.Minute), start + execute.Time(80*time.Second), 8.0},
							{start + 1*execute.Time(time.Minute), start + 2*execute.Time(time.Minute), start + execute.Time(90*time.Second), 9.0},
							{start + 1*execute.Time(time.Minute), start + 2*execute.Time(time.Minute), start + execute.Time(100*time.Second), 10.0},
							{start + 1*execute.Time(time.Minute), start + 2*execute.Time(time.Minute), start + execute.Time(110*time.Second), 11.0},
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
							{start + execute.Time(3*time.Minute), start + execute.Time(4*time.Minute), start + execute.Time(180*time.Second), 18.0},
							{start + execute.Time(3*time.Minute), start + execute.Time(4*time.Minute), start + execute.Time(190*time.Second), 19.0},
							{start + execute.Time(3*time.Minute), start + execute.Time(4*time.Minute), start + execute.Time(200*time.Second), 20.0},
							{start + execute.Time(3*time.Minute), start + execute.Time(4*time.Minute), start + execute.Time(210*time.Second), 21.0},
							{start + execute.Time(3*time.Minute), start + execute.Time(4*time.Minute), start + execute.Time(220*time.Second), 22.0},
							{start + execute.Time(3*time.Minute), start + execute.Time(4*time.Minute), start + execute.Time(230*time.Second), 23.0},
						},
					},
					newEmptyWindowTable(start+execute.Time(5*time.Minute), start+execute.Time(6*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(7*time.Minute), start+execute.Time(8*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(9*time.Minute), start+execute.Time(10*time.Minute), testCols),
				}
			},
		},
		{
			name:     "nonoverlapping_aligned_int",
			valueCol: flux.ColMeta{Label: "_value", Type: flux.TInt},
			// Use a time that is aligned with the every/period durations of the window
			start:       execute.Time(time.Date(2017, 10, 10, 10, 0, 0, 0, time.UTC).UnixNano()),
			every:       execute.Duration(time.Minute),
			period:      execute.Duration(time.Minute),
			createEmpty: true,
			num:         15,
			want: func(start execute.Time) []*executetest.Table {
				testCols := testCols
				testCols[3].Type = flux.TInt
				return []*executetest.Table{
					{
						KeyCols: []string{"_start", "_stop"},
						ColMeta: []flux.ColMeta{
							{Label: "_start", Type: flux.TTime},
							{Label: "_stop", Type: flux.TTime},
							{Label: "_time", Type: flux.TTime},
							{Label: "_value", Type: flux.TInt},
						},
						Data: [][]interface{}{
							{start, start + execute.Time(time.Minute), start, int64(0.0)},
							{start, start + execute.Time(time.Minute), start + execute.Time(10*time.Second), int64(1)},
							{start, start + execute.Time(time.Minute), start + execute.Time(20*time.Second), int64(2)},
							{start, start + execute.Time(time.Minute), start + execute.Time(30*time.Second), int64(3)},
							{start, start + execute.Time(time.Minute), start + execute.Time(40*time.Second), int64(4)},
							{start, start + execute.Time(time.Minute), start + execute.Time(50*time.Second), int64(5)},
						},
					},
					{
						KeyCols: []string{"_start", "_stop"},
						ColMeta: []flux.ColMeta{
							{Label: "_start", Type: flux.TTime},
							{Label: "_stop", Type: flux.TTime},
							{Label: "_time", Type: flux.TTime},
							{Label: "_value", Type: flux.TInt},
						},
						Data: [][]interface{}{
							{start + execute.Time(1*time.Minute), start + execute.Time(2*time.Minute), start + execute.Time(60*time.Second), int64(6)},
							{start + execute.Time(1*time.Minute), start + execute.Time(2*time.Minute), start + execute.Time(70*time.Second), int64(7)},
							{start + execute.Time(1*time.Minute), start + execute.Time(2*time.Minute), start + execute.Time(80*time.Second), int64(8)},
							{start + execute.Time(1*time.Minute), start + execute.Time(2*time.Minute), start + execute.Time(90*time.Second), int64(9)},
							{start + execute.Time(1*time.Minute), start + execute.Time(2*time.Minute), start + execute.Time(100*time.Second), int64(10)},
							{start + execute.Time(1*time.Minute), start + execute.Time(2*time.Minute), start + execute.Time(110*time.Second), int64(11)},
						},
					},
					{
						KeyCols: []string{"_start", "_stop"},
						ColMeta: []flux.ColMeta{
							{Label: "_start", Type: flux.TTime},
							{Label: "_stop", Type: flux.TTime},
							{Label: "_time", Type: flux.TTime},
							{Label: "_value", Type: flux.TInt},
						},
						Data: [][]interface{}{
							{start + execute.Time(2*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(120*time.Second), int64(12)},
							{start + execute.Time(2*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(130*time.Second), int64(13)},
							{start + execute.Time(2*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(140*time.Second), int64(14)},
						},
					},
					newEmptyWindowTable(start+execute.Time(3*time.Minute), start+execute.Time(4*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(4*time.Minute), start+execute.Time(5*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(5*time.Minute), start+execute.Time(6*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(6*time.Minute), start+execute.Time(7*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(7*time.Minute), start+execute.Time(8*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(8*time.Minute), start+execute.Time(9*time.Minute), testCols),
					newEmptyWindowTable(start+execute.Time(9*time.Minute), start+execute.Time(10*time.Minute), testCols),
				}
			},
		},
		{
			name:     "don't create empty",
			valueCol: flux.ColMeta{Label: "_value", Type: flux.TInt},
			// Use a time that is aligned with the every/period durations of the window
			start:       execute.Time(time.Date(2017, 10, 10, 10, 0, 0, 0, time.UTC).UnixNano()),
			every:       execute.Duration(time.Minute),
			period:      execute.Duration(time.Minute),
			createEmpty: false,
			num:         15,
			want: func(start execute.Time) []*executetest.Table {
				testCols := testCols
				testCols[3].Type = flux.TInt
				return []*executetest.Table{
					{
						KeyCols: []string{"_start", "_stop"},
						ColMeta: []flux.ColMeta{
							{Label: "_start", Type: flux.TTime},
							{Label: "_stop", Type: flux.TTime},
							{Label: "_time", Type: flux.TTime},
							{Label: "_value", Type: flux.TInt},
						},
						Data: [][]interface{}{
							{start, start + execute.Time(time.Minute), start, int64(0.0)},
							{start, start + execute.Time(time.Minute), start + execute.Time(10*time.Second), int64(1)},
							{start, start + execute.Time(time.Minute), start + execute.Time(20*time.Second), int64(2)},
							{start, start + execute.Time(time.Minute), start + execute.Time(30*time.Second), int64(3)},
							{start, start + execute.Time(time.Minute), start + execute.Time(40*time.Second), int64(4)},
							{start, start + execute.Time(time.Minute), start + execute.Time(50*time.Second), int64(5)},
						},
					},
					{
						KeyCols: []string{"_start", "_stop"},
						ColMeta: []flux.ColMeta{
							{Label: "_start", Type: flux.TTime},
							{Label: "_stop", Type: flux.TTime},
							{Label: "_time", Type: flux.TTime},
							{Label: "_value", Type: flux.TInt},
						},
						Data: [][]interface{}{
							{start + execute.Time(1*time.Minute), start + execute.Time(2*time.Minute), start + execute.Time(60*time.Second), int64(6)},
							{start + execute.Time(1*time.Minute), start + execute.Time(2*time.Minute), start + execute.Time(70*time.Second), int64(7)},
							{start + execute.Time(1*time.Minute), start + execute.Time(2*time.Minute), start + execute.Time(80*time.Second), int64(8)},
							{start + execute.Time(1*time.Minute), start + execute.Time(2*time.Minute), start + execute.Time(90*time.Second), int64(9)},
							{start + execute.Time(1*time.Minute), start + execute.Time(2*time.Minute), start + execute.Time(100*time.Second), int64(10)},
							{start + execute.Time(1*time.Minute), start + execute.Time(2*time.Minute), start + execute.Time(110*time.Second), int64(11)},
						},
					},
					{
						KeyCols: []string{"_start", "_stop"},
						ColMeta: []flux.ColMeta{
							{Label: "_start", Type: flux.TTime},
							{Label: "_stop", Type: flux.TTime},
							{Label: "_time", Type: flux.TTime},
							{Label: "_value", Type: flux.TInt},
						},
						Data: [][]interface{}{
							{start + execute.Time(2*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(120*time.Second), int64(12)},
							{start + execute.Time(2*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(130*time.Second), int64(13)},
							{start + execute.Time(2*time.Minute), start + execute.Time(3*time.Minute), start + execute.Time(140*time.Second), int64(14)},
						},
					},
				}
			},
		},
		{
			name:     "empty bounds start == stop",
			valueCol: flux.ColMeta{Label: "_value", Type: flux.TInt},
			start:    execute.Time(time.Date(2017, 10, 10, 10, 0, 0, 0, time.UTC).UnixNano()),
			every:    execute.Duration(time.Minute),
			period:   execute.Duration(time.Minute),
			num:      15,
			bounds:   EmptyBounds,
			want: func(start execute.Time) []*executetest.Table {
				return nil
			},
		},
		{
			name:     "empty bounds start > stop",
			valueCol: flux.ColMeta{Label: "_value", Type: flux.TInt},
			start:    execute.Time(time.Date(2017, 10, 10, 10, 0, 0, 0, time.UTC).UnixNano()),
			every:    execute.Duration(time.Minute),
			period:   execute.Duration(time.Minute),
			num:      15,
			bounds: &execute.Bounds{
				Start: execute.Time(time.Date(2017, 10, 10, 12, 0, 0, 0, time.UTC).UnixNano()),
				Stop:  execute.Time(time.Date(2017, 10, 10, 10, 0, 0, 0, time.UTC).UnixNano()),
			},
			want: func(start execute.Time) []*executetest.Table {
				return nil
			},
		},
	}

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			var start, stop execute.Time
			if tc.bounds != nil {
				start = tc.bounds.Start
				stop = tc.bounds.Stop
			} else {
				start = tc.start
				stop = start + execute.Time(10*time.Minute)
			}

			d := executetest.NewDataset(executetest.RandomDatasetID())
			c := execute.NewTableBuilderCache(executetest.UnlimitedAllocator)
			c.SetTriggerSpec(execute.DefaultTriggerSpec)

			fw := transformations.NewFixedWindowTransformation(
				d,
				c,
				execute.Bounds{
					Start: start,
					Stop:  stop,
				},
				execute.Window{
					Every:  tc.every,
					Period: tc.period,
					Start:  start,
				},
				execute.DefaultTimeColLabel,
				execute.DefaultStartColLabel,
				execute.DefaultStopColLabel,
				tc.createEmpty,
			)

			table0 := &executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_time", Type: flux.TTime},
					tc.valueCol,
				},
			}

			for i := 0; i < tc.num; i++ {
				var v interface{}
				switch tc.valueCol.Type {
				case flux.TBool:
					v = bool(i%2 == 0)
				case flux.TInt:
					v = int64(i)
				case flux.TUInt:
					v = uint64(i)
				case flux.TFloat:
					v = float64(i)
				case flux.TString:
					v = strconv.Itoa(i)
				}
				table0.Data = append(table0.Data, []interface{}{
					start,
					stop,
					start + execute.Time(time.Duration(i)*10*time.Second),
					v,
				})
			}

			parentID := executetest.RandomDatasetID()
			if err := fw.Process(parentID, table0); err != nil {
				t.Fatal(err)
			}

			got, err := executetest.TablesFromCache(c)
			if err != nil {
				t.Fatal(err)
			}

			want := tc.want(start)

			executetest.NormalizeTables(got)
			executetest.NormalizeTables(want)

			sort.Sort(executetest.SortedTables(got))
			sort.Sort(executetest.SortedTables(want))

			if !cmp.Equal(want, got) {
				t.Errorf("unexpected tables -want/+got\n%s", cmp.Diff(want, got))
			}
		})
	}
}
