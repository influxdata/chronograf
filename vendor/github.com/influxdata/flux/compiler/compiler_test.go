package compiler_test

import (
	"reflect"
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/flux/ast"
	"github.com/influxdata/flux/compiler"
	"github.com/influxdata/flux/semantic"
	"github.com/influxdata/flux/semantic/semantictest"
	"github.com/influxdata/flux/values"
)

var CmpOptions []cmp.Option

func init() {
	CmpOptions = append(semantictest.CmpOptions, cmp.Comparer(ValueEqual))
}

func ValueEqual(x, y values.Value) bool {
	switch k := x.Type().Nature(); k {
	case semantic.Object:
		if x.Type() != y.Type() {
			return false
		}
		return cmp.Equal(x.Object(), y.Object(), CmpOptions...)
	default:
		return x.Equal(y)
	}
}

func TestCompilationCache(t *testing.T) {
	add := &semantic.FunctionExpression{
		Block: &semantic.FunctionBlock{
			Parameters: &semantic.FunctionParameters{
				List: []*semantic.FunctionParameter{
					{Key: &semantic.Identifier{Name: "a"}},
					{Key: &semantic.Identifier{Name: "b"}},
				},
			},
			Body: &semantic.BinaryExpression{
				Operator: ast.AdditionOperator,
				Left:     &semantic.IdentifierExpression{Name: "a"},
				Right:    &semantic.IdentifierExpression{Name: "b"},
			},
		},
	}
	testCases := []struct {
		name   string
		inType semantic.Type
		input  values.Object
		want   values.Value
	}{
		{
			name: "floats",
			inType: semantic.NewObjectType(map[string]semantic.Type{
				"a": semantic.Float,
				"b": semantic.Float,
			}),
			input: values.NewObjectWithValues(map[string]values.Value{
				"a": values.NewFloat(5),
				"b": values.NewFloat(4),
			}),
			want: values.NewFloat(9),
		},
		{
			name: "ints",
			inType: semantic.NewObjectType(map[string]semantic.Type{
				"a": semantic.Int,
				"b": semantic.Int,
			}),
			input: values.NewObjectWithValues(map[string]values.Value{
				"a": values.NewInt(5),
				"b": values.NewInt(4),
			}),
			want: values.NewInt(9),
		},
		{
			name: "uints",
			inType: semantic.NewObjectType(map[string]semantic.Type{
				"a": semantic.UInt,
				"b": semantic.UInt,
			}),
			input: values.NewObjectWithValues(map[string]values.Value{
				"a": values.NewUInt(5),
				"b": values.NewUInt(4),
			}),
			want: values.NewUInt(9),
		},
	}

	//Reuse the same cache for all test cases
	cache := compiler.NewCompilationCache(add, nil)
	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			f0, err := cache.Compile(tc.inType)
			if err != nil {
				t.Fatal(err)
			}
			f1, err := cache.Compile(tc.inType)
			if err != nil {
				t.Fatal(err)
			}
			if !reflect.DeepEqual(f0, f1) {
				t.Errorf("unexpected new compilation result")
			}

			got0, err := f0.Eval(tc.input)
			if err != nil {
				t.Fatal(err)
			}
			got1, err := f1.Eval(tc.input)
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

func TestCompileAndEval(t *testing.T) {
	testCases := []struct {
		name    string
		fn      *semantic.FunctionExpression
		inType  semantic.Type
		input   values.Object
		want    values.Value
		wantErr bool
	}{
		{
			name: "simple ident return",
			fn: &semantic.FunctionExpression{
				Block: &semantic.FunctionBlock{
					Parameters: &semantic.FunctionParameters{
						List: []*semantic.FunctionParameter{
							{Key: &semantic.Identifier{Name: "r"}},
						},
					},
					Body: &semantic.IdentifierExpression{Name: "r"},
				},
			},
			inType: semantic.NewObjectType(map[string]semantic.Type{
				"r": semantic.Int,
			}),
			input: values.NewObjectWithValues(map[string]values.Value{
				"r": values.NewInt(4),
			}),
			want:    values.NewInt(4),
			wantErr: false,
		},
		{
			name: "call function",
			// f = (r) => ((a,b) => a + b)(a:1, b:r)
			fn: &semantic.FunctionExpression{
				Block: &semantic.FunctionBlock{
					Parameters: &semantic.FunctionParameters{
						List: []*semantic.FunctionParameter{
							{Key: &semantic.Identifier{Name: "r"}},
						},
					},
					Body: &semantic.CallExpression{
						Callee: &semantic.FunctionExpression{
							Block: &semantic.FunctionBlock{
								Parameters: &semantic.FunctionParameters{
									List: []*semantic.FunctionParameter{
										{Key: &semantic.Identifier{Name: "a"}},
										{Key: &semantic.Identifier{Name: "b"}},
									},
								},
								Body: &semantic.BinaryExpression{
									Operator: ast.AdditionOperator,
									Left:     &semantic.IdentifierExpression{Name: "a"},
									Right:    &semantic.IdentifierExpression{Name: "b"},
								},
							},
						},
						Arguments: &semantic.ObjectExpression{
							Properties: []*semantic.Property{
								{Key: &semantic.Identifier{Name: "a"}, Value: &semantic.IntegerLiteral{Value: 1}},
								{Key: &semantic.Identifier{Name: "b"}, Value: &semantic.IdentifierExpression{Name: "r"}},
							},
						},
					},
				},
			},
			inType: semantic.NewObjectType(map[string]semantic.Type{
				"r": semantic.Int,
			}),
			input: values.NewObjectWithValues(map[string]values.Value{
				"r": values.NewInt(4),
			}),
			want:    values.NewInt(5),
			wantErr: false,
		},
		{
			name: "call function with defaults",
			// f = (r) => ((a=0,b) => a + b)(b:r)
			fn: &semantic.FunctionExpression{
				Block: &semantic.FunctionBlock{
					Parameters: &semantic.FunctionParameters{
						List: []*semantic.FunctionParameter{
							{Key: &semantic.Identifier{Name: "r"}},
						},
					},
					Body: &semantic.CallExpression{
						Callee: &semantic.FunctionExpression{
							Defaults: &semantic.ObjectExpression{
								Properties: []*semantic.Property{{
									Key:   &semantic.Identifier{Name: "a"},
									Value: &semantic.IntegerLiteral{Value: 0},
								}},
							},
							Block: &semantic.FunctionBlock{
								Parameters: &semantic.FunctionParameters{
									List: []*semantic.FunctionParameter{
										{Key: &semantic.Identifier{Name: "a"}},
										{Key: &semantic.Identifier{Name: "b"}},
									},
								},
								Body: &semantic.BinaryExpression{
									Operator: ast.AdditionOperator,
									Left:     &semantic.IdentifierExpression{Name: "a"},
									Right:    &semantic.IdentifierExpression{Name: "b"},
								},
							},
						},
						Arguments: &semantic.ObjectExpression{
							Properties: []*semantic.Property{
								{Key: &semantic.Identifier{Name: "b"}, Value: &semantic.IdentifierExpression{Name: "r"}},
							},
						},
					},
				},
			},
			inType: semantic.NewObjectType(map[string]semantic.Type{
				"r": semantic.Int,
			}),
			input: values.NewObjectWithValues(map[string]values.Value{
				"r": values.NewInt(4),
			}),
			want:    values.NewInt(4),
			wantErr: false,
		},
		{
			name: "call function via identifier",
			// f = (r) => {f = (a,b) => a + b return f(a:1, b:r)}
			fn: &semantic.FunctionExpression{
				Block: &semantic.FunctionBlock{
					Parameters: &semantic.FunctionParameters{
						List: []*semantic.FunctionParameter{
							{Key: &semantic.Identifier{Name: "r"}},
						},
					},
					Body: &semantic.Block{
						Body: []semantic.Statement{
							&semantic.NativeVariableAssignment{
								Identifier: &semantic.Identifier{Name: "f"},
								Init: &semantic.FunctionExpression{
									Block: &semantic.FunctionBlock{
										Parameters: &semantic.FunctionParameters{
											List: []*semantic.FunctionParameter{
												{Key: &semantic.Identifier{Name: "a"}},
												{Key: &semantic.Identifier{Name: "b"}},
											},
										},
										Body: &semantic.BinaryExpression{
											Operator: ast.AdditionOperator,
											Left:     &semantic.IdentifierExpression{Name: "a"},
											Right:    &semantic.IdentifierExpression{Name: "b"},
										},
									},
								},
							},
							&semantic.ReturnStatement{
								Argument: &semantic.CallExpression{
									Callee: &semantic.IdentifierExpression{Name: "f"},
									Arguments: &semantic.ObjectExpression{
										Properties: []*semantic.Property{
											{Key: &semantic.Identifier{Name: "a"}, Value: &semantic.IntegerLiteral{Value: 1}},
											{Key: &semantic.Identifier{Name: "b"}, Value: &semantic.IdentifierExpression{Name: "r"}},
										},
									},
								},
							},
						},
					},
				},
			},
			inType: semantic.NewObjectType(map[string]semantic.Type{
				"r": semantic.Int,
			}),
			input: values.NewObjectWithValues(map[string]values.Value{
				"r": values.NewInt(4),
			}),
			want:    values.NewInt(5),
			wantErr: false,
		},
		{
			name: "call function via identifier with different types",
			// f = (r) => {i = (x) => x return i(x:i)(x:r+1)}
			fn: &semantic.FunctionExpression{
				Block: &semantic.FunctionBlock{
					Parameters: &semantic.FunctionParameters{
						List: []*semantic.FunctionParameter{
							{Key: &semantic.Identifier{Name: "r"}},
						},
					},
					Body: &semantic.Block{
						Body: []semantic.Statement{
							&semantic.NativeVariableAssignment{
								Identifier: &semantic.Identifier{Name: "i"},
								Init: &semantic.FunctionExpression{
									Block: &semantic.FunctionBlock{
										Parameters: &semantic.FunctionParameters{
											List: []*semantic.FunctionParameter{{Key: &semantic.Identifier{Name: "x"}}},
										},
										Body: &semantic.IdentifierExpression{Name: "x"},
									},
								},
							},
							&semantic.ReturnStatement{
								Argument: &semantic.CallExpression{
									Callee: &semantic.CallExpression{
										Callee: &semantic.IdentifierExpression{Name: "i"},
										Arguments: &semantic.ObjectExpression{
											Properties: []*semantic.Property{
												{Key: &semantic.Identifier{Name: "x"}, Value: &semantic.IdentifierExpression{Name: "i"}},
											},
										},
									},
									Arguments: &semantic.ObjectExpression{
										Properties: []*semantic.Property{
											{
												Key: &semantic.Identifier{Name: "x"},
												Value: &semantic.BinaryExpression{
													Operator: ast.AdditionOperator,
													Left:     &semantic.IdentifierExpression{Name: "r"},
													Right:    &semantic.IntegerLiteral{Value: 1},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
			inType: semantic.NewObjectType(map[string]semantic.Type{
				"r": semantic.Int,
			}),
			input: values.NewObjectWithValues(map[string]values.Value{
				"r": values.NewInt(4),
			}),
			want:    values.NewInt(5),
			wantErr: false,
		},
		{
			name: "call filter function with index expression",
			// f = (r) => r[2] == 3
			fn: &semantic.FunctionExpression{
				Block: &semantic.FunctionBlock{
					Parameters: &semantic.FunctionParameters{
						List: []*semantic.FunctionParameter{
							{Key: &semantic.Identifier{Name: "r"}},
						},
					},
					Body: &semantic.BinaryExpression{
						Operator: ast.EqualOperator,
						Left: &semantic.IndexExpression{
							Array: &semantic.IdentifierExpression{Name: "r"},
							Index: &semantic.IntegerLiteral{Value: 2},
						},
						Right: &semantic.IntegerLiteral{Value: 3},
					},
				},
			},
			inType: semantic.NewObjectType(map[string]semantic.Type{
				"r": semantic.NewArrayType(semantic.Int),
			}),
			input: values.NewObjectWithValues(map[string]values.Value{
				"r": values.NewArrayWithBacking(semantic.Int, []values.Value{
					values.NewInt(5),
					values.NewInt(6),
					values.NewInt(3),
				}),
			}),
			want:    values.NewBool(true),
			wantErr: false,
		},
		{
			name: "call filter function with complex index expression",
			// f = (r) => r[((x) => 2)(x: "anything")] == 3
			fn: &semantic.FunctionExpression{
				Block: &semantic.FunctionBlock{
					Parameters: &semantic.FunctionParameters{
						List: []*semantic.FunctionParameter{
							{Key: &semantic.Identifier{Name: "r"}},
						},
					},
					Body: &semantic.BinaryExpression{
						Operator: ast.EqualOperator,
						Left: &semantic.IndexExpression{
							Array: &semantic.IdentifierExpression{Name: "r"},
							Index: &semantic.CallExpression{
								Callee: &semantic.FunctionExpression{
									Block: &semantic.FunctionBlock{
										Parameters: &semantic.FunctionParameters{
											List: []*semantic.FunctionParameter{
												{Key: &semantic.Identifier{Name: "x"}},
											},
										},
										Body: &semantic.IntegerLiteral{Value: 2},
									},
								},
								Arguments: &semantic.ObjectExpression{
									Properties: []*semantic.Property{
										{
											Key:   &semantic.Identifier{Name: "x"},
											Value: &semantic.StringLiteral{Value: "anything"},
										},
									},
								},
							},
						},
						Right: &semantic.IntegerLiteral{Value: 3},
					},
				},
			},
			inType: semantic.NewObjectType(map[string]semantic.Type{
				"r": semantic.NewArrayType(semantic.Int),
			}),
			input: values.NewObjectWithValues(map[string]values.Value{
				"r": values.NewArrayWithBacking(semantic.Int, []values.Value{
					values.NewInt(5),
					values.NewInt(6),
					values.NewInt(3),
				}),
			}),
			want:    values.NewBool(true),
			wantErr: false,
		},
	}

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			f, err := compiler.Compile(tc.fn, tc.inType, nil)
			if tc.wantErr != (err != nil) {
				t.Fatalf("unexpected error %s", err)
			}

			got, err := f.Eval(tc.input)
			if tc.wantErr != (err != nil) {
				t.Errorf("unexpected error %s", err)
			}

			if !cmp.Equal(tc.want, got, CmpOptions...) {
				t.Errorf("unexpected value -want/+got\n%s", cmp.Diff(tc.want, got, CmpOptions...))
			}
		})
	}
}
