// Package values declares the flux data types and implements them.
package values

import (
	"fmt"
	"regexp"

	"github.com/influxdata/flux/semantic"
)

type Typer interface {
	Type() semantic.Type
	PolyType() semantic.PolyType
}

type Value interface {
	Typer
	Str() string
	Int() int64
	UInt() uint64
	Float() float64
	Bool() bool
	Time() Time
	Duration() Duration
	Regexp() *regexp.Regexp
	Array() Array
	Object() Object
	Function() Function
	Equal(Value) bool
}

type value struct {
	t semantic.Type
	v interface{}
}

func (v value) Type() semantic.Type {
	return v.t
}
func (v value) PolyType() semantic.PolyType {
	return v.t.PolyType()
}
func (v value) Str() string {
	CheckKind(v.t.Nature(), semantic.String)
	return v.v.(string)
}
func (v value) Int() int64 {
	CheckKind(v.t.Nature(), semantic.Int)
	return v.v.(int64)
}
func (v value) UInt() uint64 {
	CheckKind(v.t.Nature(), semantic.UInt)
	return v.v.(uint64)
}
func (v value) Float() float64 {
	CheckKind(v.t.Nature(), semantic.Float)
	return v.v.(float64)
}
func (v value) Bool() bool {
	CheckKind(v.t.Nature(), semantic.Bool)
	return v.v.(bool)
}
func (v value) Time() Time {
	CheckKind(v.t.Nature(), semantic.Time)
	return v.v.(Time)
}
func (v value) Duration() Duration {
	CheckKind(v.t.Nature(), semantic.Duration)
	return v.v.(Duration)
}
func (v value) Regexp() *regexp.Regexp {
	CheckKind(v.t.Nature(), semantic.Regexp)
	return v.v.(*regexp.Regexp)
}
func (v value) Array() Array {
	CheckKind(v.t.Nature(), semantic.Array)
	return v.v.(Array)
}
func (v value) Object() Object {
	CheckKind(v.t.Nature(), semantic.Object)
	return v.v.(Object)
}
func (v value) Function() Function {
	CheckKind(v.t.Nature(), semantic.Function)
	return v.v.(Function)
}
func (v value) Equal(r Value) bool {
	if v.Type() != r.Type() {
		return false
	}
	switch k := v.Type().Nature(); k {
	case semantic.Bool:
		return v.Bool() == r.Bool()
	case semantic.UInt:
		return v.UInt() == r.UInt()
	case semantic.Int:
		return v.Int() == r.Int()
	case semantic.Float:
		return v.Float() == r.Float()
	case semantic.String:
		return v.Str() == r.Str()
	case semantic.Time:
		return v.Time() == r.Time()
	case semantic.Duration:
		return v.Duration() == r.Duration()
	case semantic.Regexp:
		return v.Regexp().String() == r.Regexp().String()
	case semantic.Object:
		return v.Object().Equal(r.Object())
	case semantic.Array:
		return v.Array().Equal(r.Array())
	case semantic.Function:
		return v.Function().Equal(r.Function())
	default:
		return false
	}
}

func (v value) String() string {
	return fmt.Sprintf("%v", v.v)
}

// InvalidValue is a non nil value who's type is semantic.Invalid
var InvalidValue = value{t: semantic.Invalid}

// New constructs a new Value by inferring the type from the interface. If the interface
// does not translate to a valid Value type, then InvalidValue is returned.
func New(v interface{}) Value {
	switch v := v.(type) {
	case string:
		return NewString(v)
	case int64:
		return NewInt(v)
	case uint64:
		return NewUInt(v)
	case float64:
		return NewFloat(v)
	case bool:
		return NewBool(v)
	case Time:
		return NewTime(v)
	case Duration:
		return NewDuration(v)
	case *regexp.Regexp:
		return NewRegexp(v)
	default:
		return InvalidValue
	}
}

func NewString(v string) Value {
	return value{
		t: semantic.String,
		v: v,
	}
}
func NewInt(v int64) Value {
	return value{
		t: semantic.Int,
		v: v,
	}
}
func NewUInt(v uint64) Value {
	return value{
		t: semantic.UInt,
		v: v,
	}
}
func NewFloat(v float64) Value {
	return value{
		t: semantic.Float,
		v: v,
	}
}
func NewBool(v bool) Value {
	return value{
		t: semantic.Bool,
		v: v,
	}
}
func NewTime(v Time) Value {
	return value{
		t: semantic.Time,
		v: v,
	}
}
func NewDuration(v Duration) Value {
	return value{
		t: semantic.Duration,
		v: v,
	}
}
func NewRegexp(v *regexp.Regexp) Value {
	return value{
		t: semantic.Regexp,
		v: v,
	}
}

func UnexpectedKind(got, exp semantic.Nature) error {
	return fmt.Errorf("unexpected kind: got %q expected %q", got, exp)
}

// CheckKind panics if got != exp.
func CheckKind(got, exp semantic.Nature) {
	if got != exp {
		panic(UnexpectedKind(got, exp))
	}
}
