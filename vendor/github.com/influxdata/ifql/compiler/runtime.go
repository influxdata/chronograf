package compiler

import (
	"fmt"
	"regexp"

	"github.com/influxdata/ifql/ast"
	"github.com/influxdata/ifql/semantic"
)

type Evaluator interface {
	Type() semantic.Type
	EvalBool(scope Scope) bool
	EvalInt(scope Scope) int64
	EvalUInt(scope Scope) uint64
	EvalFloat(scope Scope) float64
	EvalString(scope Scope) string
	EvalRegexp(scope Scope) *regexp.Regexp
	EvalTime(scope Scope) Time
	EvalObject(scope Scope) *Object
}

type Func interface {
	Type() semantic.Type
	Eval(scope Scope) (Value, error)
	EvalBool(scope Scope) (bool, error)
	EvalInt(scope Scope) (int64, error)
	EvalUInt(scope Scope) (uint64, error)
	EvalFloat(scope Scope) (float64, error)
	EvalString(scope Scope) (string, error)
	EvalRegexp(scope Scope) (*regexp.Regexp, error)
	EvalTime(scope Scope) (Time, error)
	EvalObject(scope Scope) (*Object, error)
}

type Time int64

type compiledFn struct {
	root    Evaluator
	inTypes map[string]semantic.Type
}

func (c compiledFn) validate(scope Scope) error {
	// Validate scope
	for k, t := range c.inTypes {
		if scope.Type(k) != t {
			return fmt.Errorf("missing or incorrectly typed value found in scope for name %q", k)
		}
	}
	return nil
}

func (c compiledFn) Type() semantic.Type {
	return c.root.Type()
}

func (c compiledFn) Eval(scope Scope) (Value, error) {
	if err := c.validate(scope); err != nil {
		return nil, err
	}
	var val interface{}
	switch c.Type().Kind() {
	case semantic.Bool:
		val = c.root.EvalBool(scope)
	case semantic.Int:
		val = c.root.EvalInt(scope)
	case semantic.UInt:
		val = c.root.EvalUInt(scope)
	case semantic.Float:
		val = c.root.EvalFloat(scope)
	case semantic.String:
		val = c.root.EvalString(scope)
	case semantic.Regexp:
		val = c.root.EvalRegexp(scope)
	case semantic.Time:
		val = c.root.EvalTime(scope)
	case semantic.Object:
		val = c.root.EvalObject(scope)
	default:
		return nil, fmt.Errorf("unsupported kind %s", c.Type().Kind())
	}
	return value{
		typ:   c.Type(),
		Value: val,
	}, nil
}

func (c compiledFn) EvalBool(scope Scope) (bool, error) {
	if err := c.validate(scope); err != nil {
		return false, err
	}
	return c.root.EvalBool(scope), nil
}
func (c compiledFn) EvalInt(scope Scope) (int64, error) {
	if err := c.validate(scope); err != nil {
		return 0, err
	}
	return c.root.EvalInt(scope), nil
}
func (c compiledFn) EvalUInt(scope Scope) (uint64, error) {
	if err := c.validate(scope); err != nil {
		return 0, err
	}
	return c.root.EvalUInt(scope), nil
}
func (c compiledFn) EvalFloat(scope Scope) (float64, error) {
	if err := c.validate(scope); err != nil {
		return 0, err
	}
	return c.root.EvalFloat(scope), nil
}
func (c compiledFn) EvalString(scope Scope) (string, error) {
	if err := c.validate(scope); err != nil {
		return "", err
	}
	return c.root.EvalString(scope), nil
}
func (c compiledFn) EvalRegexp(scope Scope) (*regexp.Regexp, error) {
	if err := c.validate(scope); err != nil {
		return nil, err
	}
	return c.root.EvalRegexp(scope), nil
}
func (c compiledFn) EvalTime(scope Scope) (Time, error) {
	if err := c.validate(scope); err != nil {
		return 0, err
	}
	return c.root.EvalTime(scope), nil
}
func (c compiledFn) EvalObject(scope Scope) (*Object, error) {
	if err := c.validate(scope); err != nil {
		return nil, err
	}
	return c.root.EvalObject(scope), nil
}

type Value interface {
	Type() semantic.Type
	Bool() bool
	Int() int64
	UInt() uint64
	Float() float64
	Str() string
	Regexp() *regexp.Regexp
	Time() Time
	Object() *Object
}

type value struct {
	typ   semantic.Type
	Value interface{}
}

func (v value) Type() semantic.Type {
	return v.typ
}
func (v value) Bool() bool {
	return v.Value.(bool)
}
func (v value) Int() int64 {
	return v.Value.(int64)
}
func (v value) UInt() uint64 {
	return v.Value.(uint64)
}
func (v value) Float() float64 {
	return v.Value.(float64)
}
func (v value) Str() string {
	return v.Value.(string)
}
func (v value) Regexp() *regexp.Regexp {
	return v.Value.(*regexp.Regexp)
}
func (v value) Time() Time {
	return v.Value.(Time)
}
func (v value) Object() *Object {
	return v.Value.(*Object)
}

func NewBool(v bool) Value {
	return value{
		typ:   semantic.Bool,
		Value: v,
	}
}
func NewUInt(v uint64) Value {
	return value{
		typ:   semantic.UInt,
		Value: v,
	}
}
func NewInt(v int64) Value {
	return value{
		typ:   semantic.Int,
		Value: v,
	}
}
func NewFloat(v float64) Value {
	return value{
		typ:   semantic.Float,
		Value: v,
	}
}
func NewString(v string) Value {
	return value{
		typ:   semantic.String,
		Value: v,
	}
}
func NewRegexp(v *regexp.Regexp) Value {
	return value{
		typ:   semantic.Regexp,
		Value: v,
	}
}
func NewTime(v Time) Value {
	return value{
		typ:   semantic.Time,
		Value: v,
	}
}

type Scope map[string]Value

func (s Scope) Type(name string) semantic.Type {
	return s[name].Type()
}
func (s Scope) Set(name string, v Value) {
	s[name] = v
}
func (s Scope) GetBool(name string) bool {
	return s[name].Bool()
}
func (s Scope) GetInt(name string) int64 {
	return s[name].Int()
}
func (s Scope) GetUInt(name string) uint64 {
	return s[name].UInt()
}
func (s Scope) GetFloat(name string) float64 {
	return s[name].Float()
}
func (s Scope) GetString(name string) string {
	return s[name].Str()
}
func (s Scope) GetRegexp(name string) *regexp.Regexp {
	return s[name].Regexp()
}
func (s Scope) GetTime(name string) Time {
	return s[name].Time()
}
func (s Scope) GetObject(name string) *Object {
	return s[name].Object()
}

func eval(e Evaluator, scope Scope) Value {
	switch e.Type().Kind() {
	case semantic.Bool:
		return NewBool(e.EvalBool(scope))
	case semantic.Int:
		return NewInt(e.EvalInt(scope))
	case semantic.UInt:
		return NewUInt(e.EvalUInt(scope))
	case semantic.Float:
		return NewFloat(e.EvalFloat(scope))
	case semantic.String:
		return NewString(e.EvalString(scope))
	case semantic.Regexp:
		return NewRegexp(e.EvalRegexp(scope))
	case semantic.Time:
		return NewTime(e.EvalTime(scope))
	default:
		return nil
	}
}

func checkKind(act, exp semantic.Kind) {
	if act != exp {
		panic(unexpectedKind(act, exp))
	}
}

func unexpectedKind(act, exp semantic.Kind) error {
	return fmt.Errorf("unexpected kind: got %q want %q", act, exp)
}

type blockEvaluator struct {
	t     semantic.Type
	body  []Evaluator
	value Value
}

func (e *blockEvaluator) Type() semantic.Type {
	return e.t
}

func (e *blockEvaluator) eval(scope Scope) {
	for _, b := range e.body {
		e.value = eval(b, scope)
	}
}

func (e *blockEvaluator) EvalBool(scope Scope) bool {
	checkKind(e.t.Kind(), semantic.Bool)
	e.eval(scope)
	return e.value.Bool()
}

func (e *blockEvaluator) EvalInt(scope Scope) int64 {
	checkKind(e.t.Kind(), semantic.Int)
	e.eval(scope)
	return e.value.Int()
}

func (e *blockEvaluator) EvalUInt(scope Scope) uint64 {
	checkKind(e.t.Kind(), semantic.UInt)
	e.eval(scope)
	return e.value.UInt()
}

func (e *blockEvaluator) EvalFloat(scope Scope) float64 {
	checkKind(e.t.Kind(), semantic.Float)
	e.eval(scope)
	return e.value.Float()
}

func (e *blockEvaluator) EvalString(scope Scope) string {
	checkKind(e.t.Kind(), semantic.String)
	e.eval(scope)
	return e.value.Str()
}
func (e *blockEvaluator) EvalRegexp(scope Scope) *regexp.Regexp {
	checkKind(e.t.Kind(), semantic.Regexp)
	e.eval(scope)
	return e.value.Regexp()
}

func (e *blockEvaluator) EvalTime(scope Scope) Time {
	checkKind(e.t.Kind(), semantic.Time)
	e.eval(scope)
	return e.value.Time()
}
func (e *blockEvaluator) EvalObject(scope Scope) *Object {
	checkKind(e.t.Kind(), semantic.Object)
	e.eval(scope)
	return e.value.Object()
}

type returnEvaluator struct {
	Evaluator
}

type declarationEvaluator struct {
	t    semantic.Type
	id   string
	init Evaluator
}

func (e *declarationEvaluator) Type() semantic.Type {
	return e.t
}

func (e *declarationEvaluator) eval(scope Scope) {
	scope.Set(e.id, eval(e.init, scope))
}

func (e *declarationEvaluator) EvalBool(scope Scope) bool {
	e.eval(scope)
	return scope.GetBool(e.id)
}

func (e *declarationEvaluator) EvalInt(scope Scope) int64 {
	e.eval(scope)
	return scope.GetInt(e.id)
}

func (e *declarationEvaluator) EvalUInt(scope Scope) uint64 {
	e.eval(scope)
	return scope.GetUInt(e.id)
}

func (e *declarationEvaluator) EvalFloat(scope Scope) float64 {
	e.eval(scope)
	return scope.GetFloat(e.id)
}

func (e *declarationEvaluator) EvalString(scope Scope) string {
	e.eval(scope)
	return scope.GetString(e.id)
}
func (e *declarationEvaluator) EvalRegexp(scope Scope) *regexp.Regexp {
	e.eval(scope)
	return scope.GetRegexp(e.id)
}

func (e *declarationEvaluator) EvalTime(scope Scope) Time {
	e.eval(scope)
	return scope.GetTime(e.id)
}

func (e *declarationEvaluator) EvalObject(scope Scope) *Object {
	e.eval(scope)
	return scope.GetObject(e.id)
}

type mapEvaluator struct {
	t          semantic.Type
	properties map[string]Evaluator
}

func (e *mapEvaluator) Type() semantic.Type {
	return e.t
}

func (e *mapEvaluator) EvalBool(scope Scope) bool {
	panic(unexpectedKind(e.t.Kind(), semantic.Bool))
}

func (e *mapEvaluator) EvalInt(scope Scope) int64 {
	panic(unexpectedKind(e.t.Kind(), semantic.Int))
}

func (e *mapEvaluator) EvalUInt(scope Scope) uint64 {
	panic(unexpectedKind(e.t.Kind(), semantic.UInt))
}

func (e *mapEvaluator) EvalFloat(scope Scope) float64 {
	panic(unexpectedKind(e.t.Kind(), semantic.Float))
}

func (e *mapEvaluator) EvalString(scope Scope) string {
	panic(unexpectedKind(e.t.Kind(), semantic.String))
}
func (e *mapEvaluator) EvalRegexp(scope Scope) *regexp.Regexp {
	panic(unexpectedKind(e.t.Kind(), semantic.Regexp))
}

func (e *mapEvaluator) EvalTime(scope Scope) Time {
	panic(unexpectedKind(e.t.Kind(), semantic.Time))
}
func (e *mapEvaluator) EvalObject(scope Scope) *Object {
	obj := NewObject()
	for k, node := range e.properties {
		v := eval(node, scope)
		obj.Set(k, v)
	}
	return obj
}

type Object struct {
	values        map[string]Value
	propertyTypes map[string]semantic.Type
	typ           semantic.Type
}

func NewObject() *Object {
	return &Object{
		values:        make(map[string]Value),
		propertyTypes: make(map[string]semantic.Type),
	}
}

func (o *Object) Set(name string, v Value) {
	o.values[name] = v
	if o.propertyTypes[name] != v.Type() {
		o.SetPropertyType(name, v.Type())
	}
}
func (o *Object) Get(name string) Value {
	return o.values[name]
}
func (o *Object) SetPropertyType(name string, t semantic.Type) {
	o.propertyTypes[name] = t
	o.typ = nil
}
func (o *Object) Type() semantic.Type {
	if o.typ == nil {
		o.typ = semantic.NewObjectType(o.propertyTypes)
	}
	return o.typ
}
func (o *Object) Bool() bool {
	panic("map is not a boolean")
}

func (o *Object) Int() int64 {
	panic("map is not a int")
}

func (o *Object) UInt() uint64 {
	panic("map is not a uint")
}

func (o *Object) Float() float64 {
	panic("map is not a float")
}

func (o *Object) Str() string {
	panic("map is not a string")
}
func (o *Object) Regexp() *regexp.Regexp {
	panic("map is not a regular expression")
}

func (o *Object) Time() Time {
	panic("map is not a time")
}

func (o *Object) Object() *Object {
	return o
}

type logicalEvaluator struct {
	t           semantic.Type
	operator    ast.LogicalOperatorKind
	left, right Evaluator
}

func (e *logicalEvaluator) Type() semantic.Type {
	return e.t
}

func (e *logicalEvaluator) EvalBool(scope Scope) bool {
	switch e.operator {
	case ast.AndOperator:
		return e.left.EvalBool(scope) && e.right.EvalBool(scope)
	case ast.OrOperator:
		return e.left.EvalBool(scope) || e.right.EvalBool(scope)
	default:
		panic(fmt.Errorf("unknown logical operator %v", e.operator))
	}
}

func (e *logicalEvaluator) EvalInt(scope Scope) int64 {
	panic(unexpectedKind(e.t.Kind(), semantic.Int))
}

func (e *logicalEvaluator) EvalUInt(scope Scope) uint64 {
	panic(unexpectedKind(e.t.Kind(), semantic.UInt))
}

func (e *logicalEvaluator) EvalFloat(scope Scope) float64 {
	panic(unexpectedKind(e.t.Kind(), semantic.Float))
}

func (e *logicalEvaluator) EvalString(scope Scope) string {
	panic(unexpectedKind(e.t.Kind(), semantic.String))
}
func (e *logicalEvaluator) EvalRegexp(scope Scope) *regexp.Regexp {
	panic(unexpectedKind(e.t.Kind(), semantic.Regexp))
}

func (e *logicalEvaluator) EvalTime(scope Scope) Time {
	panic(unexpectedKind(e.t.Kind(), semantic.Time))
}
func (e *logicalEvaluator) EvalObject(scope Scope) *Object {
	panic(unexpectedKind(e.t.Kind(), semantic.Object))
}

type binaryFunc func(scope Scope, left, right Evaluator) Value

type binarySignature struct {
	Operator    ast.OperatorKind
	Left, Right semantic.Type
}

type binaryEvaluator struct {
	t           semantic.Type
	left, right Evaluator
	f           binaryFunc
}

func (e *binaryEvaluator) Type() semantic.Type {
	return e.t
}

func (e *binaryEvaluator) EvalBool(scope Scope) bool {
	return e.f(scope, e.left, e.right).Bool()
}

func (e *binaryEvaluator) EvalInt(scope Scope) int64 {
	return e.f(scope, e.left, e.right).Int()
}

func (e *binaryEvaluator) EvalUInt(scope Scope) uint64 {
	return e.f(scope, e.left, e.right).UInt()
}

func (e *binaryEvaluator) EvalFloat(scope Scope) float64 {
	return e.f(scope, e.left, e.right).Float()
}

func (e *binaryEvaluator) EvalString(scope Scope) string {
	return e.f(scope, e.left, e.right).Str()
}

func (e *binaryEvaluator) EvalRegexp(scope Scope) *regexp.Regexp {
	panic(unexpectedKind(e.t.Kind(), semantic.Regexp))
}

func (e *binaryEvaluator) EvalTime(scope Scope) Time {
	return e.f(scope, e.left, e.right).Time()
}
func (e *binaryEvaluator) EvalObject(scope Scope) *Object {
	panic(unexpectedKind(e.t.Kind(), semantic.Object))
}

type unaryEvaluator struct {
	t    semantic.Type
	node Evaluator
}

func (e *unaryEvaluator) Type() semantic.Type {
	return e.t
}

func (e *unaryEvaluator) EvalBool(scope Scope) bool {
	// There is only one boolean unary operator
	return !e.node.EvalBool(scope)
}

func (e *unaryEvaluator) EvalInt(scope Scope) int64 {
	// There is only one integer unary operator
	return -e.node.EvalInt(scope)
}

func (e *unaryEvaluator) EvalUInt(scope Scope) uint64 {
	panic(unexpectedKind(e.t.Kind(), semantic.UInt))
}

func (e *unaryEvaluator) EvalFloat(scope Scope) float64 {
	// There is only one float unary operator
	return -e.node.EvalFloat(scope)
}

func (e *unaryEvaluator) EvalString(scope Scope) string {
	panic(unexpectedKind(e.t.Kind(), semantic.String))
}
func (e *unaryEvaluator) EvalRegexp(scope Scope) *regexp.Regexp {
	panic(unexpectedKind(e.t.Kind(), semantic.Regexp))
}

func (e *unaryEvaluator) EvalTime(scope Scope) Time {
	panic(unexpectedKind(e.t.Kind(), semantic.Time))
}
func (e *unaryEvaluator) EvalObject(scope Scope) *Object {
	panic(unexpectedKind(e.t.Kind(), semantic.Object))
}

type integerEvaluator struct {
	t semantic.Type
	i int64
}

func (e *integerEvaluator) Type() semantic.Type {
	return e.t
}

func (e *integerEvaluator) EvalBool(scope Scope) bool {
	panic(unexpectedKind(e.t.Kind(), semantic.Bool))
}

func (e *integerEvaluator) EvalInt(scope Scope) int64 {
	return e.i
}

func (e *integerEvaluator) EvalUInt(scope Scope) uint64 {
	return uint64(e.i)
}

func (e *integerEvaluator) EvalFloat(scope Scope) float64 {
	panic(unexpectedKind(e.t.Kind(), semantic.Float))
}

func (e *integerEvaluator) EvalString(scope Scope) string {
	panic(unexpectedKind(e.t.Kind(), semantic.String))
}

func (e *integerEvaluator) EvalRegexp(scope Scope) *regexp.Regexp {
	panic(unexpectedKind(e.t.Kind(), semantic.Regexp))
}

func (e *integerEvaluator) EvalTime(scope Scope) Time {
	panic(unexpectedKind(e.t.Kind(), semantic.Time))
}
func (e *integerEvaluator) EvalObject(scope Scope) *Object {
	panic(unexpectedKind(e.t.Kind(), semantic.Object))
}

type stringEvaluator struct {
	t semantic.Type
	s string
}

func (e *stringEvaluator) Type() semantic.Type {
	return e.t
}

func (e *stringEvaluator) EvalBool(scope Scope) bool {
	panic(unexpectedKind(e.t.Kind(), semantic.Bool))
}

func (e *stringEvaluator) EvalInt(scope Scope) int64 {
	panic(unexpectedKind(e.t.Kind(), semantic.Int))
}

func (e *stringEvaluator) EvalUInt(scope Scope) uint64 {
	panic(unexpectedKind(e.t.Kind(), semantic.UInt))
}

func (e *stringEvaluator) EvalFloat(scope Scope) float64 {
	panic(unexpectedKind(e.t.Kind(), semantic.Float))
}

func (e *stringEvaluator) EvalString(scope Scope) string {
	return e.s
}
func (e *stringEvaluator) EvalRegexp(scope Scope) *regexp.Regexp {
	panic(unexpectedKind(e.t.Kind(), semantic.Regexp))
}

func (e *stringEvaluator) EvalTime(scope Scope) Time {
	panic(unexpectedKind(e.t.Kind(), semantic.Time))
}
func (e *stringEvaluator) EvalObject(scope Scope) *Object {
	panic(unexpectedKind(e.t.Kind(), semantic.Object))
}

type regexpEvaluator struct {
	t semantic.Type
	r *regexp.Regexp
}

func (e *regexpEvaluator) Type() semantic.Type {
	return e.t
}

func (e *regexpEvaluator) EvalBool(scope Scope) bool {
	panic(unexpectedKind(e.t.Kind(), semantic.Bool))
}

func (e *regexpEvaluator) EvalInt(scope Scope) int64 {
	panic(unexpectedKind(e.t.Kind(), semantic.Int))
}

func (e *regexpEvaluator) EvalUInt(scope Scope) uint64 {
	panic(unexpectedKind(e.t.Kind(), semantic.UInt))
}

func (e *regexpEvaluator) EvalFloat(scope Scope) float64 {
	panic(unexpectedKind(e.t.Kind(), semantic.Float))
}

func (e *regexpEvaluator) EvalString(scope Scope) string {
	panic(unexpectedKind(e.t.Kind(), semantic.String))
}

func (e *regexpEvaluator) EvalRegexp(scope Scope) *regexp.Regexp {
	return e.r
}

func (e *regexpEvaluator) EvalTime(scope Scope) Time {
	panic(unexpectedKind(e.t.Kind(), semantic.Time))
}

func (e *regexpEvaluator) EvalObject(scope Scope) *Object {
	panic(unexpectedKind(e.t.Kind(), semantic.Object))
}

type booleanEvaluator struct {
	t semantic.Type
	b bool
}

func (e *booleanEvaluator) Type() semantic.Type {
	return e.t
}

func (e *booleanEvaluator) EvalBool(scope Scope) bool {
	return e.b
}

func (e *booleanEvaluator) EvalInt(scope Scope) int64 {
	panic(unexpectedKind(e.t.Kind(), semantic.Int))
}

func (e *booleanEvaluator) EvalUInt(scope Scope) uint64 {
	panic(unexpectedKind(e.t.Kind(), semantic.UInt))
}

func (e *booleanEvaluator) EvalFloat(scope Scope) float64 {
	panic(unexpectedKind(e.t.Kind(), semantic.Float))
}

func (e *booleanEvaluator) EvalString(scope Scope) string {
	panic(unexpectedKind(e.t.Kind(), semantic.String))
}

func (e *booleanEvaluator) EvalRegexp(scope Scope) *regexp.Regexp {
	panic(unexpectedKind(e.t.Kind(), semantic.Regexp))
}

func (e *booleanEvaluator) EvalTime(scope Scope) Time {
	panic(unexpectedKind(e.t.Kind(), semantic.Time))
}
func (e *booleanEvaluator) EvalObject(scope Scope) *Object {
	panic(unexpectedKind(e.t.Kind(), semantic.Object))
}

type floatEvaluator struct {
	t semantic.Type
	f float64
}

func (e *floatEvaluator) Type() semantic.Type {
	return e.t
}

func (e *floatEvaluator) EvalBool(scope Scope) bool {
	panic(unexpectedKind(e.t.Kind(), semantic.Bool))
}

func (e *floatEvaluator) EvalInt(scope Scope) int64 {
	panic(unexpectedKind(e.t.Kind(), semantic.Int))
}

func (e *floatEvaluator) EvalUInt(scope Scope) uint64 {
	panic(unexpectedKind(e.t.Kind(), semantic.UInt))
}

func (e *floatEvaluator) EvalFloat(scope Scope) float64 {
	return e.f
}

func (e *floatEvaluator) EvalString(scope Scope) string {
	panic(unexpectedKind(e.t.Kind(), semantic.String))
}

func (e *floatEvaluator) EvalRegexp(scope Scope) *regexp.Regexp {
	panic(unexpectedKind(e.t.Kind(), semantic.Regexp))
}

func (e *floatEvaluator) EvalTime(scope Scope) Time {
	panic(unexpectedKind(e.t.Kind(), semantic.Time))
}
func (e *floatEvaluator) EvalObject(scope Scope) *Object {
	panic(unexpectedKind(e.t.Kind(), semantic.Object))
}

type timeEvaluator struct {
	t    semantic.Type
	time Time
}

func (e *timeEvaluator) Type() semantic.Type {
	return e.t
}

func (e *timeEvaluator) EvalBool(scope Scope) bool {
	panic(unexpectedKind(e.t.Kind(), semantic.Bool))
}

func (e *timeEvaluator) EvalInt(scope Scope) int64 {
	panic(unexpectedKind(e.t.Kind(), semantic.Int))
}

func (e *timeEvaluator) EvalUInt(scope Scope) uint64 {
	panic(unexpectedKind(e.t.Kind(), semantic.UInt))
}

func (e *timeEvaluator) EvalFloat(scope Scope) float64 {
	panic(unexpectedKind(e.t.Kind(), semantic.Float))
}

func (e *timeEvaluator) EvalString(scope Scope) string {
	panic(unexpectedKind(e.t.Kind(), semantic.String))
}

func (e *timeEvaluator) EvalRegexp(scope Scope) *regexp.Regexp {
	panic(unexpectedKind(e.t.Kind(), semantic.Regexp))
}

func (e *timeEvaluator) EvalTime(scope Scope) Time {
	return e.time
}
func (e *timeEvaluator) EvalObject(scope Scope) *Object {
	panic(unexpectedKind(e.t.Kind(), semantic.Object))
}

type identifierEvaluator struct {
	t    semantic.Type
	name string
}

func (e *identifierEvaluator) Type() semantic.Type {
	return e.t
}

func (e *identifierEvaluator) EvalBool(scope Scope) bool {
	return scope.GetBool(e.name)
}

func (e *identifierEvaluator) EvalInt(scope Scope) int64 {
	return scope.GetInt(e.name)
}

func (e *identifierEvaluator) EvalUInt(scope Scope) uint64 {
	return scope.GetUInt(e.name)
}

func (e *identifierEvaluator) EvalFloat(scope Scope) float64 {
	return scope.GetFloat(e.name)
}

func (e *identifierEvaluator) EvalString(scope Scope) string {
	return scope.GetString(e.name)
}

func (e *identifierEvaluator) EvalRegexp(scope Scope) *regexp.Regexp {
	return scope.GetRegexp(e.name)
}

func (e *identifierEvaluator) EvalTime(scope Scope) Time {
	return scope.GetTime(e.name)
}
func (e *identifierEvaluator) EvalObject(scope Scope) *Object {
	return scope.GetObject(e.name)
}

type memberEvaluator struct {
	t        semantic.Type
	object   Evaluator
	property string
}

func (e *memberEvaluator) Type() semantic.Type {
	return e.t
}

func (e *memberEvaluator) EvalBool(scope Scope) bool {
	return e.object.EvalObject(scope).Get(e.property).Bool()
}

func (e *memberEvaluator) EvalInt(scope Scope) int64 {
	return e.object.EvalObject(scope).Get(e.property).Int()
}

func (e *memberEvaluator) EvalUInt(scope Scope) uint64 {
	return e.object.EvalObject(scope).Get(e.property).UInt()
}

func (e *memberEvaluator) EvalFloat(scope Scope) float64 {
	return e.object.EvalObject(scope).Get(e.property).Float()
}

func (e *memberEvaluator) EvalString(scope Scope) string {
	return e.object.EvalObject(scope).Get(e.property).Str()
}
func (e *memberEvaluator) EvalRegexp(scope Scope) *regexp.Regexp {
	return e.object.EvalObject(scope).Get(e.property).Regexp()
}

func (e *memberEvaluator) EvalTime(scope Scope) Time {
	return e.object.EvalObject(scope).Get(e.property).Time()
}
func (e *memberEvaluator) EvalObject(scope Scope) *Object {
	return e.object.EvalObject(scope).Get(e.property).Object()
}

// Map of binary functions
var binaryFuncs = map[binarySignature]struct {
	Func       binaryFunc
	ResultKind semantic.Kind
}{
	//---------------
	// Math Operators
	//---------------
	{Operator: ast.AdditionOperator, Left: semantic.Int, Right: semantic.Int}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalInt(scope)
			r := right.EvalInt(scope)
			return value{
				typ:   semantic.Int,
				Value: l + r,
			}
		},
		ResultKind: semantic.Int,
	},
	{Operator: ast.AdditionOperator, Left: semantic.UInt, Right: semantic.UInt}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalUInt(scope)
			r := right.EvalUInt(scope)
			return value{
				typ:   semantic.UInt,
				Value: l + r,
			}
		},
		ResultKind: semantic.UInt,
	},
	{Operator: ast.AdditionOperator, Left: semantic.Float, Right: semantic.Float}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalFloat(scope)
			r := right.EvalFloat(scope)
			return value{
				typ:   semantic.Float,
				Value: l + r,
			}
		},
		ResultKind: semantic.Float,
	},
	{Operator: ast.SubtractionOperator, Left: semantic.Int, Right: semantic.Int}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalInt(scope)
			r := right.EvalInt(scope)
			return value{
				typ:   semantic.Int,
				Value: l - r,
			}
		},
		ResultKind: semantic.Int,
	},
	{Operator: ast.SubtractionOperator, Left: semantic.UInt, Right: semantic.UInt}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalUInt(scope)
			r := right.EvalUInt(scope)
			return value{
				typ:   semantic.UInt,
				Value: l - r,
			}
		},
		ResultKind: semantic.UInt,
	},
	{Operator: ast.SubtractionOperator, Left: semantic.Float, Right: semantic.Float}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalFloat(scope)
			r := right.EvalFloat(scope)
			return value{
				typ:   semantic.Float,
				Value: l - r,
			}
		},
		ResultKind: semantic.Float,
	},
	{Operator: ast.MultiplicationOperator, Left: semantic.Int, Right: semantic.Int}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalInt(scope)
			r := right.EvalInt(scope)
			return value{
				typ:   semantic.Int,
				Value: l * r,
			}
		},
		ResultKind: semantic.Int,
	},
	{Operator: ast.MultiplicationOperator, Left: semantic.UInt, Right: semantic.UInt}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalUInt(scope)
			r := right.EvalUInt(scope)
			return value{
				typ:   semantic.UInt,
				Value: l * r,
			}
		},
		ResultKind: semantic.UInt,
	},
	{Operator: ast.MultiplicationOperator, Left: semantic.Float, Right: semantic.Float}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalFloat(scope)
			r := right.EvalFloat(scope)
			return value{
				typ:   semantic.Float,
				Value: l * r,
			}
		},
		ResultKind: semantic.Float,
	},
	{Operator: ast.DivisionOperator, Left: semantic.Int, Right: semantic.Int}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalInt(scope)
			r := right.EvalInt(scope)
			return value{
				typ:   semantic.Int,
				Value: l / r,
			}
		},
		ResultKind: semantic.Int,
	},
	{Operator: ast.DivisionOperator, Left: semantic.UInt, Right: semantic.UInt}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalUInt(scope)
			r := right.EvalUInt(scope)
			return value{
				typ:   semantic.UInt,
				Value: l / r,
			}
		},
		ResultKind: semantic.UInt,
	},
	{Operator: ast.DivisionOperator, Left: semantic.Float, Right: semantic.Float}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalFloat(scope)
			r := right.EvalFloat(scope)
			return value{
				typ:   semantic.Float,
				Value: l / r,
			}
		},
		ResultKind: semantic.Float,
	},

	//---------------------
	// Comparison Operators
	//---------------------

	// LessThanEqualOperator

	{Operator: ast.LessThanEqualOperator, Left: semantic.Int, Right: semantic.Int}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalInt(scope)
			r := right.EvalInt(scope)
			return value{
				typ:   semantic.Bool,
				Value: l <= r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.LessThanEqualOperator, Left: semantic.Int, Right: semantic.UInt}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalInt(scope)
			r := right.EvalUInt(scope)
			if l < 0 {
				return value{
					typ:   semantic.Bool,
					Value: true,
				}
			}
			return value{
				typ:   semantic.Bool,
				Value: uint64(l) <= r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.LessThanEqualOperator, Left: semantic.Int, Right: semantic.Float}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalInt(scope)
			r := right.EvalFloat(scope)
			return value{
				typ:   semantic.Bool,
				Value: float64(l) <= r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.LessThanEqualOperator, Left: semantic.UInt, Right: semantic.Int}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalUInt(scope)
			r := right.EvalInt(scope)
			if r < 0 {
				return value{
					typ:   semantic.Bool,
					Value: false,
				}
			}
			return value{
				typ:   semantic.Bool,
				Value: l <= uint64(r),
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.LessThanEqualOperator, Left: semantic.UInt, Right: semantic.UInt}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalUInt(scope)
			r := right.EvalUInt(scope)
			return value{
				typ:   semantic.Bool,
				Value: l <= r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.LessThanEqualOperator, Left: semantic.UInt, Right: semantic.Float}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalUInt(scope)
			r := right.EvalFloat(scope)
			return value{
				typ:   semantic.Bool,
				Value: float64(l) <= r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.LessThanEqualOperator, Left: semantic.Float, Right: semantic.Int}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalFloat(scope)
			r := right.EvalInt(scope)
			return value{
				typ:   semantic.Bool,
				Value: l <= float64(r),
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.LessThanEqualOperator, Left: semantic.Float, Right: semantic.UInt}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalFloat(scope)
			r := right.EvalUInt(scope)
			return value{
				typ:   semantic.Bool,
				Value: l <= float64(r),
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.LessThanEqualOperator, Left: semantic.Float, Right: semantic.Float}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalFloat(scope)
			r := right.EvalFloat(scope)
			return value{
				typ:   semantic.Bool,
				Value: l <= r,
			}
		},
		ResultKind: semantic.Bool,
	},

	// LessThanOperator

	{Operator: ast.LessThanOperator, Left: semantic.Int, Right: semantic.Int}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalInt(scope)
			r := right.EvalInt(scope)
			return value{
				typ:   semantic.Bool,
				Value: l < r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.LessThanOperator, Left: semantic.Int, Right: semantic.UInt}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalInt(scope)
			r := right.EvalUInt(scope)
			if l < 0 {
				return value{
					typ:   semantic.Bool,
					Value: true,
				}
			}
			return value{
				typ:   semantic.Bool,
				Value: uint64(l) < r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.LessThanOperator, Left: semantic.Int, Right: semantic.Float}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalInt(scope)
			r := right.EvalFloat(scope)
			return value{
				typ:   semantic.Bool,
				Value: float64(l) < r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.LessThanOperator, Left: semantic.UInt, Right: semantic.Int}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalUInt(scope)
			r := right.EvalInt(scope)
			if r < 0 {
				return value{
					typ:   semantic.Bool,
					Value: false,
				}
			}
			return value{
				typ:   semantic.Bool,
				Value: l < uint64(r),
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.LessThanOperator, Left: semantic.UInt, Right: semantic.UInt}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalUInt(scope)
			r := right.EvalUInt(scope)
			return value{
				typ:   semantic.Bool,
				Value: l < r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.LessThanOperator, Left: semantic.UInt, Right: semantic.Float}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalUInt(scope)
			r := right.EvalFloat(scope)
			return value{
				typ:   semantic.Bool,
				Value: float64(l) < r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.LessThanOperator, Left: semantic.Float, Right: semantic.Int}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalFloat(scope)
			r := right.EvalInt(scope)
			return value{
				typ:   semantic.Bool,
				Value: l < float64(r),
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.LessThanOperator, Left: semantic.Float, Right: semantic.UInt}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalFloat(scope)
			r := right.EvalUInt(scope)
			return value{
				typ:   semantic.Bool,
				Value: l < float64(r),
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.LessThanOperator, Left: semantic.Float, Right: semantic.Float}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalFloat(scope)
			r := right.EvalFloat(scope)
			return value{
				typ:   semantic.Bool,
				Value: l < r,
			}
		},
		ResultKind: semantic.Bool,
	},

	// GreaterThanEqualOperator

	{Operator: ast.GreaterThanEqualOperator, Left: semantic.Int, Right: semantic.Int}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalInt(scope)
			r := right.EvalInt(scope)
			return value{
				typ:   semantic.Bool,
				Value: l >= r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.GreaterThanEqualOperator, Left: semantic.Int, Right: semantic.UInt}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalInt(scope)
			r := right.EvalUInt(scope)
			if l < 0 {
				return value{
					typ:   semantic.Bool,
					Value: true,
				}
			}
			return value{
				typ:   semantic.Bool,
				Value: uint64(l) >= r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.GreaterThanEqualOperator, Left: semantic.Int, Right: semantic.Float}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalInt(scope)
			r := right.EvalFloat(scope)
			return value{
				typ:   semantic.Bool,
				Value: float64(l) >= r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.GreaterThanEqualOperator, Left: semantic.UInt, Right: semantic.Int}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalUInt(scope)
			r := right.EvalInt(scope)
			if r < 0 {
				return value{
					typ:   semantic.Bool,
					Value: false,
				}
			}
			return value{
				typ:   semantic.Bool,
				Value: l >= uint64(r),
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.GreaterThanEqualOperator, Left: semantic.UInt, Right: semantic.UInt}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalUInt(scope)
			r := right.EvalUInt(scope)
			return value{
				typ:   semantic.Bool,
				Value: l >= r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.GreaterThanEqualOperator, Left: semantic.UInt, Right: semantic.Float}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalUInt(scope)
			r := right.EvalFloat(scope)
			return value{
				typ:   semantic.Bool,
				Value: float64(l) >= r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.GreaterThanEqualOperator, Left: semantic.Float, Right: semantic.Int}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalFloat(scope)
			r := right.EvalInt(scope)
			return value{
				typ:   semantic.Bool,
				Value: l >= float64(r),
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.GreaterThanEqualOperator, Left: semantic.Float, Right: semantic.UInt}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalFloat(scope)
			r := right.EvalUInt(scope)
			return value{
				typ:   semantic.Bool,
				Value: l >= float64(r),
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.GreaterThanEqualOperator, Left: semantic.Float, Right: semantic.Float}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalFloat(scope)
			r := right.EvalFloat(scope)
			return value{
				typ:   semantic.Bool,
				Value: l >= r,
			}
		},
		ResultKind: semantic.Bool,
	},

	// GreaterThanOperator

	{Operator: ast.GreaterThanOperator, Left: semantic.Int, Right: semantic.Int}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalInt(scope)
			r := right.EvalInt(scope)
			return value{
				typ:   semantic.Bool,
				Value: l > r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.GreaterThanOperator, Left: semantic.Int, Right: semantic.UInt}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalInt(scope)
			r := right.EvalUInt(scope)
			if l < 0 {
				return value{
					typ:   semantic.Bool,
					Value: true,
				}
			}
			return value{
				typ:   semantic.Bool,
				Value: uint64(l) > r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.GreaterThanOperator, Left: semantic.Int, Right: semantic.Float}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalInt(scope)
			r := right.EvalFloat(scope)
			return value{
				typ:   semantic.Bool,
				Value: float64(l) > r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.GreaterThanOperator, Left: semantic.UInt, Right: semantic.Int}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalUInt(scope)
			r := right.EvalInt(scope)
			if r < 0 {
				return value{
					typ:   semantic.Bool,
					Value: false,
				}
			}
			return value{
				typ:   semantic.Bool,
				Value: l > uint64(r),
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.GreaterThanOperator, Left: semantic.UInt, Right: semantic.UInt}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalUInt(scope)
			r := right.EvalUInt(scope)
			return value{
				typ:   semantic.Bool,
				Value: l > r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.GreaterThanOperator, Left: semantic.UInt, Right: semantic.Float}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalUInt(scope)
			r := right.EvalFloat(scope)
			return value{
				typ:   semantic.Bool,
				Value: float64(l) > r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.GreaterThanOperator, Left: semantic.Float, Right: semantic.Int}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalFloat(scope)
			r := right.EvalInt(scope)
			return value{
				typ:   semantic.Bool,
				Value: l > float64(r),
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.GreaterThanOperator, Left: semantic.Float, Right: semantic.UInt}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalFloat(scope)
			r := right.EvalUInt(scope)
			return value{
				typ:   semantic.Bool,
				Value: l > float64(r),
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.GreaterThanOperator, Left: semantic.Float, Right: semantic.Float}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalFloat(scope)
			r := right.EvalFloat(scope)
			return value{
				typ:   semantic.Bool,
				Value: l > r,
			}
		},
		ResultKind: semantic.Bool,
	},

	// EqualOperator

	{Operator: ast.EqualOperator, Left: semantic.Int, Right: semantic.Int}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalInt(scope)
			r := right.EvalInt(scope)
			return value{
				typ:   semantic.Bool,
				Value: l == r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.EqualOperator, Left: semantic.Int, Right: semantic.UInt}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalInt(scope)
			r := right.EvalUInt(scope)
			if l < 0 {
				return value{
					typ:   semantic.Bool,
					Value: false,
				}
			}
			return value{
				typ:   semantic.Bool,
				Value: uint64(l) == r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.EqualOperator, Left: semantic.Int, Right: semantic.Float}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalInt(scope)
			r := right.EvalFloat(scope)
			return value{
				typ:   semantic.Bool,
				Value: float64(l) == r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.EqualOperator, Left: semantic.UInt, Right: semantic.Int}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalUInt(scope)
			r := right.EvalInt(scope)
			if r < 0 {
				return value{
					typ:   semantic.Bool,
					Value: false,
				}
			}
			return value{
				typ:   semantic.Bool,
				Value: l == uint64(r),
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.EqualOperator, Left: semantic.UInt, Right: semantic.UInt}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalUInt(scope)
			r := right.EvalUInt(scope)
			return value{
				typ:   semantic.Bool,
				Value: l == r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.EqualOperator, Left: semantic.UInt, Right: semantic.Float}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalUInt(scope)
			r := right.EvalFloat(scope)
			return value{
				typ:   semantic.Bool,
				Value: float64(l) == r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.EqualOperator, Left: semantic.Float, Right: semantic.Int}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalFloat(scope)
			r := right.EvalInt(scope)
			return value{
				typ:   semantic.Bool,
				Value: l == float64(r),
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.EqualOperator, Left: semantic.Float, Right: semantic.UInt}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalFloat(scope)
			r := right.EvalUInt(scope)
			return value{
				typ:   semantic.Bool,
				Value: l == float64(r),
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.EqualOperator, Left: semantic.Float, Right: semantic.Float}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalFloat(scope)
			r := right.EvalFloat(scope)
			return value{
				typ:   semantic.Bool,
				Value: l == r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.EqualOperator, Left: semantic.String, Right: semantic.String}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalString(scope)
			r := right.EvalString(scope)
			return value{
				typ:   semantic.Bool,
				Value: l == r,
			}
		},
		ResultKind: semantic.Bool,
	},

	// NotEqualOperator

	{Operator: ast.NotEqualOperator, Left: semantic.Int, Right: semantic.Int}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalInt(scope)
			r := right.EvalInt(scope)
			return value{
				typ:   semantic.Bool,
				Value: l != r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.NotEqualOperator, Left: semantic.Int, Right: semantic.UInt}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalInt(scope)
			r := right.EvalUInt(scope)
			if l < 0 {
				return value{
					typ:   semantic.Bool,
					Value: true,
				}
			}
			return value{
				typ:   semantic.Bool,
				Value: uint64(l) != r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.NotEqualOperator, Left: semantic.Int, Right: semantic.Float}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalInt(scope)
			r := right.EvalFloat(scope)
			return value{
				typ:   semantic.Bool,
				Value: float64(l) != r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.NotEqualOperator, Left: semantic.UInt, Right: semantic.Int}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalUInt(scope)
			r := right.EvalInt(scope)
			if r < 0 {
				return value{
					typ:   semantic.Bool,
					Value: true,
				}
			}
			return value{
				typ:   semantic.Bool,
				Value: l != uint64(r),
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.NotEqualOperator, Left: semantic.UInt, Right: semantic.UInt}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalUInt(scope)
			r := right.EvalUInt(scope)
			return value{
				typ:   semantic.Bool,
				Value: l != r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.NotEqualOperator, Left: semantic.UInt, Right: semantic.Float}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalUInt(scope)
			r := right.EvalFloat(scope)
			return value{
				typ:   semantic.Bool,
				Value: float64(l) != r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.NotEqualOperator, Left: semantic.Float, Right: semantic.Int}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalFloat(scope)
			r := right.EvalInt(scope)
			return value{
				typ:   semantic.Bool,
				Value: l != float64(r),
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.NotEqualOperator, Left: semantic.Float, Right: semantic.UInt}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalFloat(scope)
			r := right.EvalUInt(scope)
			return value{
				typ:   semantic.Bool,
				Value: l != float64(r),
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.NotEqualOperator, Left: semantic.Float, Right: semantic.Float}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalFloat(scope)
			r := right.EvalFloat(scope)
			return value{
				typ:   semantic.Bool,
				Value: l != r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.NotEqualOperator, Left: semantic.String, Right: semantic.String}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalString(scope)
			r := right.EvalString(scope)
			return value{
				typ:   semantic.Bool,
				Value: l != r,
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.RegexpMatchOperator, Left: semantic.String, Right: semantic.Regexp}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalString(scope)
			r := right.EvalRegexp(scope)
			return value{
				typ:   semantic.Bool,
				Value: r.MatchString(l),
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.RegexpMatchOperator, Left: semantic.Regexp, Right: semantic.String}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalRegexp(scope)
			r := right.EvalString(scope)
			return value{
				typ:   semantic.Bool,
				Value: l.MatchString(r),
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.NotRegexpMatchOperator, Left: semantic.String, Right: semantic.Regexp}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalString(scope)
			r := right.EvalRegexp(scope)
			return value{
				typ:   semantic.Bool,
				Value: !r.MatchString(l),
			}
		},
		ResultKind: semantic.Bool,
	},
	{Operator: ast.NotRegexpMatchOperator, Left: semantic.Regexp, Right: semantic.String}: {
		Func: func(scope Scope, left, right Evaluator) Value {
			l := left.EvalRegexp(scope)
			r := right.EvalString(scope)
			return value{
				typ:   semantic.Bool,
				Value: !l.MatchString(r),
			}
		},
		ResultKind: semantic.Bool,
	},
}
