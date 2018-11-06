package transformations

import (
	"fmt"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/plan"
)

const LastKind = "last"

type LastOpSpec struct {
	execute.SelectorConfig
}

func init() {
	lastSignature := execute.SelectorSignature(nil, nil)

	flux.RegisterFunction(LastKind, createLastOpSpec, lastSignature)
	flux.RegisterOpSpec(LastKind, newLastOp)
	plan.RegisterProcedureSpec(LastKind, newLastProcedure, LastKind)
	execute.RegisterTransformation(LastKind, createLastTransformation)
}

func createLastOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	spec := new(LastOpSpec)
	if err := spec.SelectorConfig.ReadArgs(args); err != nil {
		return nil, err
	}
	return spec, nil
}

func newLastOp() flux.OperationSpec {
	return new(LastOpSpec)
}

func (s *LastOpSpec) Kind() flux.OperationKind {
	return LastKind
}

type LastProcedureSpec struct {
	execute.SelectorConfig
}

func newLastProcedure(qs flux.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*LastOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}
	return &LastProcedureSpec{
		SelectorConfig: spec.SelectorConfig,
	}, nil
}

func (s *LastProcedureSpec) Kind() plan.ProcedureKind {
	return LastKind
}

func (s *LastProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(LastProcedureSpec)
	ns.SelectorConfig = s.SelectorConfig
	return ns
}

type LastSelector struct {
	rows []execute.Row
}

func createLastTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	ps, ok := spec.(*LastProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", ps)
	}
	t, d := execute.NewRowSelectorTransformationAndDataset(id, mode, new(LastSelector), ps.SelectorConfig, a.Allocator())
	return t, d, nil
}

func (s *LastSelector) reset() {
	s.rows = nil
}
func (s *LastSelector) NewBoolSelector() execute.DoBoolRowSelector {
	s.reset()
	return s
}

func (s *LastSelector) NewIntSelector() execute.DoIntRowSelector {
	s.reset()
	return s
}

func (s *LastSelector) NewUIntSelector() execute.DoUIntRowSelector {
	s.reset()
	return s
}

func (s *LastSelector) NewFloatSelector() execute.DoFloatRowSelector {
	s.reset()
	return s
}

func (s *LastSelector) NewStringSelector() execute.DoStringRowSelector {
	s.reset()
	return s
}

func (s *LastSelector) Rows() []execute.Row {
	return s.rows
}

func (s *LastSelector) selectLast(l int, cr flux.ColReader) {
	if l > 0 {
		s.rows = []execute.Row{execute.ReadRow(l-1, cr)}
	}
}

func (s *LastSelector) DoBool(vs []bool, cr flux.ColReader) {
	s.selectLast(len(vs), cr)
}
func (s *LastSelector) DoInt(vs []int64, cr flux.ColReader) {
	s.selectLast(len(vs), cr)
}
func (s *LastSelector) DoUInt(vs []uint64, cr flux.ColReader) {
	s.selectLast(len(vs), cr)
}
func (s *LastSelector) DoFloat(vs []float64, cr flux.ColReader) {
	s.selectLast(len(vs), cr)
}
func (s *LastSelector) DoString(vs []string, cr flux.ColReader) {
	s.selectLast(len(vs), cr)
}
