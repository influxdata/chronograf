package transformations_test

import (
	"math"
	"testing"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/functions/transformations"
	"github.com/influxdata/flux/querytest"
)

func TestHistogramOperation_Marshaling(t *testing.T) {
	data := []byte(`{"id":"histogram","kind":"histogram","spec":{"column":"_value"}}`)
	op := &flux.Operation{
		ID: "histogram",
		Spec: &transformations.HistogramOpSpec{
			Column: "_value",
		},
	}
	querytest.OperationMarshalingTestHelper(t, data, op)
}

func TestHistogram_PassThrough(t *testing.T) {
	executetest.TransformationPassThroughTestHelper(t, func(d execute.Dataset, c execute.TableBuilderCache) execute.Transformation {
		s := transformations.NewHistogramTransformation(
			d,
			c,
			&transformations.HistogramProcedureSpec{},
		)
		return s
	})
}

func TestHistogram_Process(t *testing.T) {
	testCases := []struct {
		name string
		spec *transformations.HistogramProcedureSpec
		data []flux.Table
		want []*executetest.Table
	}{
		{
			name: "linear",
			spec: &transformations.HistogramProcedureSpec{HistogramOpSpec: transformations.HistogramOpSpec{
				Column:           "_value",
				UpperBoundColumn: "le",
				CountColumn:      "_value",
				Buckets:          []float64{0, 10, 20, 30, 40},
			}},
			data: []flux.Table{&executetest.Table{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), execute.Time(1), 02.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 31.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 12.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 38.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 24.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 40.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 30.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 28.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 17.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 08.0},
				},
			}},
			want: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "le", Type: flux.TFloat},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), 0.0, 0.0},
					{execute.Time(1), execute.Time(3), 10.0, 2.0},
					{execute.Time(1), execute.Time(3), 20.0, 4.0},
					{execute.Time(1), execute.Time(3), 30.0, 7.0},
					{execute.Time(1), execute.Time(3), 40.0, 10.0},
				},
			}},
		},
		{
			name: "linear+infinity",
			spec: &transformations.HistogramProcedureSpec{HistogramOpSpec: transformations.HistogramOpSpec{
				Column:           "_value",
				UpperBoundColumn: "le",
				CountColumn:      "_value",
				Buckets:          []float64{0, 10, 20, 30, 40, math.Inf(1)},
			}},
			data: []flux.Table{&executetest.Table{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), execute.Time(1), 02.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 31.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 12.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 38.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 24.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 40.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 30.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 28.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 17.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 08.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 68.0},
				},
			}},
			want: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "le", Type: flux.TFloat},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), 0.0, 0.0},
					{execute.Time(1), execute.Time(3), 10.0, 2.0},
					{execute.Time(1), execute.Time(3), 20.0, 4.0},
					{execute.Time(1), execute.Time(3), 30.0, 7.0},
					{execute.Time(1), execute.Time(3), 40.0, 10.0},
					{execute.Time(1), execute.Time(3), math.Inf(1), 11.0},
				},
			}},
		},
		{
			name: "linear+normalize",
			spec: &transformations.HistogramProcedureSpec{HistogramOpSpec: transformations.HistogramOpSpec{
				Column:           "_value",
				UpperBoundColumn: "le",
				CountColumn:      "_value",
				Buckets:          []float64{0, 10, 20, 30, 40},
				Normalize:        true,
			}},
			data: []flux.Table{&executetest.Table{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), execute.Time(1), 02.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 31.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 12.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 38.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 24.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 40.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 30.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 28.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 17.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 08.0},
				},
			}},
			want: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "le", Type: flux.TFloat},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), 0.0, 0.0},
					{execute.Time(1), execute.Time(3), 10.0, 0.2},
					{execute.Time(1), execute.Time(3), 20.0, 0.4},
					{execute.Time(1), execute.Time(3), 30.0, 0.7},
					{execute.Time(1), execute.Time(3), 40.0, 1.0},
				},
			}},
		},
		{
			name: "logarithmic",
			spec: &transformations.HistogramProcedureSpec{HistogramOpSpec: transformations.HistogramOpSpec{
				Column:           "_value",
				UpperBoundColumn: "le",
				CountColumn:      "_value",
				Buckets:          []float64{1, 2, 4, 8, 16, 32, 64},
			}},
			data: []flux.Table{&executetest.Table{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), execute.Time(1), 02.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 31.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 12.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 38.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 24.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 40.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 30.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 28.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 17.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 08.0},
				},
			}},
			want: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "le", Type: flux.TFloat},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), 1.0, 0.0},
					{execute.Time(1), execute.Time(3), 2.0, 1.0},
					{execute.Time(1), execute.Time(3), 4.0, 1.0},
					{execute.Time(1), execute.Time(3), 8.0, 2.0},
					{execute.Time(1), execute.Time(3), 16.0, 3.0},
					{execute.Time(1), execute.Time(3), 32.0, 8.0},
					{execute.Time(1), execute.Time(3), 64.0, 10.0},
				},
			}},
		},
		{
			name: "logarithmic unsorted",
			spec: &transformations.HistogramProcedureSpec{HistogramOpSpec: transformations.HistogramOpSpec{
				Column:           "_value",
				UpperBoundColumn: "le",
				CountColumn:      "_value",
				Buckets:          []float64{1, 64, 2, 4, 16, 8, 32},
			}},
			data: []flux.Table{&executetest.Table{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), execute.Time(1), 02.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 31.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 12.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 38.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 24.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 40.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 30.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 28.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 17.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 08.0},
				},
			}},
			want: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "le", Type: flux.TFloat},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), 1.0, 0.0},
					{execute.Time(1), execute.Time(3), 2.0, 1.0},
					{execute.Time(1), execute.Time(3), 4.0, 1.0},
					{execute.Time(1), execute.Time(3), 8.0, 2.0},
					{execute.Time(1), execute.Time(3), 16.0, 3.0},
					{execute.Time(1), execute.Time(3), 32.0, 8.0},
					{execute.Time(1), execute.Time(3), 64.0, 10.0},
				},
			}},
		},
		{
			name: "fibonacci",
			spec: &transformations.HistogramProcedureSpec{HistogramOpSpec: transformations.HistogramOpSpec{
				Column:           "_value",
				UpperBoundColumn: "le",
				CountColumn:      "_value",
				Buckets:          []float64{1, 2, 3, 5, 8, 13, 21, 34, 55},
			}},
			data: []flux.Table{&executetest.Table{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), execute.Time(1), 02.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 31.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 12.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 38.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 24.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 40.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 30.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 28.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 17.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 08.0},
				},
			}},
			want: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "le", Type: flux.TFloat},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), 1.0, 0.0},
					{execute.Time(1), execute.Time(3), 2.0, 1.0},
					{execute.Time(1), execute.Time(3), 3.0, 1.0},
					{execute.Time(1), execute.Time(3), 5.0, 1.0},
					{execute.Time(1), execute.Time(3), 8.0, 2.0},
					{execute.Time(1), execute.Time(3), 13.0, 3.0},
					{execute.Time(1), execute.Time(3), 21.0, 4.0},
					{execute.Time(1), execute.Time(3), 34.0, 8.0},
					{execute.Time(1), execute.Time(3), 55.0, 10.0},
				},
			}},
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
					return transformations.NewHistogramTransformation(d, c, tc.spec)
				},
			)
		})
	}
}
