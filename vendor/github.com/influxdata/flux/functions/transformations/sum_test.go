package transformations_test

import (
	"testing"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/functions/transformations"
	"github.com/influxdata/flux/querytest"
)

func TestSumOperation_Marshaling(t *testing.T) {
	data := []byte(`{"id":"sum","kind":"sum"}`)
	op := &flux.Operation{
		ID:   "sum",
		Spec: &transformations.SumOpSpec{},
	}

	querytest.OperationMarshalingTestHelper(t, data, op)
}

func TestSum_Process(t *testing.T) {
	executetest.AggFuncTestHelper(t,
		new(transformations.SumAgg),
		[]float64{0, 1, 2, 3, 4, 5, 6, 7, 8, 9},
		float64(45),
	)
}

func BenchmarkSum(b *testing.B) {
	executetest.AggFuncBenchmarkHelper(
		b,
		new(transformations.SumAgg),
		NormalData,
		10000816.96729983,
	)
}
