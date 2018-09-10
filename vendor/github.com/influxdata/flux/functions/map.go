package functions

import (
	"fmt"
	"log"
	"sort"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/interpreter"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/semantic"
	"github.com/influxdata/flux/values"
)

const MapKind = "map"

type MapOpSpec struct {
	Fn       *semantic.FunctionExpression `json:"fn"`
	MergeKey bool                         `json:"mergeKey"`
}

var mapSignature = flux.DefaultFunctionSignature()

func init() {
	mapSignature.Params["fn"] = semantic.Function
	mapSignature.Params["mergeKey"] = semantic.Bool

	flux.RegisterFunction(MapKind, createMapOpSpec, mapSignature)
	flux.RegisterOpSpec(MapKind, newMapOp)
	plan.RegisterProcedureSpec(MapKind, newMapProcedure, MapKind)
	execute.RegisterTransformation(MapKind, createMapTransformation)
}

func createMapOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	spec := new(MapOpSpec)

	if f, err := args.GetRequiredFunction("fn"); err != nil {
		return nil, err
	} else {
		fn, err := interpreter.ResolveFunction(f)
		if err != nil {
			return nil, err
		}
		spec.Fn = fn
	}

	if m, ok, err := args.GetBool("mergeKey"); err != nil {
		return nil, err
	} else if ok {
		spec.MergeKey = m
	} else {
		spec.MergeKey = true
	}
	return spec, nil
}

func newMapOp() flux.OperationSpec {
	return new(MapOpSpec)
}

func (s *MapOpSpec) Kind() flux.OperationKind {
	return MapKind
}

type MapProcedureSpec struct {
	Fn       *semantic.FunctionExpression
	MergeKey bool
}

func newMapProcedure(qs flux.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*MapOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}

	return &MapProcedureSpec{
		Fn:       spec.Fn,
		MergeKey: spec.MergeKey,
	}, nil
}

func (s *MapProcedureSpec) Kind() plan.ProcedureKind {
	return MapKind
}
func (s *MapProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(MapProcedureSpec)
	*ns = *s
	ns.Fn = s.Fn.Copy().(*semantic.FunctionExpression)
	return ns
}

func createMapTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	s, ok := spec.(*MapProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", spec)
	}
	cache := execute.NewTableBuilderCache(a.Allocator())
	d := execute.NewDataset(id, mode, cache)
	t, err := NewMapTransformation(d, cache, s)
	if err != nil {
		return nil, nil, err
	}
	return t, d, nil
}

type mapTransformation struct {
	d     execute.Dataset
	cache execute.TableBuilderCache

	fn       *execute.RowMapFn
	mergeKey bool
}

func NewMapTransformation(d execute.Dataset, cache execute.TableBuilderCache, spec *MapProcedureSpec) (*mapTransformation, error) {
	fn, err := execute.NewRowMapFn(spec.Fn)
	if err != nil {
		return nil, err
	}
	return &mapTransformation{
		d:        d,
		cache:    cache,
		fn:       fn,
		mergeKey: spec.MergeKey,
	}, nil
}

func (t *mapTransformation) RetractTable(id execute.DatasetID, key flux.GroupKey) error {
	return t.d.RetractTable(key)
}

func (t *mapTransformation) Process(id execute.DatasetID, tbl flux.Table) error {
	// Prepare the functions for the column types.
	cols := tbl.Cols()
	err := t.fn.Prepare(cols)
	if err != nil {
		// TODO(nathanielc): Should we not fail the query for failed compilation?
		return err
	}
	// Determine keys return from function
	properties := t.fn.Type().Properties()
	keys := make([]string, 0, len(properties))
	for k := range properties {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	// Determine on which cols to group
	on := make(map[string]bool, len(tbl.Key().Cols()))
	for _, c := range tbl.Key().Cols() {
		on[c.Label] = t.mergeKey || execute.ContainsStr(keys, c.Label)
	}

	return tbl.Do(func(cr flux.ColReader) error {
		l := cr.Len()
		for i := 0; i < l; i++ {
			m, err := t.fn.Eval(i, cr)
			if err != nil {
				log.Printf("failed to evaluate map expression: %v", err)
				continue
			}
			key := groupKeyForObject(i, cr, m, on)
			builder, created := t.cache.TableBuilder(key)
			if created {
				if t.mergeKey {
					execute.AddTableKeyCols(tbl.Key(), builder)
				}
				// Add columns from function in sorted order
				for _, k := range keys {
					if t.mergeKey && tbl.Key().HasCol(k) {
						continue
					}
					builder.AddCol(flux.ColMeta{
						Label: k,
						Type:  execute.ConvertFromKind(properties[k].Kind()),
					})
				}
			}
			for j, c := range builder.Cols() {
				v, ok := m.Get(c.Label)
				if !ok {
					if idx := execute.ColIdx(c.Label, tbl.Key().Cols()); t.mergeKey && idx >= 0 {
						v = tbl.Key().Value(idx)
					} else {
						// This should be unreachable
						return fmt.Errorf("could not find value for column %q", c.Label)
					}
				}
				execute.AppendValue(builder, j, v)
			}
		}
		return nil
	})
}

func groupKeyForObject(i int, cr flux.ColReader, obj values.Object, on map[string]bool) flux.GroupKey {
	cols := make([]flux.ColMeta, 0, len(on))
	vs := make([]values.Value, 0, len(on))
	for j, c := range cr.Cols() {
		if !on[c.Label] {
			continue
		}
		cols = append(cols, c)
		v, ok := obj.Get(c.Label)
		if ok {
			vs = append(vs, v)
		} else {
			switch c.Type {
			case flux.TBool:
				vs = append(vs, values.NewBoolValue(cr.Bools(j)[i]))
			case flux.TInt:
				vs = append(vs, values.NewIntValue(cr.Ints(j)[i]))
			case flux.TUInt:
				vs = append(vs, values.NewUIntValue(cr.UInts(j)[i]))
			case flux.TFloat:
				vs = append(vs, values.NewFloatValue(cr.Floats(j)[i]))
			case flux.TString:
				vs = append(vs, values.NewStringValue(cr.Strings(j)[i]))
			case flux.TTime:
				vs = append(vs, values.NewTimeValue(cr.Times(j)[i]))
			}
		}
	}
	return execute.NewGroupKey(cols, vs)
}

func (t *mapTransformation) UpdateWatermark(id execute.DatasetID, mark execute.Time) error {
	return t.d.UpdateWatermark(mark)
}
func (t *mapTransformation) UpdateProcessingTime(id execute.DatasetID, pt execute.Time) error {
	return t.d.UpdateProcessingTime(pt)
}
func (t *mapTransformation) Finish(id execute.DatasetID, err error) {
	t.d.Finish(err)
}
