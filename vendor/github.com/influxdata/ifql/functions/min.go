package functions

import (
	"fmt"

	"github.com/influxdata/ifql/query"
	"github.com/influxdata/ifql/query/execute"
	"github.com/influxdata/ifql/query/plan"
	"github.com/influxdata/ifql/semantic"
)

const MinKind = "min"

type MinOpSpec struct {
	Column     string `json:"column"`
	UseRowTime bool   `json:"useRowtime"`
}

var minSignature = query.DefaultFunctionSignature()

func init() {
	minSignature.Params["column"] = semantic.String
	minSignature.Params["useRowTime"] = semantic.Bool

	query.RegisterFunction(MinKind, createMinOpSpec, minSignature)
	query.RegisterOpSpec(MinKind, newMinOp)
	plan.RegisterProcedureSpec(MinKind, newMinProcedure, MinKind)
	execute.RegisterTransformation(MinKind, createMinTransformation)
}

func createMinOpSpec(args query.Arguments, a *query.Administration) (query.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	spec := new(MinOpSpec)
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

func newMinOp() query.OperationSpec {
	return new(MinOpSpec)
}

func (s *MinOpSpec) Kind() query.OperationKind {
	return MinKind
}

type MinProcedureSpec struct {
	Column     string
	UseRowTime bool
}

func newMinProcedure(qs query.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*MinOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}
	return &MinProcedureSpec{
		Column:     spec.Column,
		UseRowTime: spec.UseRowTime,
	}, nil
}

func (s *MinProcedureSpec) Kind() plan.ProcedureKind {
	return MinKind
}
func (s *MinProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(MinProcedureSpec)
	ns.Column = s.Column
	ns.UseRowTime = s.UseRowTime
	return ns
}

type MinSelector struct {
	set  bool
	rows []execute.Row
}

func createMinTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	ps, ok := spec.(*MinProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", ps)
	}
	t, d := execute.NewRowSelectorTransformationAndDataset(id, mode, a.Bounds(), new(MinSelector), ps.Column, ps.UseRowTime, a.Allocator())
	return t, d, nil
}

type MinIntSelector struct {
	MinSelector
	min int64
}
type MinUIntSelector struct {
	MinSelector
	min uint64
}
type MinFloatSelector struct {
	MinSelector
	min float64
}

func (s *MinSelector) NewBoolSelector() execute.DoBoolRowSelector {
	return nil
}

func (s *MinSelector) NewIntSelector() execute.DoIntRowSelector {
	return new(MinIntSelector)
}

func (s *MinSelector) NewUIntSelector() execute.DoUIntRowSelector {
	return new(MinUIntSelector)
}

func (s *MinSelector) NewFloatSelector() execute.DoFloatRowSelector {
	return new(MinFloatSelector)
}

func (s *MinSelector) NewStringSelector() execute.DoStringRowSelector {
	return nil
}

func (s *MinSelector) Rows() []execute.Row {
	if !s.set {
		return nil
	}
	return s.rows
}

func (s *MinSelector) selectRow(idx int, rr execute.RowReader) {
	// Capture row
	if idx >= 0 {
		s.rows = []execute.Row{execute.ReadRow(idx, rr)}
	}
}

func (s *MinIntSelector) DoInt(vs []int64, rr execute.RowReader) {
	minIdx := -1
	for i, v := range vs {
		if !s.set || v < s.min {
			s.set = true
			s.min = v
			minIdx = i
		}
	}
	s.selectRow(minIdx, rr)
}
func (s *MinUIntSelector) DoUInt(vs []uint64, rr execute.RowReader) {
	minIdx := -1
	for i, v := range vs {
		if !s.set || v < s.min {
			s.set = true
			s.min = v
			minIdx = i
		}
	}
	s.selectRow(minIdx, rr)
}
func (s *MinFloatSelector) DoFloat(vs []float64, rr execute.RowReader) {
	minIdx := -1
	for i, v := range vs {
		if !s.set || v < s.min {
			s.set = true
			s.min = v
			minIdx = i
		}
	}
	s.selectRow(minIdx, rr)
}
