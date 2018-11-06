package transformations

import (
	"fmt"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/semantic"
)

const YieldKind = "yield"

type YieldOpSpec struct {
	Name string `json:"name"`
}

func init() {
	yieldSignature := flux.FunctionSignature(
		map[string]semantic.PolyType{
			"name": semantic.String,
		},
		nil,
	)

	flux.RegisterFunctionWithSideEffect(YieldKind, createYieldOpSpec, yieldSignature)
	flux.RegisterOpSpec(YieldKind, newYieldOp)
	plan.RegisterProcedureSpecWithSideEffect(YieldKind, newYieldProcedure, YieldKind)
}

func createYieldOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	spec := new(YieldOpSpec)

	name, ok, err := args.GetString("name")
	if err != nil {
		return nil, err
	} else if ok {
		spec.Name = name
	} else {
		spec.Name = plan.DefaultYieldName
	}

	return spec, nil
}

func newYieldOp() flux.OperationSpec {
	return new(YieldOpSpec)
}

func (s *YieldOpSpec) Kind() flux.OperationKind {
	return YieldKind
}

type YieldProcedureSpec struct {
	plan.DefaultCost
	Name string `json:"name"`
}

func newYieldProcedure(qs flux.OperationSpec, _ plan.Administration) (plan.ProcedureSpec, error) {
	if spec, ok := qs.(*YieldOpSpec); ok {
		return &YieldProcedureSpec{Name: spec.Name}, nil
	}

	return nil, fmt.Errorf("invalid spec type %T", qs)
}

func (s *YieldProcedureSpec) Kind() plan.ProcedureKind {
	return YieldKind
}

func (s *YieldProcedureSpec) Copy() plan.ProcedureSpec {
	return &YieldProcedureSpec{Name: s.Name}
}

func (s *YieldProcedureSpec) YieldName() string {
	return s.Name
}
