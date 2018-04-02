package functions

import (
	"fmt"

	"github.com/influxdata/ifql/query"
	"github.com/influxdata/ifql/query/execute"
	"github.com/influxdata/ifql/query/plan"
	"github.com/influxdata/ifql/semantic"
)

const FirstKind = "first"

type FirstOpSpec struct {
	Column     string `json:"column"`
	UseRowTime bool   `json:"useRowtime"`
}

var firstSignature = query.DefaultFunctionSignature()

func init() {
	firstSignature.Params["column"] = semantic.String
	firstSignature.Params["useRowTime"] = semantic.Bool

	query.RegisterFunction(FirstKind, createFirstOpSpec, firstSignature)
	query.RegisterOpSpec(FirstKind, newFirstOp)
	plan.RegisterProcedureSpec(FirstKind, newFirstProcedure, FirstKind)
	execute.RegisterTransformation(FirstKind, createFirstTransformation)
}

func createFirstOpSpec(args query.Arguments, a *query.Administration) (query.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	spec := new(FirstOpSpec)
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

func newFirstOp() query.OperationSpec {
	return new(FirstOpSpec)
}

func (s *FirstOpSpec) Kind() query.OperationKind {
	return FirstKind
}

type FirstProcedureSpec struct {
	Column     string
	UseRowTime bool
}

func newFirstProcedure(qs query.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*FirstOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}
	return &FirstProcedureSpec{
		Column:     spec.Column,
		UseRowTime: spec.UseRowTime,
	}, nil
}

func (s *FirstProcedureSpec) Kind() plan.ProcedureKind {
	return FirstKind
}
func (s *FirstProcedureSpec) PushDownRules() []plan.PushDownRule {
	return []plan.PushDownRule{{
		Root:    FromKind,
		Through: []plan.ProcedureKind{GroupKind, LimitKind, FilterKind},
		Match: func(spec plan.ProcedureSpec) bool {
			selectSpec := spec.(*FromProcedureSpec)
			return !selectSpec.AggregateSet
		},
	}}
}

func (s *FirstProcedureSpec) PushDown(root *plan.Procedure, dup func() *plan.Procedure) {
	selectSpec := root.Spec.(*FromProcedureSpec)
	if selectSpec.BoundsSet || selectSpec.LimitSet || selectSpec.DescendingSet {
		root = dup()
		selectSpec = root.Spec.(*FromProcedureSpec)
		selectSpec.BoundsSet = false
		selectSpec.Bounds = plan.BoundsSpec{}
		selectSpec.LimitSet = false
		selectSpec.PointsLimit = 0
		selectSpec.SeriesLimit = 0
		selectSpec.SeriesOffset = 0
		selectSpec.DescendingSet = false
		selectSpec.Descending = false
		return
	}
	selectSpec.BoundsSet = true
	selectSpec.Bounds = plan.BoundsSpec{
		Start: query.MinTime,
		Stop:  query.Now,
	}
	selectSpec.LimitSet = true
	selectSpec.PointsLimit = 1
	selectSpec.DescendingSet = true
	selectSpec.Descending = false
}
func (s *FirstProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(FirstProcedureSpec)
	*ns = *s
	ns.Column = s.Column
	ns.UseRowTime = s.UseRowTime
	return ns
}

type FirstSelector struct {
	selected bool
}

func createFirstTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	ps, ok := spec.(*FirstProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", ps)
	}
	t, d := execute.NewIndexSelectorTransformationAndDataset(id, mode, a.Bounds(), new(FirstSelector), ps.Column, ps.UseRowTime, a.Allocator())
	return t, d, nil
}

func (s *FirstSelector) reset() {
	s.selected = false
}

func (s *FirstSelector) NewBoolSelector() execute.DoBoolIndexSelector {
	s.reset()
	return s
}
func (s *FirstSelector) NewIntSelector() execute.DoIntIndexSelector {
	s.reset()
	return s
}
func (s *FirstSelector) NewUIntSelector() execute.DoUIntIndexSelector {
	s.reset()
	return s
}
func (s *FirstSelector) NewFloatSelector() execute.DoFloatIndexSelector {
	s.reset()
	return s
}
func (s *FirstSelector) NewStringSelector() execute.DoStringIndexSelector {
	s.reset()
	return s
}

func (s *FirstSelector) selectFirst(l int) []int {
	if !s.selected && l > 0 {
		s.selected = true
		return []int{0}
	}
	return nil
}
func (s *FirstSelector) DoBool(vs []bool) []int {
	return s.selectFirst(len(vs))
}
func (s *FirstSelector) DoInt(vs []int64) []int {
	return s.selectFirst(len(vs))
}
func (s *FirstSelector) DoUInt(vs []uint64) []int {
	return s.selectFirst(len(vs))
}
func (s *FirstSelector) DoFloat(vs []float64) []int {
	return s.selectFirst(len(vs))
}
func (s *FirstSelector) DoString(vs []string) []int {
	return s.selectFirst(len(vs))
}
