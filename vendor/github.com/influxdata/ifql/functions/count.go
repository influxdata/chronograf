package functions

import (
	"github.com/influxdata/ifql/query"
	"github.com/influxdata/ifql/query/execute"
	"github.com/influxdata/ifql/query/plan"
)

const CountKind = "count"

type CountOpSpec struct {
}

var countSignature = query.DefaultFunctionSignature()

func init() {
	query.RegisterFunction(CountKind, createCountOpSpec, countSignature)
	query.RegisterOpSpec(CountKind, newCountOp)
	plan.RegisterProcedureSpec(CountKind, newCountProcedure, CountKind)
	execute.RegisterTransformation(CountKind, createCountTransformation)
}

func createCountOpSpec(args query.Arguments, a *query.Administration) (query.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}
	return new(CountOpSpec), nil
}

func newCountOp() query.OperationSpec {
	return new(CountOpSpec)
}

func (s *CountOpSpec) Kind() query.OperationKind {
	return CountKind
}

type CountProcedureSpec struct {
}

func newCountProcedure(query.OperationSpec, plan.Administration) (plan.ProcedureSpec, error) {
	return new(CountProcedureSpec), nil
}

func (s *CountProcedureSpec) Kind() plan.ProcedureKind {
	return CountKind
}

func (s *CountProcedureSpec) Copy() plan.ProcedureSpec {
	return new(CountProcedureSpec)
}

func (s *CountProcedureSpec) AggregateMethod() string {
	return CountKind
}
func (s *CountProcedureSpec) ReAggregateSpec() plan.ProcedureSpec {
	return new(SumProcedureSpec)
}

func (s *CountProcedureSpec) PushDownRules() []plan.PushDownRule {
	return []plan.PushDownRule{{
		Root:    FromKind,
		Through: nil,
		Match: func(spec plan.ProcedureSpec) bool {
			selectSpec := spec.(*FromProcedureSpec)
			return !selectSpec.GroupingSet
		},
	}}
}

func (s *CountProcedureSpec) PushDown(root *plan.Procedure, dup func() *plan.Procedure) {
	selectSpec := root.Spec.(*FromProcedureSpec)
	if selectSpec.AggregateSet {
		root = dup()
		selectSpec = root.Spec.(*FromProcedureSpec)
		selectSpec.AggregateSet = false
		selectSpec.AggregateMethod = ""
		return
	}
	selectSpec.AggregateSet = true
	selectSpec.AggregateMethod = s.AggregateMethod()
}

type CountAgg struct {
	count int64
}

func createCountTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	t, d := execute.NewAggregateTransformationAndDataset(id, mode, a.Bounds(), new(CountAgg), a.Allocator())
	return t, d, nil
}

func (a *CountAgg) NewBoolAgg() execute.DoBoolAgg {
	a.count = 0
	return a
}
func (a *CountAgg) NewIntAgg() execute.DoIntAgg {
	a.count = 0
	return a
}
func (a *CountAgg) NewUIntAgg() execute.DoUIntAgg {
	a.count = 0
	return a
}
func (a *CountAgg) NewFloatAgg() execute.DoFloatAgg {
	a.count = 0
	return a
}
func (a *CountAgg) NewStringAgg() execute.DoStringAgg {
	a.count = 0
	return a
}

func (a *CountAgg) DoBool(vs []bool) {
	a.count += int64(len(vs))
}
func (a *CountAgg) DoUInt(vs []uint64) {
	a.count += int64(len(vs))
}
func (a *CountAgg) DoInt(vs []int64) {
	a.count += int64(len(vs))
}
func (a *CountAgg) DoFloat(vs []float64) {
	a.count += int64(len(vs))
}
func (a *CountAgg) DoString(vs []string) {
	a.count += int64(len(vs))
}

func (a *CountAgg) Type() execute.DataType {
	return execute.TInt
}
func (a *CountAgg) ValueInt() int64 {
	return a.count
}
