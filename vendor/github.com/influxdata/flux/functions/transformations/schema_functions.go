package transformations

import (
	"fmt"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/interpreter"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/semantic"
	"github.com/influxdata/flux/values"
	"github.com/pkg/errors"
)

const RenameKind = "rename"
const DropKind = "drop"
const KeepKind = "keep"
const DuplicateKind = "duplicate"

type RenameOpSpec struct {
	Columns map[string]string            `json:"columns"`
	Fn      *semantic.FunctionExpression `json:"fn"`
}

type DropOpSpec struct {
	Columns   []string                     `json:"columns"`
	Predicate *semantic.FunctionExpression `json:"fn"`
}

type KeepOpSpec struct {
	Columns   []string                     `json:"columns"`
	Predicate *semantic.FunctionExpression `json:"fn"`
}

type DuplicateOpSpec struct {
	Column string `json:"columns"`
	As     string `json:"as"`
}

// The base kind for SchemaMutations
const SchemaMutationKind = "SchemaMutation"

// A list of all operations which should map to the SchemaMutationProcedure
// Added to dynamically upon calls to `Register()`
var SchemaMutationOps = []flux.OperationKind{}

// A MutationRegistrar contains information needed
// to register a type of Operation Spec
// that will be converted into a SchemaMutator
// and embedded in a SchemaMutationProcedureSpec.
// Operations with a corresponding MutationRegistrar
// should not have their own ProcedureSpec.
type MutationRegistrar struct {
	Kind   flux.OperationKind
	Args   map[string]semantic.PolyType
	Create flux.CreateOperationSpec
	New    flux.NewOperationSpec
}

func (m MutationRegistrar) Register() {
	signature := flux.FunctionSignature(m.Args, nil)

	flux.RegisterFunction(string(m.Kind), m.Create, signature)
	flux.RegisterOpSpec(m.Kind, m.New)

	// Add to list of SchemaMutations which should map to a
	// SchemaMutationProcedureSpec
	SchemaMutationOps = append(SchemaMutationOps, m.Kind)
}

// A list of all MutationRegistrars to register.
// To register a new mutation, add an entry to this list.
var Registrars = []MutationRegistrar{
	{
		Kind: RenameKind,
		Args: map[string]semantic.PolyType{
			"columns": semantic.Object,
			"fn": semantic.NewFunctionPolyType(semantic.FunctionPolySignature{
				Parameters: map[string]semantic.PolyType{
					"column": semantic.String,
				},
				Required: semantic.LabelSet{"column"},
				Return:   semantic.String,
			}),
		},
		Create: createRenameOpSpec,
		New:    newRenameOp,
	},
	{
		Kind: DropKind,
		Args: map[string]semantic.PolyType{
			"columns": semantic.NewArrayPolyType(semantic.String),
			"fn": semantic.NewFunctionPolyType(semantic.FunctionPolySignature{
				Parameters: map[string]semantic.PolyType{
					"column": semantic.String,
				},
				Required: semantic.LabelSet{"column"},
				Return:   semantic.Bool,
			}),
		},
		Create: createDropOpSpec,
		New:    newDropOp,
	},
	{
		Kind: KeepKind,
		Args: map[string]semantic.PolyType{
			"columns": semantic.NewArrayPolyType(semantic.String),
			"fn": semantic.NewFunctionPolyType(semantic.FunctionPolySignature{
				Parameters: map[string]semantic.PolyType{
					"column": semantic.String,
				},
				Required: semantic.LabelSet{"column"},
				Return:   semantic.Bool,
			}),
		},
		Create: createKeepOpSpec,
		New:    newKeepOp,
	},
	{
		Kind: DuplicateKind,
		Args: map[string]semantic.PolyType{
			"column": semantic.String,
			"as":     semantic.String,
		},
		Create: createDuplicateOpSpec,
		New:    newDuplicateOp,
	},
}

func init() {
	for _, r := range Registrars {
		r.Register()
	}

	plan.RegisterProcedureSpec(SchemaMutationKind, newSchemaMutationProcedure, SchemaMutationOps...)
	execute.RegisterTransformation(SchemaMutationKind, createSchemaMutationTransformation)
}

func createRenameOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}
	var cols values.Object
	if c, ok, err := args.GetObject("columns"); err != nil {
		return nil, err
	} else if ok {
		cols = c
	}

	var renameFn *semantic.FunctionExpression
	if f, ok, err := args.GetFunction("fn"); err != nil {
		return nil, err
	} else if ok {
		if fn, err := interpreter.ResolveFunction(f); err != nil {
			return nil, err
		} else {
			renameFn = fn
		}
	}

	if cols == nil && renameFn == nil {
		return nil, errors.New("rename error: neither column list nor map function provided")
	}

	if cols != nil && renameFn != nil {
		return nil, errors.New("rename error: both column list and map function provided")
	}

	spec := &RenameOpSpec{
		Fn: renameFn,
	}

	if cols != nil {
		var err error
		renameCols := make(map[string]string, cols.Len())
		// Check types of object values manually
		cols.Range(func(name string, v values.Value) {
			if err != nil {
				return
			}
			if v.Type() != semantic.String {
				err = fmt.Errorf("rename error: columns object contains non-string value of type %s", v.Type())
				return
			}
			renameCols[name] = v.Str()
		})
		if err != nil {
			return nil, err
		}
		spec.Columns = renameCols
	}

	return spec, nil
}

func createDropOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	var cols values.Array
	if c, ok, err := args.GetArray("columns", semantic.String); err != nil {
		return nil, err
	} else if ok {
		cols = c
	}

	var dropPredicate *semantic.FunctionExpression
	if f, ok, err := args.GetFunction("fn"); err != nil {
		return nil, err
	} else if ok {
		fn, err := interpreter.ResolveFunction(f)
		if err != nil {
			return nil, err
		}

		dropPredicate = fn
	}

	if cols == nil && dropPredicate == nil {
		return nil, errors.New("drop error: neither column list nor predicate function provided")
	}

	if cols != nil && dropPredicate != nil {
		return nil, errors.New("drop error: both column list and predicate provided")
	}

	var dropCols []string
	var err error
	if cols != nil {
		dropCols, err = interpreter.ToStringArray(cols)
		if err != nil {
			return nil, err
		}
	}

	return &DropOpSpec{
		Columns:   dropCols,
		Predicate: dropPredicate,
	}, nil
}

func createKeepOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	var cols values.Array
	if c, ok, err := args.GetArray("columns", semantic.String); err != nil {
		return nil, err
	} else if ok {
		cols = c
	}

	var keepPredicate *semantic.FunctionExpression
	if f, ok, err := args.GetFunction("fn"); err != nil {
		return nil, err
	} else if ok {
		fn, err := interpreter.ResolveFunction(f)
		if err != nil {
			return nil, err
		}

		keepPredicate = fn
	}

	if cols == nil && keepPredicate == nil {
		return nil, errors.New("keep error: neither column list nor predicate function provided")
	}

	if cols != nil && keepPredicate != nil {
		return nil, errors.New("keep error: both column list and predicate provided")
	}

	var keepCols []string
	var err error
	if cols != nil {
		keepCols, err = interpreter.ToStringArray(cols)
		if err != nil {
			return nil, err
		}
	}

	return &KeepOpSpec{
		Columns:   keepCols,
		Predicate: keepPredicate,
	}, nil
}

func createDuplicateOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	col, err := args.GetRequiredString("column")
	if err != nil {
		return nil, err
	}

	newName, err := args.GetRequiredString("as")
	if err != nil {
		return nil, err
	}

	return &DuplicateOpSpec{
		Column: col,
		As:     newName,
	}, nil
}

func newRenameOp() flux.OperationSpec {
	return new(RenameOpSpec)
}

func (s *RenameOpSpec) Kind() flux.OperationKind {
	return RenameKind
}

func newDropOp() flux.OperationSpec {
	return new(DropOpSpec)
}

func (s *DropOpSpec) Kind() flux.OperationKind {
	return DropKind
}

func newKeepOp() flux.OperationSpec {
	return new(KeepOpSpec)
}

func (s *KeepOpSpec) Kind() flux.OperationKind {
	return KeepKind
}

func newDuplicateOp() flux.OperationSpec {
	return new(DuplicateOpSpec)
}

func (s *DuplicateOpSpec) Kind() flux.OperationKind {
	return DuplicateKind
}

func (s *RenameOpSpec) Copy() SchemaMutation {
	newCols := make(map[string]string, len(s.Columns))
	for k, v := range s.Columns {
		newCols[k] = v
	}

	return &RenameOpSpec{
		Columns: newCols,
		Fn:      s.Fn.Copy().(*semantic.FunctionExpression),
	}
}

func (s *DropOpSpec) Copy() SchemaMutation {
	newCols := make([]string, len(s.Columns))
	copy(newCols, s.Columns)

	return &DropOpSpec{
		Columns:   newCols,
		Predicate: s.Predicate.Copy().(*semantic.FunctionExpression),
	}
}

func (s *KeepOpSpec) Copy() SchemaMutation {
	newCols := make([]string, len(s.Columns))
	copy(newCols, s.Columns)

	return &KeepOpSpec{
		Columns:   newCols,
		Predicate: s.Predicate.Copy().(*semantic.FunctionExpression),
	}
}

func (s *DuplicateOpSpec) Copy() SchemaMutation {
	return &DuplicateOpSpec{
		Column: s.Column,
		As:     s.As,
	}
}

func (s *RenameOpSpec) Mutator() (SchemaMutator, error) {
	m, err := NewRenameMutator(s)
	if err != nil {
		return nil, err
	}
	return m, nil
}

func (s *DropOpSpec) Mutator() (SchemaMutator, error) {
	m, err := NewDropKeepMutator(s)
	if err != nil {
		return nil, err
	}
	return m, nil
}

func (s *KeepOpSpec) Mutator() (SchemaMutator, error) {
	m, err := NewDropKeepMutator(s)
	if err != nil {
		return nil, err
	}
	return m, nil
}

func (s *DuplicateOpSpec) Mutator() (SchemaMutator, error) {
	m, err := NewDuplicateMutator(s)
	if err != nil {
		return nil, err
	}
	return m, nil
}

type SchemaMutationProcedureSpec struct {
	plan.DefaultCost
	Mutations []SchemaMutation
}

func (s *SchemaMutationProcedureSpec) Kind() plan.ProcedureKind {
	return SchemaMutationKind
}

func (s *SchemaMutationProcedureSpec) Copy() plan.ProcedureSpec {
	newMutations := make([]SchemaMutation, len(s.Mutations))
	for i, m := range newMutations {
		newMutations[i] = m.Copy()
	}

	return &SchemaMutationProcedureSpec{
		Mutations: newMutations,
	}
}

func newSchemaMutationProcedure(qs flux.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	s, ok := qs.(SchemaMutation)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T doesn't implement SchemaMutation", qs)
	}

	return &SchemaMutationProcedureSpec{
		Mutations: []SchemaMutation{s},
	}, nil
}

type schemaMutationTransformation struct {
	d        execute.Dataset
	cache    execute.TableBuilderCache
	mutators []SchemaMutator
}

func createSchemaMutationTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	cache := execute.NewTableBuilderCache(a.Allocator())
	d := execute.NewDataset(id, mode, cache)

	t, err := NewSchemaMutationTransformation(d, cache, spec)
	if err != nil {
		return nil, nil, err
	}
	return t, d, nil
}

func NewSchemaMutationTransformation(d execute.Dataset, cache execute.TableBuilderCache, spec plan.ProcedureSpec) (*schemaMutationTransformation, error) {
	s, ok := spec.(*SchemaMutationProcedureSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", spec)
	}

	mutators := make([]SchemaMutator, len(s.Mutations))
	for i, mutation := range s.Mutations {
		m, err := mutation.Mutator()
		if err != nil {
			return nil, err
		}
		mutators[i] = m
	}

	return &schemaMutationTransformation{
		d:        d,
		cache:    cache,
		mutators: mutators,
	}, nil
}

func (t *schemaMutationTransformation) Process(id execute.DatasetID, tbl flux.Table) error {
	ctx := NewBuilderContext(tbl)
	for _, m := range t.mutators {
		err := m.Mutate(ctx)
		if err != nil {
			return err
		}
	}

	builder, created := t.cache.TableBuilder(ctx.Key())
	if created {
		for _, c := range ctx.Cols() {
			_, err := builder.AddCol(c)
			if err != nil {
				return err
			}
		}
	}

	return tbl.Do(func(cr flux.ColReader) error {
		for i := 0; i < cr.Len(); i++ {
			if err := execute.AppendMappedRecordWithDefaults(i, cr, builder, ctx.ColMap()); err != nil {
				return err
			}
		}
		return nil
	})
}

func (t *schemaMutationTransformation) RetractTable(id execute.DatasetID, key flux.GroupKey) error {
	return t.d.RetractTable(key)
}

func (t *schemaMutationTransformation) UpdateWatermark(id execute.DatasetID, mark execute.Time) error {
	return t.d.UpdateWatermark(mark)
}

func (t *schemaMutationTransformation) UpdateProcessingTime(id execute.DatasetID, pt execute.Time) error {
	return t.d.UpdateProcessingTime(pt)
}

func (t *schemaMutationTransformation) Finish(id execute.DatasetID, err error) {
	t.d.Finish(err)
}
