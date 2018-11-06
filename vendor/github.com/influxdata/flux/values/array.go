package values

import (
	"fmt"
	"regexp"
	"sort"
	"strings"

	"github.com/influxdata/flux/semantic"
)

// Array represents an sequence of elements
// All elements must be the same type
type Array interface {
	Value
	Get(i int) Value
	Set(i int, v Value)
	Append(v Value)
	Len() int
	Range(func(i int, v Value))
	Sort(func(i, j Value) bool)
}

type array struct {
	t        semantic.Type
	elements []Value
}

func NewArray(elementType semantic.Type) Array {
	return &array{
		t: semantic.NewArrayType(elementType),
	}
}
func NewArrayWithBacking(elementType semantic.Type, elements []Value) Array {
	return &array{
		t:        semantic.NewArrayType(elementType),
		elements: elements,
	}
}

func (a *array) String() string {
	b := new(strings.Builder)
	b.WriteString("[")
	a.Range(func(i int, v Value) {
		if i != 0 {
			b.WriteString(", ")
		}
		fmt.Fprint(b, v)
	})
	b.WriteString("]")
	return b.String()
}

func (a *array) Type() semantic.Type {
	return a.t
}
func (a *array) PolyType() semantic.PolyType {
	return a.t.PolyType()
}

func (a *array) Get(i int) Value {
	if i >= len(a.elements) {
		panic(fmt.Errorf("index out of bounds: i:%d len:%d", i, len(a.elements)))
	}
	return a.elements[i]
}

func (a *array) Set(i int, v Value) {
	if i >= len(a.elements) {
		panic(fmt.Errorf("index out of bounds: i:%d len:%d", i, len(a.elements)))
	}
	a.elements[i] = v
}

func (a *array) Append(v Value) {
	a.elements = append(a.elements, v)
}

func (a *array) Range(f func(i int, v Value)) {
	for i, v := range a.elements {
		f(i, v)
	}
}

func (a *array) Len() int {
	return len(a.elements)
}

func (a *array) Sort(f func(i, j Value) bool) {
	sort.Slice(a.elements, func(i, j int) bool {
		return f(a.elements[i], a.elements[j])
	})
}

func (a *array) Str() string {
	panic(UnexpectedKind(semantic.Object, semantic.String))
}
func (a *array) Int() int64 {
	panic(UnexpectedKind(semantic.Object, semantic.Int))
}
func (a *array) UInt() uint64 {
	panic(UnexpectedKind(semantic.Object, semantic.UInt))
}
func (a *array) Float() float64 {
	panic(UnexpectedKind(semantic.Object, semantic.Float))
}
func (a *array) Bool() bool {
	panic(UnexpectedKind(semantic.Object, semantic.Bool))
}
func (a *array) Time() Time {
	panic(UnexpectedKind(semantic.Object, semantic.Time))
}
func (a *array) Duration() Duration {
	panic(UnexpectedKind(semantic.Object, semantic.Duration))
}
func (a *array) Regexp() *regexp.Regexp {
	panic(UnexpectedKind(semantic.Object, semantic.Regexp))
}
func (a *array) Array() Array {
	return a
}
func (a *array) Object() Object {
	panic(UnexpectedKind(semantic.Object, semantic.Object))
}
func (a *array) Function() Function {
	panic(UnexpectedKind(semantic.Object, semantic.Function))
}
func (a *array) Equal(rhs Value) bool {
	if a.Type() != rhs.Type() {
		return false
	}
	r := rhs.Array()
	if a.Len() != r.Len() {
		return false
	}
	length := a.Len()
	for i := 0; i < length; i++ {
		aVal := a.Get(i)
		rVal := r.Get(i)
		if !aVal.Equal(rVal) {
			return false
		}
	}
	return true
}
