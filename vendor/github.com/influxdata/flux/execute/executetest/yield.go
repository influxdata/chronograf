package executetest

import "github.com/influxdata/flux/plan"

func NewYieldProcedureSpec(name string) plan.PhysicalProcedureSpec {
	return &YieldProcedureSpec{name: name}
}

const YieldKind = "yield-test"

type YieldProcedureSpec struct {
	plan.DefaultCost
	name string
}

func (YieldProcedureSpec) Kind() plan.ProcedureKind {
	return YieldKind
}

func (y YieldProcedureSpec) Copy() plan.ProcedureSpec {
	return YieldProcedureSpec{name: y.name}
}

func (y YieldProcedureSpec) YieldName() string {
	return y.name
}
