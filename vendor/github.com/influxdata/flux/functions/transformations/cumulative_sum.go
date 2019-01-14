package transformations

import (
	"fmt"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/interpreter"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/semantic"
)

const CumulativeSumKind = "cumulativeSum"

type CumulativeSumOpSpec struct {
	Columns []string `json:"columns"`
}

func init() {
	cumulativeSumSignature := flux.FunctionSignature(
		map[string]semantic.PolyType{
			"columns": semantic.NewArrayPolyType(semantic.String),
		},
		nil,
	)

	flux.RegisterFunction(CumulativeSumKind, createCumulativeSumOpSpec, cumulativeSumSignature)
	flux.RegisterOpSpec(CumulativeSumKind, newCumulativeSumOp)
	plan.RegisterProcedureSpec(CumulativeSumKind, newCumulativeSumProcedure, CumulativeSumKind)
	execute.RegisterTransformation(CumulativeSumKind, createCumulativeSumTransformation)
}

func createCumulativeSumOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	spec := new(CumulativeSumOpSpec)
	if cols, ok, err := args.GetArray("columns", semantic.String); err != nil {
		return nil, err
	} else if ok {
		columns, err := interpreter.ToStringArray(cols)
		if err != nil {
			return nil, err
		}
		spec.Columns = columns
	} else {
		spec.Columns = []string{execute.DefaultValueColLabel}
	}
	return spec, nil
}

func newCumulativeSumOp() flux.OperationSpec {
	return new(CumulativeSumOpSpec)
}

func (s *CumulativeSumOpSpec) Kind() flux.OperationKind {
	return CumulativeSumKind
}

type CumulativeSumProcedureSpec struct {
	plan.DefaultCost
	Columns []string
}

func newCumulativeSumProcedure(qs flux.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*CumulativeSumOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}

	return &CumulativeSumProcedureSpec{
		Columns: spec.Columns,
	}, nil
}

func (s *CumulativeSumProcedureSpec) Kind() plan.ProcedureKind {
	return CumulativeSumKind
}
func (s *CumulativeSumProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(CumulativeSumProcedureSpec)
	*ns = *s
	if s.Columns != nil {
		ns.Columns = make([]string, len(s.Columns))
		copy(ns.Columns, s.Columns)
	}
	return ns
}

func createCumulativeSumTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	s, ok := spec.(*CumulativeSumProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", spec)
	}
	cache := execute.NewTableBuilderCache(a.Allocator())
	d := execute.NewDataset(id, mode, cache)
	t := NewCumulativeSumTransformation(d, cache, s)
	return t, d, nil
}

type cumulativeSumTransformation struct {
	d     execute.Dataset
	cache execute.TableBuilderCache
	spec  CumulativeSumProcedureSpec
}

func NewCumulativeSumTransformation(d execute.Dataset, cache execute.TableBuilderCache, spec *CumulativeSumProcedureSpec) *cumulativeSumTransformation {
	return &cumulativeSumTransformation{
		d:     d,
		cache: cache,
		spec:  *spec,
	}
}

func (t *cumulativeSumTransformation) RetractTable(id execute.DatasetID, key flux.GroupKey) error {
	return t.d.RetractTable(key)
}

func (t *cumulativeSumTransformation) Process(id execute.DatasetID, tbl flux.Table) error {
	builder, created := t.cache.TableBuilder(tbl.Key())
	if !created {
		return fmt.Errorf("cumulative sum found duplicate table with key: %v", tbl.Key())
	}
	if err := execute.AddTableCols(tbl, builder); err != nil {
		return err
	}

	cols := tbl.Cols()
	sumers := make([]*cumulativeSum, len(cols))
	for j, c := range cols {
		for _, label := range t.spec.Columns {
			if c.Label == label {
				sumers[j] = &cumulativeSum{}
				break
			}
		}
	}
	return tbl.DoArrow(func(cr flux.ArrowColReader) error {
		l := cr.Len()
		for j, c := range cols {
			switch c.Type {
			case flux.TBool:
				for i := 0; i < l; i++ {
					if err := builder.AppendBool(j, cr.Bools(j).Value(i)); err != nil {
						return err
					}
				}
			case flux.TInt:
				if sumers[j] != nil {
					for i := 0; i < l; i++ {
						if err := builder.AppendInt(j, sumers[j].sumInt(cr.Ints(j).Value(i))); err != nil {
							return err
						}
					}
				} else {
					if err := builder.AppendInts(j, cr.Ints(j).Int64Values()); err != nil {
						return err
					}
				}
			case flux.TUInt:
				if sumers[j] != nil {
					for i := 0; i < l; i++ {
						if err := builder.AppendUInt(j, sumers[j].sumUInt(cr.UInts(j).Value(i))); err != nil {
							return err
						}
					}
				} else {
					if err := builder.AppendUInts(j, cr.UInts(j).Uint64Values()); err != nil {
						return err
					}
				}
			case flux.TFloat:
				if sumers[j] != nil {
					for i := 0; i < l; i++ {
						if err := builder.AppendFloat(j, sumers[j].sumFloat(cr.Floats(j).Value(i))); err != nil {
							return err
						}
					}
				} else {
					if err := builder.AppendFloats(j, cr.Floats(j).Float64Values()); err != nil {
						return err
					}
				}
			case flux.TString:
				for i := 0; i < l; i++ {
					if err := builder.AppendString(j, cr.Strings(j).ValueString(i)); err != nil {
						return err
					}
				}
			case flux.TTime:
				for i := 0; i < l; i++ {
					if err := builder.AppendTime(j, execute.Time(cr.Times(j).Value(i))); err != nil {
						return err
					}
				}
			}
		}
		return nil
	})
}

func (t *cumulativeSumTransformation) UpdateWatermark(id execute.DatasetID, mark execute.Time) error {
	return t.d.UpdateWatermark(mark)
}
func (t *cumulativeSumTransformation) UpdateProcessingTime(id execute.DatasetID, pt execute.Time) error {
	return t.d.UpdateProcessingTime(pt)
}
func (t *cumulativeSumTransformation) Finish(id execute.DatasetID, err error) {
	t.d.Finish(err)
}

type cumulativeSum struct {
	intVal   int64
	uintVal  uint64
	floatVal float64
}

func (s *cumulativeSum) sumInt(val int64) int64 {
	s.intVal += val
	return s.intVal
}

func (s *cumulativeSum) sumUInt(val uint64) uint64 {
	s.uintVal += val
	return s.uintVal
}

func (s *cumulativeSum) sumFloat(val float64) float64 {
	s.floatVal += val
	return s.floatVal
}
