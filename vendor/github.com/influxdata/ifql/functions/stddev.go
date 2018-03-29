package functions

import (
	"math"

	"github.com/influxdata/ifql/query"
	"github.com/influxdata/ifql/query/execute"
	"github.com/influxdata/ifql/query/plan"
)

const StddevKind = "stddev"

type StddevOpSpec struct {
}

var stddevSignature = query.DefaultFunctionSignature()

func init() {
	query.RegisterFunction(StddevKind, createStddevOpSpec, stddevSignature)
	query.RegisterOpSpec(StddevKind, newStddevOp)
	plan.RegisterProcedureSpec(StddevKind, newStddevProcedure, StddevKind)
	execute.RegisterTransformation(StddevKind, createStddevTransformation)
}
func createStddevOpSpec(args query.Arguments, a *query.Administration) (query.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	return new(StddevOpSpec), nil
}

func newStddevOp() query.OperationSpec {
	return new(StddevOpSpec)
}

func (s *StddevOpSpec) Kind() query.OperationKind {
	return StddevKind
}

type StddevProcedureSpec struct {
}

func newStddevProcedure(query.OperationSpec, plan.Administration) (plan.ProcedureSpec, error) {
	return new(StddevProcedureSpec), nil
}

func (s *StddevProcedureSpec) Kind() plan.ProcedureKind {
	return StddevKind
}
func (s *StddevProcedureSpec) Copy() plan.ProcedureSpec {
	return new(StddevProcedureSpec)
}

type StddevAgg struct {
	n, m2, mean float64
}

func createStddevTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	t, d := execute.NewAggregateTransformationAndDataset(id, mode, a.Bounds(), new(StddevAgg), a.Allocator())
	return t, d, nil
}

func (a *StddevAgg) reset() {
	a.n = 0
	a.mean = 0
	a.m2 = 0
}
func (a *StddevAgg) NewBoolAgg() execute.DoBoolAgg {
	return nil
}

func (a *StddevAgg) NewIntAgg() execute.DoIntAgg {
	a.reset()
	return a
}

func (a *StddevAgg) NewUIntAgg() execute.DoUIntAgg {
	a.reset()
	return a
}

func (a *StddevAgg) NewFloatAgg() execute.DoFloatAgg {
	a.reset()
	return a
}

func (a *StddevAgg) NewStringAgg() execute.DoStringAgg {
	return nil
}
func (a *StddevAgg) DoInt(vs []int64) {
	var delta, delta2 float64
	for _, v := range vs {
		a.n++
		// TODO handle overflow
		delta = float64(v) - a.mean
		a.mean += delta / a.n
		delta2 = float64(v) - a.mean
		a.m2 += delta * delta2
	}
}
func (a *StddevAgg) DoUInt(vs []uint64) {
	var delta, delta2 float64
	for _, v := range vs {
		a.n++
		// TODO handle overflow
		delta = float64(v) - a.mean
		a.mean += delta / a.n
		delta2 = float64(v) - a.mean
		a.m2 += delta * delta2
	}
}
func (a *StddevAgg) DoFloat(vs []float64) {
	var delta, delta2 float64
	for _, v := range vs {
		a.n++
		delta = v - a.mean
		a.mean += delta / a.n
		delta2 = v - a.mean
		a.m2 += delta * delta2
	}
}
func (a *StddevAgg) Type() execute.DataType {
	return execute.TFloat
}
func (a *StddevAgg) ValueFloat() float64 {
	if a.n < 2 {
		return math.NaN()
	}
	return math.Sqrt(a.m2 / (a.n - 1))
}
