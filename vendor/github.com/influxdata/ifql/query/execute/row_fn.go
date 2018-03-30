package execute

import (
	"fmt"

	"github.com/influxdata/ifql/compiler"
	"github.com/influxdata/ifql/semantic"
	"github.com/pkg/errors"
)

type rowFn struct {
	fn               *semantic.FunctionExpression
	compilationCache *compiler.CompilationCache
	scope            compiler.Scope

	preparedFn compiler.Func

	recordName string
	record     *compiler.Object

	recordCols map[string]int
	references []string
}

func newRowFn(fn *semantic.FunctionExpression) (rowFn, error) {
	if len(fn.Params) != 1 {
		return rowFn{}, fmt.Errorf("function should only have a single parameter, got %d", len(fn.Params))
	}
	return rowFn{
		compilationCache: compiler.NewCompilationCache(fn),
		scope:            make(compiler.Scope, 1),
		recordName:       fn.Params[0].Key.Name,
		references:       findColReferences(fn),
		recordCols:       make(map[string]int),
		record:           compiler.NewObject(),
	}, nil
}

func (f *rowFn) prepare(cols []ColMeta) error {
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
	// Compile fn for given types
	fn, err := f.compilationCache.Compile(map[string]semantic.Type{
		f.recordName: semantic.NewObjectType(propertyTypes),
	})
	if err != nil {
		return err
	}
	f.preparedFn = fn
	return nil
}

func ConvertToKind(t DataType) semantic.Kind {
	// TODO make this an array lookup.
	switch t {
	case TInvalid:
		return semantic.Invalid
	case TBool:
		return semantic.Bool
	case TInt:
		return semantic.Int
	case TUInt:
		return semantic.UInt
	case TFloat:
		return semantic.Float
	case TString:
		return semantic.String
	case TTime:
		return semantic.Time
	default:
		return semantic.Invalid
	}
}

func ConvertFromKind(k semantic.Kind) DataType {
	// TODO make this an array lookup.
	switch k {
	case semantic.Invalid:
		return TInvalid
	case semantic.Bool:
		return TBool
	case semantic.Int:
		return TInt
	case semantic.UInt:
		return TUInt
	case semantic.Float:
		return TFloat
	case semantic.String:
		return TString
	case semantic.Time:
		return TTime
	default:
		return TInvalid
	}
}

func (f *rowFn) eval(row int, rr RowReader) (compiler.Value, error) {
	for _, r := range f.references {
		f.record.Set(r, ValueForRow(row, f.recordCols[r], rr))
	}
	f.scope[f.recordName] = f.record
	return f.preparedFn.Eval(f.scope)
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

func (f *RowPredicateFn) Prepare(cols []ColMeta) error {
	err := f.rowFn.prepare(cols)
	if err != nil {
		return err
	}
	if f.preparedFn.Type() != semantic.Bool {
		return errors.New("row predicate function does not evaluate to a boolean")
	}
	return nil
}

func (f *RowPredicateFn) Eval(row int, rr RowReader) (bool, error) {
	v, err := f.rowFn.eval(row, rr)
	if err != nil {
		return false, err
	}
	return v.Bool(), nil
}

type RowMapFn struct {
	rowFn

	isWrap  bool
	wrapObj *compiler.Object
}

func NewRowMapFn(fn *semantic.FunctionExpression) (*RowMapFn, error) {
	r, err := newRowFn(fn)
	if err != nil {
		return nil, err
	}
	return &RowMapFn{
		rowFn:   r,
		wrapObj: compiler.NewObject(),
	}, nil
}

func (f *RowMapFn) Prepare(cols []ColMeta) error {
	err := f.rowFn.prepare(cols)
	if err != nil {
		return err
	}
	k := f.preparedFn.Type().Kind()
	f.isWrap = k != semantic.Object
	if f.isWrap {
		f.wrapObj.SetPropertyType(DefaultValueColLabel, f.preparedFn.Type())
	}
	return nil
}

func (f *RowMapFn) Type() semantic.Type {
	if f.isWrap {
		return f.wrapObj.Type()
	}
	return f.preparedFn.Type()
}

func (f *RowMapFn) Eval(row int, rr RowReader) (*compiler.Object, error) {
	v, err := f.rowFn.eval(row, rr)
	if err != nil {
		return nil, err
	}
	if f.isWrap {
		f.wrapObj.Set(DefaultValueColLabel, v)
		return f.wrapObj, nil
	}
	return v.Object(), nil
}

func ValueForRow(i, j int, rr RowReader) compiler.Value {
	t := rr.Cols()[j].Type
	switch t {
	case TBool:
		return compiler.NewBool(rr.AtBool(i, j))
	case TInt:
		return compiler.NewInt(rr.AtInt(i, j))
	case TUInt:
		return compiler.NewUInt(rr.AtUInt(i, j))
	case TFloat:
		return compiler.NewFloat(rr.AtFloat(i, j))
	case TString:
		return compiler.NewString(rr.AtString(i, j))
	case TTime:
		return compiler.NewTime(compiler.Time(rr.AtTime(i, j)))
	default:
		PanicUnknownType(t)
		return nil
	}
}

func AppendValue(builder BlockBuilder, j int, v compiler.Value) {
	switch k := v.Type().Kind(); k {
	case semantic.Bool:
		builder.AppendBool(j, v.Bool())
	case semantic.Int:
		builder.AppendInt(j, v.Int())
	case semantic.UInt:
		builder.AppendUInt(j, v.UInt())
	case semantic.Float:
		builder.AppendFloat(j, v.Float())
	case semantic.String:
		builder.AppendString(j, v.Str())
	case semantic.Time:
		builder.AppendTime(j, Time(v.Time()))
	default:
		PanicUnknownType(ConvertFromKind(k))
	}
}

func findColReferences(fn *semantic.FunctionExpression) []string {
	v := &colReferenceVisitor{
		recordName: fn.Params[0].Key.Name,
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

func (c *colReferenceVisitor) Done() {}
