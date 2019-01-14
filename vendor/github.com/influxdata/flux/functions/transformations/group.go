package transformations

import (
	"errors"
	"fmt"
	"sort"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/functions"
	"github.com/influxdata/flux/interpreter"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/semantic"
)

const GroupKind = "group"

const (
	groupModeBy     = "by"
	groupModeExcept = "except"
)

type GroupOpSpec struct {
	Mode    string   `json:"mode"`
	Columns []string `json:"columns"`
}

func init() {
	groupSignature := flux.FunctionSignature(
		map[string]semantic.PolyType{
			"mode":    semantic.String,
			"columns": semantic.NewArrayPolyType(semantic.String),
		},
		nil,
	)

	flux.RegisterFunction(GroupKind, createGroupOpSpec, groupSignature)
	flux.RegisterOpSpec(GroupKind, newGroupOp)
	plan.RegisterProcedureSpec(GroupKind, newGroupProcedure, GroupKind)
	plan.RegisterLogicalRules(MergeGroupRule{})
	execute.RegisterTransformation(GroupKind, createGroupTransformation)
}

func createGroupOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	spec := new(GroupOpSpec)

	if mode, ok, err := args.GetString("mode"); err != nil {
		return nil, err
	} else if ok {
		if _, err := validateGroupMode(mode); err != nil {
			return nil, err
		}

		spec.Mode = mode
	} else {
		spec.Mode = groupModeBy
	}

	if columns, ok, err := args.GetArray("columns", semantic.String); err != nil {
		return nil, err
	} else if ok {
		spec.Columns, err = interpreter.ToStringArray(columns)
		if err != nil {
			return nil, err
		}
	} else {
		spec.Columns = []string{}
	}

	return spec, nil
}

func validateGroupMode(mode string) (functions.GroupMode, error) {
	switch mode {
	case groupModeBy:
		return functions.GroupModeBy, nil
	case groupModeExcept:
		return functions.GroupModeExcept, nil
	default:
		return functions.GroupModeNone, errors.New(`invalid group mode: must be "by" or "except"`)
	}
}

func newGroupOp() flux.OperationSpec {
	return new(GroupOpSpec)
}

func (s *GroupOpSpec) Kind() flux.OperationKind {
	return GroupKind
}

type GroupProcedureSpec struct {
	plan.DefaultCost
	GroupMode functions.GroupMode
	GroupKeys []string
}

func newGroupProcedure(qs flux.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*GroupOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}

	mode, err := validateGroupMode(spec.Mode)
	if err != nil {
		return nil, err
	}

	p := &GroupProcedureSpec{
		GroupMode: mode,
		GroupKeys: spec.Columns,
	}
	return p, nil
}

func (s *GroupProcedureSpec) Kind() plan.ProcedureKind {
	return GroupKind
}
func (s *GroupProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(GroupProcedureSpec)

	ns.GroupMode = s.GroupMode

	ns.GroupKeys = make([]string, len(s.GroupKeys))
	copy(ns.GroupKeys, s.GroupKeys)

	return ns
}

func createGroupTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	s, ok := spec.(*GroupProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", spec)
	}
	cache := execute.NewTableBuilderCache(a.Allocator())
	d := execute.NewDataset(id, mode, cache)
	t := NewGroupTransformation(d, cache, s)
	return t, d, nil
}

type groupTransformation struct {
	d     execute.Dataset
	cache execute.TableBuilderCache

	mode functions.GroupMode
	keys []string
}

func NewGroupTransformation(d execute.Dataset, cache execute.TableBuilderCache, spec *GroupProcedureSpec) *groupTransformation {
	t := &groupTransformation{
		d:     d,
		cache: cache,
		mode:  spec.GroupMode,
		keys:  spec.GroupKeys,
	}
	sort.Strings(t.keys)
	return t
}

func (t *groupTransformation) RetractTable(id execute.DatasetID, key flux.GroupKey) (err error) {
	panic("not implemented")
}

func (t *groupTransformation) Process(id execute.DatasetID, tbl flux.Table) error {
	cols := tbl.Cols()
	on := make(map[string]bool, len(cols))
	switch t.mode {
	case functions.GroupModeBy:
		for _, k := range t.keys {
			on[k] = true
		}
	case functions.GroupModeExcept:
	COLS:
		for _, c := range cols {
			for _, label := range t.keys {
				if c.Label == label {
					continue COLS
				}
			}
			on[c.Label] = true
		}
	default:
		panic("unimplemented group mode")
	}

	colMap := make([]int, 0, len(tbl.Cols()))
	return tbl.Do(func(cr flux.ColReader) error {
		l := cr.Len()
		for i := 0; i < l; i++ {
			key := execute.GroupKeyForRowOn(i, cr, on)
			builder, _ := t.cache.TableBuilder(key)

			colMap, err := execute.AddNewTableCols(tbl, builder, colMap)
			if err != nil {
				return err
			}

			err = execute.AppendMappedRecordWithDefaults(i, cr, builder, colMap)
			if err != nil {
				return err
			}
		}
		return nil
	})
}

func (t *groupTransformation) UpdateWatermark(id execute.DatasetID, mark execute.Time) error {
	return t.d.UpdateWatermark(mark)
}
func (t *groupTransformation) UpdateProcessingTime(id execute.DatasetID, pt execute.Time) error {
	return t.d.UpdateProcessingTime(pt)
}
func (t *groupTransformation) Finish(id execute.DatasetID, err error) {
	t.d.Finish(err)
}

// `MergeGroupRule` merges two group operations and keeps only the last one
type MergeGroupRule struct{}

func (r MergeGroupRule) Name() string {
	return "MergeGroupRule"
}

// returns the pattern that matches `group |> group`
func (r MergeGroupRule) Pattern() plan.Pattern {
	return plan.Pat(GroupKind, plan.Pat(GroupKind, plan.Any()))
}

func (r MergeGroupRule) Rewrite(lastGroup plan.PlanNode) (plan.PlanNode, bool, error) {
	firstGroup := lastGroup.Predecessors()[0]
	lastSpec := lastGroup.ProcedureSpec().(*GroupProcedureSpec)

	if lastSpec.GroupMode != functions.GroupModeBy &&
		lastSpec.GroupMode != functions.GroupModeExcept {
		return lastGroup, false, nil
	}

	merged, err := plan.MergeLogicalPlanNodes(lastGroup, firstGroup, lastSpec.Copy())
	if err != nil {
		return nil, false, err
	}

	return merged, true, nil
}
