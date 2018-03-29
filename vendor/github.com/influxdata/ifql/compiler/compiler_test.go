package compiler_test

import (
	"reflect"
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/ifql/ast"
	"github.com/influxdata/ifql/compiler"
	"github.com/influxdata/ifql/semantic"
	"github.com/influxdata/ifql/semantic/semantictest"
)

var CmpOptions []cmp.Option

func init() {
	CmpOptions = append(semantictest.CmpOptions, cmp.Comparer(ValueEqual))
}

func ValueEqual(x, y compiler.Value) bool {
	if x.Type() != y.Type() {
		return false
	}
	switch k := x.Type().Kind(); k {
	case semantic.Bool:
		return x.Bool() == y.Bool()
	case semantic.UInt:
		return x.UInt() == y.UInt()
	case semantic.Int:
		return x.Int() == y.Int()
	case semantic.Float:
		return x.Float() == y.Float()
	case semantic.String:
		return x.Str() == y.Str()
	case semantic.Time:
		return x.Time() == y.Time()
	case semantic.Object:
		return cmp.Equal(x.Object(), y.Object(), CmpOptions...)
	default:
		return false
	}
}

func TestCompilationCache(t *testing.T) {
	add := &semantic.FunctionExpression{
		Params: []*semantic.FunctionParam{
			{Key: &semantic.Identifier{Name: "a"}},
			{Key: &semantic.Identifier{Name: "b"}},
		},
		Body: &semantic.BinaryExpression{
			Operator: ast.AdditionOperator,
			Left:     &semantic.IdentifierExpression{Name: "a"},
			Right:    &semantic.IdentifierExpression{Name: "b"},
		},
	}
	testCases := []struct {
		name  string
		types map[string]semantic.Type
		scope map[string]compiler.Value
		want  compiler.Value
	}{
		{
			name: "floats",
			types: map[string]semantic.Type{
				"a": semantic.Float,
				"b": semantic.Float,
			},
			scope: map[string]compiler.Value{
				"a": compiler.NewFloat(5),
				"b": compiler.NewFloat(4),
			},
			want: compiler.NewFloat(9),
		},
		{
			name: "ints",
			types: map[string]semantic.Type{
				"a": semantic.Int,
				"b": semantic.Int,
			},
			scope: map[string]compiler.Value{
				"a": compiler.NewInt(5),
				"b": compiler.NewInt(4),
			},
			want: compiler.NewInt(9),
		},
		{
			name: "uints",
			types: map[string]semantic.Type{
				"a": semantic.UInt,
				"b": semantic.UInt,
			},
			scope: map[string]compiler.Value{
				"a": compiler.NewUInt(5),
				"b": compiler.NewUInt(4),
			},
			want: compiler.NewUInt(9),
		},
	}

	//Reuse the same cache for all test cases
	cache := compiler.NewCompilationCache(add)
	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			f0, err := cache.Compile(tc.types)
			if err != nil {
				t.Fatal(err)
			}
			f1, err := cache.Compile(tc.types)
			if err != nil {
				t.Fatal(err)
			}
			if !reflect.DeepEqual(f0, f1) {
				t.Errorf("unexpected new compilation result")
			}

			got0, err := f0.Eval(tc.scope)
			if err != nil {
				t.Fatal(err)
			}
			got1, err := f1.Eval(tc.scope)
			if err != nil {
				t.Fatal(err)
			}

			if !cmp.Equal(got0, tc.want, CmpOptions...) {
				t.Errorf("unexpected eval result -want/+got\n%s", cmp.Diff(tc.want, got0, CmpOptions...))
			}
			if !cmp.Equal(got0, got1, CmpOptions...) {
				t.Errorf("unexpected differing results -got0/+got1\n%s", cmp.Diff(got0, got1, CmpOptions...))
			}

		})
	}
}

func TestCompile(t *testing.T) {
	testCases := []struct {
		name    string
		fn      *semantic.FunctionExpression
		types   map[string]semantic.Type
		scope   map[string]compiler.Value
		want    compiler.Value
		wantErr bool
	}{
		{
			name: "simple ident return",
			fn: &semantic.FunctionExpression{
				Params: []*semantic.FunctionParam{
					{Key: &semantic.Identifier{Name: "r"}},
				},
				Body: &semantic.IdentifierExpression{Name: "r"},
			},
			types: map[string]semantic.Type{
				"r": semantic.Int,
			},
			scope: map[string]compiler.Value{
				"r": compiler.NewInt(4),
			},
			want:    compiler.NewInt(4),
			wantErr: false,
		},
	}

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			f, err := compiler.Compile(tc.fn, tc.types)
			if tc.wantErr != (err != nil) {
				t.Errorf("unexpected error %s", err)
			}

			got, err := f.Eval(tc.scope)
			if tc.wantErr != (err != nil) {
				t.Errorf("unexpected error %s", err)
			}

			if !cmp.Equal(tc.want, got, CmpOptions...) {
				t.Errorf("unexpected value -want/+got\n%s", cmp.Diff(tc.want, got, CmpOptions...))
			}
		})
	}
}
