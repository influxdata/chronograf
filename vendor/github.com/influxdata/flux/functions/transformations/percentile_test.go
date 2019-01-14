package transformations_test

import (
	"math"
	"testing"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/arrow"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/functions/transformations"
	"github.com/influxdata/flux/memory"
	"github.com/influxdata/flux/querytest"
)

func TestPercentileOperation_Marshaling(t *testing.T) {
	data := []byte(`{"id":"percentile","kind":"percentile","spec":{"percentile":0.9}}`)
	op := &flux.Operation{
		ID: "percentile",
		Spec: &transformations.PercentileOpSpec{
			Percentile: 0.9,
		},
	}

	querytest.OperationMarshalingTestHelper(t, data, op)
}

func TestPercentile_Process(t *testing.T) {
	testCases := []struct {
		name       string
		data       []float64
		percentile float64
		exact      bool
		want       float64
	}{
		{
			name:       "zero",
			data:       []float64{0, 0, 0},
			percentile: 0.5,
			want:       0.0,
		},
		{
			name:       "50th",
			data:       []float64{1, 2, 3, 4, 5, 5, 4, 3, 2, 1},
			percentile: 0.5,
			want:       3,
		},
		{
			name:       "75th",
			data:       []float64{1, 2, 3, 4, 5, 5, 4, 3, 2, 1},
			percentile: 0.75,
			want:       4,
		},
		{
			name:       "90th",
			data:       []float64{1, 2, 3, 4, 5, 5, 4, 3, 2, 1},
			percentile: 0.9,
			want:       5,
		},
		{
			name:       "99th",
			data:       []float64{1, 2, 3, 4, 5, 5, 4, 3, 2, 1},
			percentile: 0.99,
			want:       5,
		},
		{
			name:       "exact 50th",
			data:       []float64{1, 2, 3, 4, 5},
			percentile: 0.5,
			exact:      true,
			want:       3,
		},
		{
			name:       "exact 75th",
			data:       []float64{1, 2, 3, 4, 5},
			percentile: 0.75,
			exact:      true,
			want:       4,
		},
		{
			name:       "exact 90th",
			data:       []float64{1, 2, 3, 4, 5},
			percentile: 0.9,
			exact:      true,
			want:       4.6,
		},
		{
			name:       "exact 99th",
			data:       []float64{1, 2, 3, 4, 5},
			percentile: 0.99,
			exact:      true,
			want:       4.96,
		},
		{
			name:       "exact 100th",
			data:       []float64{1, 2, 3, 4, 5},
			percentile: 1,
			exact:      true,
			want:       5,
		},
		{
			name:       "exact 50th normal",
			data:       NormalData,
			percentile: 0.5,
			exact:      true,
			want:       10.000736834856248,
		},
		{
			name:       "normal",
			data:       NormalData,
			percentile: 0.9,
			want:       13.842132136909889,
		},
		{
			name: "NaN",
			data: []float64{},
			want: math.NaN(),
		},
	}
	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			var agg execute.Aggregate
			if tc.exact {
				agg = &transformations.ExactPercentileAgg{Quantile: tc.percentile}
			} else {
				agg = &transformations.PercentileAgg{
					Quantile:    tc.percentile,
					Compression: 1000,
				}
			}
			executetest.AggFuncTestHelper(
				t,
				agg,
				tc.data,
				tc.want,
			)
		})
	}
}

func TestPercentileSelector_Process(t *testing.T) {
	testCases := []struct {
		name     string
		quantile float64
		data     []flux.Table
		want     []*executetest.Table
	}{
		{
			name:     "select_10",
			quantile: 0.1,
			data: []flux.Table{
				&executetest.Table{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(0), 1.0, "a", "y"},
						{execute.Time(10), 2.0, "a", "x"},
						{execute.Time(20), 3.0, "a", "y"},
						{execute.Time(30), 4.0, "a", "x"},
						{execute.Time(40), 5.0, "a", "y"},
					},
				}},
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
						{execute.Time(0), 1.0, "a", "y"},
					},
				},
			},
		},
		{
			name:     "select_20",
			quantile: 0.2,
			data: []flux.Table{&executetest.Table{
				KeyCols: []string{"t1"},
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "t1", Type: flux.TString},
					{Label: "t2", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(0), 1.0, "a", "y"},
					{execute.Time(10), 2.0, "a", "x"},
					{execute.Time(20), 3.0, "a", "y"},
					{execute.Time(30), 4.0, "a", "x"},
					{execute.Time(40), 5.0, "a", "y"},
				},
			}},
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
						{execute.Time(0), 1.0, "a", "y"},
					},
				}},
		},
		{
			name:     "select_40",
			quantile: 0.4,
			data: []flux.Table{&executetest.Table{
				KeyCols: []string{"t1"},
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "t1", Type: flux.TString},
					{Label: "t2", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(0), 1.0, "a", "y"},
					{execute.Time(10), 2.0, "a", "x"},
					{execute.Time(20), 3.0, "a", "y"},
					{execute.Time(30), 4.0, "a", "x"},
					{execute.Time(40), 5.0, "a", "y"},
				},
			}},
			want: []*executetest.Table{{
				KeyCols: []string{"t1"},
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "t1", Type: flux.TString},
					{Label: "t2", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(10), 2.0, "a", "x"},
				},
			}},
		},
		{
			name:     "select_50",
			quantile: 0.5,
			data: []flux.Table{&executetest.Table{
				KeyCols: []string{"t1"},
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "t1", Type: flux.TString},
					{Label: "t2", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(0), 1.0, "a", "y"},
					{execute.Time(10), 2.0, "a", "x"},
					{execute.Time(20), 3.0, "a", "y"},
					{execute.Time(30), 4.0, "a", "x"},
					{execute.Time(40), 5.0, "a", "y"},
				},
			}},
			want: []*executetest.Table{{
				KeyCols: []string{"t1"},
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "t1", Type: flux.TString},
					{Label: "t2", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(20), 3.0, "a", "y"},
				},
			}},
		},
		{
			name:     "select_80",
			quantile: 0.8,
			data: []flux.Table{&executetest.Table{
				KeyCols: []string{"t1"},
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "t1", Type: flux.TString},
					{Label: "t2", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(0), 1.0, "a", "y"},
					{execute.Time(10), 2.0, "a", "x"},
					{execute.Time(20), 3.0, "a", "y"},
					{execute.Time(30), 4.0, "a", "x"},
					{execute.Time(40), 5.0, "a", "y"},
				},
			}},
			want: []*executetest.Table{{
				KeyCols: []string{"t1"},
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "t1", Type: flux.TString},
					{Label: "t2", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(30), 4.0, "a", "x"},
				},
			}},
		},
		{
			name:     "select_90",
			quantile: 0.9,
			data: []flux.Table{&executetest.Table{
				KeyCols: []string{"t1"},
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "t1", Type: flux.TString},
					{Label: "t2", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(0), 1.0, "a", "y"},
					{execute.Time(10), 2.0, "a", "x"},
					{execute.Time(20), 3.0, "a", "y"},
					{execute.Time(30), 4.0, "a", "x"},
					{execute.Time(40), 5.0, "a", "y"},
				},
			}},
			want: []*executetest.Table{{
				KeyCols: []string{"t1"},
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "t1", Type: flux.TString},
					{Label: "t2", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(40), 5.0, "a", "y"},
				},
			}},
		},
		{
			name:     "select_100",
			quantile: 1.0,
			data: []flux.Table{&executetest.Table{
				KeyCols: []string{"t1"},
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "t1", Type: flux.TString},
					{Label: "t2", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(0), 1.0, "a", "y"},
					{execute.Time(10), 2.0, "a", "x"},
					{execute.Time(20), 3.0, "a", "y"},
					{execute.Time(30), 4.0, "a", "x"},
					{execute.Time(40), 5.0, "a", "y"},
				},
			}},
			want: []*executetest.Table{{
				KeyCols: []string{"t1"},
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "t1", Type: flux.TString},
					{Label: "t2", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(40), 5.0, "a", "y"},
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
					return transformations.NewExactPercentileSelectorTransformation(d, c, &transformations.ExactPercentileSelectProcedureSpec{Percentile: tc.quantile}, executetest.UnlimitedAllocator)
				},
			)
		})
	}
}

func BenchmarkPercentile(b *testing.B) {
	data := arrow.NewFloat(NormalData, &memory.Allocator{})
	executetest.AggFuncBenchmarkHelper(
		b,
		&transformations.PercentileAgg{
			Quantile:    0.9,
			Compression: 1000,
		},
		data,
		13.843815760607427,
	)
}
