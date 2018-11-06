package plan_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/go-cmp/cmp"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/plan/plantest"
)

func TestRuleRegistration(t *testing.T) {
	simpleRule := plantest.SimpleRule{}

	// Register the rule,
	// then check seenNodes below to check that the rule was invoked.
	plan.RegisterLogicalRules(&simpleRule)

	now := time.Now().UTC()
	fluxSpec, err := flux.Compile(context.Background(), `from(bucket: "telegraf") |> range(start: -5m)`, now)
	if err != nil {
		t.Fatalf("could not compile very simple Flux query: %v", err)
	}

	logicalPlanner := plan.NewLogicalPlanner()
	logicalPlanSpec, err := logicalPlanner.Plan(fluxSpec)
	if err != nil {
		t.Fatalf("could not do logical planning: %v", err)
	}

	wantSeenNodes := []plan.NodeID{"generated_yield", "range1", "from0"}
	if !cmp.Equal(wantSeenNodes, simpleRule.SeenNodes) {
		t.Errorf("did not find expected seen nodes, -want/+got:\n%v", cmp.Diff(wantSeenNodes, simpleRule.SeenNodes))
	}

	// Test rule registration for the physical plan too.
	simpleRule.SeenNodes = simpleRule.SeenNodes[0:0]
	plan.RegisterPhysicalRules(&simpleRule)

	physicalPlanner := plan.NewPhysicalPlanner()
	_, err = physicalPlanner.Plan(logicalPlanSpec)
	if err != nil {
		t.Fatalf("could not do physical planning: %v", err)
	}

	// Here seen nodes reflects two passes: on the first pass, after simpleRule visits range1, the range node
	// is pushed into the from.  The second pass changes nothing and shows both nodes in the plan
	wantSeenNodes = []plan.NodeID{"generated_yield", "range1", "generated_yield", "merged_from0_range1"}
	if !cmp.Equal(wantSeenNodes, simpleRule.SeenNodes) {
		t.Errorf("did not find expected seen nodes, -want/+got:\n%v", cmp.Diff(wantSeenNodes, simpleRule.SeenNodes))
	}
}
