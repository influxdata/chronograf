package plan

import (
	"fmt"
	"strings"
	"time"

	"github.com/influxdata/flux"
)

const DefaultYieldName = "_result"

// PlanNode defines the common interface for interacting with
// logical and physical plan nodes.
type PlanNode interface {
	// Returns an identifier for this plan node
	ID() NodeID

	// Returns the time bounds for this plan node
	Bounds() *Bounds

	// Plan nodes executed immediately before this node
	Predecessors() []PlanNode

	// Plan nodes executed immediately after this node
	Successors() []PlanNode

	// Specification of the procedure represented by this node
	ProcedureSpec() ProcedureSpec

	// Replaces the procedure spec of this node with another
	ReplaceSpec(ProcedureSpec) error

	// Type of procedure represented by this node
	Kind() ProcedureKind

	// Helper methods for manipulating a plan
	// These methods are used during planning
	SetBounds(bounds *Bounds)
	AddSuccessors(...PlanNode)
	AddPredecessors(...PlanNode)
	ClearSuccessors()
	ClearPredecessors()

	ShallowCopy() PlanNode
}

type NodeID string

// PlanSpec holds the result nodes of a query plan with associated metadata
type PlanSpec struct {
	Roots     map[PlanNode]struct{}
	Resources flux.ResourceManagement
	Now       time.Time
}

// NewPlanSpec initializes a new query plan
func NewPlanSpec() *PlanSpec {
	return &PlanSpec{
		Roots: make(map[PlanNode]struct{}),
	}
}

// Replace replaces one of the root nodes of the query plan
func (plan *PlanSpec) Replace(root, with PlanNode) {
	delete(plan.Roots, root)
	plan.Roots[with] = struct{}{}
}

// ProcedureSpec specifies a query operation
type ProcedureSpec interface {
	Kind() ProcedureKind
	Copy() ProcedureSpec
}

// ProcedureKind denotes the kind of operation
type ProcedureKind string

type bounds struct {
	value *Bounds
}

func (b *bounds) SetBounds(bounds *Bounds) {
	b.value = bounds
}

func (b *bounds) Bounds() *Bounds {
	return b.value
}

type edges struct {
	predecessors []PlanNode
	successors   []PlanNode
}

func (e *edges) Predecessors() []PlanNode {
	return e.predecessors
}

func (e *edges) Successors() []PlanNode {
	return e.successors
}

func (e *edges) AddSuccessors(nodes ...PlanNode) {
	e.successors = append(e.successors, nodes...)
}

func (e *edges) AddPredecessors(nodes ...PlanNode) {
	e.predecessors = append(e.predecessors, nodes...)
}

func (e *edges) ClearSuccessors() {
	e.successors = e.successors[0:0]
}

func (e *edges) ClearPredecessors() {
	e.predecessors = e.predecessors[0:0]
}

func (e *edges) shallowCopy() edges {
	newEdges := new(edges)
	copy(newEdges.predecessors, e.predecessors)
	copy(newEdges.successors, e.successors)
	return *newEdges
}

// MergeLogicalPlanNodes merges top and bottom plan nodes into a new plan node, with the
// given procedure spec.
//
//     V1     V2       V1            V2       <-- successors
//       \   /
//        top             mergedNode
//         |      ==>         |
//       bottom               W
//         |
//         W
//
// The returned node will have its predecessors set to the predecessors
// of "bottom", however, it's successors will not be set---it will be the responsibility of
// the plan to attach the merged node to its successors.
func MergeLogicalPlanNodes(top, bottom PlanNode, procSpec ProcedureSpec) (PlanNode, error) {
	merged := &LogicalPlanNode{
		id:   mergeIDs(top.ID(), bottom.ID()),
		Spec: procSpec,
	}

	return mergePlanNodes(top, bottom, merged)
}

func MergePhysicalPlanNodes(top, bottom PlanNode, procSpec PhysicalProcedureSpec) (PlanNode, error) {
	merged := &PhysicalPlanNode{
		id:   mergeIDs(top.ID(), bottom.ID()),
		Spec: procSpec,
	}

	return mergePlanNodes(top, bottom, merged)
}

func mergeIDs(top, bottom NodeID) NodeID {
	if strings.HasPrefix(string(top), "merged_") {
		top = top[7:]
	}
	if strings.HasPrefix(string(bottom), "merged_") {
		bottom = bottom[7:]
	}

	return "merged_" + bottom + "_" + top

}

func mergePlanNodes(top, bottom, merged PlanNode) (PlanNode, error) {
	if len(top.Predecessors()) != 1 ||
		len(bottom.Successors()) != 1 ||
		top.Predecessors()[0] != bottom {
		return nil, fmt.Errorf("cannot merge %s and %s due to topological issues", top.ID(), bottom.ID())
	}

	merged.AddPredecessors(bottom.Predecessors()...)
	for i, pred := range merged.Predecessors() {
		for _, succ := range pred.Successors() {
			if succ == bottom {
				pred.Successors()[i] = merged
			}
		}
	}

	return merged, nil

}

// SwapPlanNodes swaps two plan nodes and returns an equivalent sub-plan with the nodes swapped.
//
//     V1   V2        V1   V2
//       \ /
//        A              B
//        |     ==>      |
//        B          copy of A
//        |              |
//        W              W
//
// Note that successors of the original top node will not be updated, and the returned
// plan node will have no successors.  It will be the responsibility of the plan to
// attach the swapped nodes to successors.
func SwapPlanNodes(top, bottom PlanNode) (PlanNode, error) {
	if len(top.Predecessors()) != 1 ||
		len(bottom.Successors()) != 1 ||
		len(bottom.Predecessors()) != 1 {
		return nil, fmt.Errorf("cannot swap nodes %v and %v due to topological issue", top.ID(), bottom.ID())
	}

	newBottom := top.ShallowCopy()
	newBottom.ClearSuccessors()
	newBottom.ClearPredecessors()
	newBottom.AddSuccessors(bottom)
	newBottom.AddPredecessors(bottom.Predecessors()[0])
	for i, bottomPredSucc := range bottom.Predecessors()[0].Successors() {
		if bottomPredSucc == bottom {
			bottom.Predecessors()[0].Successors()[i] = newBottom
			break
		}
	}

	bottom.ClearPredecessors()
	bottom.AddPredecessors(newBottom)
	bottom.ClearSuccessors()
	return bottom, nil
}

type WindowSpec struct {
	Every  flux.Duration
	Period flux.Duration
	Round  flux.Duration
	Start  flux.Time
}
