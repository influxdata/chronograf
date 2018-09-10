package functions

import (
	"fmt"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/semantic"
)

const DistinctKind = "distinct"

type DistinctOpSpec struct {
	Column string `json:"column"`
}

var distinctSignature = flux.DefaultFunctionSignature()

func init() {
	distinctSignature.Params["column"] = semantic.String

	flux.RegisterFunction(DistinctKind, createDistinctOpSpec, distinctSignature)
	flux.RegisterOpSpec(DistinctKind, newDistinctOp)
	plan.RegisterProcedureSpec(DistinctKind, newDistinctProcedure, DistinctKind)
	plan.RegisterRewriteRule(DistinctPointLimitRewriteRule{})
	execute.RegisterTransformation(DistinctKind, createDistinctTransformation)
}

func createDistinctOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	spec := new(DistinctOpSpec)

	if col, ok, err := args.GetString("column"); err != nil {
		return nil, err
	} else if ok {
		spec.Column = col
	} else {
		spec.Column = execute.DefaultValueColLabel
	}

	return spec, nil
}

func newDistinctOp() flux.OperationSpec {
	return new(DistinctOpSpec)
}

func (s *DistinctOpSpec) Kind() flux.OperationKind {
	return DistinctKind
}

type DistinctProcedureSpec struct {
	Column string
}

func newDistinctProcedure(qs flux.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*DistinctOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}

	return &DistinctProcedureSpec{
		Column: spec.Column,
	}, nil
}

func (s *DistinctProcedureSpec) Kind() plan.ProcedureKind {
	return DistinctKind
}
func (s *DistinctProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(DistinctProcedureSpec)

	*ns = *s

	return ns
}

type DistinctPointLimitRewriteRule struct {
}

func (r DistinctPointLimitRewriteRule) Root() plan.ProcedureKind {
	return FromKind
}

func (r DistinctPointLimitRewriteRule) Rewrite(pr *plan.Procedure, planner plan.PlanRewriter) error {
	fromSpec, ok := pr.Spec.(*FromProcedureSpec)
	if !ok {
		return nil
	}

	var distinct *DistinctProcedureSpec
	pr.DoChildren(func(child *plan.Procedure) {
		if d, ok := child.Spec.(*DistinctProcedureSpec); ok {
			distinct = d
		}
	})
	if distinct == nil {
		return nil
	}

	groupStar := !fromSpec.GroupingSet && distinct.Column != execute.DefaultValueColLabel
	groupByColumn := fromSpec.GroupingSet && len(fromSpec.GroupKeys) > 0 &&
		((fromSpec.GroupMode == GroupModeBy && execute.ContainsStr(fromSpec.GroupKeys, distinct.Column)) ||
			(fromSpec.GroupMode == GroupModeExcept && !execute.ContainsStr(fromSpec.GroupKeys, distinct.Column)))
	if groupStar || groupByColumn {
		fromSpec.LimitSet = true
		fromSpec.PointsLimit = -1
		return nil
	}
	return nil
}

func createDistinctTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	s, ok := spec.(*DistinctProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", spec)
	}
	cache := execute.NewTableBuilderCache(a.Allocator())
	d := execute.NewDataset(id, mode, cache)
	t := NewDistinctTransformation(d, cache, s)
	return t, d, nil
}

type distinctTransformation struct {
	d     execute.Dataset
	cache execute.TableBuilderCache

	column string
}

func NewDistinctTransformation(d execute.Dataset, cache execute.TableBuilderCache, spec *DistinctProcedureSpec) *distinctTransformation {
	return &distinctTransformation{
		d:      d,
		cache:  cache,
		column: spec.Column,
	}
}

func (t *distinctTransformation) RetractTable(id execute.DatasetID, key flux.GroupKey) error {
	return t.d.RetractTable(key)
}

func (t *distinctTransformation) Process(id execute.DatasetID, tbl flux.Table) error {
	builder, created := t.cache.TableBuilder(tbl.Key())
	if !created {
		return fmt.Errorf("distinct found duplicate table with key: %v", tbl.Key())
	}

	colIdx := execute.ColIdx(t.column, tbl.Cols())
	if colIdx < 0 {
		// doesn't exist in this table, so add an empty value
		execute.AddTableKeyCols(tbl.Key(), builder)
		colIdx = builder.AddCol(flux.ColMeta{
			Label: execute.DefaultValueColLabel,
			Type:  flux.TString,
		})
		builder.AppendString(colIdx, "")
		execute.AppendKeyValues(tbl.Key(), builder)
		// TODO: hack required to ensure data flows downstream
		return tbl.Do(func(flux.ColReader) error {
			return nil
		})
	}

	col := tbl.Cols()[colIdx]

	execute.AddTableKeyCols(tbl.Key(), builder)
	colIdx = builder.AddCol(flux.ColMeta{
		Label: execute.DefaultValueColLabel,
		Type:  col.Type,
	})

	if tbl.Key().HasCol(t.column) {
		j := execute.ColIdx(t.column, tbl.Key().Cols())
		switch col.Type {
		case flux.TBool:
			builder.AppendBool(colIdx, tbl.Key().ValueBool(j))
		case flux.TInt:
			builder.AppendInt(colIdx, tbl.Key().ValueInt(j))
		case flux.TUInt:
			builder.AppendUInt(colIdx, tbl.Key().ValueUInt(j))
		case flux.TFloat:
			builder.AppendFloat(colIdx, tbl.Key().ValueFloat(j))
		case flux.TString:
			builder.AppendString(colIdx, tbl.Key().ValueString(j))
		case flux.TTime:
			builder.AppendTime(colIdx, tbl.Key().ValueTime(j))
		}

		execute.AppendKeyValues(tbl.Key(), builder)
		// TODO: hack required to ensure data flows downstream
		return tbl.Do(func(flux.ColReader) error {
			return nil
		})
	}

	var (
		boolDistinct   map[bool]bool
		intDistinct    map[int64]bool
		uintDistinct   map[uint64]bool
		floatDistinct  map[float64]bool
		stringDistinct map[string]bool
		timeDistinct   map[execute.Time]bool
	)
	switch col.Type {
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


	j := execute.ColIdx(t.column, tbl.Cols())
	return tbl.Do(func(cr flux.ColReader) error {
		l := cr.Len()

		for i := 0; i < l; i++ {
			// Check distinct
			switch col.Type {
			case flux.TBool:
				v := cr.Bools(j)[i]
				if boolDistinct[v] {
					continue
				}
				boolDistinct[v] = true
				builder.AppendBool(colIdx, v)
			case flux.TInt:
				v := cr.Ints(j)[i]
				if intDistinct[v] {
					continue
				}
				intDistinct[v] = true
				builder.AppendInt(colIdx, v)
			case flux.TUInt:
				v := cr.UInts(j)[i]
				if uintDistinct[v] {
					continue
				}
				uintDistinct[v] = true
				builder.AppendUInt(colIdx, v)
			case flux.TFloat:
				v := cr.Floats(j)[i]
				if floatDistinct[v] {
					continue
				}
				floatDistinct[v] = true
				builder.AppendFloat(colIdx, v)
			case flux.TString:
				v := cr.Strings(j)[i]
				if stringDistinct[v] {
					continue
				}
				stringDistinct[v] = true
				builder.AppendString(colIdx, v)
			case flux.TTime:
				v := cr.Times(j)[i]
				if timeDistinct[v] {
					continue
				}
				timeDistinct[v] = true
				builder.AppendTime(colIdx, v)
			}

			execute.AppendKeyValues(tbl.Key(), builder)
		}
		return nil
	})
}

func (t *distinctTransformation) UpdateWatermark(id execute.DatasetID, mark execute.Time) error {
	return t.d.UpdateWatermark(mark)
}
func (t *distinctTransformation) UpdateProcessingTime(id execute.DatasetID, pt execute.Time) error {
	return t.d.UpdateProcessingTime(pt)
}
func (t *distinctTransformation) Finish(id execute.DatasetID, err error) {
	t.d.Finish(err)
}
