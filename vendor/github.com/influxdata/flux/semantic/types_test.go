package semantic_test

import (
	"testing"

	"github.com/influxdata/flux/semantic"
)

func MustType(e semantic.Expression) semantic.Type {
	ts, _ := semantic.InferTypes(e, nil)
	typ, _ := ts.TypeOf(e)
	return typ
}

func TestTypes_Comparable(t *testing.T) {
	testCases := []struct {
		name string
		a, b semantic.Type
		want bool
	}{
		{
			name: "equal int",
			a:    semantic.Int,
			b:    semantic.Int,
			want: true,
		},
		{
			name: "not equal int bool",
			a:    semantic.Int,
			b:    semantic.Bool,
			want: false,
		},
		{
			name: "equal array",
			a: MustType(&semantic.ArrayExpression{
				Elements: []semantic.Expression{
					&semantic.IntegerLiteral{Value: 1},
				},
			}),
			b: MustType(&semantic.ArrayExpression{
				Elements: []semantic.Expression{
					&semantic.IntegerLiteral{Value: 2},
				},
			}),
			want: true,
		},
		{
			name: "not equal arrays",
			a: MustType(&semantic.ArrayExpression{
				Elements: []semantic.Expression{
					&semantic.IntegerLiteral{Value: 1},
				},
			}),
			b: MustType(&semantic.ArrayExpression{
				Elements: []semantic.Expression{
					&semantic.BooleanLiteral{Value: true},
				},
			}),
			want: false,
		},
		{
			name: "not equal arrays primitive",
			a: MustType(&semantic.ArrayExpression{
				Elements: []semantic.Expression{
					&semantic.IntegerLiteral{Value: 1},
				},
			}),
			b:    semantic.Int,
			want: false,
		},
		{
			name: "not equal empty array primitive",
			a:    MustType(&semantic.ArrayExpression{}),
			b:    semantic.Nil,
			want: false,
		},
		{
			name: "equal empty arrays",
			a:    MustType(&semantic.ArrayExpression{}),
			b:    MustType(&semantic.ArrayExpression{}),
			want: true,
		},
		{
			name: "equal arrays of arrays",
			a: MustType(&semantic.ArrayExpression{
				Elements: []semantic.Expression{
					&semantic.ArrayExpression{
						Elements: []semantic.Expression{
							&semantic.IntegerLiteral{Value: 1},
						},
					},
				},
			}),
			b: MustType(&semantic.ArrayExpression{
				Elements: []semantic.Expression{
					&semantic.ArrayExpression{
						Elements: []semantic.Expression{
							&semantic.IntegerLiteral{Value: 2},
						},
					},
				},
			}),
			want: true,
		},
		{
			name: "equal objects",
			a: MustType(&semantic.ObjectExpression{
				Properties: []*semantic.Property{
					{Key: &semantic.Identifier{Name: "x"}, Value: &semantic.IntegerLiteral{Value: 1}},
					{Key: &semantic.Identifier{Name: "y"}, Value: &semantic.FloatLiteral{Value: 1}},
				},
			}),
			b: MustType(&semantic.ObjectExpression{
				Properties: []*semantic.Property{
					{Key: &semantic.Identifier{Name: "x"}, Value: &semantic.IntegerLiteral{Value: -1}},
					{Key: &semantic.Identifier{Name: "y"}, Value: &semantic.FloatLiteral{Value: -1}},
				},
			}),
			want: true,
		},
		{
			name: "equal objects of objects",
			a: MustType(&semantic.ObjectExpression{
				Properties: []*semantic.Property{
					{
						Key: &semantic.Identifier{Name: "x"},
						Value: &semantic.ObjectExpression{
							Properties: []*semantic.Property{
								{Key: &semantic.Identifier{Name: "m"}, Value: &semantic.IntegerLiteral{Value: 1}},
								{Key: &semantic.Identifier{Name: "n"}, Value: &semantic.FloatLiteral{Value: 1}},
							},
						},
					},
					{
						Key: &semantic.Identifier{Name: "y"},
						Value: &semantic.ObjectExpression{
							Properties: []*semantic.Property{
								{Key: &semantic.Identifier{Name: "j"}, Value: &semantic.IntegerLiteral{Value: 1}},
								{Key: &semantic.Identifier{Name: "k"}, Value: &semantic.FloatLiteral{Value: 1}},
							},
						},
					},
				},
			}),
			b: MustType(&semantic.ObjectExpression{
				Properties: []*semantic.Property{
					{
						Key: &semantic.Identifier{Name: "x"},
						Value: &semantic.ObjectExpression{
							Properties: []*semantic.Property{
								{Key: &semantic.Identifier{Name: "m"}, Value: &semantic.IntegerLiteral{Value: 3}},
								{Key: &semantic.Identifier{Name: "n"}, Value: &semantic.FloatLiteral{Value: 3}},
							},
						},
					},
					{
						Key: &semantic.Identifier{Name: "y"},
						Value: &semantic.ObjectExpression{
							Properties: []*semantic.Property{
								{Key: &semantic.Identifier{Name: "j"}, Value: &semantic.IntegerLiteral{Value: 4}},
								{Key: &semantic.Identifier{Name: "k"}, Value: &semantic.FloatLiteral{Value: 4}},
							},
						},
					},
				},
			}),
			want: true,
		},
		{
			name: "equal array of objects",
			a: MustType(&semantic.ArrayExpression{
				Elements: []semantic.Expression{&semantic.ObjectExpression{
					Properties: []*semantic.Property{
						{Key: &semantic.Identifier{Name: "x"}, Value: &semantic.IntegerLiteral{Value: 1}},
						{Key: &semantic.Identifier{Name: "y"}, Value: &semantic.FloatLiteral{Value: 1}},
					},
				}},
			}),
			b: MustType(&semantic.ArrayExpression{
				Elements: []semantic.Expression{&semantic.ObjectExpression{
					Properties: []*semantic.Property{
						{Key: &semantic.Identifier{Name: "x"}, Value: &semantic.IntegerLiteral{Value: 2}},
						{Key: &semantic.Identifier{Name: "y"}, Value: &semantic.FloatLiteral{Value: 2}},
					},
				}},
			}),
			want: true,
		},
		{
			name: "not equal array of objects",
			a: MustType(&semantic.ArrayExpression{
				Elements: []semantic.Expression{&semantic.ObjectExpression{
					Properties: []*semantic.Property{
						{Key: &semantic.Identifier{Name: "x"}, Value: &semantic.IntegerLiteral{Value: 1}},
						{Key: &semantic.Identifier{Name: "y"}, Value: &semantic.FloatLiteral{Value: 1}},
					},
				}},
			}),
			b: MustType(&semantic.ArrayExpression{
				Elements: []semantic.Expression{&semantic.ObjectExpression{
					Properties: []*semantic.Property{
						{Key: &semantic.Identifier{Name: "w"}, Value: &semantic.IntegerLiteral{Value: 2}},
						{Key: &semantic.Identifier{Name: "x"}, Value: &semantic.FloatLiteral{Value: 2}},
					},
				}},
			}),
			want: false,
		},
	}
	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			if tc.want {
				if tc.a != tc.b {
					t.Errorf("expected types to be equal: pointers %p %p a: %#v b: %#v", tc.a, tc.b, tc.a, tc.b)
				}
			} else {
				if tc.a == tc.b {
					t.Errorf("expected types to not be equal: pointers %p %p a: %#v b: %#v", tc.a, tc.b, tc.a, tc.b)
				}
			}
		})
	}
}
