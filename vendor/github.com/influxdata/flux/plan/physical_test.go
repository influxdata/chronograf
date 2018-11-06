package plan_test

import (
	"math"
	"testing"

	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/plan/plantest"
)

func TestPhysicalOptions(t *testing.T) {
	configs := [][]plan.PhysicalOption{
		{plan.WithDefaultMemoryLimit(16384)},
		{},
	}

	for _, options := range configs {
		spec := &plantest.PlanSpec{
			Nodes: []plan.PlanNode{
				plantest.CreatePhysicalMockNode("0"),
				plantest.CreatePhysicalMockNode("1"),
			},
			Edges: [][2]int{
				{0, 1},
			},
		}

		inputPlan := plantest.CreatePlanSpec(spec)

		thePlanner := plan.NewPhysicalPlanner(options...)
		outputPlan, err := thePlanner.Plan(inputPlan)
		if err != nil {
			t.Fatalf("Physical planning failed: %v", err)
		}

		// If option was specified, we should have overridden the default memory quota.
		if len(options) > 0 {
			if outputPlan.Resources.MemoryBytesQuota != 16384 {
				t.Errorf("Expected memory quota of 16384 with option specified")
			}
		} else {
			if outputPlan.Resources.MemoryBytesQuota != math.MaxInt64 {
				t.Errorf("Expected memory quota of math.MaxInt64 with no options specified")
			}
		}
	}
}
