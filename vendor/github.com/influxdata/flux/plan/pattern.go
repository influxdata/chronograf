package plan

const AnyKind = "*** any procedure kind ***"

// Pattern represents an operator tree pattern
// It can match itself against a query plan
type Pattern interface {
	Root() ProcedureKind
	Match(PlanNode) bool
}

// Pat returns a pattern that can match a plan node with the given ProcedureKind
// and whose predecessors match the given predecessor patterns.
//
// For example, to construct a pattern that matches a join followed by a sum:
//
//   sum
//    |
//   |X|    <=>  join(A, B) |> sum()  <=>  Pat(SumKind, Pat(JoinKind, Any(), Any()))
//  /   \
// A     B
func Pat(kind ProcedureKind, predecessors ...Pattern) Pattern {
	return &OneKindPattern{
		kind:         kind,
		predecessors: predecessors,
	}
}

// Any returns a pattern that matches anything.
func Any() Pattern {
	return &AnyPattern{}
}

// OneKindPattern matches a specified procedure with a predecessor pattern
//
//                   ProcedureKind
//                 /       |  ...  \
//        pattern1     pattern2  ... patternK
type OneKindPattern struct {
	kind         ProcedureKind
	predecessors []Pattern
}

func (okp OneKindPattern) Root() ProcedureKind {
	return okp.kind
}

func (okp OneKindPattern) Match(node PlanNode) bool {
	if node.Kind() != okp.kind {
		return false
	}

	if len(okp.predecessors) != len(node.Predecessors()) {
		return false
	}

	// Check that each predecessor does not have other successors
	for _, pred := range node.Predecessors() {
		if len(pred.Successors()) != 1 {
			return false
		}
	}

	// Recursively match each predecessor
	for i, pattern := range okp.predecessors {
		if !pattern.Match(node.Predecessors()[i]) {
			return false
		}
	}
	return true
}

// AnyPattern describes (and matches) any plan node
type AnyPattern struct{}

func (AnyPattern) Root() ProcedureKind {
	return AnyKind
}

func (AnyPattern) Match(node PlanNode) bool {
	return true
}
