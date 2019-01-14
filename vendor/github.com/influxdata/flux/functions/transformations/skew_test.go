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

func TestSkewOperation_Marshaling(t *testing.T) {
	data := []byte(`{"id":"skew","kind":"skew"}`)
	op := &flux.Operation{
		ID:   "skew",
		Spec: &transformations.SkewOpSpec{},
	}

	querytest.OperationMarshalingTestHelper(t, data, op)
}

func TestSkew_Process(t *testing.T) {
	testCases := []struct {
		name string
		data []float64
		want float64
	}{
		{
			name: "zero",
			data: []float64{1, 2, 3},
			want: 0.0,
		},
		{
			name: "nonzero",
			data: []float64{2, 2, 3},
			want: 0.7071067811865475,
		},
		{
			name: "nonzero",
			data: []float64{2, 2, 3, 4},
			want: 0.49338220021815854,
		},
		{
			name: "NaN short",
			data: []float64{1},
			want: math.NaN(),
		},
		{
			name: "NaN divide by zero",
			data: []float64{1, 1, 1},
			want: math.NaN(),
		},
	}
	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			executetest.AggFuncTestHelper(
				t,
				new(transformations.SkewAgg),
				tc.data,
				tc.want,
			)
		})
	}
}

func BenchmarkSkew(b *testing.B) {
	data := arrow.NewFloat(NormalData, &memory.Allocator{})
	executetest.AggFuncBenchmarkHelper(
		b,
		new(transformations.SkewAgg),
		data,
		0.0032200673020400935,
	)
}
