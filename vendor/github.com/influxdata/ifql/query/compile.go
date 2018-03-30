package query

import (
	"context"
	"fmt"
	"log"
	"sort"
	"time"

	"github.com/influxdata/ifql/interpreter"
	"github.com/influxdata/ifql/parser"
	"github.com/influxdata/ifql/semantic"
	opentracing "github.com/opentracing/opentracing-go"
	"github.com/pkg/errors"
)

const (
	TableParameter  = "table"
	tableIDKey      = "id"
	tableKindKey    = "kind"
	tableParentsKey = "parents"
	tableSpecKey    = "spec"
)

type Option func(*options)

func Verbose(v bool) Option {
	return func(o *options) {
		o.verbose = v
	}
}

type options struct {
	verbose bool
}

// Compile evaluates an IFQL script producing a query Spec.
func Compile(ctx context.Context, q string, opts ...Option) (*Spec, error) {
	o := new(options)
	for _, opt := range opts {
		opt(o)
	}
	s, _ := opentracing.StartSpanFromContext(ctx, "parse")
	astProg, err := parser.NewAST(q)
	if err != nil {
		return nil, err
	}
	s.Finish()
	s, _ = opentracing.StartSpanFromContext(ctx, "compile")
	defer s.Finish()

	// Convert AST program to a semantic program
	semProg, err := semantic.New(astProg, builtinDeclarations.Copy())
	if err != nil {
		return nil, err
	}

	// Create top-level builtin scope
	scope := builtinScope.Nest()

	// Create new query domain
	d := new(queryDomain)
	if err := interpreter.Eval(semProg, scope, d); err != nil {
		return nil, err
	}
	spec := d.ToSpec()

	if o.verbose {
		log.Println("Query Spec: ", Formatted(spec, FmtJSON))
	}
	return spec, nil
}

type CreateOperationSpec func(args Arguments, a *Administration) (OperationSpec, error)

var functionsMap = make(map[string]function)

// RegisterFunction adds a new builtin top level function.
func RegisterFunction(name string, c CreateOperationSpec, sig semantic.FunctionSignature) {
	if finalized {
		panic(errors.New("already finalized, cannot register function"))
	}
	if _, ok := functionsMap[name]; ok {
		panic(fmt.Errorf("duplicate registration for function %q", name))
	}
	f := function{
		name:         name,
		createOpSpec: c,
	}
	functionsMap[name] = f
	builtinScope.Set(name, f)
	builtinDeclarations[name] = semantic.NewExternalVariableDeclaration(
		name,
		semantic.NewFunctionType(sig),
	)
}

var TableObjectType = semantic.NewObjectType(map[string]semantic.Type{
	tableIDKey:   semantic.String,
	tableKindKey: semantic.String,
	// TODO(nathanielc): The spec types vary significantly making type comparisons impossible, for now the solution is to state the type as an empty object.
	tableSpecKey: semantic.EmptyObject,
	// TODO(nathanielc): Support recursive types, for now we state that the array has empty objects.
	tableParentsKey: semantic.NewArrayType(semantic.EmptyObject),
})

type TableObject struct {
	interpreter.Object
}

func NewTableObject(t interpreter.Object) (TableObject, error) {
	if typ := t.Type(); typ != TableObjectType {
		return TableObject{}, fmt.Errorf("cannot create table object, wrong type: %v exp: %v", typ, TableObjectType)
	}
	return TableObject{
		Object: t,
	}, nil
}

func (t TableObject) ID() OperationID {
	return OperationID(t.Properties[tableIDKey].Value().(string))
}

func (t TableObject) Kind() OperationKind {
	return OperationKind(t.Properties[tableKindKey].Value().(string))
}

func (t TableObject) Spec() OperationSpec {
	return t.Properties[tableSpecKey].Value().(OperationSpec)
}
func (t TableObject) Operation() *Operation {
	return &Operation{
		ID:   t.ID(),
		Spec: t.Spec(),
	}
}

func (t TableObject) String() string {
	return fmt.Sprintf("{id: %q, kind: %q}", t.ID(), t.Kind())
}

func (t TableObject) ToSpec() *Spec {
	visited := make(map[OperationID]bool)
	spec := new(Spec)
	t.buildSpec(spec, visited)
	return spec
}

func (t TableObject) buildSpec(spec *Spec, visited map[OperationID]bool) {
	id := t.ID()
	parents := t.Properties[tableParentsKey].(interpreter.Array).Elements
	for i := range parents {
		p := parents[i].(TableObject)
		if !visited[p.ID()] {
			// rescurse up parents
			p.buildSpec(spec, visited)
		}

		spec.Edges = append(spec.Edges, Edge{
			Parent: p.ID(),
			Child:  id,
		})
	}

	visited[id] = true
	spec.Operations = append(spec.Operations, t.Operation())
}

// DefaultFunctionSignature returns a FunctionSignature for standard functions which accept a table piped argument.
// It is safe to modify the returned signature.
func DefaultFunctionSignature() semantic.FunctionSignature {
	return semantic.FunctionSignature{
		Params: map[string]semantic.Type{
			TableParameter: TableObjectType,
		},
		ReturnType:   TableObjectType,
		PipeArgument: TableParameter,
	}
}

var builtinScope = interpreter.NewScope()
var builtinDeclarations = make(semantic.DeclarationScope)

// list of builtin scripts
var builtins = make(map[string]string)
var finalized bool

// RegisterBuiltIn adds any variable declarations in the script to the builtin scope.
func RegisterBuiltIn(name, script string) {
	if finalized {
		panic(errors.New("already finalized, cannot register builtin"))
	}
	builtins[name] = script
}

// FinalizeRegistration must be called to complete registration.
// Future calls to RegisterFunction or RegisterBuiltIn will panic.
func FinalizeRegistration() {
	finalized = true
	for name, script := range builtins {
		astProg, err := parser.NewAST(script)
		if err != nil {
			panic(errors.Wrapf(err, "failed to parse builtin %q", name))
		}
		semProg, err := semantic.New(astProg, builtinDeclarations)
		if err != nil {
			panic(errors.Wrapf(err, "failed to create semantic graph for builtin %q", name))
		}

		// Create new query domain
		d := new(queryDomain)

		if err := interpreter.Eval(semProg, builtinScope, d); err != nil {
			panic(errors.Wrapf(err, "failed to evaluate builtin %q", name))
		}
	}
	// free builtins list
	builtins = nil
}

func BuiltIns() (*interpreter.Scope, semantic.DeclarationScope) {
	return builtinScope.Nest(), builtinDeclarations.Copy()
}

type Administration struct {
	id      OperationID
	parents interpreter.Array
}

func newAdministration(id OperationID) *Administration {
	return &Administration{
		id: id,
		// TODO(nathanielc): Once we can support recursive types change this to,
		// interpreter.NewArray(TableObjectType)
		parents: interpreter.NewArray(semantic.EmptyObject),
	}
}

// AddParentFromArgs reads the args for the `table` argument and adds the value as a parent.
func (a *Administration) AddParentFromArgs(args Arguments) error {
	parent, err := args.GetRequiredObject(TableParameter)
	if err != nil {
		return err
	}
	p, err := NewTableObject(parent)
	if err != nil {
		return err
	}
	a.AddParent(p)
	return nil
}

// AddParent instructs the evaluation Context that a new edge should be created from the parent to the current operation.
// Duplicate parents will be removed, so the caller need not concern itself with which parents have already been added.
func (a *Administration) AddParent(np TableObject) {
	// Check for duplicates
	for _, p := range a.parents.Elements {
		if p.(TableObject).ID() == np.ID() {
			return
		}
	}
	a.parents.Elements = append(a.parents.Elements, np)
}

type Domain interface {
	interpreter.Domain
	ToSpec() *Spec
}

func NewDomain() Domain {
	return new(queryDomain)
}

type queryDomain struct {
	id int

	operations []TableObject
}

func (d *queryDomain) NewID(name string) OperationID {
	return OperationID(fmt.Sprintf("%s%d", name, d.nextID()))
}

func (d *queryDomain) nextID() int {
	id := d.id
	d.id++
	return id
}

func (d *queryDomain) ToSpec() *Spec {
	spec := new(Spec)
	visited := make(map[OperationID]bool)
	for _, t := range d.operations {
		t.buildSpec(spec, visited)
	}
	return spec
}

type function struct {
	name         string
	createOpSpec CreateOperationSpec
}

func (f function) Type() semantic.Type {
	//TODO(nathanielc): Return a complete function type
	return semantic.Function
}

func (f function) Value() interface{} {
	return f
}
func (f function) Property(name string) (interpreter.Value, error) {
	return nil, fmt.Errorf("property %q does not exist", name)
}
func (f function) Resolve() (*semantic.FunctionExpression, error) {
	return nil, fmt.Errorf("function %q cannot be resolved", f.name)
}

func (f function) Call(args interpreter.Arguments, d interpreter.Domain) (interpreter.Value, error) {
	qd := d.(*queryDomain)
	id := qd.NewID(f.name)

	a := newAdministration(id)

	spec, err := f.createOpSpec(Arguments{Arguments: args}, a)
	if err != nil {
		return nil, err
	}

	if len(a.parents.Elements) > 1 {
		// Always add parents in a consistent order
		sort.Slice(a.parents.Elements, func(i, j int) bool {
			return a.parents.Elements[i].(TableObject).ID() < a.parents.Elements[j].(TableObject).ID()
		})
	}

	t, err := NewTableObject(interpreter.Object{
		Properties: map[string]interpreter.Value{
			tableIDKey:      interpreter.NewStringValue(string(id)),
			tableKindKey:    interpreter.NewStringValue(string(spec.Kind())),
			tableSpecKey:    specValue{spec: spec},
			tableParentsKey: a.parents,
		},
	})
	if err != nil {
		return nil, err
	}
	qd.operations = append(qd.operations, t)
	return t, nil
}

type specValue struct {
	spec OperationSpec
}

func (v specValue) Type() semantic.Type {
	return semantic.EmptyObject
}

func (v specValue) Value() interface{} {
	return v.spec
}

func (v specValue) Property(name string) (interpreter.Value, error) {
	return nil, errors.New("spec does not have properties")
}

type Arguments struct {
	interpreter.Arguments
}

func (a Arguments) GetTime(name string) (Time, bool, error) {
	v, ok := a.Get(name)
	if !ok {
		return Time{}, false, nil
	}
	qt, err := ToQueryTime(v)
	if err != nil {
		return Time{}, ok, err
	}
	return qt, ok, nil
}

func (a Arguments) GetRequiredTime(name string) (Time, error) {
	qt, ok, err := a.GetTime(name)
	if err != nil {
		return Time{}, err
	}
	if !ok {
		return Time{}, fmt.Errorf("missing required keyword argument %q", name)
	}
	return qt, nil
}

func (a Arguments) GetDuration(name string) (Duration, bool, error) {
	v, ok := a.Get(name)
	if !ok {
		return 0, false, nil
	}
	return (Duration)(v.Value().(time.Duration)), ok, nil
}

func (a Arguments) GetRequiredDuration(name string) (Duration, error) {
	d, ok, err := a.GetDuration(name)
	if err != nil {
		return 0, err
	}
	if !ok {
		return 0, fmt.Errorf("missing required keyword argument %q", name)
	}
	return d, nil
}

func ToQueryTime(value interpreter.Value) (Time, error) {
	switch v := value.Value().(type) {
	case time.Time:
		return Time{
			Absolute: v,
		}, nil
	case time.Duration:
		return Time{
			Relative:   v,
			IsRelative: true,
		}, nil
	case int64:
		return Time{
			Absolute: time.Unix(v, 0),
		}, nil
	default:
		return Time{}, fmt.Errorf("value is not a time, got %v", value.Type())
	}
}
