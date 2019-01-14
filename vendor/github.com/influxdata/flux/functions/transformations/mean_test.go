package transformations_test

import (
	"math"
	"testing"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/arrow"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/functions/transformations"
	"github.com/influxdata/flux/memory"
	"github.com/influxdata/flux/querytest"
)

func TestMeanOperation_Marshaling(t *testing.T) {
	data := []byte(`{"id":"mean","kind":"mean"}`)
	op := &flux.Operation{
		ID:   "mean",
		Spec: &transformations.MeanOpSpec{},
	}

	querytest.OperationMarshalingTestHelper(t, data, op)
}

func TestMean_Process(t *testing.T) {
	testCases := []struct {
		name string
		data []float64
		want float64
	}{
		{
			name: "zero",
			data: []float64{0, 0, 0},
			want: 0.0,
		},
		{
			name: "nonzero",
			data: []float64{0, 1, 2, 3, 4, 5, 6, 7, 8, 9},
			want: 4.5,
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
			executetest.AggFuncTestHelper(
				t,
				new(transformations.MeanAgg),
				tc.data,
				tc.want,
			)
		})
	}
}

func BenchmarkMean(b *testing.B) {
	data := arrow.NewFloat(NormalData, &memory.Allocator{})
	executetest.AggFuncBenchmarkHelper(
		b,
		new(transformations.MeanAgg),
		data,
		10.00081696729983,
	)
}
