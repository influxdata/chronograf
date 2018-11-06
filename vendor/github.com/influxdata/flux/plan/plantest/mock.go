package plantest

import "github.com/influxdata/flux/plan"

const MockKind = "mock"

// CreateLogicalMockNode creates a mock plan node that doesn't match any rules
// (other than rules that match any node)
func CreateLogicalMockNode(id string) *plan.LogicalPlanNode {
	return plan.CreateLogicalNode(plan.NodeID(id), MockProcedureSpec{})
}

// CreatePhysicalMockNode creates a mock plan node that doesn't match any rules
// (other than rules that match any node)
func CreatePhysicalMockNode(id string) *plan.PhysicalPlanNode {
	return plan.CreatePhysicalNode(plan.NodeID(id), MockProcedureSpec{})
}

// MockProcedureSpec provides a type that implements ProcedureSpec but does not require
// importing packages which register rules and procedure kinds, which makes it useful for
// unit testing.
type MockProcedureSpec struct {
	plan.DefaultCost
}

func (MockProcedureSpec) Kind() plan.ProcedureKind {
	return MockKind
}

func (MockProcedureSpec) Copy() plan.ProcedureSpec {
	return MockProcedureSpec{}
}
