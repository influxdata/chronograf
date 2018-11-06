package plan_test

import (
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/plan/plantest"
)

func TestPlanSpec_BottomUpWalk(t *testing.T) {
	spec := &plantest.PlanSpec{
		//  0 1 2  additional edge (3->2)
		//  |\|\|
		//  3 4 5  additional edge (8->3)
		//  |/|/|
		//  6 7 8
		Nodes: []plan.PlanNode{
			plantest.CreateLogicalMockNode("0"),
			plantest.CreateLogicalMockNode("1"),
			plantest.CreateLogicalMockNode("2"),

			plantest.CreateLogicalMockNode("3"),
			plantest.CreateLogicalMockNode("4"),
			plantest.CreateLogicalMockNode("5"),

			plantest.CreateLogicalMockNode("6"),
			plantest.CreateLogicalMockNode("7"),
			plantest.CreateLogicalMockNode("8"),
		},
		Edges: [][2]int{
			{6, 3},
			{6, 4},
			{7, 4},
			{7, 5},
			{8, 3},
			{8, 5},

			{3, 0},
			{3, 2},
			{4, 0},
			{4, 1},
			{5, 1},
			{5, 2},
		},
	}

	thePlan := plantest.CreatePlanSpec(spec)

	got := make([]plan.NodeID, 0, 9)
	thePlan.BottomUpWalk(func(n plan.PlanNode) error {
		got = append(got, n.ID())
		return nil
	})

	want := []plan.NodeID{"6", "8", "3", "7", "4", "0", "5", "1", "2"}
	if !cmp.Equal(want, got) {
		t.Errorf("Did not get expected node traversal, -want/+got:\n%v", cmp.Diff(want, got))
	}
}

func TestPlanSpec_TopDownWalk(t *testing.T) {
	spec := &plantest.PlanSpec{
		//  0 1 2  additional edge (3->2)
		//  |\|\|
		//  3 4 5  additional edge (8->3)
		//  |/|/|
		//  6 7 8
		Nodes: []plan.PlanNode{
			plantest.CreateLogicalMockNode("0"),
			plantest.CreateLogicalMockNode("1"),
			plantest.CreateLogicalMockNode("2"),

			plantest.CreateLogicalMockNode("3"),
			plantest.CreateLogicalMockNode("4"),
			plantest.CreateLogicalMockNode("5"),

			plantest.CreateLogicalMockNode("6"),
			plantest.CreateLogicalMockNode("7"),
			plantest.CreateLogicalMockNode("8"),
		},
		Edges: [][2]int{
			{6, 3},
			{6, 4},
			{7, 4},
			{7, 5},
			{8, 3},
			{8, 5},

			{3, 0},
			{3, 2},
			{4, 0},
			{4, 1},
			{5, 1},
			{5, 2},
		},
	}

	thePlan := plantest.CreatePlanSpec(spec)

	got := make([]plan.NodeID, 0, 9)
	thePlan.TopDownWalk(func(n plan.PlanNode) error {
		got = append(got, n.ID())
		return nil
	})

	want := []plan.NodeID{"0", "3", "6", "8", "4", "7", "1", "5", "2"}
	if !cmp.Equal(want, got) {
		t.Errorf("Did not get expected node traversal, -want/+got:\n%v", cmp.Diff(want, got))
	}
}
