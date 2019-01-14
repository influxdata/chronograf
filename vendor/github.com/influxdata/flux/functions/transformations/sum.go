package transformations

import (
	"fmt"

	"github.com/apache/arrow/go/arrow/array"
	"github.com/apache/arrow/go/arrow/math"
	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/plan"
)

const SumKind = "sum"

type SumOpSpec struct {
	execute.AggregateConfig
}

func init() {
	sumSignature := execute.AggregateSignature(nil, nil)

	flux.RegisterFunction(SumKind, createSumOpSpec, sumSignature)
	flux.RegisterOpSpec(SumKind, newSumOp)
	plan.RegisterProcedureSpec(SumKind, newSumProcedure, SumKind)
	execute.RegisterTransformation(SumKind, createSumTransformation)
}

func createSumOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}
	s := new(SumOpSpec)
	if err := s.AggregateConfig.ReadArgs(args); err != nil {
		return s, err
	}
	return s, nil
}

func newSumOp() flux.OperationSpec {
	return new(SumOpSpec)
}

func (s *SumOpSpec) Kind() flux.OperationKind {
	return SumKind
}

type SumProcedureSpec struct {
	execute.AggregateConfig
}

func newSumProcedure(qs flux.OperationSpec, a plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*SumOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}
	return &SumProcedureSpec{
		AggregateConfig: spec.AggregateConfig,
	}, nil
}

func (s *SumProcedureSpec) Kind() plan.ProcedureKind {
	return SumKind
}

func (s *SumProcedureSpec) Copy() plan.ProcedureSpec {
	return &SumProcedureSpec{
		AggregateConfig: s.AggregateConfig,
	}
}

func (s *SumProcedureSpec) AggregateMethod() string {
	return SumKind
}
func (s *SumProcedureSpec) ReAggregateSpec() plan.ProcedureSpec {
	return new(SumProcedureSpec)
}

type SumAgg struct{}

func createSumTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	s, ok := spec.(*SumProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", spec)
	}

	t, d := execute.NewAggregateTransformationAndDataset(id, mode, new(SumAgg), s.AggregateConfig, a.Allocator())
	return t, d, nil
}

func (a *SumAgg) NewBoolAgg() execute.DoBoolAgg {
	return nil
}
func (a *SumAgg) NewIntAgg() execute.DoIntAgg {
	return new(SumIntAgg)
}
func (a *SumAgg) NewUIntAgg() execute.DoUIntAgg {
	return new(SumUIntAgg)
}
func (a *SumAgg) NewFloatAgg() execute.DoFloatAgg {
	return new(SumFloatAgg)
}
func (a *SumAgg) NewStringAgg() execute.DoStringAgg {
	return nil
}

type SumIntAgg struct {
	sum int64
}

func (a *SumIntAgg) DoInt(vs *array.Int64) {
	// https://issues.apache.org/jira/browse/ARROW-4081
	if vs.Len() > 0 {
		a.sum += math.Int64.Sum(vs)
	}
}
func (a *SumIntAgg) Type() flux.ColType {
	return flux.TInt
}
func (a *SumIntAgg) ValueInt() int64 {
	return a.sum
}

type SumUIntAgg struct {
	sum uint64
}

func (a *SumUIntAgg) DoUInt(vs *array.Uint64) {
	// https://issues.apache.org/jira/browse/ARROW-4081
	if vs.Len() > 0 {
		a.sum += math.Uint64.Sum(vs)
	}
}
func (a *SumUIntAgg) Type() flux.ColType {
	return flux.TUInt
}
func (a *SumUIntAgg) ValueUInt() uint64 {
	return a.sum
}

type SumFloatAgg struct {
	sum float64
}

func (a *SumFloatAgg) DoFloat(vs *array.Float64) {
	// https://issues.apache.org/jira/browse/ARROW-4081
	if vs.Len() > 0 {
		a.sum += math.Float64.Sum(vs)
	}
}
func (a *SumFloatAgg) Type() flux.ColType {
	return flux.TFloat
}
func (a *SumFloatAgg) ValueFloat() float64 {
	return a.sum
}
