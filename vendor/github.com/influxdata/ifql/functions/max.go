package functions

import (
	"fmt"

	"github.com/influxdata/ifql/query"
	"github.com/influxdata/ifql/query/execute"
	"github.com/influxdata/ifql/query/plan"
	"github.com/influxdata/ifql/semantic"
)

const MaxKind = "max"

type MaxOpSpec struct {
	Column     string `json:"column"`
	UseRowTime bool   `json:"useRowtime"`
}

var maxSignature = query.DefaultFunctionSignature()

func init() {
	maxSignature.Params["column"] = semantic.String
	maxSignature.Params["useRowTime"] = semantic.Bool

	query.RegisterFunction(MaxKind, createMaxOpSpec, maxSignature)
	query.RegisterOpSpec(MaxKind, newMaxOp)
	plan.RegisterProcedureSpec(MaxKind, newMaxProcedure, MaxKind)
	execute.RegisterTransformation(MaxKind, createMaxTransformation)
}

func createMaxOpSpec(args query.Arguments, a *query.Administration) (query.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	spec := new(MaxOpSpec)
	if c, ok, err := args.GetString("column"); err != nil {
		return nil, err
	} else if ok {
		spec.Column = c
	}
	if useRowTime, ok, err := args.GetBool("useRowTime"); err != nil {
		return nil, err
	} else if ok {
		spec.UseRowTime = useRowTime
	}

	return spec, nil
}

func newMaxOp() query.OperationSpec {
	return new(MaxOpSpec)
}

func (s *MaxOpSpec) Kind() query.OperationKind {
	return MaxKind
}

type MaxProcedureSpec struct {
	Column     string
	UseRowTime bool
}

func newMaxProcedure(qs query.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*MaxOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}
	return &MaxProcedureSpec{
		Column:     spec.Column,
		UseRowTime: spec.UseRowTime,
	}, nil
}

func (s *MaxProcedureSpec) Kind() plan.ProcedureKind {
	return MaxKind
}
func (s *MaxProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(MaxProcedureSpec)
	ns.Column = s.Column
	ns.UseRowTime = s.UseRowTime
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
	t, d := execute.NewRowSelectorTransformationAndDataset(id, mode, a.Bounds(), new(MaxSelector), ps.Column, ps.UseRowTime, a.Allocator())
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

func (s *MaxSelector) selectRow(idx int, rr execute.RowReader) {
	// Capture row
	if idx >= 0 {
		s.rows = []execute.Row{execute.ReadRow(idx, rr)}
	}
}

func (s *MaxIntSelector) DoInt(vs []int64, rr execute.RowReader) {
	maxIdx := -1
	for i, v := range vs {
		if !s.set || v > s.max {
			s.set = true
			s.max = v
			maxIdx = i
		}
	}
	s.selectRow(maxIdx, rr)
}
func (s *MaxUIntSelector) DoUInt(vs []uint64, rr execute.RowReader) {
	maxIdx := -1
	for i, v := range vs {
		if !s.set || v > s.max {
			s.set = true
			s.max = v
			maxIdx = i
		}
	}
	s.selectRow(maxIdx, rr)
}
func (s *MaxFloatSelector) DoFloat(vs []float64, rr execute.RowReader) {
	maxIdx := -1
	for i, v := range vs {
		if !s.set || v > s.max {
			s.set = true
			s.max = v
			maxIdx = i
		}
	}
	s.selectRow(maxIdx, rr)
}
