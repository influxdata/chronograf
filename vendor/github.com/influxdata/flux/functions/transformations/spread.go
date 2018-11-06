package transformations

import (
	"fmt"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/plan"
)

// SpreadKind is the registration name for Flux, query, plan, and execution.
const SpreadKind = "spread"

func init() {
	spreadSignature := execute.AggregateSignature(nil, nil)

	flux.RegisterFunction(SpreadKind, createSpreadOpSpec, spreadSignature)
	flux.RegisterOpSpec(SpreadKind, newSpreadOp)
	plan.RegisterProcedureSpec(SpreadKind, newSpreadProcedure, SpreadKind)
	execute.RegisterTransformation(SpreadKind, createSpreadTransformation)
}

func createSpreadOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	s := new(SpreadOpSpec)
	if err := s.AggregateConfig.ReadArgs(args); err != nil {
		return nil, err
	}
	return s, nil
}

func newSpreadOp() flux.OperationSpec {
	return new(SpreadOpSpec)
}

// SpreadOpSpec defines the required arguments for Flux.  Currently,
// spread takes no arguments.
type SpreadOpSpec struct {
	execute.AggregateConfig
}

// Kind is used to lookup createSpreadOpSpec producing SpreadOpSpec
func (s *SpreadOpSpec) Kind() flux.OperationKind {
	return SpreadKind
}

func newSpreadProcedure(qs flux.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*SpreadOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}
	return &SpreadProcedureSpec{
		AggregateConfig: spec.AggregateConfig,
	}, nil
}

// SpreadProcedureSpec is created when mapping from SpreadOpSpec.Kind
// to a CreateProcedureSpec.
type SpreadProcedureSpec struct {
	execute.AggregateConfig
}

// Kind is used to lookup CreateTransformation producing SpreadAgg
func (s *SpreadProcedureSpec) Kind() plan.ProcedureKind {
	return SpreadKind
}
func (s *SpreadProcedureSpec) Copy() plan.ProcedureSpec {
	return &SpreadProcedureSpec{
		AggregateConfig: s.AggregateConfig,
	}
}

func createSpreadTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	s, ok := spec.(*SpreadProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", spec)
	}

	t, d := execute.NewAggregateTransformationAndDataset(id, mode, new(SpreadAgg), s.AggregateConfig, a.Allocator())
	return t, d, nil
}

// SpreadAgg finds the difference between the max and min values a table
type SpreadAgg struct {
	minSet bool
	maxSet bool
}
type SpreadIntAgg struct {
	SpreadAgg
	min int64
	max int64
}
type SpreadUIntAgg struct {
	SpreadAgg
	min uint64
	max uint64
}
type SpreadFloatAgg struct {
	SpreadAgg
	min float64
	max float64
}

func (a *SpreadAgg) NewBoolAgg() execute.DoBoolAgg {
	return nil
}

func (a *SpreadAgg) NewIntAgg() execute.DoIntAgg {
	return new(SpreadIntAgg)
}

func (a *SpreadAgg) NewUIntAgg() execute.DoUIntAgg {
	return new(SpreadUIntAgg)
}

func (a *SpreadAgg) NewFloatAgg() execute.DoFloatAgg {
	return new(SpreadFloatAgg)
}

func (a *SpreadAgg) NewStringAgg() execute.DoStringAgg {
	return nil
}

// DoInt searches for the min and max value of the array and caches them in the aggregate
func (a *SpreadIntAgg) DoInt(vs []int64) {
	for _, v := range vs {
		if !a.minSet || v < a.min {
			a.minSet = true
			a.min = v
		}
		if !a.maxSet || v > a.max {
			a.maxSet = true
			a.max = v
		}
	}
}

func (a *SpreadIntAgg) Type() flux.ColType {
	return flux.TInt
}

// Value returns the difference between max and min
func (a *SpreadIntAgg) ValueInt() int64 {
	return a.max - a.min
}

// Do searches for the min and max value of the array and caches them in the aggregate
func (a *SpreadUIntAgg) DoUInt(vs []uint64) {
	for _, v := range vs {
		if !a.minSet || v < a.min {
			a.minSet = true
			a.min = v
		}
		if !a.maxSet || v > a.max {
			a.maxSet = true
			a.max = v
		}
	}
}

func (a *SpreadUIntAgg) Type() flux.ColType {
	return flux.TUInt
}

// Value returns the difference between max and min
func (a *SpreadUIntAgg) ValueUInt() uint64 {
	return a.max - a.min
}

// Do searches for the min and max value of the array and caches them in the aggregate
func (a *SpreadFloatAgg) DoFloat(vs []float64) {
	for _, v := range vs {
		if !a.minSet || v < a.min {
			a.minSet = true
			a.min = v
		}
		if !a.maxSet || v > a.max {
			a.maxSet = true
			a.max = v
		}
	}
}

func (a *SpreadFloatAgg) Type() flux.ColType {
	return flux.TFloat
}

// Value returns the difference between max and min
func (a *SpreadFloatAgg) ValueFloat() float64 {
	return a.max - a.min
}
