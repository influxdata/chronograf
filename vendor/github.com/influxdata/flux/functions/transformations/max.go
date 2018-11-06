package transformations

import (
	"fmt"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/plan"
)

const MaxKind = "max"

type MaxOpSpec struct {
	execute.SelectorConfig
}

func init() {
	maxSignature := execute.SelectorSignature(nil, nil)

	flux.RegisterFunction(MaxKind, createMaxOpSpec, maxSignature)
	flux.RegisterOpSpec(MaxKind, newMaxOp)
	plan.RegisterProcedureSpec(MaxKind, newMaxProcedure, MaxKind)
	execute.RegisterTransformation(MaxKind, createMaxTransformation)
}

func createMaxOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	spec := new(MaxOpSpec)
	if err := spec.SelectorConfig.ReadArgs(args); err != nil {
		return nil, err
	}

	return spec, nil
}

func newMaxOp() flux.OperationSpec {
	return new(MaxOpSpec)
}

func (s *MaxOpSpec) Kind() flux.OperationKind {
	return MaxKind
}

type MaxProcedureSpec struct {
	execute.SelectorConfig
}

func newMaxProcedure(qs flux.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*MaxOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}
	return &MaxProcedureSpec{
		SelectorConfig: spec.SelectorConfig,
	}, nil
}

func (s *MaxProcedureSpec) Kind() plan.ProcedureKind {
	return MaxKind
}
func (s *MaxProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(MaxProcedureSpec)
	ns.SelectorConfig = s.SelectorConfig
	return ns
}

type MaxSelector struct {
	set  bool
	rows []execute.Row
}

func createMaxTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	ps, ok := spec.(*MaxProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", ps)
	}
	t, d := execute.NewRowSelectorTransformationAndDataset(id, mode, new(MaxSelector), ps.SelectorConfig, a.Allocator())
	return t, d, nil
}

type MaxIntSelector struct {
	MaxSelector
	max int64
}
type MaxUIntSelector struct {
	MaxSelector
	max uint64
}
type MaxFloatSelector struct {
	MaxSelector
	max float64
}

func (s *MaxSelector) NewBoolSelector() execute.DoBoolRowSelector {
	return nil
}

func (s *MaxSelector) NewIntSelector() execute.DoIntRowSelector {
	return new(MaxIntSelector)
}

func (s *MaxSelector) NewUIntSelector() execute.DoUIntRowSelector {
	return new(MaxUIntSelector)
}

func (s *MaxSelector) NewFloatSelector() execute.DoFloatRowSelector {
	return new(MaxFloatSelector)
}

func (s *MaxSelector) NewStringSelector() execute.DoStringRowSelector {
	return nil
}

func (s *MaxSelector) Rows() []execute.Row {
	if !s.set {
		return nil
	}
	return s.rows
}

func (s *MaxSelector) selectRow(idx int, cr flux.ColReader) {
	// Capture row
	if idx >= 0 {
		s.rows = []execute.Row{execute.ReadRow(idx, cr)}
	}
}

func (s *MaxIntSelector) DoInt(vs []int64, cr flux.ColReader) {
	maxIdx := -1
	for i, v := range vs {
		if !s.set || v > s.max {
			s.set = true
			s.max = v
			maxIdx = i
		}
	}
	s.selectRow(maxIdx, cr)
}
func (s *MaxUIntSelector) DoUInt(vs []uint64, cr flux.ColReader) {
	maxIdx := -1
	for i, v := range vs {
		if !s.set || v > s.max {
			s.set = true
			s.max = v
			maxIdx = i
		}
	}
	s.selectRow(maxIdx, cr)
}
func (s *MaxFloatSelector) DoFloat(vs []float64, cr flux.ColReader) {
	maxIdx := -1
	for i, v := range vs {
		if !s.set || v > s.max {
			s.set = true
			s.max = v
			maxIdx = i
		}
	}
	s.selectRow(maxIdx, cr)
}
