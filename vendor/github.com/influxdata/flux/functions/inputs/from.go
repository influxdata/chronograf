package inputs

import (
	"fmt"
	"github.com/influxdata/flux"
	"github.com/influxdata/flux/ast"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/functions"
	"github.com/influxdata/flux/functions/transformations"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/semantic"
	"github.com/influxdata/flux/values"
	"github.com/pkg/errors"
)

const FromKind = "from"

type FromOpSpec struct {
	Bucket   string `json:"bucket,omitempty"`
	BucketID string `json:"bucketID,omitempty"`
}

func init() {
	fromSignature := semantic.FunctionPolySignature{
		Parameters: map[string]semantic.PolyType{
			"bucket":   semantic.String,
			"bucketID": semantic.String,
		},
		Required: nil,
		Return:   flux.TableObjectType,
	}

	flux.RegisterFunction(FromKind, createFromOpSpec, fromSignature)
	flux.RegisterOpSpec(FromKind, newFromOp)
	plan.RegisterProcedureSpec(FromKind, newFromProcedure, FromKind)
	plan.RegisterPhysicalRules(
		MergeFromRangeRule{},
		MergeFromFilterRule{},
		FromDistinctRule{},
		MergeFromGroupRule{},
	)
}

func createFromOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	spec := new(FromOpSpec)

	if bucket, ok, err := args.GetString("bucket"); err != nil {
		return nil, err
	} else if ok {
		spec.Bucket = bucket
	}

	if bucketID, ok, err := args.GetString("bucketID"); err != nil {
		return nil, err
	} else if ok {
		spec.BucketID = bucketID
	}

	if spec.Bucket == "" && spec.BucketID == "" {
		return nil, errors.New("must specify one of bucket or bucketID")
	}
	if spec.Bucket != "" && spec.BucketID != "" {
		return nil, errors.New("must specify only one of bucket or bucketID")
	}
	return spec, nil
}

func newFromOp() flux.OperationSpec {
	return new(FromOpSpec)
}

func (s *FromOpSpec) Kind() flux.OperationKind {
	return FromKind
}

type FromProcedureSpec struct {
	plan.DefaultCost
	Bucket   string
	BucketID string

	BoundsSet bool
	Bounds    flux.Bounds

	FilterSet bool
	Filter    *semantic.FunctionExpression

	DescendingSet bool
	Descending    bool

	LimitSet     bool
	PointsLimit  int64
	SeriesLimit  int64
	SeriesOffset int64

	WindowSet bool
	Window    plan.WindowSpec

	GroupingSet bool
	OrderByTime bool
	GroupMode   functions.GroupMode
	GroupKeys   []string

	AggregateSet    bool
	AggregateMethod string
}

func newFromProcedure(qs flux.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*FromOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}

	return &FromProcedureSpec{
		Bucket:   spec.Bucket,
		BucketID: spec.BucketID,
	}, nil
}

func (s *FromProcedureSpec) Kind() plan.ProcedureKind {
	return FromKind
}

func (s *FromProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(FromProcedureSpec)

	ns.Bucket = s.Bucket
	ns.BucketID = s.BucketID

	ns.BoundsSet = s.BoundsSet
	ns.Bounds = s.Bounds

	ns.FilterSet = s.FilterSet
	ns.Filter = s.Filter.Copy().(*semantic.FunctionExpression)

	ns.DescendingSet = s.DescendingSet
	ns.Descending = s.Descending

	ns.LimitSet = s.LimitSet
	ns.PointsLimit = s.PointsLimit
	ns.SeriesLimit = s.SeriesLimit
	ns.SeriesOffset = s.SeriesOffset

	ns.WindowSet = s.WindowSet
	ns.Window = s.Window

	ns.GroupingSet = s.GroupingSet
	ns.OrderByTime = s.OrderByTime
	ns.GroupMode = s.GroupMode
	ns.GroupKeys = s.GroupKeys

	ns.AggregateSet = s.AggregateSet
	ns.AggregateMethod = s.AggregateMethod

	return ns
}

// TimeBounds implements plan.BoundsAwareProcedureSpec
func (s *FromProcedureSpec) TimeBounds(predecessorBounds *plan.Bounds) *plan.Bounds {
	if s.BoundsSet {
		bounds := &plan.Bounds{
			Start: values.ConvertTime(s.Bounds.Start.Time(s.Bounds.Now)),
			Stop:  values.ConvertTime(s.Bounds.Stop.Time(s.Bounds.Now)),
		}
		return bounds
	}
	return nil
}

func (s FromProcedureSpec) PostPhysicalValidate(id plan.NodeID) error {
	if !s.BoundsSet || (s.Bounds.Start.IsZero() && s.Bounds.Stop.IsZero()) {
		return fmt.Errorf(`result '%s' is unbounded. Add a 'range' call to bound the query`, id)
	}

	return nil
}

// MergeFromRangeRule pushes a `range` into a `from`
type MergeFromRangeRule struct{}

// Name returns the name of the rule
func (rule MergeFromRangeRule) Name() string {
	return "MergeFromRangeRule"
}

// Pattern returns the pattern that matches `from -> range`
func (rule MergeFromRangeRule) Pattern() plan.Pattern {
	return plan.Pat(transformations.RangeKind, plan.Pat(FromKind))
}

// Rewrite attempts to rewrite a `from -> range` into a `FromRange`
func (rule MergeFromRangeRule) Rewrite(node plan.PlanNode) (plan.PlanNode, bool, error) {
	from := node.Predecessors()[0]
	fromSpec := from.ProcedureSpec().(*FromProcedureSpec)
	rangeSpec := node.ProcedureSpec().(*transformations.RangeProcedureSpec)
	fromRange := fromSpec.Copy().(*FromProcedureSpec)

	// Set new bounds to `range` bounds initially
	fromRange.Bounds = rangeSpec.Bounds

	var (
		now   = rangeSpec.Bounds.Now
		start = rangeSpec.Bounds.Start
		stop  = rangeSpec.Bounds.Stop
	)

	bounds := &plan.Bounds{
		Start: values.ConvertTime(start.Time(now)),
		Stop:  values.ConvertTime(stop.Time(now)),
	}

	// Intersect bounds if `from` already bounded
	if fromSpec.BoundsSet {
		now = fromSpec.Bounds.Now
		start = fromSpec.Bounds.Start
		stop = fromSpec.Bounds.Stop

		fromBounds := &plan.Bounds{
			Start: values.ConvertTime(start.Time(now)),
			Stop:  values.ConvertTime(stop.Time(now)),
		}

		bounds = bounds.Intersect(fromBounds)
		fromRange.Bounds = flux.Bounds{
			Start: flux.Time{Absolute: bounds.Start.Time()},
			Stop:  flux.Time{Absolute: bounds.Stop.Time()},
		}
	}

	fromRange.BoundsSet = true

	// Finally merge nodes into single operation
	merged, err := plan.MergePhysicalPlanNodes(node, from, fromRange)
	if err != nil {
		return nil, false, err
	}

	return merged, true, nil
}

// MergeFromFilterRule is a rule that pushes filters into from procedures to be evaluated in the storage layer.
// TODO: Code that analyzes predicates should be put in platform, or anywhere sources are actually created.
// This is so we can tailor push down logic to actual capabilities of storage (whether InfluxDB or some other source).
// Also this rule is likely to be replaced by a more generic rule when we have a better
// framework for pushing filters, etc into sources.
type MergeFromFilterRule struct {
}

func (MergeFromFilterRule) Name() string {
	return "MergeFromFilterRule"
}

func (MergeFromFilterRule) Pattern() plan.Pattern {
	return plan.Pat(transformations.FilterKind, plan.Pat(FromKind))
}

func (MergeFromFilterRule) Rewrite(filterNode plan.PlanNode) (plan.PlanNode, bool, error) {
	filterSpec := filterNode.ProcedureSpec().(*transformations.FilterProcedureSpec)
	fromNode := filterNode.Predecessors()[0]
	fromSpec := fromNode.ProcedureSpec().(*FromProcedureSpec)

	if fromSpec.AggregateSet || fromSpec.GroupingSet {
		return filterNode, false, nil
	}

	bodyExpr, ok := filterSpec.Fn.Block.Body.(semantic.Expression)
	if !ok {
		return filterNode, false, nil
	}

	if len(filterSpec.Fn.Block.Parameters.List) != 1 {
		// I would expect that type checking would catch this, but just to be safe...
		return filterNode, false, nil
	}

	paramName := filterSpec.Fn.Block.Parameters.List[0].Key.Name

	pushable, notPushable, err := semantic.PartitionPredicates(bodyExpr, func(e semantic.Expression) (bool, error) {
		return isPushableExpr(paramName, e)
	})
	if err != nil {
		return nil, false, err
	}

	if pushable == nil {
		// Nothing could be pushed down, no rewrite can happen
		return filterNode, false, nil
	}

	newFromSpec := fromSpec.Copy().(*FromProcedureSpec)
	if newFromSpec.FilterSet {
		newBody := semantic.ExprsToConjunction(newFromSpec.Filter.Block.Body.(semantic.Expression), pushable)
		newFromSpec.Filter.Block.Body = newBody
	} else {
		newFromSpec.FilterSet = true
		newFromSpec.Filter = filterSpec.Fn.Copy().(*semantic.FunctionExpression)
		newFromSpec.Filter.Block.Body = pushable
	}

	if notPushable == nil {
		// All predicates could be pushed down, so eliminate the filter
		mergedNode, err := plan.MergePhysicalPlanNodes(filterNode, fromNode, newFromSpec)
		if err != nil {
			return nil, false, err
		}
		return mergedNode, true, nil
	}

	err = fromNode.ReplaceSpec(newFromSpec)
	if err != nil {
		return nil, false, err
	}

	newFilterSpec := filterSpec.Copy().(*transformations.FilterProcedureSpec)
	newFilterSpec.Fn.Block.Body = notPushable
	err = filterNode.ReplaceSpec(newFilterSpec)
	if err != nil {
		return nil, false, err
	}

	return filterNode, true, nil
}

// isPushableExpr determines if a predicate expression can be pushed down into the storage layer.
func isPushableExpr(paramName string, expr semantic.Expression) (bool, error) {
	switch e := expr.(type) {
	case *semantic.LogicalExpression:
		b, err := isPushableExpr(paramName, e.Left)
		if err != nil {
			return false, err
		}

		if !b {
			return false, nil
		}

		return isPushableExpr(paramName, e.Right)

	case *semantic.BinaryExpression:
		if isPushablePredicate(paramName, e) {
			return true, nil
		}
	}

	return false, nil
}

func isPushablePredicate(paramName string, be *semantic.BinaryExpression) bool {
	// Manual testing seems to indicate that (at least right now) we can
	// only handle predicates of the form <fn param>.<property> <op> <literal>
	// and the literal must be on the RHS.

	if !isLiteral(be.Right) {
		return false
	}

	if isField(paramName, be.Left) && isPushableFieldOperator(be.Operator) {
		return true
	}

	if isTag(paramName, be.Left) && isPushableTagOperator(be.Operator) {
		return true
	}

	return false
}

func isLiteral(e semantic.Expression) bool {
	switch e.(type) {
	case *semantic.StringLiteral:
		return true
	case *semantic.IntegerLiteral:
		return true
	case *semantic.BooleanLiteral:
		return true
	case *semantic.FloatLiteral:
		return true
	case *semantic.RegexpLiteral:
		return true
	}

	return false
}

const fieldValueProperty = "_value"

func isTag(paramName string, e semantic.Expression) bool {
	memberExpr := validateMemberExpr(paramName, e)
	return memberExpr != nil && memberExpr.Property != fieldValueProperty
}

func isField(paramName string, e semantic.Expression) bool {
	memberExpr := validateMemberExpr(paramName, e)
	return memberExpr != nil && memberExpr.Property == fieldValueProperty
}

func validateMemberExpr(paramName string, e semantic.Expression) *semantic.MemberExpression {
	memberExpr, ok := e.(*semantic.MemberExpression)
	if !ok {
		return nil
	}

	idExpr, ok := memberExpr.Object.(*semantic.IdentifierExpression)
	if !ok {
		return nil
	}

	if idExpr.Name != paramName {
		return nil
	}

	return memberExpr
}

func isPushableTagOperator(kind ast.OperatorKind) bool {
	pushableOperators := []ast.OperatorKind{
		ast.EqualOperator,
		ast.NotEqualOperator,
		ast.RegexpMatchOperator,
		ast.NotRegexpMatchOperator,
	}

	for _, op := range pushableOperators {
		if op == kind {
			return true
		}
	}

	return false
}

func isPushableFieldOperator(kind ast.OperatorKind) bool {
	if isPushableTagOperator(kind) {
		return true
	}

	// Fields can be filtered by anything that tags can be filtered by,
	// plus range operators.

	moreOperators := []ast.OperatorKind{
		ast.LessThanEqualOperator,
		ast.LessThanOperator,
		ast.GreaterThanEqualOperator,
		ast.GreaterThanOperator,
	}

	for _, op := range moreOperators {
		if op == kind {
			return true
		}
	}

	return false
}

type FromDistinctRule struct {
}

func (FromDistinctRule) Name() string {
	return "FromDistinctRule"
}

func (FromDistinctRule) Pattern() plan.Pattern {
	return plan.Pat(transformations.DistinctKind, plan.Pat(FromKind))
}

func (FromDistinctRule) Rewrite(distinctNode plan.PlanNode) (plan.PlanNode, bool, error) {
	fromNode := distinctNode.Predecessors()[0]
	distinctSpec := distinctNode.ProcedureSpec().(*transformations.DistinctProcedureSpec)
	fromSpec := fromNode.ProcedureSpec().(*FromProcedureSpec)

	if fromSpec.LimitSet && fromSpec.PointsLimit == -1 {
		return distinctNode, false, nil
	}

	groupStar := !fromSpec.GroupingSet && distinctSpec.Column != execute.DefaultValueColLabel && distinctSpec.Column != execute.DefaultTimeColLabel
	groupByColumn := fromSpec.GroupingSet && len(fromSpec.GroupKeys) > 0 &&
		((fromSpec.GroupMode == functions.GroupModeBy && execute.ContainsStr(fromSpec.GroupKeys, distinctSpec.Column)) ||
			(fromSpec.GroupMode == functions.GroupModeExcept && !execute.ContainsStr(fromSpec.GroupKeys, distinctSpec.Column)))
	if groupStar || groupByColumn {
		newFromSpec := fromSpec.Copy().(*FromProcedureSpec)
		newFromSpec.LimitSet = true
		newFromSpec.PointsLimit = -1
		if err := fromNode.ReplaceSpec(newFromSpec); err != nil {
			return nil, false, err
		}
		return distinctNode, true, nil
	}

	return distinctNode, false, nil
}

type MergeFromGroupRule struct {
}

func (MergeFromGroupRule) Name() string {
	return "MergeFromGroupRule"
}

func (MergeFromGroupRule) Pattern() plan.Pattern {
	return plan.Pat(transformations.GroupKind, plan.Pat(FromKind))
}

func (MergeFromGroupRule) Rewrite(groupNode plan.PlanNode) (plan.PlanNode, bool, error) {
	fromNode := groupNode.Predecessors()[0]
	groupSpec := groupNode.ProcedureSpec().(*transformations.GroupProcedureSpec)
	fromSpec := fromNode.ProcedureSpec().(*FromProcedureSpec)

	if !fromSpec.GroupingSet && !fromSpec.LimitSet {
		newFromSpec := fromSpec.Copy().(*FromProcedureSpec)
		newFromSpec.GroupingSet = true
		newFromSpec.GroupMode = groupSpec.GroupMode
		newFromSpec.GroupKeys = groupSpec.GroupKeys
		merged, err := plan.MergePhysicalPlanNodes(groupNode, fromNode, newFromSpec)
		if err != nil {
			return nil, false, err
		}
		return merged, true, nil
	}

	return groupNode, false, nil
}
