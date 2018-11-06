package plan

// Rule is transformation rule for a query operation
type Rule interface {
	// The name of this rule (must be unique)
	Name() string

	// Pattern for this rule to match against
	Pattern() Pattern

	// Rewrite an operation into an equivalent one
	Rewrite(PlanNode) (PlanNode, bool, error)
}
