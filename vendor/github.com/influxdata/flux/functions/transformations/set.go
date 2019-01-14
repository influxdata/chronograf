package transformations

import (
	"fmt"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/semantic"
	"github.com/influxdata/flux/values"
)

const SetKind = "set"

type SetOpSpec struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

func init() {
	setSignature := flux.FunctionSignature(
		map[string]semantic.PolyType{
			"key":   semantic.String,
			"value": semantic.String,
		},
		[]string{"key", "value"},
	)

	flux.RegisterFunction(SetKind, createSetOpSpec, setSignature)
	flux.RegisterOpSpec(SetKind, newSetOp)
	plan.RegisterProcedureSpec(SetKind, newSetProcedure, SetKind)
	execute.RegisterTransformation(SetKind, createSetTransformation)
}

func createSetOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	spec := new(SetOpSpec)
	key, err := args.GetRequiredString("key")
	if err != nil {
		return nil, err
	}
	spec.Key = key

	value, err := args.GetRequiredString("value")
	if err != nil {
		return nil, err
	}
	spec.Value = value

	return spec, nil
}

func newSetOp() flux.OperationSpec {
	return new(SetOpSpec)
}

func (s *SetOpSpec) Kind() flux.OperationKind {
	return SetKind
}

type SetProcedureSpec struct {
	plan.DefaultCost
	Key, Value string
}

func newSetProcedure(qs flux.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	s, ok := qs.(*SetOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}
	p := &SetProcedureSpec{
		Key:   s.Key,
		Value: s.Value,
	}
	return p, nil
}

func (s *SetProcedureSpec) Kind() plan.ProcedureKind {
	return SetKind
}
func (s *SetProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(SetProcedureSpec)
	ns.Key = s.Key
	ns.Value = s.Value
	return ns
}

func createSetTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	s, ok := spec.(*SetProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", spec)
	}
	cache := execute.NewTableBuilderCache(a.Allocator())
	d := execute.NewDataset(id, mode, cache)
	t := NewSetTransformation(d, cache, s)
	return t, d, nil
}

type setTransformation struct {
	d     execute.Dataset
	cache execute.TableBuilderCache

	key, value string
}

func NewSetTransformation(
	d execute.Dataset,
	cache execute.TableBuilderCache,
	spec *SetProcedureSpec,
) execute.Transformation {
	return &setTransformation{
		d:     d,
		cache: cache,
		key:   spec.Key,
		value: spec.Value,
	}
}

func (t *setTransformation) RetractTable(id execute.DatasetID, key flux.GroupKey) error {
	// TODO
	return nil
}

func (t *setTransformation) Process(id execute.DatasetID, tbl flux.Table) error {
	key := tbl.Key()
	if idx := execute.ColIdx(t.key, key.Cols()); idx >= 0 {
		// Update key
		cols := make([]flux.ColMeta, len(key.Cols()))
		vs := make([]values.Value, len(key.Cols()))
		for j, c := range key.Cols() {
			cols[j] = c
			if j == idx {
				vs[j] = values.NewString(t.value)
			} else {
				vs[j] = key.Value(j)
			}
		}
		key = execute.NewGroupKey(cols, vs)
	}
	builder, created := t.cache.TableBuilder(key)
	if created {
		err := execute.AddTableCols(tbl, builder)
		if err != nil {
			return err
		}
		if !execute.HasCol(t.key, builder.Cols()) {
			if _, err = builder.AddCol(flux.ColMeta{
				Label: t.key,
				Type:  flux.TString,
			}); err != nil {
				return err
			}
		}
	}
	idx := execute.ColIdx(t.key, builder.Cols())
	return tbl.DoArrow(func(cr flux.ArrowColReader) error {
		for j := range cr.Cols() {
			if j == idx {
				continue
			}
			if err := execute.AppendColArrow(j, j, cr, builder); err != nil {
				return err
			}
		}
		// Set new value
		l := cr.Len()
		for i := 0; i < l; i++ {
			if err := builder.AppendString(idx, t.value); err != nil {
				return err
			}
		}
		return nil
	})
}

func (t *setTransformation) UpdateWatermark(id execute.DatasetID, mark execute.Time) error {
	return t.d.UpdateWatermark(mark)
}
func (t *setTransformation) UpdateProcessingTime(id execute.DatasetID, pt execute.Time) error {
	return t.d.UpdateProcessingTime(pt)
}
func (t *setTransformation) Finish(id execute.DatasetID, err error) {
	t.d.Finish(err)
}
