package plan

import (
	"fmt"
	"time"

	"github.com/influxdata/flux"
)

type Administration interface {
	Now() time.Time
}

// CreateProcedureSpec creates a ProcedureSpec from an OperationSpec and Administration
type CreateProcedureSpec func(flux.OperationSpec, Administration) (ProcedureSpec, error)

var createProcedureFns = struct {
	kind      map[ProcedureKind]CreateProcedureSpec
	operation map[flux.OperationKind][]CreateProcedureSpec

	sideEffectKind      map[ProcedureKind]CreateProcedureSpec
	sideEffectOperation map[flux.OperationKind][]CreateProcedureSpec
}{
	kind:      make(map[ProcedureKind]CreateProcedureSpec),
	operation: make(map[flux.OperationKind][]CreateProcedureSpec),

	sideEffectKind:      make(map[ProcedureKind]CreateProcedureSpec),
	sideEffectOperation: make(map[flux.OperationKind][]CreateProcedureSpec),
}

// RegisterProcedureSpec registers a new procedure with the specified kind.
// The call panics if the kind is not unique.
func RegisterProcedureSpec(k ProcedureKind, c CreateProcedureSpec, qks ...flux.OperationKind) {
	if createProcedureFns.kind[k] != nil {
		panic(fmt.Errorf("duplicate registration for procedure kind %v", k))
	}
	createProcedureFns.kind[k] = c
	for _, qk := range qks {
		createProcedureFns.operation[qk] = append(createProcedureFns.operation[qk], c)
	}
}

// RegisterProcedureSpecWithSideEffect registers a new procedure that produces side effects
func RegisterProcedureSpecWithSideEffect(k ProcedureKind, c CreateProcedureSpec, qks ...flux.OperationKind) {
	if createProcedureFns.sideEffectKind[k] != nil {
		panic(fmt.Errorf("duplicate registration for procedure kind %v", k))
	}
	createProcedureFns.sideEffectKind[k] = c
	for _, qk := range qks {
		createProcedureFns.sideEffectOperation[qk] = append(createProcedureFns.sideEffectOperation[qk], c)
	}
}

func createProcedureFnsFromKind(kind flux.OperationKind) ([]CreateProcedureSpec, bool) {
	var fns []CreateProcedureSpec
	var ok bool

	if fns, ok = createProcedureFns.operation[kind]; ok {
		return fns, ok
	}
	if fns, ok = createProcedureFns.sideEffectOperation[kind]; ok {
		return fns, ok
	}
	return nil, false

}

func hasSideEffects(spec ProcedureSpec) bool {
	_, ok := createProcedureFns.sideEffectKind[spec.Kind()]
	return ok
}

var ruleNameToLogicalRule = make(map[string]Rule)
var ruleNameToPhysicalRule = make(map[string]Rule)

// RegisterLogicalRules registers the rule created by createFn with the logical plan.
func RegisterLogicalRules(rules ...Rule) {
	registerRule(ruleNameToLogicalRule, rules...)
}

// RegisterPhysicalRules registers the rule created by createFn with the physical plan.
func RegisterPhysicalRules(rules ...Rule) {
	registerRule(ruleNameToPhysicalRule, rules...)
}

func registerRule(ruleMap map[string]Rule, rules ...Rule) {
	for _, rule := range rules {
		name := rule.Name()
		if _, ok := ruleMap[name]; ok {
			panic(fmt.Errorf(`rule with name "%v" has already been registered`, name))
		}
		ruleMap[name] = rule
	}
}
