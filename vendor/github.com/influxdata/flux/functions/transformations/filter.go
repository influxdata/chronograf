package transformations

import (
	"fmt"
	"log"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/interpreter"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/semantic"
)

const FilterKind = "filter"

type FilterOpSpec struct {
	Fn *semantic.FunctionExpression `json:"fn"`
}

func init() {
	filterSignature := flux.FunctionSignature(
		map[string]semantic.PolyType{
			"fn": semantic.NewFunctionPolyType(semantic.FunctionPolySignature{
				Parameters: map[string]semantic.PolyType{
					"r": semantic.Tvar(1),
				},
				Required: semantic.LabelSet{"r"},
				Return:   semantic.Bool,
			}),
		},
		[]string{"fn"},
	)

	flux.RegisterFunction(FilterKind, createFilterOpSpec, filterSignature)
	flux.RegisterOpSpec(FilterKind, newFilterOp)
	plan.RegisterProcedureSpec(FilterKind, newFilterProcedure, FilterKind)
	execute.RegisterTransformation(FilterKind, createFilterTransformation)
}

func createFilterOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}
	f, err := args.GetRequiredFunction("fn")
	if err != nil {
		return nil, err
	}

	fn, err := interpreter.ResolveFunction(f)
	if err != nil {
		return nil, err
	}

	return &FilterOpSpec{
		Fn: fn,
	}, nil
}
func newFilterOp() flux.OperationSpec {
	return new(FilterOpSpec)
}

func (s *FilterOpSpec) Kind() flux.OperationKind {
	return FilterKind
}

type FilterProcedureSpec struct {
	plan.DefaultCost
	Fn *semantic.FunctionExpression
}

func newFilterProcedure(qs flux.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*FilterOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}

	return &FilterProcedureSpec{
		Fn: spec.Fn,
	}, nil
}

func (s *FilterProcedureSpec) Kind() plan.ProcedureKind {
	return FilterKind
}
func (s *FilterProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(FilterProcedureSpec)
	ns.Fn = s.Fn.Copy().(*semantic.FunctionExpression)
	return ns
}

func createFilterTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	s, ok := spec.(*FilterProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", spec)
	}
	cache := execute.NewTableBuilderCache(a.Allocator())
	d := execute.NewDataset(id, mode, cache)
	t, err := NewFilterTransformation(d, cache, s)
	if err != nil {
		return nil, nil, err
	}
	return t, d, nil
}

type filterTransformation struct {
	d     execute.Dataset
	cache execute.TableBuilderCache

	fn *execute.RowPredicateFn
}

func NewFilterTransformation(d execute.Dataset, cache execute.TableBuilderCache, spec *FilterProcedureSpec) (*filterTransformation, error) {
	fn, err := execute.NewRowPredicateFn(spec.Fn)
	if err != nil {
		return nil, err
	}

	return &filterTransformation{
		d:     d,
		cache: cache,
		fn:    fn,
	}, nil
}

func (t *filterTransformation) RetractTable(id execute.DatasetID, key flux.GroupKey) error {
	return t.d.RetractTable(key)
}

func (t *filterTransformation) Process(id execute.DatasetID, tbl flux.Table) error {
	builder, created := t.cache.TableBuilder(tbl.Key())
	if !created {
		return fmt.Errorf("filter found duplicate table with key: %v", tbl.Key())
	}
	if err := execute.AddTableCols(tbl, builder); err != nil {
		return err
	}

	// Prepare the function for the column types.
	cols := tbl.Cols()
	if err := t.fn.Prepare(cols); err != nil {
		// TODO(nathanielc): Should we not fail the query for failed compilation?
		return err
	}

	// Append only matching rows to table
	return tbl.DoArrow(func(cr flux.ArrowColReader) error {
		l := cr.Len()
		for i := 0; i < l; i++ {
			if pass, err := t.fn.Eval(i, cr); err != nil {
				log.Printf("failed to evaluate filter expression: %v", err)
				continue
			} else if !pass {
				// No match, skipping
				continue
			}
			if err := execute.AppendRecordArrow(i, cr, builder); err != nil {
				return err
			}
		}
		return nil
	})
}

func (t *filterTransformation) UpdateWatermark(id execute.DatasetID, mark execute.Time) error {
	return t.d.UpdateWatermark(mark)
}
func (t *filterTransformation) UpdateProcessingTime(id execute.DatasetID, pt execute.Time) error {
	return t.d.UpdateProcessingTime(pt)
}
func (t *filterTransformation) Finish(id execute.DatasetID, err error) {
	t.d.Finish(err)
}
