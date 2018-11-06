package plan

import "sort"

// TopDownWalk will execute f for each plan node in the PlanSpec.
// It always visits a node before visiting its predecessors.
func (plan *PlanSpec) TopDownWalk(f func(node PlanNode) error) error {
	visited := make(map[PlanNode]struct{})

	roots := make([]PlanNode, 0, len(plan.Roots))
	for root := range plan.Roots {
		roots = append(roots, root)
	}

	// Make sure to sort the roots first otherwise
	// an in-consistent walk order is possible.
	sort.Slice(roots, func(i, j int) bool {
		return roots[i].ID() < roots[j].ID()
	})

	postFn := func(PlanNode) error {
		return nil
	}

	for _, root := range roots {
		err := walk(root, f, postFn, visited)
		if err != nil {
			return err
		}
	}

	return nil
}

// BottomUpWalk will execute f for each plan node in the PlanSpec,
// starting from the sources, and only visiting a node after all its
// predecessors have been visited.
func (plan *PlanSpec) BottomUpWalk(f func(PlanNode) error) error {
	visited := make(map[PlanNode]struct{})

	roots := make([]PlanNode, 0, len(plan.Roots))
	for root := range plan.Roots {
		roots = append(roots, root)
	}

	// Make sure to sort the roots first otherwise
	// an in-consistent walk order is possible.
	sort.Slice(roots, func(i, j int) bool {
		return roots[i].ID() < roots[j].ID()
	})

	preFn := func(PlanNode) error {
		return nil
	}

	for _, root := range roots {
		err := walk(root, preFn, f, visited)
		if err != nil {
			return err
		}
	}

	return nil
}

func walk(node PlanNode, preFn, postFn func(PlanNode) error, visited map[PlanNode]struct{}) error {
	if _, ok := visited[node]; ok {
		return nil
	}

	visited[node] = struct{}{}

	// Pre-order traversal
	if err := preFn(node); err != nil {
		return err
	}

	for _, pred := range node.Predecessors() {
		if err := walk(pred, preFn, postFn, visited); err != nil {
			return err
		}
	}

	// Post-order traversal
	return postFn(node)
}
