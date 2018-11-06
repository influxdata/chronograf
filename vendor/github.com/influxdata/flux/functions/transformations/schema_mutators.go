package transformations

import (
	"fmt"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/compiler"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/semantic"
	"github.com/influxdata/flux/values"
	"github.com/pkg/errors"
)

type BuilderContext struct {
	TableColumns []flux.ColMeta
	TableKey     flux.GroupKey
	ColIdxMap    []int
}

func NewBuilderContext(tbl flux.Table) *BuilderContext {
	colMap := make([]int, len(tbl.Cols()))
	for i := range tbl.Cols() {
		colMap[i] = i
	}

	return &BuilderContext{
		TableColumns: tbl.Cols(),
		TableKey:     tbl.Key(),
		ColIdxMap:    colMap,
	}
}

func (b *BuilderContext) Cols() []flux.ColMeta {
	return b.TableColumns
}

func (b *BuilderContext) Key() flux.GroupKey {
	return b.TableKey
}

func (b *BuilderContext) ColMap() []int {
	return b.ColIdxMap
}

type SchemaMutator interface {
	Mutate(ctx *BuilderContext) error
}

type SchemaMutation interface {
	Mutator() (SchemaMutator, error)
	Copy() SchemaMutation
}

func toStringSet(arr []string) map[string]bool {
	if arr == nil {
		return nil
	}
	set := make(map[string]bool, len(arr))
	for _, s := range arr {
		set[s] = true
	}

	return set
}

func checkCol(label string, cols []flux.ColMeta) error {
	if execute.ColIdx(label, cols) < 0 {
		return fmt.Errorf(`column "%s" doesn't exist`, label)
	}
	return nil
}

type RenameMutator struct {
	Columns   map[string]string
	Fn        compiler.Func
	Input     values.Object
	ParamName string
}

func NewRenameMutator(qs flux.OperationSpec) (*RenameMutator, error) {
	s, ok := qs.(*RenameOpSpec)

	m := &RenameMutator{}
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}

	if s.Columns != nil {
		m.Columns = s.Columns
	}

	if s.Fn != nil {
		compiledFn, param, err := compiler.CompileFnParam(s.Fn, semantic.String, semantic.String)
		if err != nil {
			return nil, err
		}

		m.Fn = compiledFn
		m.ParamName = param
		m.Input = values.NewObject()
	}
	return m, nil
}

func (m *RenameMutator) renameCol(col *flux.ColMeta) error {
	if col == nil {
		return errors.New("rename error: cannot rename nil column")
	}
	if m.Columns != nil {
		if newName, ok := m.Columns[col.Label]; ok {
			col.Label = newName
		}
	} else if m.Fn != nil {
		m.Input.Set(m.ParamName, values.NewString(col.Label))
		newName, err := m.Fn.EvalString(m.Input)
		if err != nil {
			return err
		}
		col.Label = newName
	}
	return nil
}

func (m *RenameMutator) checkColumns(tableCols []flux.ColMeta) error {
	for c := range m.Columns {
		if err := checkCol(c, tableCols); err != nil {
			return errors.Wrap(err, "rename error")
		}
	}
	return nil
}

func (m *RenameMutator) Mutate(ctx *BuilderContext) error {
	if err := m.checkColumns(ctx.Cols()); err != nil {
		return err
	}

	keyCols := make([]flux.ColMeta, 0, len(ctx.Cols()))
	keyValues := make([]values.Value, 0, len(ctx.Cols()))

	for i := range ctx.Cols() {
		keyIdx := execute.ColIdx(ctx.TableColumns[i].Label, ctx.Key().Cols())
		keyed := keyIdx >= 0

		if err := m.renameCol(&ctx.TableColumns[i]); err != nil {
			return err
		}

		if keyed {
			keyCols = append(keyCols, ctx.TableColumns[i])
			keyValues = append(keyValues, ctx.Key().Value(keyIdx))
		}
	}

	ctx.TableKey = execute.NewGroupKey(keyCols, keyValues)

	return nil
}

type DropKeepMutator struct {
	KeepCols      map[string]bool
	DropCols      map[string]bool
	Predicate     compiler.Func
	FlipPredicate bool
	ParamName     string
	Input         values.Object
}

func NewDropKeepMutator(qs flux.OperationSpec) (*DropKeepMutator, error) {
	m := &DropKeepMutator{}

	switch s := qs.(type) {
	case *DropOpSpec:
		if s.Columns != nil {
			m.DropCols = toStringSet(s.Columns)
		}
		if s.Predicate != nil {
			compiledFn, param, err := compiler.CompileFnParam(s.Predicate, semantic.String, semantic.Bool)
			if err != nil {
				return nil, err
			}
			m.Predicate = compiledFn
			m.ParamName = param
			m.Input = values.NewObject()
		}
	case *KeepOpSpec:
		if s.Columns != nil {
			m.KeepCols = toStringSet(s.Columns)
		}
		if s.Predicate != nil {
			compiledFn, param, err := compiler.CompileFnParam(s.Predicate, semantic.String, semantic.Bool)
			if err != nil {
				return nil, err
			}
			m.Predicate = compiledFn
			m.FlipPredicate = true

			m.ParamName = param
			m.Input = values.NewObject()
		}
	default:
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}

	return m, nil
}

func (m *DropKeepMutator) checkColumns(tableCols []flux.ColMeta) error {
	if m.DropCols != nil {
		for c := range m.DropCols {
			if err := checkCol(c, tableCols); err != nil {
				return errors.Wrap(err, "drop error")
			}
		}
	}

	if m.KeepCols != nil {
		for c := range m.KeepCols {
			if err := checkCol(c, tableCols); err != nil {
				return errors.Wrap(err, "keep error")
			}
		}
	}

	return nil
}

func (m *DropKeepMutator) shouldDrop(col string) (bool, error) {
	m.Input.Set(m.ParamName, values.NewString(col))
	if shouldDrop, err := m.Predicate.EvalBool(m.Input); err != nil {
		return false, err
	} else if m.FlipPredicate {
		return !shouldDrop, nil
	} else {
		return shouldDrop, nil
	}
}

func (m *DropKeepMutator) shouldDropCol(col string) (bool, error) {
	if m.DropCols != nil {
		if _, exists := m.DropCols[col]; exists {
			return true, nil
		}
	} else if m.Predicate != nil {
		return m.shouldDrop(col)
	}
	return false, nil
}

func (m *DropKeepMutator) keepToDropCols(cols []flux.ColMeta) {
	// If we have columns we want to keep, we can accomplish this by inverting the Cols map,
	// and storing it in Cols.
	//  With a keep operation, Cols may be changed with each call to `Mutate`, but
	// `Cols` will not be.
	if m.KeepCols != nil {
		exclusiveDropCols := make(map[string]bool, len(cols))
		for _, c := range cols {
			if _, ok := m.KeepCols[c.Label]; !ok {
				exclusiveDropCols[c.Label] = true
			}
		}
		m.DropCols = exclusiveDropCols
	}
}

func (m *DropKeepMutator) Mutate(ctx *BuilderContext) error {
	if err := m.checkColumns(ctx.Cols()); err != nil {
		return err
	}

	m.keepToDropCols(ctx.Cols())

	keyCols := make([]flux.ColMeta, 0, len(ctx.Cols()))
	keyValues := make([]values.Value, 0, len(ctx.Cols()))
	newCols := make([]flux.ColMeta, 0, len(ctx.Cols()))

	oldColMap := ctx.ColMap()
	newColMap := make([]int, 0, len(ctx.Cols()))

	for i, c := range ctx.Cols() {
		if shouldDrop, err := m.shouldDropCol(c.Label); err != nil {
			return err
		} else if shouldDrop {
			continue
		}

		keyIdx := execute.ColIdx(c.Label, ctx.Key().Cols())
		if keyIdx >= 0 {
			keyCols = append(keyCols, c)
			keyValues = append(keyValues, ctx.Key().Value(keyIdx))
		}
		newCols = append(newCols, c)
		newColMap = append(newColMap, oldColMap[i])
	}

	ctx.TableColumns = newCols
	ctx.TableKey = execute.NewGroupKey(keyCols, keyValues)
	ctx.ColIdxMap = newColMap

	return nil
}

type DuplicateMutator struct {
	Column string
	As     string
}

func NewDuplicateMutator(qs flux.OperationSpec) (*DuplicateMutator, error) {
	s, ok := qs.(*DuplicateOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}

	return &DuplicateMutator{
		Column: s.Column,
		As:     s.As,
	}, nil
}

func (m *DuplicateMutator) Mutate(ctx *BuilderContext) error {
	if err := checkCol(m.Column, ctx.Cols()); err != nil {
		return errors.Wrap(err, "duplicate error")
	}

	newCols := make([]flux.ColMeta, 0, len(ctx.Cols())+1)
	newColMap := make([]int, 0, len(ctx.Cols())+1)
	oldColMap := ctx.ColMap()

	for i, c := range ctx.Cols() {
		newCols = append(newCols, c)
		newColMap = append(newColMap, oldColMap[i])

		if c.Label == m.Column {
			newCols = append(newCols, duplicate(c, m.As))
			newColMap = append(newColMap, oldColMap[i])
		}
	}

	ctx.TableColumns = newCols
	ctx.ColIdxMap = newColMap

	return nil
}

func duplicate(col flux.ColMeta, dupName string) flux.ColMeta {
	return flux.ColMeta{
		Type:  col.Type,
		Label: dupName,
	}
}

// TODO: determine pushdown rules
/*
func (s *SchemaMutationProcedureSpec) PushDownRules() []plan.PushDownRule {
	return []plan.PushDownRule{{
		Root:    SchemaMutationKind,
		Through: nil,
		Match:   nil,
	}}
}

func (s *SchemaMutationProcedureSpec) PushDown(root *plan.Procedure, dup func() *plan.Procedure) {
	rootSpec := root.Spec.(*SchemaMutationProcedureSpec)
	rootSpec.Mutations = append(rootSpec.Mutations, s.Mutations...)
}
*/
