package plan

// DefaultYieldName is the name of a result that doesn't
// have any name assigned.
const DefaultYieldName = "_result"

// YieldProcedureSpec is a special procedure that has the side effect of
// returning a result to the client.
type YieldProcedureSpec interface {
	YieldName() string
}

const generatedYieldKind = "generatedYield"

// GeneratedYieldProcedureSpec provides a special planner-generated yield for queries that don't
// have explicit calls to yield().
type GeneratedYieldProcedureSpec struct {
	DefaultCost
	Name string
}

func (y *GeneratedYieldProcedureSpec) Kind() ProcedureKind {
	return generatedYieldKind
}

func (y *GeneratedYieldProcedureSpec) Copy() ProcedureSpec {
	return &GeneratedYieldProcedureSpec{Name: y.Name}
}

func (y *GeneratedYieldProcedureSpec) YieldName() string {
	return y.Name
}
