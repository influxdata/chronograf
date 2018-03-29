package functions

import (
	"math"

	"github.com/influxdata/ifql/query"
	"github.com/influxdata/ifql/query/execute"
	"github.com/influxdata/ifql/query/plan"
)

const SkewKind = "skew"

type SkewOpSpec struct {
}

var skewSignature = query.DefaultFunctionSignature()

func init() {
	query.RegisterFunction(SkewKind, createSkewOpSpec, skewSignature)
	query.RegisterOpSpec(SkewKind, newSkewOp)
	plan.RegisterProcedureSpec(SkewKind, newSkewProcedure, SkewKind)
	execute.RegisterTransformation(SkewKind, createSkewTransformation)
}
func createSkewOpSpec(args query.Arguments, a *query.Administration) (query.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	return new(SkewOpSpec), nil
}

func newSkewOp() query.OperationSpec {
	return new(SkewOpSpec)
}

func (s *SkewOpSpec) Kind() query.OperationKind {
	return SkewKind
}

type SkewProcedureSpec struct {
}

func newSkewProcedure(query.OperationSpec, plan.Administration) (plan.ProcedureSpec, error) {
	return new(SkewProcedureSpec), nil
}

func (s *SkewProcedureSpec) Kind() plan.ProcedureKind {
	return SkewKind
}
func (s *SkewProcedureSpec) Copy() plan.ProcedureSpec {
	return new(SkewProcedureSpec)
}

type SkewAgg struct {
	n, m1, m2, m3 float64
}

func createSkewTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	t, d := execute.NewAggregateTransformationAndDataset(id, mode, a.Bounds(), new(SkewAgg), a.Allocator())
	return t, d, nil
}

func (a *SkewAgg) reset() {
	a.n = 0
	a.m1 = 0
	a.m2 = 0
	a.m3 = 0
}
func (a *SkewAgg) NewBoolAgg() execute.DoBoolAgg {
	return nil
}

func (a *SkewAgg) NewIntAgg() execute.DoIntAgg {
	a.reset()
	return a
}

func (a *SkewAgg) NewUIntAgg() execute.DoUIntAgg {
	a.reset()
	return a
}

func (a *SkewAgg) NewFloatAgg() execute.DoFloatAgg {
	a.reset()
	return a
}

func (a *SkewAgg) NewStringAgg() execute.DoStringAgg {
	return nil
}

func (a *SkewAgg) DoInt(vs []int64) {
	for _, v := range vs {
		n0 := a.n
		a.n++
		// TODO handle overflow
		delta := float64(v) - a.m1
		deltaN := delta / a.n
		t := delta * deltaN * n0
		a.m3 += t*deltaN*(a.n-2) - 3*deltaN*a.m2
		a.m2 += t
		a.m1 += deltaN
	}
}
func (a *SkewAgg) DoUInt(vs []uint64) {
	for _, v := range vs {
		n0 := a.n
		a.n++
		// TODO handle overflow
		delta := float64(v) - a.m1
		deltaN := delta / a.n
		t := delta * deltaN * n0
		a.m3 += t*deltaN*(a.n-2) - 3*deltaN*a.m2
		a.m2 += t
		a.m1 += deltaN
	}
}
func (a *SkewAgg) DoFloat(vs []float64) {
	for _, v := range vs {
		n0 := a.n
		a.n++
		delta := v - a.m1
		deltaN := delta / a.n
		t := delta * deltaN * n0
		a.m3 += t*deltaN*(a.n-2) - 3*deltaN*a.m2
		a.m2 += t
		a.m1 += deltaN
	}
}
func (a *SkewAgg) Type() execute.DataType {
	return execute.TFloat
}
func (a *SkewAgg) ValueFloat() float64 {
	if a.n < 2 {
		return math.NaN()
	}
	return math.Sqrt(a.n) * a.m3 / math.Pow(a.m2, 1.5)
}
