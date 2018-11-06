# Query Planner and Optimizer

This document describes the design of the Flux query planner and optimizer.

## Plans
--------

A Flux query plan is represented as a Directed Acyclic Graph (DAG).
The nodes of the graph represent individual query operations to perform.
The edges of the graph represent the flow of data from one operation to another.
In a Flux query plan, data flows upwards from source nodes to terminal yield nodes.

## Plan Nodes
-------------

```go
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

	// Type of procedure represented by this node
	Kind() ProcedureKind

    ...
}
```

The nodes of a query represent operations.
An operation is a transformation to apply to data in some form.
Nodes have predecessors and successors.
A node's predecessors are the query operations executed immediately before it.
A node's successors are the query operations executed immediately after it.
A node receives data directly from its predecessors.
A node feeds data directly to its successors.

## Planning and Optmimization
-----------------------------

```go
type LogicalPlanner interface {
	Plan(*flux.Spec) (*PlanSpec, error)
}

type PhysicalPlanner interface {
	Plan(*PlanSpec) (*PlanSpec, error)
}
```

There are two types of query plans - logical and physical.
The nodes of a logical plan represent logical operations.
The nodes of a physical plan represent physical operations.
Logical operations describe _what_ happens to the data.
Physical operations specify _how_ transformations are implemented.

Logical planning occurs in two distinct phases.
First a Flux query spec is translated directly into a logical plan.
There is a 1-1 relationship between a query spec and a logical plan.
Once a spec is converted to an initial logical plan, it is optimized via a set of rewrite rules.
Each rule transforms the plan into an equivalent one that can be executed more efficiently by the query engine.

After a logical plan has been optimized, a physical planner converts it to an optimized physical plan.
Physical plan nodes have a cost of execution associated with them.
Hence the goal of this phase is to compute an equivalent physical plan with the smallest cost.
During optimization equivalent plans are obtained via rewrite rules.
These plans are enumerated with their total query costs.
The final physical plan specifies the best algorithm (in terms of cost) to perform the query.

## Rewrite Rules
----------------

```go
type Rule interface {
	// The name of this rule (must be unique)
	Name() string

	// Pattern for this rule to match against
	Pattern() Pattern

	// Rewrite an operation into an equivalent one
	Rewrite(PlanNode) (PlanNode, bool, error)
}
```

Query plans - whether logical or physical - are transformed into equivalent plans via rewrite rules.
A rewrite rule defines an equivalence class of queries.
That is, for any data instance, a query expressed before and after a rewrite rule is applied will always define the same data transformation.
This implies that an abritrary number of rewrite rules still preserves query equivalence.

## Patterns
-----------

A rewrite rule specifies an operator pattern that it must match in order to perform the rewrite.
Patterns are constructed using the `Pat(ProcedureKind, Pattern) Pattern` method.
For example, given that we are interested in the rewrite rule that merges two consecutive filters, the pattern that this rule must match is given by the following construction.

```go
// Any() returns a pattern that matches anything
consecutiveFiltersPattern := Pat(FilterKind, Pat(FilterKind, Any()))
```

Therefore this rewrite rule's `Pattern()` method is defined as such.

```go
// MergeFiltersRule merges two consecutive filter operations into a single filter operation
type MergeFiltersRule struct {}

// Pattern specifies the operator pattern ... |> filter(...) |> filter(...)
func (rule MergeFiltersRule) Pattern() Pattern {
	return Pat(FilterKind, Pat(FilterKind, Any()))
}
```
