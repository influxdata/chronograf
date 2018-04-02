package interpreter

import (
	"fmt"
	"regexp"
	"strconv"
	"time"

	"github.com/influxdata/ifql/ast"
	"github.com/influxdata/ifql/semantic"
	"github.com/pkg/errors"
)

func Eval(program *semantic.Program, scope *Scope, d Domain) error {
	itrp := interpreter{
		d: d,
	}
	return itrp.eval(program, scope)
}

// Domain represents any specific domain being used during evaluation.
type Domain interface{}

type interpreter struct {
	d Domain
}

func (itrp interpreter) eval(program *semantic.Program, scope *Scope) error {
	for _, stmt := range program.Body {
		if err := itrp.doStatement(stmt, scope); err != nil {
			return err
		}
	}
	return nil
}

func (itrp interpreter) doStatement(stmt semantic.Statement, scope *Scope) error {
	scope.SetReturn(value{t: semantic.Invalid})
	switch s := stmt.(type) {
	case *semantic.NativeVariableDeclaration:
		if err := itrp.doVariableDeclaration(s, scope); err != nil {
			return err
		}
	case *semantic.ExpressionStatement:
		v, err := itrp.doExpression(s.Expression, scope)
		if err != nil {
			return err
		}
		scope.SetReturn(v)
	case *semantic.BlockStatement:
		nested := scope.Nest()
		for i, stmt := range s.Body {
			if err := itrp.doStatement(stmt, nested); err != nil {
				return err
			}
			// Validate a return statement is the last statement
			if _, ok := stmt.(*semantic.ReturnStatement); ok {
				if i != len(s.Body)-1 {
					return errors.New("return statement is not the last statement in the block")
				}
			}
		}
		// Propgate any return value from the nested scope out.
		// Since a return statement is always last we do not have to worry about overriding an existing return value.
		scope.SetReturn(nested.Return())
	case *semantic.ReturnStatement:
		v, err := itrp.doExpression(s.Argument, scope)
		if err != nil {
			return err
		}
		scope.SetReturn(v)
	default:
		return fmt.Errorf("unsupported statement type %T", stmt)
	}
	return nil
}

func (itrp interpreter) doVariableDeclaration(declaration *semantic.NativeVariableDeclaration, scope *Scope) error {
	value, err := itrp.doExpression(declaration.Init, scope)
	if err != nil {
		return err
	}
	scope.Set(declaration.Identifier.Name, value)
	return nil
}

func (itrp interpreter) doExpression(expr semantic.Expression, scope *Scope) (Value, error) {
	switch e := expr.(type) {
	case semantic.Literal:
		return itrp.doLiteral(e)
	case *semantic.ArrayExpression:
		return itrp.doArray(e, scope)
	case *semantic.IdentifierExpression:
		value, ok := scope.Lookup(e.Name)
		if !ok {
			return nil, fmt.Errorf("undefined identifier %q", e.Name)
		}
		return value, nil
	case *semantic.CallExpression:
		v, err := itrp.doCall(e, scope)
		if err != nil {
			// Determine function name
			return nil, errors.Wrapf(err, "error calling function %q", functionName(e))
		}
		return v, nil
	case *semantic.MemberExpression:
		obj, err := itrp.doExpression(e.Object, scope)
		if err != nil {
			return nil, err
		}
		return obj.Property(e.Property)
	case *semantic.ObjectExpression:
		return itrp.doObject(e, scope)
	case *semantic.UnaryExpression:
		v, err := itrp.doExpression(e.Argument, scope)
		if err != nil {
			return nil, err
		}
		switch e.Operator {
		case ast.NotOperator:
			if v.Type() != semantic.Bool {
				return nil, fmt.Errorf("operand to unary expression is not a boolean value, got %v", v.Type())
			}
			return NewBoolValue(!v.Value().(bool)), nil
		case ast.SubtractionOperator:
			switch t := v.Type(); t {
			case semantic.Int:
				return NewIntValue(-v.Value().(int64)), nil
			case semantic.Float:
				return NewFloatValue(-v.Value().(float64)), nil
			case semantic.Duration:
				return NewDurationValue(-v.Value().(time.Duration)), nil
			default:
				return nil, fmt.Errorf("operand to unary expression is not a number value, got %v", v.Type())
			}
		default:
			return nil, fmt.Errorf("unsupported operator %q to unary expression", e.Operator)
		}

	case *semantic.BinaryExpression:
		l, err := itrp.doExpression(e.Left, scope)
		if err != nil {
			return nil, err
		}

		r, err := itrp.doExpression(e.Right, scope)
		if err != nil {
			return nil, err
		}

		bf, ok := binaryFuncLookup[binaryFuncSignature{
			operator: e.Operator,
			left:     l.Type(),
			right:    r.Type(),
		}]
		if !ok {
			return nil, fmt.Errorf("unsupported binary operation: %v %v %v", l.Type(), e.Operator, r.Type())
		}
		return bf(l, r), nil
	case *semantic.LogicalExpression:
		l, err := itrp.doExpression(e.Left, scope)
		if err != nil {
			return nil, err
		}
		if l.Type() != semantic.Bool {
			return nil, fmt.Errorf("left operand to logcial expression is not a boolean value, got %v", l.Type())
		}
		left := l.Value().(bool)

		if e.Operator == ast.AndOperator && !left {
			// Early return
			return NewBoolValue(false), nil
		} else if e.Operator == ast.OrOperator && left {
			// Early return
			return NewBoolValue(true), nil
		}

		r, err := itrp.doExpression(e.Right, scope)
		if err != nil {
			return nil, err
		}
		if r.Type() != semantic.Bool {
			return nil, errors.New("right operand to logcial expression is not a boolean value")
		}
		right := r.Value().(bool)

		switch e.Operator {
		case ast.AndOperator:
			return NewBoolValue(left && right), nil
		case ast.OrOperator:
			return NewBoolValue(left || right), nil
		default:
			return nil, fmt.Errorf("invalid logical operator %v", e.Operator)
		}
	case *semantic.FunctionExpression:
		return value{
			t: semantic.Function,
			v: arrowFunc{
				e:     e,
				scope: scope.Nest(),
			},
		}, nil
	default:
		return nil, fmt.Errorf("unsupported expression %T", expr)
	}
}

func (itrp interpreter) doArray(a *semantic.ArrayExpression, scope *Scope) (Value, error) {
	array := Array{
		Elements: make([]Value, len(a.Elements)),
	}
	elementType := semantic.EmptyArrayType.ElementType()
	for i, el := range a.Elements {
		v, err := itrp.doExpression(el, scope)
		if err != nil {
			return nil, err
		}
		if i == 0 {
			elementType = v.Type()
		}
		if elementType != v.Type() {
			return nil, fmt.Errorf("cannot mix types in an array, found both %v and %v", elementType, v.Type())
		}
		array.Elements[i] = v
	}
	array.typ = semantic.NewArrayType(elementType)
	return array, nil
}

func (itrp interpreter) doObject(m *semantic.ObjectExpression, scope *Scope) (Value, error) {
	obj := Object{
		Properties: make(map[string]Value, len(m.Properties)),
	}
	for _, p := range m.Properties {
		v, err := itrp.doExpression(p.Value, scope)
		if err != nil {
			return nil, err
		}
		if _, ok := obj.Properties[p.Key.Name]; ok {
			return nil, fmt.Errorf("duplicate key in object: %q", p.Key.Name)
		}
		obj.Properties[p.Key.Name] = v
	}
	return obj, nil
}

func (itrp interpreter) doLiteral(lit semantic.Literal) (Value, error) {
	switch l := lit.(type) {
	case *semantic.DateTimeLiteral:
		return value{
			t: semantic.Time,
			v: l.Value,
		}, nil
	case *semantic.DurationLiteral:
		return value{
			t: semantic.Duration,
			v: l.Value,
		}, nil
	case *semantic.FloatLiteral:
		return value{
			t: semantic.Float,
			v: l.Value,
		}, nil
	case *semantic.IntegerLiteral:
		return value{
			t: semantic.Int,
			v: l.Value,
		}, nil
	case *semantic.UnsignedIntegerLiteral:
		return value{
			t: semantic.UInt,
			v: l.Value,
		}, nil
	case *semantic.StringLiteral:
		return value{
			t: semantic.String,
			v: l.Value,
		}, nil
	case *semantic.RegexpLiteral:
		return value{
			t: semantic.Regexp,
			v: l.Value,
		}, nil
	case *semantic.BooleanLiteral:
		return value{
			t: semantic.Bool,
			v: l.Value,
		}, nil
	// semantic.TODO(nathanielc): Support lists and objects
	default:
		return nil, fmt.Errorf("unknown literal type %T", lit)
	}
}

func functionName(call *semantic.CallExpression) string {
	switch callee := call.Callee.(type) {
	case *semantic.IdentifierExpression:
		return callee.Name
	case *semantic.MemberExpression:
		return callee.Property
	default:
		return "<anonymous function>"
	}
}

func (itrp interpreter) doCall(call *semantic.CallExpression, scope *Scope) (Value, error) {
	callee, err := itrp.doExpression(call.Callee, scope)
	if err != nil {
		return nil, err
	}
	if callee.Type() != semantic.Function {
		return nil, fmt.Errorf("cannot call function, value is of type %v", callee.Type())
	}
	f := callee.Value().(Function)
	arguments, err := itrp.doArguments(call.Arguments, scope)
	if err != nil {
		return nil, err
	}

	// Check if the function is an arrowFunc and rebind it.
	if af, ok := f.(arrowFunc); ok {
		af.itrp = itrp
		f = af
	}

	// Call the function
	v, err := f.Call(arguments, itrp.d)
	if err != nil {
		return nil, err
	}
	if unused := arguments.listUnused(); len(unused) > 0 {
		return nil, fmt.Errorf("unused arguments %s", unused)
	}
	return v, nil
}

func (itrp interpreter) doArguments(args *semantic.ObjectExpression, scope *Scope) (Arguments, error) {
	if args == nil || len(args.Properties) == 0 {
		return newArguments(nil), nil
	}
	paramsMap := make(map[string]Value, len(args.Properties))
	for _, p := range args.Properties {
		value, err := itrp.doExpression(p.Value, scope)
		if err != nil {
			return nil, err
		}
		if _, ok := paramsMap[p.Key.Name]; ok {
			return nil, fmt.Errorf("duplicate keyword parameter specified: %q", p.Key.Name)
		}
		paramsMap[p.Key.Name] = value
	}
	return newArguments(paramsMap), nil
}

type Scope struct {
	parent      *Scope
	values      map[string]Value
	returnValue Value
}

func NewScope() *Scope {
	return &Scope{
		values:      make(map[string]Value),
		returnValue: value{t: semantic.Invalid},
	}
}

func (s *Scope) Lookup(name string) (Value, bool) {
	if s == nil {
		return nil, false
	}
	v, ok := s.values[name]
	if !ok {
		return s.parent.Lookup(name)
	}
	return v, ok
}

func (s *Scope) Set(name string, value Value) {
	s.values[name] = value
}

// SetReturn sets the return value of this scope.
func (s *Scope) SetReturn(value Value) {
	s.returnValue = value
}

// Return reports the return value for this scope. If no return value has been set a value with type semantic.TInvalid is returned.
func (s *Scope) Return() Value {
	return s.returnValue
}

func (s *Scope) Names() []string {
	if s == nil {
		return nil
	}
	names := s.parent.Names()
	for k := range s.values {
		names = append(names, k)
	}
	return names
}

// Nest returns a new nested scope.
func (s *Scope) Nest() *Scope {
	c := NewScope()
	c.parent = s
	return c
}

// Copy returns a copy of the scope and its parents.
func (s *Scope) Copy() *Scope {
	c := NewScope()

	// copy parent values into new scope
	curr := s
	for curr != nil {
		// copy values
		for k, v := range curr.values {
			c.values[k] = v
		}
		curr = curr.parent
	}
	return c
}

// Value represents any value that can be the result of evaluating any expression.
type Value interface {
	// Type reports the type of value
	Type() semantic.Type
	// Value returns the actual value represented.
	Value() interface{}
	// Property returns a new value which is a property of this value.
	Property(name string) (Value, error)
}

type value struct {
	t semantic.Type
	v interface{}
}

func (v value) Type() semantic.Type {
	return v.t
}
func (v value) Value() interface{} {
	return v.v
}
func (v value) Property(name string) (Value, error) {
	return nil, fmt.Errorf("property %q does not exist", name)
}
func (v value) String() string {
	return fmt.Sprintf("%v", v.v)
}

func NewBoolValue(v bool) Value {
	return value{
		t: semantic.Bool,
		v: v,
	}
}
func NewIntValue(v int64) Value {
	return value{
		t: semantic.Int,
		v: v,
	}
}
func NewUIntValue(v uint64) Value {
	return value{
		t: semantic.UInt,
		v: v,
	}
}
func NewFloatValue(v float64) Value {
	return value{
		t: semantic.Float,
		v: v,
	}
}
func NewStringValue(v string) Value {
	return value{
		t: semantic.String,
		v: v,
	}
}
func NewTimeValue(v time.Time) Value {
	return value{
		t: semantic.Time,
		v: v,
	}
}
func NewDurationValue(v time.Duration) Value {
	return value{
		t: semantic.Duration,
		v: v,
	}
}

// Function represents a callable type
type Function interface {
	Call(args Arguments, d Domain) (Value, error)
	// Resolve rewrites the function resolving any identifiers not listed in the function params.
	Resolve() (*semantic.FunctionExpression, error)
}

type arrowFunc struct {
	e     *semantic.FunctionExpression
	scope *Scope
	call  func(Arguments, Domain) (Value, error)

	itrp interpreter
}

func (f arrowFunc) Call(args Arguments, d Domain) (Value, error) {
	for _, p := range f.e.Params {
		if p.Default == nil {
			v, err := args.GetRequired(p.Key.Name)
			if err != nil {
				return nil, err
			}
			f.scope.Set(p.Key.Name, v)
		} else {
			v, ok := args.Get(p.Key.Name)
			if !ok {
				// Use default value
				var err error
				v, err = f.itrp.doExpression(p.Default, f.scope)
				if err != nil {
					return nil, err
				}
			}
			f.scope.Set(p.Key.Name, v)
		}
	}
	switch n := f.e.Body.(type) {
	case semantic.Expression:
		return f.itrp.doExpression(n, f.scope)
	case semantic.Statement:
		err := f.itrp.doStatement(n, f.scope)
		if err != nil {
			return nil, err
		}
		v := f.scope.Return()
		if v.Type() == semantic.Invalid {
			return nil, errors.New("arrow function has no return value")
		}
		return v, nil
	default:
		return nil, fmt.Errorf("unsupported arrow function body type %T", f.e.Body)
	}
}

// Resolve rewrites the function resolving any identifiers not listed in the function params.
func (f arrowFunc) Resolve() (*semantic.FunctionExpression, error) {
	n := f.e.Copy()
	node, err := f.resolveIdentifiers(n)
	if err != nil {
		return nil, err
	}
	return node.(*semantic.FunctionExpression), nil
}

func (f arrowFunc) resolveIdentifiers(n semantic.Node) (semantic.Node, error) {
	switch n := n.(type) {
	case *semantic.IdentifierExpression:
		for _, p := range f.e.Params {
			if n.Name == p.Key.Name {
				// Identifier is a parameter do not resolve
				return n, nil
			}
		}
		v, ok := f.scope.Lookup(n.Name)
		if !ok {
			return nil, fmt.Errorf("name %q does not exist in scope", n.Name)
		}
		return resolveValue(v)
	case *semantic.BlockStatement:
		for i, s := range n.Body {
			node, err := f.resolveIdentifiers(s)
			if err != nil {
				return nil, err
			}
			n.Body[i] = node.(semantic.Statement)
		}
	case *semantic.ExpressionStatement:
		node, err := f.resolveIdentifiers(n.Expression)
		if err != nil {
			return nil, err
		}
		n.Expression = node.(semantic.Expression)
	case *semantic.ReturnStatement:
		node, err := f.resolveIdentifiers(n.Argument)
		if err != nil {
			return nil, err
		}
		n.Argument = node.(semantic.Expression)
	case *semantic.NativeVariableDeclaration:
		node, err := f.resolveIdentifiers(n.Init)
		if err != nil {
			return nil, err
		}
		n.Init = node.(semantic.Expression)
	case *semantic.CallExpression:
		node, err := f.resolveIdentifiers(n.Arguments)
		if err != nil {
			return nil, err
		}
		n.Arguments = node.(*semantic.ObjectExpression)
	case *semantic.FunctionExpression:
		node, err := f.resolveIdentifiers(n.Body)
		if err != nil {
			return nil, err
		}
		n.Body = node
	case *semantic.BinaryExpression:
		node, err := f.resolveIdentifiers(n.Left)
		if err != nil {
			return nil, err
		}
		n.Left = node.(semantic.Expression)

		node, err = f.resolveIdentifiers(n.Right)
		if err != nil {
			return nil, err
		}
		n.Right = node.(semantic.Expression)
	case *semantic.UnaryExpression:
		node, err := f.resolveIdentifiers(n.Argument)
		if err != nil {
			return nil, err
		}
		n.Argument = node.(semantic.Expression)
	case *semantic.LogicalExpression:
		node, err := f.resolveIdentifiers(n.Left)
		if err != nil {
			return nil, err
		}
		n.Left = node.(semantic.Expression)
		node, err = f.resolveIdentifiers(n.Right)
		if err != nil {
			return nil, err
		}
		n.Right = node.(semantic.Expression)
	case *semantic.ArrayExpression:
		for i, el := range n.Elements {
			node, err := f.resolveIdentifiers(el)
			if err != nil {
				return nil, err
			}
			n.Elements[i] = node.(semantic.Expression)
		}
	case *semantic.ObjectExpression:
		for i, p := range n.Properties {
			node, err := f.resolveIdentifiers(p)
			if err != nil {
				return nil, err
			}
			n.Properties[i] = node.(*semantic.Property)
		}
	case *semantic.ConditionalExpression:
		node, err := f.resolveIdentifiers(n.Test)
		if err != nil {
			return nil, err
		}
		n.Test = node.(semantic.Expression)

		node, err = f.resolveIdentifiers(n.Alternate)
		if err != nil {
			return nil, err
		}
		n.Alternate = node.(semantic.Expression)

		node, err = f.resolveIdentifiers(n.Consequent)
		if err != nil {
			return nil, err
		}
		n.Consequent = node.(semantic.Expression)
	case *semantic.Property:
		node, err := f.resolveIdentifiers(n.Value)
		if err != nil {
			return nil, err
		}
		n.Value = node.(semantic.Expression)
	}
	return n, nil
}

func resolveValue(v Value) (semantic.Node, error) {
	switch t := v.Type(); t {
	case semantic.String:
		return &semantic.StringLiteral{
			Value: v.Value().(string),
		}, nil
	case semantic.Int:
		return &semantic.IntegerLiteral{
			Value: v.Value().(int64),
		}, nil
	case semantic.UInt:
		return &semantic.UnsignedIntegerLiteral{
			Value: v.Value().(uint64),
		}, nil
	case semantic.Float:
		return &semantic.FloatLiteral{
			Value: v.Value().(float64),
		}, nil
	case semantic.Bool:
		return &semantic.BooleanLiteral{
			Value: v.Value().(bool),
		}, nil
	case semantic.Time:
		return &semantic.DateTimeLiteral{
			Value: v.Value().(time.Time),
		}, nil
	case semantic.Regexp:
		return &semantic.RegexpLiteral{
			Value: v.Value().(*regexp.Regexp),
		}, nil
	case semantic.Duration:
		return &semantic.DurationLiteral{
			Value: v.Value().(time.Duration),
		}, nil
	case semantic.Function:
		return v.Value().(Function).Resolve()
	case semantic.Array:
		arr := v.Value().(Array)
		node := new(semantic.ArrayExpression)
		node.Elements = make([]semantic.Expression, len(arr.Elements))
		for i, el := range arr.Elements {
			n, err := resolveValue(el)
			if err != nil {
				return nil, err
			}
			node.Elements[i] = n.(semantic.Expression)
		}
		return node, nil
	case semantic.Object:
		m := v.Value().(Object)
		node := new(semantic.ObjectExpression)
		node.Properties = make([]*semantic.Property, 0, len(m.Properties))
		for k, el := range m.Properties {
			n, err := resolveValue(el)
			if err != nil {
				return nil, err
			}
			node.Properties = append(node.Properties, &semantic.Property{
				Key:   &semantic.Identifier{Name: k},
				Value: n.(semantic.Expression),
			})
		}
		return node, nil
	default:
		return nil, fmt.Errorf("cannot resove value of type %v", t)
	}
}

// Array represents an sequence of elements
// All elements must be the same type
type Array struct {
	Elements []Value
	typ      semantic.Type
}

func NewArray(elementType semantic.Type) Array {
	return Array{
		typ: semantic.NewArrayType(elementType),
	}
}

func (a Array) Type() semantic.Type {
	return a.typ
}

func (a Array) Value() interface{} {
	return a
}

func (a Array) Property(name string) (Value, error) {
	i, err := strconv.Atoi(name)
	if err != nil {
		return nil, err
	}
	if i < 0 || i >= len(a.Elements) {
		return nil, fmt.Errorf("out of bounds index %d, length: %d", i, len(a.Elements))
	}
	return a.Elements[i], nil
}

func (a Array) AsStrings() []string {
	if a.typ.ElementType() != semantic.String {
		return nil
	}
	strs := make([]string, len(a.Elements))
	for i, v := range a.Elements {
		strs[i] = v.Value().(string)
	}
	return strs
}

// Object represents an association of keys to values.
// Object values may be of any type.
type Object struct {
	Properties map[string]Value
}

func (m Object) Type() semantic.Type {
	propertyTypes := make(map[string]semantic.Type)
	for k, v := range m.Properties {
		propertyTypes[k] = v.Type()
	}
	return semantic.NewObjectType(propertyTypes)
}
func (m Object) Value() interface{} {
	return m
}
func (m Object) Property(name string) (Value, error) {
	v, ok := m.Properties[name]
	if ok {
		return v, nil
	}
	return nil, fmt.Errorf("property %q does not exist", name)
}

// Arguments provides access to the keyword arguments passed to a function.
// semantic.The Get{Type} methods return three values: the typed value of the arg,
// whether the argument was specified and any errors about the argument type.
// semantic.The GetRequired{Type} methods return only two values, the typed value of the arg and any errors, a missing argument is considered an error in this case.
type Arguments interface {
	Get(name string) (Value, bool)
	GetRequired(name string) (Value, error)

	GetString(name string) (string, bool, error)
	GetInt(name string) (int64, bool, error)
	GetFloat(name string) (float64, bool, error)
	GetBool(name string) (bool, bool, error)
	GetFunction(name string) (Function, bool, error)
	GetArray(name string, t semantic.Kind) (Array, bool, error)
	GetObject(name string) (Object, bool, error)

	GetRequiredString(name string) (string, error)
	GetRequiredInt(name string) (int64, error)
	GetRequiredFloat(name string) (float64, error)
	GetRequiredBool(name string) (bool, error)
	GetRequiredFunction(name string) (Function, error)
	GetRequiredArray(name string, t semantic.Kind) (Array, error)
	GetRequiredObject(name string) (Object, error)

	// listUnused returns the list of provided arguments that were not used by the function.
	listUnused() []string
}

type arguments struct {
	params map[string]Value
	used   map[string]bool
}

func newArguments(params map[string]Value) *arguments {
	return &arguments{
		params: params,
		used:   make(map[string]bool, len(params)),
	}
}

func (a *arguments) Get(name string) (Value, bool) {
	a.used[name] = true
	v, ok := a.params[name]
	return v, ok
}

func (a *arguments) GetRequired(name string) (Value, error) {
	a.used[name] = true
	v, ok := a.params[name]
	if !ok {
		return nil, fmt.Errorf("missing required keyword argument %q", name)
	}
	return v, nil
}

func (a *arguments) GetString(name string) (string, bool, error) {
	v, ok, err := a.get(name, semantic.String, false)
	if err != nil || !ok {
		return "", ok, err
	}
	return v.Value().(string), ok, nil
}
func (a *arguments) GetRequiredString(name string) (string, error) {
	v, _, err := a.get(name, semantic.String, true)
	if err != nil {
		return "", err
	}
	return v.Value().(string), nil
}
func (a *arguments) GetInt(name string) (int64, bool, error) {
	v, ok, err := a.get(name, semantic.Int, false)
	if err != nil || !ok {
		return 0, ok, err
	}
	return v.Value().(int64), ok, nil
}
func (a *arguments) GetRequiredInt(name string) (int64, error) {
	v, _, err := a.get(name, semantic.Int, true)
	if err != nil {
		return 0, err
	}
	return v.Value().(int64), nil
}
func (a *arguments) GetFloat(name string) (float64, bool, error) {
	v, ok, err := a.get(name, semantic.Float, false)
	if err != nil || !ok {
		return 0, ok, err
	}
	return v.Value().(float64), ok, nil
}
func (a *arguments) GetRequiredFloat(name string) (float64, error) {
	v, _, err := a.get(name, semantic.Float, true)
	if err != nil {
		return 0, err
	}
	return v.Value().(float64), nil
}
func (a *arguments) GetBool(name string) (bool, bool, error) {
	v, ok, err := a.get(name, semantic.Bool, false)
	if err != nil || !ok {
		return false, ok, err
	}
	return v.Value().(bool), ok, nil
}
func (a *arguments) GetRequiredBool(name string) (bool, error) {
	v, _, err := a.get(name, semantic.Bool, true)
	if err != nil {
		return false, err
	}
	return v.Value().(bool), nil
}

func (a *arguments) GetArray(name string, t semantic.Kind) (Array, bool, error) {
	v, ok, err := a.get(name, semantic.Array, false)
	if err != nil || !ok {
		return Array{}, ok, err
	}
	arr := v.Value().(Array)
	if arr.Type().ElementType() != t {
		return Array{}, true, fmt.Errorf("keyword argument %q should be of an array of type %v, but got an array of type %v", name, t, arr.Type())
	}
	return v.Value().(Array), ok, nil
}
func (a *arguments) GetRequiredArray(name string, t semantic.Kind) (Array, error) {
	v, _, err := a.get(name, semantic.Array, true)
	if err != nil {
		return Array{}, err
	}
	arr := v.Value().(Array)
	if arr.Type().ElementType() != t {
		return Array{}, fmt.Errorf("keyword argument %q should be of an array of type %v, but got an array of type %v", name, t, arr.Type())
	}
	return arr, nil
}
func (a *arguments) GetFunction(name string) (Function, bool, error) {
	v, ok, err := a.get(name, semantic.Function, false)
	if err != nil || !ok {
		return nil, ok, err
	}
	return v.Value().(Function), ok, nil
}
func (a *arguments) GetRequiredFunction(name string) (Function, error) {
	v, _, err := a.get(name, semantic.Function, true)
	if err != nil {
		return nil, err
	}
	return v.Value().(Function), nil
}

func (a *arguments) GetObject(name string) (Object, bool, error) {
	v, ok, err := a.get(name, semantic.Object, false)
	if err != nil || !ok {
		return Object{}, ok, err
	}
	return v.Value().(Object), ok, nil
}
func (a *arguments) GetRequiredObject(name string) (Object, error) {
	v, _, err := a.get(name, semantic.Object, true)
	if err != nil {
		return Object{}, err
	}
	return v.Value().(Object), nil
}

func (a *arguments) get(name string, kind semantic.Kind, required bool) (Value, bool, error) {
	a.used[name] = true
	v, ok := a.params[name]
	if !ok {
		if required {
			return nil, false, fmt.Errorf("missing required keyword argument %q", name)
		}
		return nil, false, nil
	}
	if v.Type().Kind() != kind {
		return nil, true, fmt.Errorf("keyword argument %q should be of kind %v, but got %v", name, kind, v.Type().Kind())
	}
	return v, true, nil
}

func (a *arguments) listUnused() []string {
	var unused []string
	for k := range a.params {
		if !a.used[k] {
			unused = append(unused, k)
		}
	}

	return unused
}

type binaryFunc func(l, r Value) Value

type binaryFuncSignature struct {
	operator    ast.OperatorKind
	left, right semantic.Type
}

var binaryFuncLookup = map[binaryFuncSignature]binaryFunc{
	//---------------
	// Math Operators
	//---------------
	{operator: ast.AdditionOperator, left: semantic.Int, right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Value().(int64)
		r := rv.Value().(int64)
		return NewIntValue(l + r)
	},
	{operator: ast.AdditionOperator, left: semantic.UInt, right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Value().(uint64)
		r := rv.Value().(uint64)
		return NewUIntValue(l + r)
	},
	{operator: ast.AdditionOperator, left: semantic.Float, right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Value().(float64)
		r := rv.Value().(float64)
		return NewFloatValue(l + r)
	},
	{operator: ast.SubtractionOperator, left: semantic.Int, right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Value().(int64)
		r := rv.Value().(int64)
		return NewIntValue(l - r)
	},
	{operator: ast.SubtractionOperator, left: semantic.UInt, right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Value().(uint64)
		r := rv.Value().(uint64)
		return NewUIntValue(l - r)
	},
	{operator: ast.SubtractionOperator, left: semantic.Float, right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Value().(float64)
		r := rv.Value().(float64)
		return NewFloatValue(l - r)
	},
	{operator: ast.MultiplicationOperator, left: semantic.Int, right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Value().(int64)
		r := rv.Value().(int64)
		return NewIntValue(l * r)
	},
	{operator: ast.MultiplicationOperator, left: semantic.UInt, right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Value().(uint64)
		r := rv.Value().(uint64)
		return NewUIntValue(l * r)
	},
	{operator: ast.MultiplicationOperator, left: semantic.Float, right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Value().(float64)
		r := rv.Value().(float64)
		return NewFloatValue(l * r)
	},
	{operator: ast.DivisionOperator, left: semantic.Int, right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Value().(int64)
		r := rv.Value().(int64)
		return NewIntValue(l / r)
	},
	{operator: ast.DivisionOperator, left: semantic.UInt, right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Value().(uint64)
		r := rv.Value().(uint64)
		return NewUIntValue(l / r)
	},
	{operator: ast.DivisionOperator, left: semantic.Float, right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Value().(float64)
		r := rv.Value().(float64)
		return NewFloatValue(l / r)
	},

	//---------------------
	// Comparison Operators
	//---------------------

	// LessThanEqualOperator

	{operator: ast.LessThanEqualOperator, left: semantic.Int, right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Value().(int64)
		r := rv.Value().(int64)
		return NewBoolValue(l <= r)
	},
	{operator: ast.LessThanEqualOperator, left: semantic.Int, right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Value().(int64)
		r := rv.Value().(uint64)
		if l < 0 {
			return NewBoolValue(true)
		}
		return NewBoolValue(uint64(l) <= r)
	},
	{operator: ast.LessThanEqualOperator, left: semantic.Int, right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Value().(int64)
		r := rv.Value().(float64)
		return NewBoolValue(float64(l) <= r)
	},
	{operator: ast.LessThanEqualOperator, left: semantic.UInt, right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Value().(uint64)
		r := rv.Value().(int64)
		if r < 0 {
			return NewBoolValue(false)
		}
		return NewBoolValue(l <= uint64(r))
	},
	{operator: ast.LessThanEqualOperator, left: semantic.UInt, right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Value().(uint64)
		r := rv.Value().(uint64)
		return NewBoolValue(l <= r)
	},
	{operator: ast.LessThanEqualOperator, left: semantic.UInt, right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Value().(uint64)
		r := rv.Value().(float64)
		return NewBoolValue(float64(l) <= r)
	},
	{operator: ast.LessThanEqualOperator, left: semantic.Float, right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Value().(float64)
		r := rv.Value().(int64)
		return NewBoolValue(l <= float64(r))
	},
	{operator: ast.LessThanEqualOperator, left: semantic.Float, right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Value().(float64)
		r := rv.Value().(uint64)
		return NewBoolValue(l <= float64(r))
	},
	{operator: ast.LessThanEqualOperator, left: semantic.Float, right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Value().(float64)
		r := rv.Value().(float64)
		return NewBoolValue(l <= r)
	},

	// LessThanOperator

	{operator: ast.LessThanOperator, left: semantic.Int, right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Value().(int64)
		r := rv.Value().(int64)
		return NewBoolValue(l < r)
	},
	{operator: ast.LessThanOperator, left: semantic.Int, right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Value().(int64)
		r := rv.Value().(uint64)
		if l < 0 {
			return NewBoolValue(true)
		}
		return NewBoolValue(uint64(l) < r)
	},
	{operator: ast.LessThanOperator, left: semantic.Int, right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Value().(int64)
		r := rv.Value().(float64)
		return NewBoolValue(float64(l) < r)
	},
	{operator: ast.LessThanOperator, left: semantic.UInt, right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Value().(uint64)
		r := rv.Value().(int64)
		if r < 0 {
			return NewBoolValue(false)
		}
		return NewBoolValue(l < uint64(r))
	},
	{operator: ast.LessThanOperator, left: semantic.UInt, right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Value().(uint64)
		r := rv.Value().(uint64)
		return NewBoolValue(l < r)
	},
	{operator: ast.LessThanOperator, left: semantic.UInt, right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Value().(uint64)
		r := rv.Value().(float64)
		return NewBoolValue(float64(l) < r)
	},
	{operator: ast.LessThanOperator, left: semantic.Float, right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Value().(float64)
		r := rv.Value().(int64)
		return NewBoolValue(l < float64(r))
	},
	{operator: ast.LessThanOperator, left: semantic.Float, right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Value().(float64)
		r := rv.Value().(uint64)
		return NewBoolValue(l < float64(r))
	},
	{operator: ast.LessThanOperator, left: semantic.Float, right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Value().(float64)
		r := rv.Value().(float64)
		return NewBoolValue(l < r)
	},

	// GreaterThanEqualOperator

	{operator: ast.GreaterThanEqualOperator, left: semantic.Int, right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Value().(int64)
		r := rv.Value().(int64)
		return NewBoolValue(l >= r)
	},
	{operator: ast.GreaterThanEqualOperator, left: semantic.Int, right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Value().(int64)
		r := rv.Value().(uint64)
		if l < 0 {
			return NewBoolValue(true)
		}
		return NewBoolValue(uint64(l) >= r)
	},
	{operator: ast.GreaterThanEqualOperator, left: semantic.Int, right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Value().(int64)
		r := rv.Value().(float64)
		return NewBoolValue(float64(l) >= r)
	},
	{operator: ast.GreaterThanEqualOperator, left: semantic.UInt, right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Value().(uint64)
		r := rv.Value().(int64)
		if r < 0 {
			return NewBoolValue(false)
		}
		return NewBoolValue(l >= uint64(r))
	},
	{operator: ast.GreaterThanEqualOperator, left: semantic.UInt, right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Value().(uint64)
		r := rv.Value().(uint64)
		return NewBoolValue(l >= r)
	},
	{operator: ast.GreaterThanEqualOperator, left: semantic.UInt, right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Value().(uint64)
		r := rv.Value().(float64)
		return NewBoolValue(float64(l) >= r)
	},
	{operator: ast.GreaterThanEqualOperator, left: semantic.Float, right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Value().(float64)
		r := rv.Value().(int64)
		return NewBoolValue(l >= float64(r))
	},
	{operator: ast.GreaterThanEqualOperator, left: semantic.Float, right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Value().(float64)
		r := rv.Value().(uint64)
		return NewBoolValue(l >= float64(r))
	},
	{operator: ast.GreaterThanEqualOperator, left: semantic.Float, right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Value().(float64)
		r := rv.Value().(float64)
		return NewBoolValue(l >= r)
	},

	// GreaterThanOperator

	{operator: ast.GreaterThanOperator, left: semantic.Int, right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Value().(int64)
		r := rv.Value().(int64)
		return NewBoolValue(l > r)
	},
	{operator: ast.GreaterThanOperator, left: semantic.Int, right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Value().(int64)
		r := rv.Value().(uint64)
		if l < 0 {
			return NewBoolValue(true)
		}
		return NewBoolValue(uint64(l) > r)
	},
	{operator: ast.GreaterThanOperator, left: semantic.Int, right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Value().(int64)
		r := rv.Value().(float64)
		return NewBoolValue(float64(l) > r)
	},
	{operator: ast.GreaterThanOperator, left: semantic.UInt, right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Value().(uint64)
		r := rv.Value().(int64)
		if r < 0 {
			return NewBoolValue(false)
		}
		return NewBoolValue(l > uint64(r))
	},
	{operator: ast.GreaterThanOperator, left: semantic.UInt, right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Value().(uint64)
		r := rv.Value().(uint64)
		return NewBoolValue(l > r)
	},
	{operator: ast.GreaterThanOperator, left: semantic.UInt, right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Value().(uint64)
		r := rv.Value().(float64)
		return NewBoolValue(float64(l) > r)
	},
	{operator: ast.GreaterThanOperator, left: semantic.Float, right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Value().(float64)
		r := rv.Value().(int64)
		return NewBoolValue(l > float64(r))
	},
	{operator: ast.GreaterThanOperator, left: semantic.Float, right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Value().(float64)
		r := rv.Value().(uint64)
		return NewBoolValue(l > float64(r))
	},
	{operator: ast.GreaterThanOperator, left: semantic.Float, right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Value().(float64)
		r := rv.Value().(float64)
		return NewBoolValue(l > r)
	},

	// EqualOperator

	{operator: ast.EqualOperator, left: semantic.Int, right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Value().(int64)
		r := rv.Value().(int64)
		return NewBoolValue(l == r)
	},
	{operator: ast.EqualOperator, left: semantic.Int, right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Value().(int64)
		r := rv.Value().(uint64)
		if l < 0 {
			return NewBoolValue(false)
		}
		return NewBoolValue(uint64(l) == r)
	},
	{operator: ast.EqualOperator, left: semantic.Int, right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Value().(int64)
		r := rv.Value().(float64)
		return NewBoolValue(float64(l) == r)
	},
	{operator: ast.EqualOperator, left: semantic.UInt, right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Value().(uint64)
		r := rv.Value().(int64)
		if r < 0 {
			return NewBoolValue(false)
		}
		return NewBoolValue(l == uint64(r))
	},
	{operator: ast.EqualOperator, left: semantic.UInt, right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Value().(uint64)
		r := rv.Value().(uint64)
		return NewBoolValue(l == r)
	},
	{operator: ast.EqualOperator, left: semantic.UInt, right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Value().(uint64)
		r := rv.Value().(float64)
		return NewBoolValue(float64(l) == r)
	},
	{operator: ast.EqualOperator, left: semantic.Float, right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Value().(float64)
		r := rv.Value().(int64)
		return NewBoolValue(l == float64(r))
	},
	{operator: ast.EqualOperator, left: semantic.Float, right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Value().(float64)
		r := rv.Value().(uint64)
		return NewBoolValue(l == float64(r))
	},
	{operator: ast.EqualOperator, left: semantic.Float, right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Value().(float64)
		r := rv.Value().(float64)
		return NewBoolValue(l == r)
	},
	{operator: ast.EqualOperator, left: semantic.String, right: semantic.String}: func(lv, rv Value) Value {
		l := lv.Value().(string)
		r := rv.Value().(string)
		return NewBoolValue(l == r)
	},

	// NotEqualOperator

	{operator: ast.NotEqualOperator, left: semantic.Int, right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Value().(int64)
		r := rv.Value().(int64)
		return NewBoolValue(l != r)
	},
	{operator: ast.NotEqualOperator, left: semantic.Int, right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Value().(int64)
		r := rv.Value().(uint64)
		if l < 0 {
			return NewBoolValue(true)
		}
		return NewBoolValue(uint64(l) != r)
	},
	{operator: ast.NotEqualOperator, left: semantic.Int, right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Value().(int64)
		r := rv.Value().(float64)
		return NewBoolValue(float64(l) != r)
	},
	{operator: ast.NotEqualOperator, left: semantic.UInt, right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Value().(uint64)
		r := rv.Value().(int64)
		if r < 0 {
			return NewBoolValue(true)
		}
		return NewBoolValue(l != uint64(r))
	},
	{operator: ast.NotEqualOperator, left: semantic.UInt, right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Value().(uint64)
		r := rv.Value().(uint64)
		return NewBoolValue(l != r)
	},
	{operator: ast.NotEqualOperator, left: semantic.UInt, right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Value().(uint64)
		r := rv.Value().(float64)
		return NewBoolValue(float64(l) != r)
	},
	{operator: ast.NotEqualOperator, left: semantic.Float, right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Value().(float64)
		r := rv.Value().(int64)
		return NewBoolValue(l != float64(r))
	},
	{operator: ast.NotEqualOperator, left: semantic.Float, right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Value().(float64)
		r := rv.Value().(uint64)
		return NewBoolValue(l != float64(r))
	},
	{operator: ast.NotEqualOperator, left: semantic.Float, right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Value().(float64)
		r := rv.Value().(float64)
		return NewBoolValue(l != r)
	},
	{operator: ast.NotEqualOperator, left: semantic.String, right: semantic.String}: func(lv, rv Value) Value {
		l := lv.Value().(string)
		r := rv.Value().(string)
		return NewBoolValue(l != r)
	},
	{operator: ast.RegexpMatchOperator, left: semantic.String, right: semantic.Regexp}: func(lv, rv Value) Value {
		l := lv.Value().(string)
		r := rv.Value().(*regexp.Regexp)
		return NewBoolValue(r.MatchString(l))
	},
	{operator: ast.RegexpMatchOperator, left: semantic.Regexp, right: semantic.String}: func(lv, rv Value) Value {
		l := lv.Value().(*regexp.Regexp)
		r := rv.Value().(string)
		return NewBoolValue(l.MatchString(r))
	},
	{operator: ast.NotRegexpMatchOperator, left: semantic.String, right: semantic.Regexp}: func(lv, rv Value) Value {
		l := lv.Value().(string)
		r := rv.Value().(*regexp.Regexp)
		return NewBoolValue(!r.MatchString(l))
	},
	{operator: ast.NotRegexpMatchOperator, left: semantic.Regexp, right: semantic.String}: func(lv, rv Value) Value {
		l := lv.Value().(*regexp.Regexp)
		r := rv.Value().(string)
		return NewBoolValue(!l.MatchString(r))
	},
}
