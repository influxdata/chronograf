package transformations

import (
	"errors"
	"fmt"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/interpreter"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/semantic"
)

const KeyValuesKind = "keyValues"

type KeyValuesOpSpec struct {
	KeyColumns  []string                     `json:"keyColumns"`
	PredicateFn *semantic.FunctionExpression `json:"fn"`
}

func init() {
	keyValuesSignature := flux.FunctionSignature(
		map[string]semantic.PolyType{
			"keyColumns": semantic.NewArrayPolyType(semantic.String),
			"fn":         semantic.Function,
		},
		nil,
	)

	flux.RegisterFunction(KeyValuesKind, createKeyValuesOpSpec, keyValuesSignature)
	flux.RegisterOpSpec(KeyValuesKind, newKeyValuesOp)
	plan.RegisterProcedureSpec(KeyValuesKind, newKeyValuesProcedure, KeyValuesKind)
	execute.RegisterTransformation(KeyValuesKind, createKeyValuesTransformation)
}

func createKeyValuesOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	spec := new(KeyValuesOpSpec)

	if c, ok, err := args.GetArray("keyColumns", semantic.String); err != nil {
		return nil, err
	} else if ok {
		spec.KeyColumns, err = interpreter.ToStringArray(c)
		if err != nil {
			return nil, err
		}
	}

	if f, ok, err := args.GetFunction("fn"); err != nil {
		return nil, err
	} else if ok {
		fn, err := interpreter.ResolveFunction(f)
		if err != nil {
			return nil, err
		}
		spec.PredicateFn = fn
	}

	if spec.KeyColumns == nil && spec.PredicateFn == nil {
		return nil, errors.New("neither column list nor predicate function provided")
	}

	if spec.KeyColumns != nil && spec.PredicateFn != nil {
		return nil, errors.New("must provide exactly one of keyColumns list or predicate function")
	}

	return spec, nil
}

func newKeyValuesOp() flux.OperationSpec {
	return new(KeyValuesOpSpec)
}

func (s *KeyValuesOpSpec) Kind() flux.OperationKind {
	return KeyValuesKind
}

type KeyValuesProcedureSpec struct {
	plan.DefaultCost
	KeyColumns []string                     `json:"keyColumns"`
	Predicate  *semantic.FunctionExpression `json:"fn"`
}

func newKeyValuesProcedure(qs flux.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*KeyValuesOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}

	return &KeyValuesProcedureSpec{
		KeyColumns: spec.KeyColumns,
		Predicate:  spec.PredicateFn,
	}, nil
}

func (s *KeyValuesProcedureSpec) Kind() plan.ProcedureKind {
	return KeyValuesKind
}

func (s *KeyValuesProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(KeyValuesProcedureSpec)
	ns.KeyColumns = make([]string, len(s.KeyColumns))
	copy(ns.KeyColumns, s.KeyColumns)
	ns.Predicate = s.Predicate.Copy().(*semantic.FunctionExpression)
	return ns
}

type keyValuesTransformation struct {
	d        execute.Dataset
	cache    execute.TableBuilderCache
	spec     *KeyValuesProcedureSpec
	distinct bool
}

func createKeyValuesTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	s, ok := spec.(*KeyValuesProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", spec)
	}
	cache := execute.NewTableBuilderCache(a.Allocator())
	d := execute.NewDataset(id, mode, cache)
	t := NewKeyValuesTransformation(d, cache, s)
	return t, d, nil
}

func NewKeyValuesTransformation(d execute.Dataset, cache execute.TableBuilderCache, spec *KeyValuesProcedureSpec) *keyValuesTransformation {
	return &keyValuesTransformation{
		d:        d,
		cache:    cache,
		spec:     spec,
		distinct: true,
	}
}

func (t *keyValuesTransformation) RetractTable(id execute.DatasetID, key flux.GroupKey) error {
	return t.d.RetractTable(key)
}

func (t *keyValuesTransformation) Process(id execute.DatasetID, tbl flux.Table) error {
	builder, created := t.cache.TableBuilder(tbl.Key())
	if !created {
		return fmt.Errorf("distinct found duplicate table with key: %v", tbl.Key())
	}

	// TODO: use fn to populate t.spec.keyColumns

	cols := tbl.Cols()
	i := 0
	keyColIndex := -1
	for keyColIndex < 0 && i < len(t.spec.KeyColumns) {
		keyColIndex = execute.ColIdx(t.spec.KeyColumns[i], cols)
		i++
	}
	if keyColIndex < 1 {
		columnNames := make([]string, len(cols))
		for i, column := range cols {
			columnNames[i] = column.Label
		}
		return fmt.Errorf("received table with columns %v not having key columns %v", columnNames, t.spec.KeyColumns)
	}

	keyColIndices := make([]int, len(t.spec.KeyColumns))
	keyColIndices[i-1] = keyColIndex
	keyColType := cols[keyColIndex].Type
	for j, v := range t.spec.KeyColumns[i:] {
		keyColIndex = execute.ColIdx(v, cols)
		keyColIndices[i+j] = keyColIndex
		if keyColIndex < 0 {
			continue
		}
		if cols[keyColIndex].Type != keyColType {
			return errors.New("keyColumns must all be the same type")
		}
	}

	err := execute.AddTableKeyCols(tbl.Key(), builder)
	if err != nil {
		return err
	}
	keyColIdx, err := builder.AddCol(flux.ColMeta{
		Label: "_key",
		Type:  flux.TString,
	})
	if err != nil {
		return err
	}
	valueColIdx, err := builder.AddCol(flux.ColMeta{
		Label: execute.DefaultValueColLabel,
		Type:  keyColType,
	})
	if err != nil {
		return err
	}

	var (
		boolDistinct   map[bool]bool
		intDistinct    map[int64]bool
		uintDistinct   map[uint64]bool
		floatDistinct  map[float64]bool
		stringDistinct map[string]bool
		timeDistinct   map[execute.Time]bool
	)

	// TODO(adam): implement planner logic that will push down a matching call to distinct() into this call, setting t.distinct to true
	if t.distinct {
		switch keyColType {
		case flux.TBool:
			boolDistinct = make(map[bool]bool)
		case flux.TInt:
			intDistinct = make(map[int64]bool)
		case flux.TUInt:
			uintDistinct = make(map[uint64]bool)
		case flux.TFloat:
			floatDistinct = make(map[float64]bool)
		case flux.TString:
			stringDistinct = make(map[string]bool)
		case flux.TTime:
			timeDistinct = make(map[execute.Time]bool)
		}
	}

	return tbl.DoArrow(func(cr flux.ArrowColReader) error {
		l := cr.Len()
		for i := 0; i < l; i++ {
			// Check distinct
			for j, rowIdx := range keyColIndices {
				if rowIdx < 0 {
					continue
				}
				switch keyColType {
				case flux.TBool:
					v := cr.Bools(rowIdx).Value(i)
					if t.distinct {
						if boolDistinct[v] {
							continue
						}
						boolDistinct[v] = true
					}
					if err := builder.AppendString(keyColIdx, t.spec.KeyColumns[j]); err != nil {
						return err
					}
					if err := builder.AppendBool(valueColIdx, v); err != nil {
						return err
					}
				case flux.TInt:
					v := cr.Ints(rowIdx).Value(i)
					if t.distinct {
						if intDistinct[v] {
							continue
						}
						intDistinct[v] = true
					}
					if err := builder.AppendString(keyColIdx, t.spec.KeyColumns[j]); err != nil {
						return err
					}
					if err := builder.AppendInt(valueColIdx, v); err != nil {
						return err
					}
				case flux.TUInt:
					v := cr.UInts(rowIdx).Value(i)
					if t.distinct {
						if uintDistinct[v] {
							continue
						}
						uintDistinct[v] = true
					}
					if err := builder.AppendString(keyColIdx, t.spec.KeyColumns[j]); err != nil {
						return err
					}
					if err := builder.AppendUInt(valueColIdx, v); err != nil {
						return err
					}
				case flux.TFloat:
					v := cr.Floats(rowIdx).Value(i)
					if t.distinct {
						if floatDistinct[v] {
							continue
						}
						floatDistinct[v] = true
					}
					if err := builder.AppendString(keyColIdx, t.spec.KeyColumns[j]); err != nil {
						return err
					}
					if err := builder.AppendFloat(valueColIdx, v); err != nil {
						return err
					}
				case flux.TString:
					v := cr.Strings(rowIdx).ValueString(i)
					if t.distinct {
						if stringDistinct[v] {
							continue
						}
						stringDistinct[v] = true
					}
					if err := builder.AppendString(keyColIdx, t.spec.KeyColumns[j]); err != nil {
						return err
					}
					if err := builder.AppendString(valueColIdx, v); err != nil {
						return err
					}
				case flux.TTime:
					v := execute.Time(cr.Times(rowIdx).Value(i))
					if t.distinct {
						if timeDistinct[v] {
							continue
						}
						timeDistinct[v] = true
					}
					if err := builder.AppendString(keyColIdx, t.spec.KeyColumns[j]); err != nil {
						return err
					}
					if err := builder.AppendTime(valueColIdx, v); err != nil {
						return err
					}
				}
				if err := execute.AppendKeyValues(tbl.Key(), builder); err != nil {
					return err
				}
			}
		}
		return nil
	})
}

func (t *keyValuesTransformation) UpdateWatermark(id execute.DatasetID, mark execute.Time) error {
	return t.d.UpdateWatermark(mark)
}
func (t *keyValuesTransformation) UpdateProcessingTime(id execute.DatasetID, pt execute.Time) error {
	return t.d.UpdateProcessingTime(pt)
}
func (t *keyValuesTransformation) Finish(id execute.DatasetID, err error) {
	t.d.Finish(err)
}
