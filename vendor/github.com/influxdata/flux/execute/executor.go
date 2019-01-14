// Package execute contains the implementation of the execution phase in the query engine.
package execute

import (
	"context"
	"fmt"
	"runtime/debug"
	"time"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/memory"
	"github.com/influxdata/flux/plan"
	"github.com/pkg/errors"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type Executor interface {
	Execute(ctx context.Context, p *plan.PlanSpec, a *memory.Allocator) (map[string]flux.Result, error)
}

type executor struct {
	deps   Dependencies
	logger *zap.Logger
}

func NewExecutor(deps Dependencies, logger *zap.Logger) Executor {
	if logger == nil {
		logger = zap.NewNop()
	}
	e := &executor{
		deps:   deps,
		logger: logger,
	}
	return e
}

type streamContext struct {
	bounds *Bounds
}

func (ctx streamContext) Bounds() *Bounds {
	return ctx.bounds
}

type executionState struct {
	p    *plan.PlanSpec
	deps Dependencies

	alloc *memory.Allocator

	resources flux.ResourceManagement

	results map[string]flux.Result
	sources []Source

	transports []Transport

	dispatcher *poolDispatcher
	logger     *zap.Logger
}

func (e *executor) Execute(ctx context.Context, p *plan.PlanSpec, a *memory.Allocator) (map[string]flux.Result, error) {
	es, err := e.createExecutionState(ctx, p, a)
	if err != nil {
		return nil, errors.Wrap(err, "failed to initialize execute state")
	}
	es.logger = e.logger
	es.do(ctx)
	return es.results, nil
}

func validatePlan(p *plan.PlanSpec) error {
	if p.Resources.ConcurrencyQuota == 0 {
		return errors.New("plan must have a non-zero concurrency quota")
	}
	return nil
}

func (e *executor) createExecutionState(ctx context.Context, p *plan.PlanSpec, a *memory.Allocator) (*executionState, error) {
	if err := validatePlan(p); err != nil {
		return nil, errors.Wrap(err, "invalid plan")
	}
	// Set allocation limit
	a.Limit = &p.Resources.MemoryBytesQuota
	es := &executionState{
		p:         p,
		deps:      e.deps,
		alloc:     a,
		resources: p.Resources,
		results:   make(map[string]flux.Result),
		// TODO(nathanielc): Have the planner specify the dispatcher throughput
		dispatcher: newPoolDispatcher(10, e.logger),
	}
	v := &createExecutionNodeVisitor{
		ctx:   ctx,
		es:    es,
		nodes: make(map[plan.PlanNode]Node),
	}

	if err := p.BottomUpWalk(v.Visit); err != nil {
		return nil, err
	}

	return v.es, nil
}

// DefaultTriggerSpec defines the triggering that should be used for datasets
// whose parent transformation is not a windowing transformation.
var DefaultTriggerSpec = flux.AfterWatermarkTriggerSpec{}

type triggeringSpec interface {
	TriggerSpec() flux.TriggerSpec
}

// createExecutionNodeVisitor visits each node in a physical query plan
// and creates a node responsible for executing that physical operation.
type createExecutionNodeVisitor struct {
	ctx   context.Context
	es    *executionState
	nodes map[plan.PlanNode]Node
}

func skipYields(pn plan.PlanNode) plan.PlanNode {
	isYield := func(pn plan.PlanNode) bool {
		_, ok := pn.ProcedureSpec().(plan.YieldProcedureSpec)
		return ok
	}

	for isYield(pn) {
		pn = pn.Predecessors()[0]
	}

	return pn
}

func nonYieldPredecessors(pn plan.PlanNode) []plan.PlanNode {
	nodes := make([]plan.PlanNode, len(pn.Predecessors()))
	for i, pred := range pn.Predecessors() {
		nodes[i] = skipYields(pred)
	}

	return nodes
}

// Visit creates the node that will execute a particular plan node
func (v *createExecutionNodeVisitor) Visit(node plan.PlanNode) error {
	spec := node.ProcedureSpec()
	kind := spec.Kind()
	id := DatasetIDFromNodeID(node.ID())

	if yieldSpec, ok := spec.(plan.YieldProcedureSpec); ok {
		r := newResult(yieldSpec.YieldName())
		v.es.results[yieldSpec.YieldName()] = r
		v.nodes[skipYields(node)].AddTransformation(r)
		return nil
	}

	// Add explicit stream context if bounds are set on this node
	var streamContext streamContext
	if node.Bounds() != nil {
		streamContext.bounds = &Bounds{
			Start: node.Bounds().Start,
			Stop:  node.Bounds().Stop,
		}
	}

	// Build execution context
	ec := executionContext{
		ctx:           v.ctx,
		es:            v.es,
		parents:       make([]DatasetID, len(node.Predecessors())),
		streamContext: streamContext,
	}

	for i, pred := range nonYieldPredecessors(node) {
		ec.parents[i] = DatasetIDFromNodeID(pred.ID())
	}

	// If node is a leaf, create a source
	if len(node.Predecessors()) == 0 {
		createSourceFn, ok := procedureToSource[kind]

		if !ok {
			return fmt.Errorf("unsupported source kind %v", kind)
		}

		source, err := createSourceFn(spec, id, ec)

		if err != nil {
			return err
		}

		v.es.sources = append(v.es.sources, source)
		v.nodes[node] = source
	} else {

		// If node is internal, create a transformation.
		// For each predecessor, add a transport for sending data upstream.
		createTransformationFn, ok := procedureToTransformation[kind]

		if !ok {
			return fmt.Errorf("unsupported procedure %v", kind)
		}

		tr, ds, err := createTransformationFn(id, AccumulatingMode, spec, ec)

		if err != nil {
			return err
		}

		// Setup triggering
		var ts flux.TriggerSpec = DefaultTriggerSpec
		if t, ok := spec.(triggeringSpec); ok {
			ts = t.TriggerSpec()
		}
		ds.SetTriggerSpec(ts)
		v.nodes[node] = ds

		for _, p := range nonYieldPredecessors(node) {
			executionNode := v.nodes[p]
			transport := newConsecutiveTransport(v.es.dispatcher, tr)
			v.es.transports = append(v.es.transports, transport)
			executionNode.AddTransformation(transport)
		}

		if plan.HasSideEffect(spec) && len(node.Successors()) == 0 {
			name := string(node.ID())
			r := newResult(name)
			v.es.results[name] = r
			v.nodes[skipYields(node)].AddTransformation(r)
		}
	}

	return nil
}

func (es *executionState) abort(err error) {
	for _, r := range es.results {
		r.(*result).abort(err)
	}
}

func (es *executionState) do(ctx context.Context) {
	for _, src := range es.sources {
		go func(src Source) {
			// Setup panic handling on the source goroutines
			defer func() {
				if e := recover(); e != nil {
					// We had a panic, abort the entire execution.
					var err error
					switch e := e.(type) {
					case error:
						err = e
					default:
						err = fmt.Errorf("%v", e)
					}
					es.abort(fmt.Errorf("panic: %v\n%s", err, debug.Stack()))
					if entry := es.logger.Check(zapcore.InfoLevel, "Execute source panic"); entry != nil {
						entry.Stack = string(debug.Stack())
						entry.Write(zap.Error(err))
					}
				}
			}()
			src.Run(ctx)
		}(src)
	}
	es.dispatcher.Start(es.resources.ConcurrencyQuota, ctx)
	go func() {
		// Wait for all transports to finish
		for _, t := range es.transports {
			select {
			case <-t.Finished():
			case <-ctx.Done():
				es.abort(errors.New("context done"))
			case err := <-es.dispatcher.Err():
				if err != nil {
					es.abort(err)
				}
			}
		}
		// Check for any errors on the dispatcher
		err := es.dispatcher.Stop()
		if err != nil {
			es.abort(err)
		}
	}()
}

// Need a unique stream context per execution context
type executionContext struct {
	ctx           context.Context
	es            *executionState
	parents       []DatasetID
	streamContext streamContext
}

func resolveTime(qt flux.Time, now time.Time) Time {
	return Time(qt.Time(now).UnixNano())
}

func (ec executionContext) Context() context.Context {
	return ec.ctx
}

func (ec executionContext) ResolveTime(qt flux.Time) Time {
	return resolveTime(qt, ec.es.p.Now)
}

func (ec executionContext) StreamContext() StreamContext {
	return ec.streamContext
}

func (ec executionContext) Allocator() *memory.Allocator {
	return ec.es.alloc
}

func (ec executionContext) Parents() []DatasetID {
	return ec.parents
}

func (ec executionContext) Dependencies() Dependencies {
	return ec.es.deps
}
