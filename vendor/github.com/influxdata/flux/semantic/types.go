package semantic

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"hash/fnv"
	"sort"
	"strconv"
	"strings"
	"sync"
)

// Type is the representation of a Flux type.
// Type is a monomorphic, meaning that it represents a single type and is not polymorphic.
// See PolyType for polymorphic types.
//
// Type values are comparable and as such can be used as map keys and directly comparison using the == operator.
// Two types are equal if they represent identical types.
//
// Do NOT embed this type into other interfaces or structs as that will invalidate the comparison properties of the interface.
type Type interface {
	// Nature returns the specific primitive description of this type.
	Nature() Nature

	// PropertyType returns the type of a given property.
	// It panics if the type's Kind is not Object
	PropertyType(name string) Type

	// Properties returns a map of all property types.
	// It panics if the type's Kind is not Object
	Properties() map[string]Type

	// ElementType return the type of elements in the array.
	// It panics if the type's Kind is not Array.
	ElementType() Type

	// FunctionSignature returns the function signature of this type.
	// It panics if the type's Kind is not Function.
	FunctionSignature() FunctionSignature

	PolyType() PolyType

	// Types cannot be created outside of the semantic package
	// This is needed so that we can cache type definitions.
	typ()
}

// Nature is the primitive description of a type.
type Nature int

const (
	Invalid Nature = iota
	Nil
	String
	Int
	UInt
	Float
	Bool
	Time
	Duration
	Regexp
	Array
	Object
	Function
)

var natureNames = []string{
	Invalid:  "invalid",
	Nil:      "nil",
	String:   "string",
	Int:      "int",
	UInt:     "uint",
	Float:    "float",
	Bool:     "bool",
	Time:     "time",
	Duration: "duration",
	Regexp:   "regexp",
	Array:    "array",
	Object:   "object",
	Function: "function",
}

func (n Nature) String() string {
	if int(n) < len(natureNames) {
		return natureNames[n]
	}
	return "nature" + strconv.Itoa(int(n))
}

func (n Nature) PolyType() PolyType { return n }
func (n Nature) Nature() Nature     { return n }

func (n Nature) PropertyType(name string) Type {
	panic(fmt.Errorf("cannot get type of property %q, from kind %q", name, n))
}
func (n Nature) Properties() map[string]Type {
	panic(fmt.Errorf("cannot get properties from kind %s", n))
}
func (n Nature) ElementType() Type {
	panic(fmt.Errorf("cannot get element type from kind %s", n))
}
func (n Nature) FunctionSignature() FunctionSignature {
	panic(fmt.Errorf("cannot get function signature from kind %s", n))
}
func (n Nature) typ() {}

type arrayType struct {
	elementType Type
}

func (t *arrayType) String() string {
	return fmt.Sprintf("[%v]", t.elementType)
}

func (t *arrayType) Nature() Nature {
	return Array
}
func (t *arrayType) PropertyType(name string) Type {
	panic(fmt.Errorf("cannot get property type of kind %s", t.Nature()))
}
func (t *arrayType) Properties() map[string]Type {
	panic(fmt.Errorf("cannot get properties type of kind %s", t.Nature()))
}
func (t *arrayType) ElementType() Type {
	return t.elementType
}
func (t *arrayType) FunctionSignature() FunctionSignature {
	panic(fmt.Errorf("cannot get function signature of kind %s", t.Nature()))
}
func (t *arrayType) PolyType() PolyType {
	if t.elementType == nil {
		return Invalid
	}
	return NewArrayPolyType(t.elementType.PolyType())
}

func (t *arrayType) typ() {}

// arrayTypeCache caches *arrayType values.
//
// Since arrayTypes only have a single field elementType we can key
// all arrayTypes by their elementType.
var arrayTypeCache struct {
	sync.Mutex // Guards stores (but not loads) on m.

	// m is a map[Type]*arrayType keyed by the elementType of the array.
	// Elements in m are append-only and thus safe for concurrent reading.
	m sync.Map
}

// TODO(nathanielc): Make empty array types polymorphic over element type?
var EmptyArrayType = NewArrayType(Nil)

func NewArrayType(elementType Type) Type {
	// Lookup arrayType in cache by elementType
	if t, ok := arrayTypeCache.m.Load(elementType); ok {
		return t.(*arrayType)
	}

	// Type not found in cache, lock and retry.
	arrayTypeCache.Lock()
	defer arrayTypeCache.Unlock()

	// First read again while holding the lock.
	if t, ok := arrayTypeCache.m.Load(elementType); ok {
		return t.(*arrayType)
	}

	// Still no cache entry, add it.
	at := &arrayType{
		elementType: elementType,
	}
	arrayTypeCache.m.Store(elementType, at)

	return at
}

type objectType struct {
	properties map[string]Type
}

func (t *objectType) String() string {
	var buf bytes.Buffer
	buf.Write([]byte("{"))
	for k, prop := range t.properties {
		fmt.Fprintf(&buf, "%s: %v,", k, prop)
	}
	buf.WriteRune('}')

	return buf.String()
}

func (t *objectType) Nature() Nature {
	return Object
}
func (t *objectType) PropertyType(name string) Type {
	typ, ok := t.properties[name]
	if ok {
		return typ
	}
	return Invalid
}
func (t *objectType) Properties() map[string]Type {
	return t.properties
}
func (t *objectType) ElementType() Type {
	panic(fmt.Errorf("cannot get element type of kind %s", t.Nature()))
}
func (t *objectType) FunctionSignature() FunctionSignature {
	panic(fmt.Errorf("cannot get function signature of kind %s", t.Nature()))
}
func (t *objectType) PolyType() PolyType {
	properties := make(map[string]PolyType, len(t.properties))
	labels := make([]string, 0, len(t.properties))
	for k, p := range t.properties {
		properties[k] = p.PolyType()
		labels = append(labels, k)
	}

	return NewObjectPolyType(properties, LabelSet{}, labels)
}

func (t *objectType) typ() {}

func (t *objectType) equal(o *objectType) bool {
	if t == o {
		return true
	}

	if len(t.properties) != len(o.properties) {
		return false
	}

	for k, vtyp := range t.properties {
		ovtyp, ok := o.properties[k]
		if !ok {
			return false
		}
		if ovtyp != vtyp {
			return false
		}
	}
	return true
}

// objectTypeCache caches all *objectTypes.
//
// Since objectTypes are identified by their properties,
// a hash is computed of the property names and kinds to reduce the search space.
var objectTypeCache struct {
	sync.Mutex // Guards stores (but not loads) on m.

	// m is a map[uint32][]*objectType keyed by the hash calculated of the object's properties' name and kind.
	// Elements in m are append-only and thus safe for concurrent reading.
	m sync.Map
}

var EmptyObject = NewObjectType(nil)

func NewObjectType(propertyTypes map[string]Type) Type {
	propertyNames := make([]string, 0, len(propertyTypes))
	for name := range propertyTypes {
		propertyNames = append(propertyNames, name)
	}
	sort.Strings(propertyNames)

	sum := fnv.New32a()
	for _, p := range propertyNames {
		t := propertyTypes[p]

		// track hash of property names and kinds
		sum.Write([]byte(p))
		binary.Write(sum, binary.LittleEndian, int64(t.Nature()))
	}

	// Create new object type
	ot := &objectType{
		properties: propertyTypes,
	}

	// Simple linear search after hash lookup
	h := sum.Sum32()
	if ts, ok := objectTypeCache.m.Load(h); ok {
		for _, t := range ts.([]*objectType) {
			if t.equal(ot) {
				return t
			}
		}
	}

	// Type not found in cache, lock and retry.
	objectTypeCache.Lock()
	defer objectTypeCache.Unlock()

	// First read again while holding the lock.
	var types []*objectType
	if ts, ok := objectTypeCache.m.Load(h); ok {
		types = ts.([]*objectType)
		for _, t := range types {
			if t.equal(ot) {
				return t
			}
		}
	}

	// Make copy of properties since we can't trust that the source will not be modified
	properties := make(map[string]Type)
	for k, v := range ot.properties {
		properties[k] = v
	}
	ot.properties = properties

	// Still no cache entry, add it.
	objectTypeCache.m.Store(h, append(types, ot))

	return ot
}

type functionType struct {
	parameters   map[string]Type
	required     LabelSet
	ret          Type
	pipeArgument string
}

func (t *functionType) String() string {
	var builder strings.Builder
	keys := make([]string, 0, len(t.parameters))
	for k := range t.parameters {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	builder.WriteString("(")
	for i, k := range keys {
		if i != 0 {
			builder.WriteString(", ")
		}
		if t.required.contains(k) {
			builder.WriteString("^")
		}
		fmt.Fprintf(&builder, "%s: %v", k, t.parameters[k])
	}
	fmt.Fprintf(&builder, ") -> %v", t.ret)
	return builder.String()
}

func (t *functionType) Nature() Nature {
	return Function
}
func (t *functionType) PropertyType(name string) Type {
	panic(fmt.Errorf("cannot get property type of kind %s", t.Nature()))
}
func (t *functionType) Properties() map[string]Type {
	panic(fmt.Errorf("cannot get properties type of kind %s", t.Nature()))
}
func (t *functionType) ElementType() Type {
	panic(fmt.Errorf("cannot get element type of kind %s", t.Nature()))
}
func (t *functionType) FunctionSignature() FunctionSignature {
	return FunctionSignature{
		Parameters:   t.parameters,
		Required:     []string(t.required),
		Return:       t.ret,
		PipeArgument: t.pipeArgument,
	}
}

func (a *functionType) equal(b *functionType) bool {
	if len(a.parameters) != len(b.parameters) ||
		a.pipeArgument != b.pipeArgument ||
		!a.required.equal(b.required) ||
		a.ret != b.ret {
		return false
	}
	for k, pA := range a.parameters {
		pB, ok := b.parameters[k]
		if !ok || pA != pB {
			return false
		}
	}
	return true
}

func (t *functionType) PolyType() PolyType {
	parameters := make(map[string]PolyType, len(t.parameters))
	for k, p := range t.parameters {
		parameters[k] = p.PolyType()
	}
	return NewFunctionPolyType(FunctionPolySignature{
		Parameters: parameters,
		Required:   t.required.copy(),
		Return:     t.ret.PolyType(),
	})
}

func (t *functionType) typ() {}

// functionTypeCache caches all *functionTypes.
var functionTypeCache struct {
	sync.Mutex // Guards stores (but not loads) on m.

	// m is a map[Type][]*functionType keyed by the elementType of the array.
	// Elements in m are append-only and thus safe for concurrent reading.
	m sync.Map
}

type FunctionSignature struct {
	Parameters   map[string]Type
	Required     []string
	Return       Type
	PipeArgument string
}

func NewFunctionType(sig FunctionSignature) (t Type) {
	ft := &functionType{
		parameters:   sig.Parameters,
		required:     LabelSet(sig.Required).remove(sig.PipeArgument),
		ret:          sig.Return,
		pipeArgument: sig.PipeArgument,
	}
	if ft.ret == nil {
		ft.ret = Nil
	}
	in := NewObjectType(ft.parameters)
	// Lookup functionType in cache by in type
	if ts, ok := functionTypeCache.m.Load(in); ok {
		// Search for matching function type
		for _, t := range ts.([]*functionType) {
			if t.equal(ft) {
				return t
			}
		}
	}

	// Type not found in cache, lock and retry.
	functionTypeCache.Lock()
	defer functionTypeCache.Unlock()

	// First read again while holding the lock.
	var types []*functionType
	if ts, ok := functionTypeCache.m.Load(in); ok {
		types = ts.([]*functionType)
		// Search for matching function type
		for _, t := range types {
			if t.equal(ft) {
				return t
			}
		}
	}

	functionTypeCache.m.Store(in, append(types, ft))
	return ft
}
