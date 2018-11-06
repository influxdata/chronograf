package transformations

import (
	"errors"
	"math"
	"sync"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/semantic"
	"github.com/influxdata/flux/values"
)

const UnionKind = "union"

type UnionOpSpec struct {
}

func (s *UnionOpSpec) Kind() flux.OperationKind {
	return UnionKind
}

func init() {
	unionSignature := semantic.FunctionPolySignature{
		Parameters: map[string]semantic.PolyType{
			"tables": semantic.NewArrayPolyType(flux.TableObjectType),
		},
		Required: semantic.LabelSet{"tables"},
		Return:   flux.TableObjectType,
	}

	flux.RegisterFunction(UnionKind, createUnionOpSpec, unionSignature)
	flux.RegisterOpSpec(UnionKind, newUnionOp)
	plan.RegisterProcedureSpec(UnionKind, newUnionProcedure, UnionKind)
	execute.RegisterTransformation(UnionKind, createUnionTransformation)
}

func createUnionOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	tables, err := args.GetRequiredArray("tables", semantic.Object)
	if err != nil {
		return nil, err
	}

	if tables.Len() < 2 {
		return nil, errors.New("union must have at least two streams as input")
	}

	err = nil
	tables.Range(func(i int, parent values.Value) {
		p, ok := parent.(*flux.TableObject)
		if !ok {
			err = errors.New("input to union is not a table object")
		}

		a.AddParent(p)
	})

	if err != nil {
		return nil, err
	}

	return &UnionOpSpec{}, nil
}

func newUnionOp() flux.OperationSpec {
	return new(UnionOpSpec)
}

type UnionProcedureSpec struct {
	plan.DefaultCost
}

func (s *UnionProcedureSpec) Kind() plan.ProcedureKind {
	return UnionKind
}

func (s *UnionProcedureSpec) Copy() plan.ProcedureSpec {
	return &UnionProcedureSpec{}
}

func newUnionProcedure(qs flux.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	return &UnionProcedureSpec{}, nil
}

type unionTransformation struct {
	mu sync.Mutex

	parentState map[execute.DatasetID]*unionParentState

	d     execute.Dataset
	cache execute.TableBuilderCache
}

type unionParentState struct {
	mark       execute.Time
	processing execute.Time
	finished   bool
}

func createUnionTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	parentState := make(map[execute.DatasetID]*unionParentState, len(a.Parents()))
	for _, id := range a.Parents() {
		parentState[id] = new(unionParentState)
	}

	cache := execute.NewTableBuilderCache(a.Allocator())
	dataset := execute.NewDataset(id, mode, cache)

	transform := &unionTransformation{
		parentState: parentState,
		d:           dataset,
		cache:       cache,
	}

	return transform, dataset, nil
}

func (t *unionTransformation) RetractTable(id execute.DatasetID, key flux.GroupKey) error {
	panic("not implemented")
}

func (t *unionTransformation) Process(id execute.DatasetID, tbl flux.Table) error {
	t.mu.Lock()
	defer t.mu.Unlock()
	var colMap = make([]int, 0, len(tbl.Cols()))
	var err error
	builder, _ := t.cache.TableBuilder(tbl.Key())

	colMap, err = execute.AddNewTableCols(tbl, builder, colMap)
	if err != nil {
		return err
	}

	if err := execute.AppendMappedTable(tbl, builder, colMap); err != nil {
		return err
	}

	return nil
}

func (t *unionTransformation) UpdateWatermark(id execute.DatasetID, mark execute.Time) error {
	t.mu.Lock()
	defer t.mu.Unlock()

	t.parentState[id].mark = mark

	min := execute.Time(math.MaxInt64)
	for _, state := range t.parentState {
		if state.mark < min {
			min = state.mark
		}
	}

	return t.d.UpdateWatermark(min)
}

func (t *unionTransformation) UpdateProcessingTime(id execute.DatasetID, pt execute.Time) error {
	t.mu.Lock()
	defer t.mu.Unlock()

	t.parentState[id].processing = pt

	min := execute.Time(math.MaxInt64)
	for _, state := range t.parentState {
		if state.processing < min {
			min = state.processing
		}
	}

	return t.d.UpdateProcessingTime(min)
}

func (t *unionTransformation) Finish(id execute.DatasetID, err error) {
	t.mu.Lock()
	defer t.mu.Unlock()

	t.parentState[id].finished = true

	if err != nil {
		t.d.Finish(err)
	}

	finished := true
	for _, state := range t.parentState {
		finished = finished && state.finished
	}

	if finished {
		t.d.Finish(nil)
	}
}
