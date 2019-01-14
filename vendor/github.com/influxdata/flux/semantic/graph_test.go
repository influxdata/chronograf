package semantic_test

import (
	"testing"
	"time"

	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/flux/ast"
	"github.com/influxdata/flux/semantic"
	"github.com/influxdata/flux/semantic/semantictest"
)

func TestNew(t *testing.T) {
	testCases := []struct {
		name    string
		program *ast.Program
		want    *semantic.Program
		wantErr bool
	}{
		{
			name:    "empty",
			program: &ast.Program{},
			want: &semantic.Program{
				Body: []semantic.Statement{},
			},
		},
		{
			name: "package",
			program: &ast.Program{
				Package: &ast.PackageClause{
					Name: &ast.Identifier{Name: "foo"},
				},
			},
			want: &semantic.Program{
				Package: &semantic.PackageClause{
					Name: &semantic.Identifier{Name: "foo"},
				},
				Body: []semantic.Statement{},
			},
		},
		{
			name: "imports",
			program: &ast.Program{
				Imports: []*ast.ImportDeclaration{
					{
						Path: &ast.StringLiteral{Value: "path/foo"},
					},
					{
						Path: &ast.StringLiteral{Value: "path/bar"},
						As:   &ast.Identifier{Name: "b"},
					},
				},
			},
			want: &semantic.Program{
				Imports: []*semantic.ImportDeclaration{
					{
						Path: &semantic.StringLiteral{Value: "path/foo"},
					},
					{
						Path: &semantic.StringLiteral{Value: "path/bar"},
						As:   &semantic.Identifier{Name: "b"},
					},
				},
				Body: []semantic.Statement{},
			},
		},
		{
			name: "var assignment",
			program: &ast.Program{
				Body: []ast.Statement{
					&ast.VariableAssignment{
						ID:   &ast.Identifier{Name: "a"},
						Init: &ast.BooleanLiteral{Value: true},
					},
					&ast.ExpressionStatement{
						Expression: &ast.Identifier{Name: "a"},
					},
				},
			},
			want: &semantic.Program{
				Body: []semantic.Statement{
					&semantic.NativeVariableAssignment{
						Identifier: &semantic.Identifier{Name: "a"},
						Init:       &semantic.BooleanLiteral{Value: true},
					},
					&semantic.ExpressionStatement{
						Expression: &semantic.IdentifierExpression{Name: "a"},
					},
				},
			},
		},
		{
			name: "object",
			program: &ast.Program{
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						Expression: &ast.ObjectExpression{
							Properties: []*ast.Property{
								&ast.Property{
									Key: &ast.Identifier{
										Name: "a",
									},
									Value: &ast.IntegerLiteral{
										Value: 10,
									},
								},
							},
						},
					},
				},
			},
			want: &semantic.Program{
				Body: []semantic.Statement{
					&semantic.ExpressionStatement{
						Expression: &semantic.ObjectExpression{
							Properties: []*semantic.Property{
								&semantic.Property{
									Key: &semantic.Identifier{
										Name: "a",
									},
									Value: &semantic.IntegerLiteral{
										Value: 10,
									},
								},
							},
						},
					},
				},
			},
		},
		{
			name: "object with string key",
			program: &ast.Program{
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						Expression: &ast.ObjectExpression{
							Properties: []*ast.Property{
								&ast.Property{
									Key: &ast.StringLiteral{
										Value: "a",
									},
									Value: &ast.IntegerLiteral{
										Value: 10,
									},
								},
							},
						},
					},
				},
			},
			want: &semantic.Program{
				Body: []semantic.Statement{
					&semantic.ExpressionStatement{
						Expression: &semantic.ObjectExpression{
							Properties: []*semantic.Property{
								&semantic.Property{
									Key: &semantic.StringLiteral{
										Value: "a",
									},
									Value: &semantic.IntegerLiteral{
										Value: 10,
									},
								},
							},
						},
					},
				},
			},
		},
		{
			name: "object with mixed keys",
			program: &ast.Program{
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						Expression: &ast.ObjectExpression{
							Properties: []*ast.Property{
								&ast.Property{
									Key: &ast.StringLiteral{
										Value: "a",
									},
									Value: &ast.IntegerLiteral{
										Value: 10,
									},
								},
								&ast.Property{
									Key: &ast.Identifier{
										Name: "b",
									},
									Value: &ast.IntegerLiteral{
										Value: 11,
									},
								},
							},
						},
					},
				},
			},
			want: &semantic.Program{
				Body: []semantic.Statement{
					&semantic.ExpressionStatement{
						Expression: &semantic.ObjectExpression{
							Properties: []*semantic.Property{
								&semantic.Property{
									Key: &semantic.StringLiteral{
										Value: "a",
									},
									Value: &semantic.IntegerLiteral{
										Value: 10,
									},
								},
								&semantic.Property{
									Key: &semantic.Identifier{
										Name: "b",
									},
									Value: &semantic.IntegerLiteral{
										Value: 11,
									},
								},
							},
						},
					},
				},
			},
		},
		{
			name: "object with implicit keys",
			program: &ast.Program{
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						Expression: &ast.ObjectExpression{
							Properties: []*ast.Property{
								&ast.Property{
									Key: &ast.Identifier{
										Name: "a",
									},
								},
								&ast.Property{
									Key: &ast.Identifier{
										Name: "b",
									},
								},
							},
						},
					},
				},
			},
			want: &semantic.Program{
				Body: []semantic.Statement{
					&semantic.ExpressionStatement{
						Expression: &semantic.ObjectExpression{
							Properties: []*semantic.Property{
								&semantic.Property{
									Key: &semantic.Identifier{
										Name: "a",
									},
									Value: &semantic.IdentifierExpression{
										Name: "a",
									},
								},
								&semantic.Property{
									Key: &semantic.Identifier{
										Name: "b",
									},
									Value: &semantic.IdentifierExpression{
										Name: "b",
									},
								},
							},
						},
					},
				},
			},
		},
		{
			name: "options declaration",
			program: &ast.Program{
				Body: []ast.Statement{
					&ast.OptionStatement{
						Assignment: &ast.VariableAssignment{
							ID: &ast.Identifier{Name: "task"},
							Init: &ast.ObjectExpression{
								Properties: []*ast.Property{
									{
										Key:   &ast.Identifier{Name: "name"},
										Value: &ast.StringLiteral{Value: "foo"},
									},
									{
										Key: &ast.Identifier{Name: "every"},
										Value: &ast.DurationLiteral{
											Values: []ast.Duration{
												{
													Magnitude: 1,
													Unit:      "h",
												},
											},
										},
									},
									{
										Key: &ast.Identifier{Name: "delay"},
										Value: &ast.DurationLiteral{
											Values: []ast.Duration{
												{
													Magnitude: 10,
													Unit:      "m",
												},
											},
										},
									},
									{
										Key:   &ast.Identifier{Name: "cron"},
										Value: &ast.StringLiteral{Value: "0 2 * * *"},
									},
									{
										Key:   &ast.Identifier{Name: "retry"},
										Value: &ast.IntegerLiteral{Value: 5},
									},
								},
							},
						},
					},
				},
			},
			want: &semantic.Program{
				Body: []semantic.Statement{
					&semantic.OptionStatement{
						Assignment: &semantic.NativeVariableAssignment{
							Identifier: &semantic.Identifier{Name: "task"},
							Init: &semantic.ObjectExpression{
								Properties: []*semantic.Property{
									{
										Key:   &semantic.Identifier{Name: "name"},
										Value: &semantic.StringLiteral{Value: "foo"},
									},
									{
										Key:   &semantic.Identifier{Name: "every"},
										Value: &semantic.DurationLiteral{Value: 1 * time.Hour},
									},
									{
										Key:   &semantic.Identifier{Name: "delay"},
										Value: &semantic.DurationLiteral{Value: 10 * time.Minute},
									},
									{
										Key:   &semantic.Identifier{Name: "cron"},
										Value: &semantic.StringLiteral{Value: "0 2 * * *"},
									},
									{
										Key:   &semantic.Identifier{Name: "retry"},
										Value: &semantic.IntegerLiteral{Value: 5},
									},
								},
							},
						},
					},
				},
			},
		},
		{
			name: "function",
			program: &ast.Program{
				Body: []ast.Statement{
					&ast.VariableAssignment{
						ID: &ast.Identifier{Name: "f"},
						Init: &ast.FunctionExpression{
							Params: []*ast.Property{
								{Key: &ast.Identifier{Name: "a"}},
								{Key: &ast.Identifier{Name: "b"}},
							},
							Body: &ast.BinaryExpression{
								Operator: ast.AdditionOperator,
								Left:     &ast.Identifier{Name: "a"},
								Right:    &ast.Identifier{Name: "b"},
							},
						},
					},
					&ast.ExpressionStatement{
						Expression: &ast.CallExpression{
							Callee: &ast.Identifier{Name: "f"},
							Arguments: []ast.Expression{&ast.ObjectExpression{
								Properties: []*ast.Property{
									{Key: &ast.Identifier{Name: "a"}, Value: &ast.IntegerLiteral{Value: 2}},
									{Key: &ast.Identifier{Name: "b"}, Value: &ast.IntegerLiteral{Value: 3}},
								},
							}},
						},
					},
				},
			},
			want: &semantic.Program{
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
									Left: &semantic.IdentifierExpression{
										Name: "a",
									},
									Right: &semantic.IdentifierExpression{
										Name: "b",
									},
								},
							},
						},
					},
					&semantic.ExpressionStatement{
						Expression: &semantic.CallExpression{
							Callee: &semantic.IdentifierExpression{
								Name: "f",
							},
							Arguments: &semantic.ObjectExpression{
								Properties: []*semantic.Property{
									{Key: &semantic.Identifier{Name: "a"}, Value: &semantic.IntegerLiteral{Value: 2}},
									{Key: &semantic.Identifier{Name: "b"}, Value: &semantic.IntegerLiteral{Value: 3}},
								},
							},
						},
					},
				},
			},
		},
		{
			name: "index expression",
			program: &ast.Program{
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						Expression: &ast.IndexExpression{
							Array: &ast.Identifier{Name: "a"},
							Index: &ast.IntegerLiteral{Value: 3},
						},
					},
				},
			},
			want: &semantic.Program{
				Body: []semantic.Statement{
					&semantic.ExpressionStatement{
						Expression: &semantic.IndexExpression{
							Array: &semantic.IdentifierExpression{Name: "a"},
							Index: &semantic.IntegerLiteral{Value: 3},
						},
					},
				},
			},
		},
		{
			name: "nested index expression",
			program: &ast.Program{
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						Expression: &ast.IndexExpression{
							Array: &ast.IndexExpression{
								Array: &ast.Identifier{Name: "a"},
								Index: &ast.IntegerLiteral{Value: 3},
							},
							Index: &ast.IntegerLiteral{Value: 5},
						},
					},
				},
			},
			want: &semantic.Program{
				Body: []semantic.Statement{
					&semantic.ExpressionStatement{
						Expression: &semantic.IndexExpression{
							Array: &semantic.IndexExpression{
								Array: &semantic.IdentifierExpression{Name: "a"},
								Index: &semantic.IntegerLiteral{Value: 3},
							},
							Index: &semantic.IntegerLiteral{Value: 5},
						},
					},
				},
			},
		},
		{
			name: "access indexed object returned from function call",
			program: &ast.Program{
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						Expression: &ast.IndexExpression{
							Array: &ast.CallExpression{
								Callee: &ast.Identifier{Name: "f"},
							},
							Index: &ast.IntegerLiteral{Value: 3},
						},
					},
				},
			},
			want: &semantic.Program{
				Body: []semantic.Statement{
					&semantic.ExpressionStatement{
						Expression: &semantic.IndexExpression{
							Array: &semantic.CallExpression{
								Callee:    &semantic.IdentifierExpression{Name: "f"},
								Arguments: &semantic.ObjectExpression{},
							},
							Index: &semantic.IntegerLiteral{Value: 3},
						},
					},
				},
			},
		},
		{
			name: "nested member expressions",
			program: &ast.Program{
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						Expression: &ast.MemberExpression{
							Object: &ast.MemberExpression{
								Object:   &ast.Identifier{Name: "a"},
								Property: &ast.Identifier{Name: "b"},
							},
							Property: &ast.Identifier{Name: "c"},
						},
					},
				},
			},
			want: &semantic.Program{
				Body: []semantic.Statement{
					&semantic.ExpressionStatement{
						Expression: &semantic.MemberExpression{
							Object: &semantic.MemberExpression{
								Object:   &semantic.IdentifierExpression{Name: "a"},
								Property: "b",
							},
							Property: "c",
						},
					},
				},
			},
		},
		{
			name: "member with call expression",
			program: &ast.Program{
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						Expression: &ast.MemberExpression{
							Object: &ast.CallExpression{
								Callee: &ast.MemberExpression{
									Object:   &ast.Identifier{Name: "a"},
									Property: &ast.Identifier{Name: "b"},
								},
							},
							Property: &ast.Identifier{Name: "c"},
						},
					},
				},
			},
			want: &semantic.Program{
				Body: []semantic.Statement{
					&semantic.ExpressionStatement{
						Expression: &semantic.MemberExpression{
							Object: &semantic.CallExpression{
								Callee: &semantic.MemberExpression{
									Object:   &semantic.IdentifierExpression{Name: "a"},
									Property: "b",
								},
								Arguments: &semantic.ObjectExpression{},
							},
							Property: "c",
						},
					},
				},
			},
		},
	}
	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			got, err := semantic.New(tc.program)
			if !tc.wantErr && err != nil {
				t.Fatal(err)
			} else if tc.wantErr && err == nil {
				t.Fatal("expected error")
			}

			if !cmp.Equal(tc.want, got, semantictest.CmpOptions...) {
				t.Errorf("unexpected semantic program: -want/+got:\n%s", cmp.Diff(tc.want, got, semantictest.CmpOptions...))
			}
		})
	}
}

//func TestExpression_Kind(t *testing.T) {
//	testCases := []struct {
//		name string
//		expr semantic.Expression
//		want semantic.Kind
//	}{
//		{
//			name: "string",
//			expr: &semantic.StringLiteral{},
//			want: semantic.String,
//		},
//		{
//			name: "int",
//			expr: &semantic.IntegerLiteral{},
//			want: semantic.Int,
//		},
//		{
//			name: "uint",
//			expr: &semantic.UnsignedIntegerLiteral{},
//			want: semantic.UInt,
//		},
//		{
//			name: "float",
//			expr: &semantic.FloatLiteral{},
//			want: semantic.Float,
//		},
//		{
//			name: "bool",
//			expr: &semantic.BooleanLiteral{},
//			want: semantic.Bool,
//		},
//		{
//			name: "time",
//			expr: &semantic.DateTimeLiteral{},
//			want: semantic.Time,
//		},
//		{
//			name: "duration",
//			expr: &semantic.DurationLiteral{},
//			want: semantic.Duration,
//		},
//	}
//	for _, tc := range testCases {
//		tc := tc
//		t.Run(tc.name, func(t *testing.T) {
//			typ, mono := tc.expr.TypeScheme().MonoType()
//			if !mono {
//				t.Fatal("unexpected polymorphic expression type")
//			}
//			got := typ.Kind()
//
//			if !cmp.Equal(tc.want, got) {
//				t.Errorf("unexpected expression type: -want/+got:\n%s", cmp.Diff(tc.want, got))
//			}
//		})
//	}
//}
