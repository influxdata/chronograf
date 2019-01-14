package plantest

import (
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/semantic/semantictest"
)

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

// SmashPlanRule adds an `Intruder` as predecessor of the given `Node` without
// marking it as successor of it. It breaks the integrity of the plan.
// If `Kind` is specified, it takes precedence over `Node`, and the rule will use it
// to match.
type SmashPlanRule struct {
	Node     plan.PlanNode
	Intruder plan.PlanNode
	Kind     plan.ProcedureKind
}

func (SmashPlanRule) Name() string {
	return "SmashPlanRule"
}

func (spp SmashPlanRule) Pattern() plan.Pattern {
	var k plan.ProcedureKind
	if len(spp.Kind) > 0 {
		k = spp.Kind
	} else {
		k = spp.Node.Kind()
	}

	return plan.Pat(k, plan.Any())
}

func (spp SmashPlanRule) Rewrite(node plan.PlanNode) (plan.PlanNode, bool, error) {
	var changed bool
	if len(spp.Kind) > 0 || node == spp.Node {
		node.AddPredecessors(spp.Intruder)
		changed = true
	}

	// it is not necessary to return a copy of the node, because the rule changes the number
	// of predecessors and it won't be re-triggered again.
	return node, changed, nil
}

// CreateCycleRule creates a cycle between the given `Node` and its predecessor.
// It creates exactly one cycle. After the rule is triggered once, it won't have any effect later.
// This rule breaks the integrity of the plan.
// If `Kind` is specified, it takes precedence over `Node`, and the rule will use it
// to match.
type CreateCycleRule struct {
	Node plan.PlanNode
	Kind plan.ProcedureKind
}

func (CreateCycleRule) Name() string {
	return "CreateCycleRule"
}

func (ccr CreateCycleRule) Pattern() plan.Pattern {
	var k plan.ProcedureKind
	if len(ccr.Kind) > 0 {
		k = ccr.Kind
	} else {
		k = ccr.Node.Kind()
	}

	return plan.Pat(k, plan.Any())
}

func (ccr CreateCycleRule) Rewrite(node plan.PlanNode) (plan.PlanNode, bool, error) {
	var changed bool
	if len(ccr.Kind) > 0 || node == ccr.Node {
		node.Predecessors()[0].AddPredecessors(node)
		node.AddSuccessors(node.Predecessors()[0])
		changed = true
	}

	// just return a copy of the node, otherwise the rule will be triggered an infinite number of times
	// (it doesn't change the number of predecessors, indeed).
	return node.ShallowCopy(), changed, nil
}

// RuleTestCase allows for concise creation of test cases that exercise rules
type RuleTestCase struct {
	Name     string
	Rules    []plan.Rule
	Before   *PlanSpec
	After    *PlanSpec
	NoChange bool
}

// RuleTestHelper will run a rule test case.
func RuleTestHelper(t *testing.T, tc *RuleTestCase) {
	t.Helper()

	before := CreatePlanSpec(tc.Before)
	var after *plan.PlanSpec
	if tc.NoChange {
		after = CreatePlanSpec(tc.Before.Copy())
	} else {
		after = CreatePlanSpec(tc.After)
	}

	// Disable validation so that we can avoid having to push a range into every from
	physicalPlanner := plan.NewPhysicalPlanner(
		plan.OnlyPhysicalRules(tc.Rules...),
		plan.DisableValidation(),
	)

	pp, err := physicalPlanner.Plan(before)
	if err != nil {
		t.Fatal(err)
	}

	type testAttrs struct {
		ID   plan.NodeID
		Spec plan.ProcedureSpec
	}
	want := make([]testAttrs, 0)
	after.BottomUpWalk(func(node plan.PlanNode) error {
		want = append(want, testAttrs{
			ID:   node.ID(),
			Spec: node.ProcedureSpec(),
		})
		return nil
	})

	got := make([]testAttrs, 0)
	pp.BottomUpWalk(func(node plan.PlanNode) error {
		got = append(got, testAttrs{
			ID:   node.ID(),
			Spec: node.ProcedureSpec(),
		})
		return nil
	})

	if !cmp.Equal(want, got, semantictest.CmpOptions...) {
		t.Errorf("transformed plan not as expected, -want/+got:\n%v",
			cmp.Diff(want, got, semantictest.CmpOptions...))
	}
}
