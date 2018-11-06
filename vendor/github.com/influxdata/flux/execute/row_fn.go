package execute

import (
	"fmt"
	"regexp"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/compiler"
	"github.com/influxdata/flux/semantic"
	"github.com/influxdata/flux/values"
	"github.com/pkg/errors"
)

type rowFn struct {
	compilationCache *compiler.CompilationCache
	inRecord         values.Object

	preparedFn compiler.Func

	recordName string
	record     *Record

	recordCols map[string]int
	references []string
}

func newRowFn(fn *semantic.FunctionExpression) (rowFn, error) {
	if fn.Block.Parameters != nil && len(fn.Block.Parameters.List) != 1 {
		return rowFn{}, errors.New("function should only have a single parameter")
	}
	scope := flux.BuiltIns()
	return rowFn{
		compilationCache: compiler.NewCompilationCache(fn, scope),
		inRecord:         values.NewObject(),
		recordName:       fn.Block.Parameters.List[0].Key.Name,
		references:       findColReferences(fn),
		recordCols:       make(map[string]int),
	}, nil
}

func (f *rowFn) prepare(cols []flux.ColMeta) error {
	// Prepare types and recordCols
	propertyTypes := make(map[string]semantic.Type, len(f.references))
	for _, r := range f.references {
		found := false
		for j, c := range cols {
			if r == c.Label {
				f.recordCols[r] = j
				found = true
				propertyTypes[r] = ConvertToKind(c.Type)
				break
			}
		}
		if !found {
			return fmt.Errorf("function references unknown column %q", r)
		}
	}
	f.record = NewRecord(semantic.NewObjectType(propertyTypes))
	// Compile fn for given types
	fn, err := f.compilationCache.Compile(
		semantic.NewObjectType(map[string]semantic.Type{
			f.recordName: f.record.Type(),
		}),
	)
	if err != nil {
		return err
	}
	f.preparedFn = fn
	return nil
}

func ConvertToKind(t flux.ColType) semantic.Nature {
	// TODO make this an array lookup.
	switch t {
	case flux.TInvalid:
		return semantic.Invalid
	case flux.TBool:
		return semantic.Bool
	case flux.TInt:
		return semantic.Int
	case flux.TUInt:
		return semantic.UInt
	case flux.TFloat:
		return semantic.Float
	case flux.TString:
		return semantic.String
	case flux.TTime:
		return semantic.Time
	default:
		return semantic.Invalid
	}
}

func ConvertFromKind(k semantic.Nature) flux.ColType {
	// TODO make this an array lookup.
	switch k {
	case semantic.Invalid:
		return flux.TInvalid
	case semantic.Bool:
		return flux.TBool
	case semantic.Int:
		return flux.TInt
	case semantic.UInt:
		return flux.TUInt
	case semantic.Float:
		return flux.TFloat
	case semantic.String:
		return flux.TString
	case semantic.Time:
		return flux.TTime
	default:
		return flux.TInvalid
	}
}

func (f *rowFn) eval(row int, cr flux.ColReader) (values.Value, error) {
	for _, r := range f.references {
		f.record.Set(r, ValueForRow(cr, row, f.recordCols[r]))
	}
	f.inRecord.Set(f.recordName, f.record)
	return f.preparedFn.Eval(f.inRecord)
}

type RowPredicateFn struct {
	rowFn
}

func NewRowPredicateFn(fn *semantic.FunctionExpression) (*RowPredicateFn, error) {
	r, err := newRowFn(fn)
	if err != nil {
		return nil, err
	}
	return &RowPredicateFn{
		rowFn: r,
	}, nil
}

func (f *RowPredicateFn) Prepare(cols []flux.ColMeta) error {
	err := f.rowFn.prepare(cols)
	if err != nil {
		return err
	}
	if f.preparedFn.Type() != semantic.Bool {
		return errors.New("row predicate function does not evaluate to a boolean")
	}
	return nil
}

func (f *RowPredicateFn) Eval(row int, cr flux.ColReader) (bool, error) {
	v, err := f.rowFn.eval(row, cr)
	if err != nil {
		return false, err
	}
	return v.Bool(), nil
}

type RowMapFn struct {
	rowFn

	isWrap  bool
	wrapObj *Record
}

func NewRowMapFn(fn *semantic.FunctionExpression) (*RowMapFn, error) {
	r, err := newRowFn(fn)
	if err != nil {
		return nil, err
	}
	return &RowMapFn{
		rowFn: r,
	}, nil
}

func (f *RowMapFn) Prepare(cols []flux.ColMeta) error {
	err := f.rowFn.prepare(cols)
	if err != nil {
		return err
	}
	k := f.preparedFn.Type().Nature()
	f.isWrap = k != semantic.Object
	if f.isWrap {
		f.wrapObj = NewRecord(semantic.NewObjectType(map[string]semantic.Type{
			DefaultValueColLabel: f.preparedFn.Type(),
		}))
	}
	return nil
}

func (f *RowMapFn) Type() semantic.Type {
	if f.isWrap {
		return f.wrapObj.Type()
	}
	return f.preparedFn.Type()
}

func (f *RowMapFn) Eval(row int, cr flux.ColReader) (values.Object, error) {
	v, err := f.rowFn.eval(row, cr)
	if err != nil {
		return nil, err
	}
	if f.isWrap {
		f.wrapObj.Set(DefaultValueColLabel, v)
		return f.wrapObj, nil
	}
	return v.Object(), nil
}

func findColReferences(fn *semantic.FunctionExpression) []string {
	v := &colReferenceVisitor{
		recordName: fn.Block.Parameters.List[0].Key.Name,
	}
	semantic.Walk(v, fn)
	return v.refs
}

type colReferenceVisitor struct {
	recordName string
	refs       []string
}

func (c *colReferenceVisitor) Visit(node semantic.Node) semantic.Visitor {
	if me, ok := node.(*semantic.MemberExpression); ok {
		if obj, ok := me.Object.(*semantic.IdentifierExpression); ok && obj.Name == c.recordName {
			c.refs = append(c.refs, me.Property)
		}
	}
	return c
}

func (c *colReferenceVisitor) Done(semantic.Node) {}

type Record struct {
	t      semantic.Type
	values map[string]values.Value
}

func NewRecord(t semantic.Type) *Record {
	return &Record{
		t:      t,
		values: make(map[string]values.Value),
	}
}
func (r *Record) Type() semantic.Type {
	return r.t
}
func (r *Record) PolyType() semantic.PolyType {
	return r.t.PolyType()
}

func (r *Record) Str() string {
	panic(values.UnexpectedKind(semantic.Object, semantic.String))
}
func (r *Record) Int() int64 {
	panic(values.UnexpectedKind(semantic.Object, semantic.Int))
}
func (r *Record) UInt() uint64 {
	panic(values.UnexpectedKind(semantic.Object, semantic.UInt))
}
func (r *Record) Float() float64 {
	panic(values.UnexpectedKind(semantic.Object, semantic.Float))
}
func (r *Record) Bool() bool {
	panic(values.UnexpectedKind(semantic.Object, semantic.Bool))
}
func (r *Record) Time() values.Time {
	panic(values.UnexpectedKind(semantic.Object, semantic.Time))
}
func (r *Record) Duration() values.Duration {
	panic(values.UnexpectedKind(semantic.Object, semantic.Duration))
}
func (r *Record) Regexp() *regexp.Regexp {
	panic(values.UnexpectedKind(semantic.Object, semantic.Regexp))
}
func (r *Record) Array() values.Array {
	panic(values.UnexpectedKind(semantic.Object, semantic.Array))
}
func (r *Record) Object() values.Object {
	return r
}
func (r *Record) Function() values.Function {
	panic(values.UnexpectedKind(semantic.Object, semantic.Function))
}
func (r *Record) Equal(rhs values.Value) bool {
	if r.Type() != rhs.Type() {
		return false
	}
	obj := rhs.Object()
	if r.Len() != obj.Len() {
		return false
	}
	for k, v := range r.values {
		val, ok := obj.Get(k)
		if !ok || !v.Equal(val) {
			return false
		}
	}
	return true
}

func (r *Record) Set(name string, v values.Value) {
	r.values[name] = v
}
func (r *Record) Get(name string) (values.Value, bool) {
	v, ok := r.values[name]
	return v, ok
}
func (r *Record) Len() int {
	return len(r.values)
}

func (r *Record) Range(f func(name string, v values.Value)) {
	for k, v := range r.values {
		f(k, v)
	}
}
