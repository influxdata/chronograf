package edit

import (
	"fmt"
	"sort"

	"github.com/influxdata/flux/ast"
	"github.com/influxdata/flux/semantic"
	"github.com/influxdata/flux/values"
)

// `OptionFn` is a function that, provided with an `OptionStatement`, returns
// an `Expression` or an error. It is used by `Option` functions to edit
// AST's options statements.
type OptionFn func(opt *ast.OptionStatement) (ast.Expression, error)

// `Option` passes the `OptionStatement` in the AST rooted at `node` that has the
// specified identifier to `fn`.
// The function can have side effects on the option statement
// and/or return a non-nil `Expression` that is set as value for the option.
// If the value returned by the edit function is `nil` (or an error is returned) no new value is set
// for the option statement (but any, maybe partial, side effect is applied).
// `Option` returns whether it could find and edit the option (possibly with errors) or not.
func Option(node ast.Node, optionIdentifier string, fn OptionFn) (bool, error) {
	oe := &optionEditor{identifier: optionIdentifier, optionFn: fn, err: nil}
	ast.Walk(oe, node)

	if oe.err != nil {
		return oe.found, oe.err
	}

	return oe.found, nil
}

// Creates an `OptionFn` for setting the value of an `OptionStatement`.
func OptionValueFn(expr ast.Expression) OptionFn {
	return func(opt *ast.OptionStatement) (ast.Expression, error) {
		return expr, nil
	}
}

// Creates an `OptionFn` for updating the values of an `OptionStatement` that has an
// `ObjectExpression` as value. Returns error if the child of the option statement is not
// an object expression, or if some key in the provided map is not a property of the object.
func OptionObjectFn(keyMap map[string]values.Value) OptionFn {
	return func(opt *ast.OptionStatement) (ast.Expression, error) {
		obj, ok := opt.Assignment.Init.(*ast.ObjectExpression)
		if !ok {
			return nil, fmt.Errorf("value is is %s, not an object expression", opt.Assignment.Init.Type())
		}

		// check that every specified property exists in the object
		keys := make(map[string]bool, len(obj.Properties))
		for _, p := range obj.Properties {
			keys[p.Key.Key()] = true
		}

		for k := range keyMap {
			if !keys[k] {
				return nil, fmt.Errorf("cannot find property '%s' in object expression", k)
			}
		}

		for _, p := range obj.Properties {
			value, found := keyMap[p.Key.Key()]
			if found {
				p.Value = CreateLiteral(value)
			}
		}

		return nil, nil
	}
}

// `CreateLiteral` creates a AST `Expression` from a `Value`. Supported types for value are Bool, Int, UInt, Float,
// String, Time, Duration, Regexp, Array, and Object. In the case of Object, the returned expression gets
// properties sorted by their keys in increasing order.
func CreateLiteral(v values.Value) ast.Expression {
	var literal ast.Expression
	switch v.Type().Nature() {
	case semantic.Bool:
		literal = &ast.BooleanLiteral{Value: v.Bool()}
	case semantic.UInt:
		literal = &ast.UnsignedIntegerLiteral{Value: v.UInt()}
	case semantic.Int:
		literal = &ast.IntegerLiteral{Value: v.Int()}
	case semantic.Float:
		literal = &ast.FloatLiteral{Value: v.Float()}
	case semantic.String:
		literal = &ast.StringLiteral{Value: v.Str()}
	case semantic.Time:
		literal = &ast.DateTimeLiteral{Value: v.Time().Time()}
	case semantic.Duration:
		literal = &ast.DurationLiteral{
			Values: []ast.Duration{
				{
					Magnitude: int64(v.Duration()),
					Unit:      "ns",
				},
			},
		}
	case semantic.Regexp:
		literal = &ast.RegexpLiteral{Value: v.Regexp()}
	case semantic.Array:
		arr := v.Array()
		arrExpr := &ast.ArrayExpression{Elements: make([]ast.Expression, arr.Len())}

		arr.Range(func(i int, el values.Value) {
			arrExpr.Elements[i] = CreateLiteral(el)
		})

		literal = arrExpr
	case semantic.Object:
		obj := v.Object()

		// sort keys
		keys := make([]string, 0, obj.Len())
		obj.Range(func(k string, v values.Value) {
			keys = append(keys, k)
		})
		sort.Strings(keys)

		props := make([]*ast.Property, len(keys))

		for i, k := range keys {
			v, _ := obj.Get(k)
			prop := &ast.Property{
				Key:   &ast.Identifier{Name: k},
				Value: CreateLiteral(v),
			}

			props[i] = prop
		}

		literal = &ast.ObjectExpression{Properties: props}
	default:
		panic(fmt.Errorf("cannot create literal for %v", v.Type().Nature()))
	}

	return literal
}

//Finds the `OptionStatement` with the specified `identifier` and updates its value.
//There shouldn't be more then one option statement with the same identifier
//in a valid query.
type optionEditor struct {
	identifier string
	optionFn   OptionFn
	err        error
	found      bool
}

func (v *optionEditor) Visit(node ast.Node) ast.Visitor {
	if os, ok := node.(*ast.OptionStatement); ok {
		if os.Assignment.ID.Name == v.identifier {
			v.found = true

			newInit, err := v.optionFn(os)

			if err != nil {
				v.err = err
			} else if newInit != nil {
				os.Assignment.Init = newInit
			}

			return nil
		}
	}

	return v
}

func (v *optionEditor) Done(node ast.Node) {}
