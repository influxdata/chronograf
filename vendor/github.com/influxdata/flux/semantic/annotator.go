package semantic

// Annotate walks a graph and assigns each expression a type variable annotation.
func Annotate(node Node) Annotator {
	annotator := Annotator{
		f:           new(fresher),
		annotations: make(map[Node]annotation),
	}
	Walk(annotator, node)
	return annotator
}

// Annotator implements Visitor to walk the graph.
type Annotator struct {
	f           *fresher
	annotations map[Node]annotation
}

// annotation is associated with a Node.
type annotation struct {
	// Var is the type variable assigned to the node
	Var Tvar
	// Type is the type of the node if known
	Type PolyType
	// Err is any error encountered while performing type inference.
	Err error
}

func (v Annotator) Visit(node Node) Visitor {
	switch n := node.(type) {
	case *FunctionBlock,
		*FunctionParameter,
		*Property,
		*Block,
		*ReturnStatement,
		Expression:
		v.annotations[n] = annotation{
			Var: v.f.Fresh(),
		}
	}
	return v
}
func (v Annotator) Done(node Node) {}
