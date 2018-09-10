package functions

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

var yieldSignature = semantic.FunctionSignature{
	Params: map[string]semantic.Type{
		flux.TableParameter: flux.TableObjectType,
		"name":              semantic.String,
	},
	ReturnType:   flux.TableObjectType,
	PipeArgument: flux.TableParameter,
}

func init() {
	flux.RegisterFunctionWithSideEffect(YieldKind, createYieldOpSpec, yieldSignature)
	flux.RegisterOpSpec(YieldKind, newYieldOp)
	plan.RegisterProcedureSpec(YieldKind, newYieldProcedure, YieldKind)
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
		spec.Name = "_result"
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
