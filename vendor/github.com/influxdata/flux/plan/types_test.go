package plan_test

import (
	"testing"

	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/plan/plantest"
)

func TestPlanSpec_CheckIntegrity(t *testing.T) {
	ps := &plantest.PlanSpec{
		Nodes: []plan.PlanNode{
			plantest.CreateLogicalMockNode("0"),
			plantest.CreateLogicalMockNode("1"),
			plantest.CreateLogicalMockNode("2"),
		},
		Edges: [][2]int{
			{0, 1},
			{1, 2},
		},
	}

	p := plantest.CreatePlanSpec(ps)
	assertOK(t, p)
	assertOK(t, p)

	// Let's add a predecessor to 1 that has no successor:
	node3 := plantest.CreateLogicalMockNode("3")
	ps.Nodes[1].AddPredecessors(node3)
	assertKO(t, p)

	// Let's fix it:
	node3.AddSuccessors(ps.Nodes[1])
	assertOK(t, p)
	assertOK(t, p)

	// Now, Let's add a successor (without predecessor) to 3:
	node3.AddSuccessors(ps.Nodes[0])
	assertKO(t, p)

	// Let's fix it:
	ps.Nodes[0].AddPredecessors(node3)
	assertOK(t, p)

	// This passes, because 4 is isolated
	node4 := plantest.CreateLogicalMockNode("4")
	node4.AddSuccessors(ps.Nodes[0])
	assertOK(t, p)

	// But, if we point at 4, it fails:
	ps.Nodes[2].AddPredecessors(node4)
	assertKO(t, p)

	// Even if we fix it, still 4 is not predecessor of 0
	node4.AddSuccessors(ps.Nodes[2])
	assertKO(t, p)

	// Final fix:
	ps.Nodes[0].AddPredecessors(node4)
	assertOK(t, p)

	// But now, if we introduce a cycle (2 -> 1 -> 3 -> 2):
	node3.AddPredecessors(ps.Nodes[2])
	ps.Nodes[2].AddSuccessors(node3)
	assertKO(t, p)
}

func assertOK(t *testing.T, p *plan.PlanSpec) {
	err := p.CheckIntegrity()
	if err != nil {
		t.Fatalf("unexpected integrity check fail: %v", err)
	}
}

func assertKO(t *testing.T, p *plan.PlanSpec) {
	err := p.CheckIntegrity()
	if err == nil {
		t.Fatal("unexpected integrity check pass")
	}
}
