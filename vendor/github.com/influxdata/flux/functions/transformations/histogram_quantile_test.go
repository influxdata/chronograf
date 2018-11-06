package transformations_test

import (
	"math"
	"testing"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/functions/transformations"
)

var linearHist = []flux.Table{&executetest.Table{
	KeyCols: []string{"_start", "_stop"},
	ColMeta: []flux.ColMeta{
		{Label: "_start", Type: flux.TTime},
		{Label: "_stop", Type: flux.TTime},
		{Label: "_time", Type: flux.TTime},
		{Label: "le", Type: flux.TFloat},
		{Label: "_value", Type: flux.TFloat},
	},
	Data: [][]interface{}{
		{execute.Time(1), execute.Time(3), execute.Time(1), 0.1, 1.0},
		{execute.Time(1), execute.Time(3), execute.Time(1), 0.2, 2.0},
		{execute.Time(1), execute.Time(3), execute.Time(1), 0.3, 3.0},
		{execute.Time(1), execute.Time(3), execute.Time(1), 0.4, 4.0},
		{execute.Time(1), execute.Time(3), execute.Time(1), 0.5, 5.0},
		{execute.Time(1), execute.Time(3), execute.Time(1), 0.6, 6.0},
		{execute.Time(1), execute.Time(3), execute.Time(1), 0.7, 7.0},
		{execute.Time(1), execute.Time(3), execute.Time(1), 0.8, 8.0},
		{execute.Time(1), execute.Time(3), execute.Time(1), 0.9, 9.0},
		{execute.Time(1), execute.Time(3), execute.Time(1), 1.0, 10.0},
		{execute.Time(1), execute.Time(3), execute.Time(1), math.Inf(1), 10.0},
	},
}}
var linearHistNoMax = []flux.Table{&executetest.Table{
	KeyCols: []string{"_start", "_stop"},
	ColMeta: []flux.ColMeta{
		{Label: "_start", Type: flux.TTime},
		{Label: "_stop", Type: flux.TTime},
		{Label: "_time", Type: flux.TTime},
		{Label: "le", Type: flux.TFloat},
		{Label: "_value", Type: flux.TFloat},
	},
	Data: [][]interface{}{
		{execute.Time(1), execute.Time(3), execute.Time(1), 0.2, 2.0},
		{execute.Time(1), execute.Time(3), execute.Time(1), 0.4, 4.0},
		{execute.Time(1), execute.Time(3), execute.Time(1), 0.6, 6.0},
		{execute.Time(1), execute.Time(3), execute.Time(1), 0.8, 8.0},
		{execute.Time(1), execute.Time(3), execute.Time(1), 1.0, 10.0},
	},
}}
var unsortedOddHist = []flux.Table{&executetest.Table{
	KeyCols: []string{"_start", "_stop"},
	ColMeta: []flux.ColMeta{
		{Label: "_start", Type: flux.TTime},
		{Label: "_stop", Type: flux.TTime},
		{Label: "_time", Type: flux.TTime},
		{Label: "le", Type: flux.TFloat},
		{Label: "_value", Type: flux.TFloat},
	},
	Data: [][]interface{}{
		{execute.Time(1), execute.Time(3), execute.Time(1), 0.4, 4.0},
		{execute.Time(1), execute.Time(3), execute.Time(1), 1.0, 10.0},
		{execute.Time(1), execute.Time(3), execute.Time(1), 0.6, 6.0},
		{execute.Time(1), execute.Time(3), execute.Time(1), 0.2, 2.0},
		{execute.Time(1), execute.Time(3), execute.Time(1), 0.8, 10.0},
	},
}}
var nonLinearHist = []flux.Table{&executetest.Table{
	KeyCols: []string{"_start", "_stop"},
	ColMeta: []flux.ColMeta{
		{Label: "_start", Type: flux.TTime},
		{Label: "_stop", Type: flux.TTime},
		{Label: "_time", Type: flux.TTime},
		{Label: "le", Type: flux.TFloat},
		{Label: "_value", Type: flux.TFloat},
	},
	Data: [][]interface{}{
		{execute.Time(1), execute.Time(3), execute.Time(1), 0.1, 1.0},
		{execute.Time(1), execute.Time(3), execute.Time(1), 0.5, 5.0},
		{execute.Time(1), execute.Time(3), execute.Time(1), 1.0, 10.0},
		{execute.Time(1), execute.Time(3), execute.Time(1), math.Inf(1), 11.0},
	},
}}

func TestHistogramQuantile_Process(t *testing.T) {
	testCases := []struct {
		name string
		spec *transformations.HistogramQuantileProcedureSpec
		data []flux.Table
		want []*executetest.Table
	}{
		{
			name: "90th linear",
			spec: &transformations.HistogramQuantileProcedureSpec{
				Quantile:         0.9,
				CountColumn:      "_value",
				UpperBoundColumn: "le",
				ValueColumn:      "_value",
			},
			data: linearHist,
			want: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), 0.9},
				},
			}},
		},
		{
			name: "0th linear",
			spec: &transformations.HistogramQuantileProcedureSpec{
				Quantile:         0.0,
				CountColumn:      "_value",
				UpperBoundColumn: "le",
				ValueColumn:      "_value",
			},
			data: linearHist,
			want: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), 0.0},
				},
			}},
		},
		{
			name: "5th linear",
			spec: &transformations.HistogramQuantileProcedureSpec{
				Quantile:         0.05,
				CountColumn:      "_value",
				UpperBoundColumn: "le",
				ValueColumn:      "_value",
			},
			data: linearHist,
			want: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), 0.05},
				},
			}},
		},
		{
			name: "5th linear -0.1 min value",
			spec: &transformations.HistogramQuantileProcedureSpec{
				Quantile:         0.05,
				CountColumn:      "_value",
				UpperBoundColumn: "le",
				ValueColumn:      "_value",
				MinValue:         -0.1,
			},
			data: linearHist,
			want: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), 0.0},
				},
			}},
		},
		{
			name: "5th linear -inf min value",
			spec: &transformations.HistogramQuantileProcedureSpec{
				Quantile:         0.05,
				CountColumn:      "_value",
				UpperBoundColumn: "le",
				ValueColumn:      "_value",
				MinValue:         math.Inf(-1),
			},
			data: linearHist,
			want: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), 0.1},
				},
			}},
		},
		{
			name: "10th linear",
			spec: &transformations.HistogramQuantileProcedureSpec{
				Quantile:         0.1,
				CountColumn:      "_value",
				UpperBoundColumn: "le",
				ValueColumn:      "_value",
			},
			data: linearHist,
			want: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), 0.1},
				},
			}},
		},
		{
			name: "95th linear",
			spec: &transformations.HistogramQuantileProcedureSpec{
				Quantile:         0.95,
				CountColumn:      "_value",
				UpperBoundColumn: "le",
				ValueColumn:      "_value",
			},
			data: linearHist,
			want: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), 0.95},
				},
			}},
		},
		{
			name: "99.999th linear",
			spec: &transformations.HistogramQuantileProcedureSpec{
				Quantile:         0.99999,
				CountColumn:      "_value",
				UpperBoundColumn: "le",
				ValueColumn:      "_value",
			},
			data: linearHist,
			want: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), 0.99999},
				},
			}},
		},
		{
			name: "100th linear",
			spec: &transformations.HistogramQuantileProcedureSpec{
				Quantile:         1.0,
				CountColumn:      "_value",
				UpperBoundColumn: "le",
				ValueColumn:      "_value",
			},
			data: linearHist,
			want: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), math.Inf(1)},
				},
			}},
		},
		{
			name: "100th linear no max",
			spec: &transformations.HistogramQuantileProcedureSpec{
				Quantile:         1.0,
				CountColumn:      "_value",
				UpperBoundColumn: "le",
				ValueColumn:      "_value",
			},
			data: linearHistNoMax,
			want: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), 1.0},
				},
			}},
		},
		{
			name: "90th linear unsorted odd",
			spec: &transformations.HistogramQuantileProcedureSpec{
				Quantile:         0.9,
				CountColumn:      "_value",
				UpperBoundColumn: "le",
				ValueColumn:      "_value",
			},
			data: unsortedOddHist,
			want: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), 0.75},
				},
			}},
		},
		{
			name: "100th linear unsorted odd",
			spec: &transformations.HistogramQuantileProcedureSpec{
				Quantile:         1.0,
				CountColumn:      "_value",
				UpperBoundColumn: "le",
				ValueColumn:      "_value",
			},
			data: unsortedOddHist,
			want: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), 1.0},
				},
			}},
		},
		{
			name: "90th nonlinear",
			spec: &transformations.HistogramQuantileProcedureSpec{
				Quantile:         0.90,
				CountColumn:      "_value",
				UpperBoundColumn: "le",
				ValueColumn:      "_value",
			},
			data: nonLinearHist,
			want: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), 0.99},
				},
			}},
		},
		{
			name: "highest finite upper bound nonlinear",
			spec: &transformations.HistogramQuantileProcedureSpec{
				Quantile:         0.99,
				CountColumn:      "_value",
				UpperBoundColumn: "le",
				ValueColumn:      "_value",
			},
			data: nonLinearHist,
			want: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), 1.0},
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
					return transformations.NewHistorgramQuantileTransformation(d, c, tc.spec)
				},
			)
		})
	}
}
