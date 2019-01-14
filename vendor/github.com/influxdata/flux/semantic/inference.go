package semantic

// InferTypes produces a solution to type inference for a given semantic graph.
func InferTypes(n Node, importer Importer) (TypeSolution, error) {
	annotator := Annotate(n)
	cs, err := GenerateConstraints(n, annotator, importer)
	if err != nil {
		return nil, err
	}
	return SolveConstraints(cs)
}

// TypeSolution is a mapping of Nodes to their types.
type TypeSolution interface {
	// TypeOf reports the monotype of the node or an error.
	TypeOf(n Node) (Type, error)
	// TypeOf reports the polytype of the node or an error.
	PolyTypeOf(n Node) (PolyType, error)

	// FreshSolution creates a copy of the solution with fresh type variables
	FreshSolution() TypeSolution

	// Fresh creates a new type variable within the solution.
	Fresh() Tvar

	// AddConstraint adds a new constraint and solves again reporting any errors.
	AddConstraint(l, r PolyType) error
}
