package transformations

import (
	"fmt"
	"math"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/plan"
)

const MeanKind = "mean"

type MeanOpSpec struct {
	execute.AggregateConfig
}

func init() {
	meanSignature := execute.AggregateSignature(nil, nil)

	flux.RegisterFunction(MeanKind, createMeanOpSpec, meanSignature)
	flux.RegisterOpSpec(MeanKind, newMeanOp)
	plan.RegisterProcedureSpec(MeanKind, newMeanProcedure, MeanKind)
	execute.RegisterTransformation(MeanKind, createMeanTransformation)
}
func createMeanOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	spec := &MeanOpSpec{}
	if err := spec.AggregateConfig.ReadArgs(args); err != nil {
		return nil, err
	}
	return spec, nil
}

func newMeanOp() flux.OperationSpec {
	return new(MeanOpSpec)
}

func (s *MeanOpSpec) Kind() flux.OperationKind {
	return MeanKind
}

type MeanProcedureSpec struct {
	execute.AggregateConfig
}

func newMeanProcedure(qs flux.OperationSpec, a plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*MeanOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}
	return &MeanProcedureSpec{
		AggregateConfig: spec.AggregateConfig,
	}, nil
}

func (s *MeanProcedureSpec) Kind() plan.ProcedureKind {
	return MeanKind
}
func (s *MeanProcedureSpec) Copy() plan.ProcedureSpec {
	return &MeanProcedureSpec{
		AggregateConfig: s.AggregateConfig,
	}
}

type MeanAgg struct {
	count float64
	sum   float64
}

func createMeanTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	s, ok := spec.(*MeanProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", spec)
	}
	t, d := execute.NewAggregateTransformationAndDataset(id, mode, new(MeanAgg), s.AggregateConfig, a.Allocator())
	return t, d, nil
}

func (a *MeanAgg) NewBoolAgg() execute.DoBoolAgg {
	return nil
}

func (a *MeanAgg) NewIntAgg() execute.DoIntAgg {
	return new(MeanAgg)
}

func (a *MeanAgg) NewUIntAgg() execute.DoUIntAgg {
	return new(MeanAgg)
}

func (a *MeanAgg) NewFloatAgg() execute.DoFloatAgg {
	return new(MeanAgg)
}

func (a *MeanAgg) NewStringAgg() execute.DoStringAgg {
	return nil
}

func (a *MeanAgg) DoInt(vs []int64) {
	a.count += float64(len(vs))
	for _, v := range vs {
		//TODO handle overflow
		a.sum += float64(v)
	}
}
func (a *MeanAgg) DoUInt(vs []uint64) {
	a.count += float64(len(vs))
	for _, v := range vs {
		//TODO handle overflow
		a.sum += float64(v)
	}
}
func (a *MeanAgg) DoFloat(vs []float64) {
	a.count += float64(len(vs))
	for _, v := range vs {
		a.sum += v
	}
}
func (a *MeanAgg) Type() flux.ColType {
	return flux.TFloat
}
func (a *MeanAgg) ValueFloat() float64 {
	if a.count < 1 {
		return math.NaN()
	}
	return a.sum / a.count
}
