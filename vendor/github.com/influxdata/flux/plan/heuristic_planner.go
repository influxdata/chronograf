package plan

import "sort"

// heuristicPlanner applies a set of rules to the nodes in a PlanSpec
// until a fixed point is reached and no more rules can be applied.
type heuristicPlanner struct {
	rules map[ProcedureKind][]Rule
}

func newHeuristicPlanner() *heuristicPlanner {
	return &heuristicPlanner{
		rules: make(map[ProcedureKind][]Rule),
	}
}

func (p *heuristicPlanner) addRules(rules ...Rule) {
	for _, rule := range rules {
		ruleSlice := p.rules[rule.Pattern().Root()]
		p.rules[rule.Pattern().Root()] = append(ruleSlice, rule)
	}
}

func (p *heuristicPlanner) clearRules() {
	p.rules = make(map[ProcedureKind][]Rule)
}

// matchRules applies any applicable rules to the given plan node,
// and returns the rewritten plan node and whether or not any rewriting was done.
func (p *heuristicPlanner) matchRules(node PlanNode) (PlanNode, bool, error) {
	anyChanged := false

	for _, rule := range p.rules[AnyKind] {
		if rule.Pattern().Match(node) {
			newNode, changed, err := rule.Rewrite(node)
			if err != nil {
				return nil, false, err
			}
			anyChanged = anyChanged || changed
			node = newNode
		}
	}

	for _, rule := range p.rules[node.Kind()] {
		if rule.Pattern().Match(node) {
			newNode, changed, err := rule.Rewrite(node)
			if err != nil {
				return nil, false, err
			}
			anyChanged = anyChanged || changed
			node = newNode
		}
	}

	return node, anyChanged, nil
}

// Plan is a fixed-point query planning algorithm.
// It traverses the DAG depth-first, attempting to apply rewrite rules at each node.
// Traversal is repeated until a pass over the DAG results in no changes with the given rule set.
//
// Plan may change its argument and/or return a new instance of PlanSpec, so the correct way to call Plan is:
//     plan, err = plan.Plan(plan)
func (p *heuristicPlanner) Plan(inputPlan *PlanSpec) (*PlanSpec, error) {
	for anyChanged := true; anyChanged; {
		visited := make(map[PlanNode]struct{})

		nodeStack := make([]PlanNode, 0, len(inputPlan.Roots))
		for root := range inputPlan.Roots {
			nodeStack = append(nodeStack, root)
		}

		// Sort the roots so that we always traverse deterministically
		// (sort descending so that we pop off the stack in ascending order)
		sort.Slice(nodeStack, func(i, j int) bool {
			return nodeStack[i].ID() > nodeStack[j].ID()
		})

		anyChanged = false
		for len(nodeStack) > 0 {
			node := nodeStack[len(nodeStack)-1]
			nodeStack = nodeStack[0 : len(nodeStack)-1]

			_, alreadyVisited := visited[node]

			if !alreadyVisited {
				newNode, changed, err := p.matchRules(node)
				if err != nil {
					return nil, err
				}
				anyChanged = anyChanged || changed
				if changed {
					updateSuccessors(inputPlan, node, newNode)
				}

				anyChanged = anyChanged || changed

				// append to stack in reverse order so lower-indexed children
				// are visited first.
				for i := len(newNode.Predecessors()); i > 0; i-- {
					nodeStack = append(nodeStack, newNode.Predecessors()[i-1])
				}

				visited[newNode] = struct{}{}
			}
		}
	}

	return inputPlan, nil
}

// updateSuccessors looks at all the successors of oldNode
// and rewires them to point them at newNode.
// Predecessors of oldNode and newNode are not touched.
//
//  A   B             A   B     <-- successors
//   \ /               \ /
//   node  becomes   newNode
//   / \               / \
//  D   E             D'  E'    <-- predecessors
func updateSuccessors(plan *PlanSpec, oldNode, newNode PlanNode) {
	newNode.ClearSuccessors()

	if len(oldNode.Successors()) == 0 {
		// This is a new root node.
		plan.Replace(oldNode, newNode)
		return
	}

	for _, succ := range oldNode.Successors() {
		found := false
		for i, succPred := range succ.Predecessors() {
			if succPred == oldNode {
				found = true
				succ.Predecessors()[i] = newNode
			}
		}

		if !found {
			panic("Inconsistent plan graph: successor does not have edge back to predecessor")
		}
	}

	newNode.AddSuccessors(oldNode.Successors()...)
}
