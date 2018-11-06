package plan

const generatedYieldKind = "generatedYield"

type YieldProcedureSpec interface {
	YieldName() string
}

// GeneratedYieldProcedureSpec provides a special planner-generated yield for queries that don't
// have explicit calls to yield().
type GeneratedYieldProcedureSpec struct {
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
