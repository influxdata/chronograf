package transformations

import (
	"errors"
	"fmt"
	"sort"

	"math/bits"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/functions"
	"github.com/influxdata/flux/interpreter"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/semantic"
)

const GroupKind = "group"

type GroupOpSpec struct {
	By     []string `json:"by"`
	Except []string `json:"except"`
	All    bool     `json:"all"`
	None   bool     `json:"none"`
}

func init() {
	groupSignature := flux.FunctionSignature(
		map[string]semantic.PolyType{
			"by":     semantic.NewArrayPolyType(semantic.String),
			"except": semantic.NewArrayPolyType(semantic.String),
			"none":   semantic.Bool,
			"all":    semantic.Bool,
		},
		nil,
	)

	flux.RegisterFunction(GroupKind, createGroupOpSpec, groupSignature)
	flux.RegisterOpSpec(GroupKind, newGroupOp)
	plan.RegisterProcedureSpec(GroupKind, newGroupProcedure, GroupKind)
	execute.RegisterTransformation(GroupKind, createGroupTransformation)
}

func createGroupOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	spec := new(GroupOpSpec)

	if val, ok, err := args.GetBool("none"); err != nil {
		return nil, err
	} else if ok && val {
		spec.None = true
	}
	if val, ok, err := args.GetBool("all"); err != nil {
		return nil, err
	} else if ok && val {
		spec.All = true
	}

	if array, ok, err := args.GetArray("by", semantic.String); err != nil {
		return nil, err
	} else if ok {
		spec.By, err = interpreter.ToStringArray(array)
		if err != nil {
			return nil, err
		}
	}
	if array, ok, err := args.GetArray("except", semantic.String); err != nil {
		return nil, err
	} else if ok {
		spec.Except, err = interpreter.ToStringArray(array)
		if err != nil {
			return nil, err
		}
	}

	switch bits.OnesCount(uint(groupModeFromSpec(spec))) {
	case 0:
		// empty args
		spec.All = true
	case 1:
		// all good
	default:
		return nil, errors.New(`specify one of "by", "except", "none" or "all" keyword arguments`)
	}

	return spec, nil
}

func newGroupOp() flux.OperationSpec {
	return new(GroupOpSpec)
}

func (s *GroupOpSpec) Kind() flux.OperationKind {
	return GroupKind
}

func groupModeFromSpec(spec *GroupOpSpec) functions.GroupMode {
	var mode functions.GroupMode
	if spec.All {
		mode |= functions.GroupModeAll
	}
	if spec.None {
		mode |= functions.GroupModeNone
	}
	if len(spec.By) > 0 {
		mode |= functions.GroupModeBy
	}
	if len(spec.Except) > 0 {
		mode |= functions.GroupModeExcept
	}
	if mode == functions.GroupModeDefault {
		mode = functions.GroupModeAll
	}
	return mode
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

	mode := groupModeFromSpec(spec)
	var keys []string
	switch mode {
	case functions.GroupModeAll:
	case functions.GroupModeNone:
	case functions.GroupModeBy:
		keys = spec.By
	case functions.GroupModeExcept:
		keys = spec.Except
	default:
		return nil, fmt.Errorf("invalid GroupOpSpec; multiple modes detected")
	}

	p := &GroupProcedureSpec{
		GroupMode: mode,
		GroupKeys: keys,
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
	if t.mode == functions.GroupModeBy && len(t.keys) > 0 {
		for _, k := range t.keys {
			on[k] = true
		}
	} else if t.mode == functions.GroupModeExcept && len(t.keys) > 0 {
	COLS:
		for _, c := range cols {
			for _, label := range t.keys {
				if c.Label == label {
					continue COLS
				}
			}
			on[c.Label] = true
		}
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
