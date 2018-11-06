package plantest

import "github.com/influxdata/flux/plan"

// SimpleRule is a simple rule whose pattern matches any plan node and
// just stores the NodeIDs of nodes it has visited in SeenNodes.
type SimpleRule struct {
	SeenNodes []plan.NodeID
}

func (sr *SimpleRule) Pattern() plan.Pattern {
	return plan.Any()
}

func (sr *SimpleRule) Rewrite(node plan.PlanNode) (plan.PlanNode, bool, error) {
	sr.SeenNodes = append(sr.SeenNodes, node.ID())
	return node, false, nil
}

func (sr *SimpleRule) Name() string {
	return "simple"
}
