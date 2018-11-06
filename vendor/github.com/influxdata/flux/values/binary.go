package values

import (
	"fmt"
	"math"

	"github.com/influxdata/flux/ast"
	"github.com/influxdata/flux/semantic"
)

type BinaryFunction func(l, r Value) Value

type BinaryFuncSignature struct {
	Operator    ast.OperatorKind
	Left, Right semantic.Type
}

// LookupBinaryFunction returns an appropriate binary function that evaluates two values and returns another value.
// If the two types are not compatible with the given operation, this returns an error.
func LookupBinaryFunction(sig BinaryFuncSignature) (BinaryFunction, error) {
	f, ok := binaryFuncLookup[sig]
	if !ok {
		return nil, fmt.Errorf("unsupported binary expression %v %v %v", sig.Left, sig.Operator, sig.Right)
	}
	return f, nil
}

var binaryFuncLookup = map[BinaryFuncSignature]BinaryFunction{
	//---------------
	// Math Operators
	//---------------
	{Operator: ast.AdditionOperator, Left: semantic.Int, Right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Int()
		r := rv.Int()
		return NewInt(l + r)
	},
	{Operator: ast.AdditionOperator, Left: semantic.UInt, Right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.UInt()
		r := rv.UInt()
		return NewUInt(l + r)
	},
	{Operator: ast.AdditionOperator, Left: semantic.Float, Right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Float()
		r := rv.Float()
		return NewFloat(l + r)
	},
	{Operator: ast.SubtractionOperator, Left: semantic.Int, Right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Int()
		r := rv.Int()
		return NewInt(l - r)
	},
	{Operator: ast.SubtractionOperator, Left: semantic.UInt, Right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.UInt()
		r := rv.UInt()
		return NewUInt(l - r)
	},
	{Operator: ast.SubtractionOperator, Left: semantic.Float, Right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Float()
		r := rv.Float()
		return NewFloat(l - r)
	},
	{Operator: ast.MultiplicationOperator, Left: semantic.Int, Right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Int()
		r := rv.Int()
		return NewInt(l * r)
	},
	{Operator: ast.MultiplicationOperator, Left: semantic.UInt, Right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.UInt()
		r := rv.UInt()
		return NewUInt(l * r)
	},
	{Operator: ast.MultiplicationOperator, Left: semantic.Float, Right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Float()
		r := rv.Float()
		return NewFloat(l * r)
	},
	{Operator: ast.DivisionOperator, Left: semantic.Int, Right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Int()
		r := rv.Int()
		if r == 0 {
			// TODO(#38): reject divisions with a constant 0 divisor.
			return NewInt(0)
		}
		return NewInt(l / r)
	},
	{Operator: ast.DivisionOperator, Left: semantic.UInt, Right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.UInt()
		r := rv.UInt()
		if r == 0 {
			// TODO(#38): reject divisions with a constant 0 divisor.
			return NewUInt(0)
		}
		return NewUInt(l / r)
	},
	{Operator: ast.DivisionOperator, Left: semantic.Float, Right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Float()
		r := rv.Float()
		if r == 0 {
			// TODO(#38): reject divisions with a constant 0 divisor.
			return NewFloat(math.NaN())
		}
		return NewFloat(l / r)
	},

	//---------------------
	// Comparison Operators
	//---------------------

	// LessThanEqualOperator

	{Operator: ast.LessThanEqualOperator, Left: semantic.Int, Right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Int()
		r := rv.Int()
		return NewBool(l <= r)
	},
	{Operator: ast.LessThanEqualOperator, Left: semantic.Int, Right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Int()
		r := rv.UInt()
		if l < 0 {
			return NewBool(true)
		}
		return NewBool(uint64(l) <= r)
	},
	{Operator: ast.LessThanEqualOperator, Left: semantic.Int, Right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Int()
		r := rv.Float()
		return NewBool(float64(l) <= r)
	},
	{Operator: ast.LessThanEqualOperator, Left: semantic.UInt, Right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.UInt()
		r := rv.Int()
		if r < 0 {
			return NewBool(false)
		}
		return NewBool(l <= uint64(r))
	},
	{Operator: ast.LessThanEqualOperator, Left: semantic.UInt, Right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.UInt()
		r := rv.UInt()
		return NewBool(l <= r)
	},
	{Operator: ast.LessThanEqualOperator, Left: semantic.UInt, Right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.UInt()
		r := rv.Float()
		return NewBool(float64(l) <= r)
	},
	{Operator: ast.LessThanEqualOperator, Left: semantic.Float, Right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Float()
		r := rv.Int()
		return NewBool(l <= float64(r))
	},
	{Operator: ast.LessThanEqualOperator, Left: semantic.Float, Right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Float()
		r := rv.UInt()
		return NewBool(l <= float64(r))
	},
	{Operator: ast.LessThanEqualOperator, Left: semantic.Float, Right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Float()
		r := rv.Float()
		return NewBool(l <= r)
	},

	// LessThanOperator

	{Operator: ast.LessThanOperator, Left: semantic.Int, Right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Int()
		r := rv.Int()
		return NewBool(l < r)
	},
	{Operator: ast.LessThanOperator, Left: semantic.Int, Right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Int()
		r := rv.UInt()
		if l < 0 {
			return NewBool(true)
		}
		return NewBool(uint64(l) < r)
	},
	{Operator: ast.LessThanOperator, Left: semantic.Int, Right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Int()
		r := rv.Float()
		return NewBool(float64(l) < r)
	},
	{Operator: ast.LessThanOperator, Left: semantic.UInt, Right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.UInt()
		r := rv.Int()
		if r < 0 {
			return NewBool(false)
		}
		return NewBool(l < uint64(r))
	},
	{Operator: ast.LessThanOperator, Left: semantic.UInt, Right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.UInt()
		r := rv.UInt()
		return NewBool(l < r)
	},
	{Operator: ast.LessThanOperator, Left: semantic.UInt, Right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.UInt()
		r := rv.Float()
		return NewBool(float64(l) < r)
	},
	{Operator: ast.LessThanOperator, Left: semantic.Float, Right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Float()
		r := rv.Int()
		return NewBool(l < float64(r))
	},
	{Operator: ast.LessThanOperator, Left: semantic.Float, Right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Float()
		r := rv.UInt()
		return NewBool(l < float64(r))
	},
	{Operator: ast.LessThanOperator, Left: semantic.Float, Right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Float()
		r := rv.Float()
		return NewBool(l < r)
	},

	// GreaterThanEqualOperator

	{Operator: ast.GreaterThanEqualOperator, Left: semantic.Int, Right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Int()
		r := rv.Int()
		return NewBool(l >= r)
	},
	{Operator: ast.GreaterThanEqualOperator, Left: semantic.Int, Right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Int()
		r := rv.UInt()
		if l < 0 {
			return NewBool(true)
		}
		return NewBool(uint64(l) >= r)
	},
	{Operator: ast.GreaterThanEqualOperator, Left: semantic.Int, Right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Int()
		r := rv.Float()
		return NewBool(float64(l) >= r)
	},
	{Operator: ast.GreaterThanEqualOperator, Left: semantic.UInt, Right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.UInt()
		r := rv.Int()
		if r < 0 {
			return NewBool(false)
		}
		return NewBool(l >= uint64(r))
	},
	{Operator: ast.GreaterThanEqualOperator, Left: semantic.UInt, Right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.UInt()
		r := rv.UInt()
		return NewBool(l >= r)
	},
	{Operator: ast.GreaterThanEqualOperator, Left: semantic.UInt, Right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.UInt()
		r := rv.Float()
		return NewBool(float64(l) >= r)
	},
	{Operator: ast.GreaterThanEqualOperator, Left: semantic.Float, Right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Float()
		r := rv.Int()
		return NewBool(l >= float64(r))
	},
	{Operator: ast.GreaterThanEqualOperator, Left: semantic.Float, Right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Float()
		r := rv.UInt()
		return NewBool(l >= float64(r))
	},
	{Operator: ast.GreaterThanEqualOperator, Left: semantic.Float, Right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Float()
		r := rv.Float()
		return NewBool(l >= r)
	},

	// GreaterThanOperator

	{Operator: ast.GreaterThanOperator, Left: semantic.Int, Right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Int()
		r := rv.Int()
		return NewBool(l > r)
	},
	{Operator: ast.GreaterThanOperator, Left: semantic.Int, Right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Int()
		r := rv.UInt()
		if l < 0 {
			return NewBool(true)
		}
		return NewBool(uint64(l) > r)
	},
	{Operator: ast.GreaterThanOperator, Left: semantic.Int, Right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Int()
		r := rv.Float()
		return NewBool(float64(l) > r)
	},
	{Operator: ast.GreaterThanOperator, Left: semantic.UInt, Right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.UInt()
		r := rv.Int()
		if r < 0 {
			return NewBool(false)
		}
		return NewBool(l > uint64(r))
	},
	{Operator: ast.GreaterThanOperator, Left: semantic.UInt, Right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.UInt()
		r := rv.UInt()
		return NewBool(l > r)
	},
	{Operator: ast.GreaterThanOperator, Left: semantic.UInt, Right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.UInt()
		r := rv.Float()
		return NewBool(float64(l) > r)
	},
	{Operator: ast.GreaterThanOperator, Left: semantic.Float, Right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Float()
		r := rv.Int()
		return NewBool(l > float64(r))
	},
	{Operator: ast.GreaterThanOperator, Left: semantic.Float, Right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Float()
		r := rv.UInt()
		return NewBool(l > float64(r))
	},
	{Operator: ast.GreaterThanOperator, Left: semantic.Float, Right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Float()
		r := rv.Float()
		return NewBool(l > r)
	},

	// EqualOperator

	{Operator: ast.EqualOperator, Left: semantic.Int, Right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Int()
		r := rv.Int()
		return NewBool(l == r)
	},
	{Operator: ast.EqualOperator, Left: semantic.Int, Right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Int()
		r := rv.UInt()
		if l < 0 {
			return NewBool(false)
		}
		return NewBool(uint64(l) == r)
	},
	{Operator: ast.EqualOperator, Left: semantic.Int, Right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Int()
		r := rv.Float()
		return NewBool(float64(l) == r)
	},
	{Operator: ast.EqualOperator, Left: semantic.UInt, Right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.UInt()
		r := rv.Int()
		if r < 0 {
			return NewBool(false)
		}
		return NewBool(l == uint64(r))
	},
	{Operator: ast.EqualOperator, Left: semantic.UInt, Right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.UInt()
		r := rv.UInt()
		return NewBool(l == r)
	},
	{Operator: ast.EqualOperator, Left: semantic.UInt, Right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.UInt()
		r := rv.Float()
		return NewBool(float64(l) == r)
	},
	{Operator: ast.EqualOperator, Left: semantic.Float, Right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Float()
		r := rv.Int()
		return NewBool(l == float64(r))
	},
	{Operator: ast.EqualOperator, Left: semantic.Float, Right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Float()
		r := rv.UInt()
		return NewBool(l == float64(r))
	},
	{Operator: ast.EqualOperator, Left: semantic.Float, Right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Float()
		r := rv.Float()
		return NewBool(l == r)
	},
	{Operator: ast.EqualOperator, Left: semantic.String, Right: semantic.String}: func(lv, rv Value) Value {
		l := lv.Str()
		r := rv.Str()
		return NewBool(l == r)
	},

	// NotEqualOperator

	{Operator: ast.NotEqualOperator, Left: semantic.Int, Right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Int()
		r := rv.Int()
		return NewBool(l != r)
	},
	{Operator: ast.NotEqualOperator, Left: semantic.Int, Right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Int()
		r := rv.UInt()
		if l < 0 {
			return NewBool(true)
		}
		return NewBool(uint64(l) != r)
	},
	{Operator: ast.NotEqualOperator, Left: semantic.Int, Right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Int()
		r := rv.Float()
		return NewBool(float64(l) != r)
	},
	{Operator: ast.NotEqualOperator, Left: semantic.UInt, Right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.UInt()
		r := rv.Int()
		if r < 0 {
			return NewBool(true)
		}
		return NewBool(l != uint64(r))
	},
	{Operator: ast.NotEqualOperator, Left: semantic.UInt, Right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.UInt()
		r := rv.UInt()
		return NewBool(l != r)
	},
	{Operator: ast.NotEqualOperator, Left: semantic.UInt, Right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.UInt()
		r := rv.Float()
		return NewBool(float64(l) != r)
	},
	{Operator: ast.NotEqualOperator, Left: semantic.Float, Right: semantic.Int}: func(lv, rv Value) Value {
		l := lv.Float()
		r := rv.Int()
		return NewBool(l != float64(r))
	},
	{Operator: ast.NotEqualOperator, Left: semantic.Float, Right: semantic.UInt}: func(lv, rv Value) Value {
		l := lv.Float()
		r := rv.UInt()
		return NewBool(l != float64(r))
	},
	{Operator: ast.NotEqualOperator, Left: semantic.Float, Right: semantic.Float}: func(lv, rv Value) Value {
		l := lv.Float()
		r := rv.Float()
		return NewBool(l != r)
	},
	{Operator: ast.NotEqualOperator, Left: semantic.String, Right: semantic.String}: func(lv, rv Value) Value {
		l := lv.Str()
		r := rv.Str()
		return NewBool(l != r)
	},
	{Operator: ast.RegexpMatchOperator, Left: semantic.String, Right: semantic.Regexp}: func(lv, rv Value) Value {
		l := lv.Str()
		r := rv.Regexp()
		return NewBool(r.MatchString(l))
	},
	{Operator: ast.RegexpMatchOperator, Left: semantic.Regexp, Right: semantic.String}: func(lv, rv Value) Value {
		l := lv.Regexp()
		r := rv.Str()
		return NewBool(l.MatchString(r))
	},
	{Operator: ast.NotRegexpMatchOperator, Left: semantic.String, Right: semantic.Regexp}: func(lv, rv Value) Value {
		l := lv.Str()
		r := rv.Regexp()
		return NewBool(!r.MatchString(l))
	},
	{Operator: ast.NotRegexpMatchOperator, Left: semantic.Regexp, Right: semantic.String}: func(lv, rv Value) Value {
		l := lv.Regexp()
		r := rv.Str()
		return NewBool(!l.MatchString(r))
	},

	{Operator: ast.AdditionOperator, Left: semantic.String, Right: semantic.String}: func(lv, rv Value) Value {
		l := lv.Str()
		r := rv.Str()
		return NewString(l + r)
	},
}
