package parser_test

import (
	"reflect"
	"regexp"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/flux/ast"
	"github.com/influxdata/flux/internal/parser"
)

var CompareOptions = []cmp.Option{
	cmp.Transformer("", func(re *regexp.Regexp) string {
		return re.String()
	}),
	cmp.Transformer("", func(pos ast.Position) string {
		return pos.String()
	}),
}

func TestParser(t *testing.T) {
	testParser(func(name string, fn func(t testing.TB)) {
		t.Run(name, func(t *testing.T) {
			fn(t)
		})
	})
}

func BenchmarkParser(b *testing.B) {
	testParser(func(name string, fn func(t testing.TB)) {
		b.Run(name, func(b *testing.B) {
			b.ReportAllocs()
			for i := 0; i < b.N; i++ {
				fn(b)
			}
		})
	})
}

func testParser(runFn func(name string, fn func(t testing.TB))) {
	for _, tt := range []struct {
		name string
		raw  string
		want *ast.Program
		// If parseOnly is set to true, then the test will verify
		// that parsing works and will not verify the contents of
		// the AST.
		parseOnly bool
	}{
		{
			name: "package clause",
			raw:  `package foo`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:12"),
				Package: &ast.PackageClause{
					BaseNode: base("1:1", "1:12"),
					Name: &ast.Identifier{
						BaseNode: base("1:9", "1:12"),
						Name:     "foo",
					},
				},
			},
		},
		{
			name: "import",
			raw:  `import "path/foo"`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:18"),
				Imports: []*ast.ImportDeclaration{{
					BaseNode: base("1:1", "1:18"),
					Path: &ast.StringLiteral{
						BaseNode: base("1:8", "1:18"),
						Value:    "path/foo",
					},
				}},
			},
		},
		{
			name: "import as",
			raw:  `import bar "path/foo"`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:22"),
				Imports: []*ast.ImportDeclaration{{
					BaseNode: base("1:1", "1:22"),
					As: &ast.Identifier{
						BaseNode: base("1:8", "1:11"),
						Name:     "bar",
					},
					Path: &ast.StringLiteral{
						BaseNode: base("1:12", "1:22"),
						Value:    "path/foo",
					},
				}},
			},
		},
		{
			name: "imports",
			raw: `import "path/foo"
import "path/bar"`,
			want: &ast.Program{
				BaseNode: base("1:1", "2:18"),
				Imports: []*ast.ImportDeclaration{
					{
						BaseNode: base("1:1", "1:18"),
						Path: &ast.StringLiteral{
							BaseNode: base("1:8", "1:18"),
							Value:    "path/foo",
						},
					},
					{
						BaseNode: base("2:1", "2:18"),
						Path: &ast.StringLiteral{
							BaseNode: base("2:8", "2:18"),
							Value:    "path/bar",
						},
					},
				},
			},
		},
		{
			name: "package and imports",
			raw: `
package baz

import "path/foo"
import "path/bar"`,
			want: &ast.Program{
				BaseNode: base("2:1", "5:18"),
				Package: &ast.PackageClause{
					BaseNode: base("2:1", "2:12"),
					Name: &ast.Identifier{
						BaseNode: base("2:9", "2:12"),
						Name:     "baz",
					},
				},
				Imports: []*ast.ImportDeclaration{
					{
						BaseNode: base("4:1", "4:18"),
						Path: &ast.StringLiteral{
							BaseNode: base("4:8", "4:18"),
							Value:    "path/foo",
						},
					},
					{
						BaseNode: base("5:1", "5:18"),
						Path: &ast.StringLiteral{
							BaseNode: base("5:8", "5:18"),
							Value:    "path/bar",
						},
					},
				},
			},
		},
		{
			name: "package and imports and body",
			raw: `
package baz

import "path/foo"
import "path/bar"

1 + 1`,
			want: &ast.Program{
				BaseNode: base("2:1", "7:6"),
				Package: &ast.PackageClause{
					BaseNode: base("2:1", "2:12"),
					Name: &ast.Identifier{
						BaseNode: base("2:9", "2:12"),
						Name:     "baz",
					},
				},
				Imports: []*ast.ImportDeclaration{
					{
						BaseNode: base("4:1", "4:18"),
						Path: &ast.StringLiteral{
							BaseNode: base("4:8", "4:18"),
							Value:    "path/foo",
						},
					},
					{
						BaseNode: base("5:1", "5:18"),
						Path: &ast.StringLiteral{
							BaseNode: base("5:8", "5:18"),
							Value:    "path/bar",
						},
					},
				},
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("7:1", "7:6"),
						Expression: &ast.BinaryExpression{
							BaseNode: base("7:1", "7:6"),
							Operator: ast.AdditionOperator,
							Left: &ast.IntegerLiteral{
								BaseNode: base("7:1", "7:2"),
								Value:    1,
							},
							Right: &ast.IntegerLiteral{
								BaseNode: base("7:5", "7:6"),
								Value:    1,
							},
						},
					},
				},
			},
		},
		{
			name: "optional query metadata",
			raw: `option task = {
				name: "foo",
				every: 1h,
				delay: 10m,
				cron: "0 2 * * *",
				retry: 5,
			  }`,
			want: &ast.Program{
				BaseNode: base("1:1", "7:7"),
				Body: []ast.Statement{
					&ast.OptionStatement{
						BaseNode: base("1:1", "7:7"),
						Assignment: &ast.VariableAssignment{
							BaseNode: base("1:8", "7:7"),
							ID: &ast.Identifier{
								BaseNode: base("1:8", "1:12"),
								Name:     "task",
							},
							Init: &ast.ObjectExpression{
								BaseNode: base("1:15", "7:7"),
								Properties: []*ast.Property{
									{
										BaseNode: base("2:5", "2:16"),
										Key: &ast.Identifier{
											BaseNode: base("2:5", "2:9"),
											Name:     "name",
										},
										Value: &ast.StringLiteral{
											BaseNode: base("2:11", "2:16"),
											Value:    "foo",
										},
									},
									{
										BaseNode: base("3:5", "3:14"),
										Key: &ast.Identifier{
											BaseNode: base("3:5", "3:10"),
											Name:     "every",
										},
										Value: &ast.DurationLiteral{
											BaseNode: base("3:12", "3:14"),
											Values: []ast.Duration{
												{
													Magnitude: 1,
													Unit:      "h",
												},
											},
										},
									},
									{
										BaseNode: base("4:5", "4:15"),
										Key: &ast.Identifier{
											BaseNode: base("4:5", "4:10"),
											Name:     "delay",
										},
										Value: &ast.DurationLiteral{
											BaseNode: base("4:12", "4:15"),
											Values: []ast.Duration{
												{
													Magnitude: 10,
													Unit:      "m",
												},
											},
										},
									},
									{
										BaseNode: base("5:5", "5:22"),
										Key: &ast.Identifier{
											BaseNode: base("5:5", "5:9"),
											Name:     "cron",
										},
										Value: &ast.StringLiteral{
											BaseNode: base("5:11", "5:22"),
											Value:    "0 2 * * *",
										},
									},
									{
										BaseNode: base("6:5", "6:13"),
										Key: &ast.Identifier{
											BaseNode: base("6:5", "6:10"),
											Name:     "retry",
										},
										Value: &ast.IntegerLiteral{
											BaseNode: base("6:12", "6:13"),
											Value:    5,
										},
									},
								},
							},
						},
					},
				},
			},
		},
		{
			name: "optional query metadata preceding query text",
			raw: `option task = {
					name: "foo",  // Name of task
					every: 1h,    // Execution frequency of task
				}

				// Task will execute the following query
				from() |> count()`,
			want: &ast.Program{
				BaseNode: base("1:1", "7:22"),
				Body: []ast.Statement{
					&ast.OptionStatement{
						BaseNode: base("1:1", "4:6"),
						Assignment: &ast.VariableAssignment{
							BaseNode: base("1:8", "4:6"),
							ID: &ast.Identifier{
								BaseNode: base("1:8", "1:12"),
								Name:     "task",
							},
							Init: &ast.ObjectExpression{
								BaseNode: base("1:15", "4:6"),
								Properties: []*ast.Property{
									{
										BaseNode: base("2:6", "2:17"),
										Key: &ast.Identifier{
											BaseNode: base("2:6", "2:10"),
											Name:     "name",
										},
										Value: &ast.StringLiteral{
											BaseNode: base("2:12", "2:17"),
											Value:    "foo",
										},
									},
									{
										BaseNode: base("3:6", "3:15"),
										Key: &ast.Identifier{
											BaseNode: base("3:6", "3:11"),
											Name:     "every",
										},
										Value: &ast.DurationLiteral{
											BaseNode: base("3:13", "3:15"),
											Values: []ast.Duration{
												{
													Magnitude: 1,
													Unit:      "h",
												},
											},
										},
									},
								},
							},
						},
					},
					&ast.ExpressionStatement{
						BaseNode: base("7:5", "7:22"),
						Expression: &ast.PipeExpression{
							BaseNode: base("7:5", "7:22"),
							Argument: &ast.CallExpression{
								BaseNode: base("7:5", "7:11"),
								Callee: &ast.Identifier{
									Name:     "from",
									BaseNode: base("7:5", "7:9"),
								},
								Arguments: nil,
							},
							Call: &ast.CallExpression{
								BaseNode: base("7:15", "7:22"),
								Callee: &ast.Identifier{
									Name:     "count",
									BaseNode: base("7:15", "7:20"),
								},
								Arguments: nil,
							},
						},
					},
				},
			},
		},
		{
			name: "from",
			raw:  `from()`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:7"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("1:1", "1:7"),
						Expression: &ast.CallExpression{
							BaseNode: base("1:1", "1:7"),
							Callee: &ast.Identifier{
								Name:     "from",
								BaseNode: base("1:1", "1:5"),
							},
						},
					},
				},
			},
		},
		{
			name: "comment",
			raw: `// Comment
			from()`,
			want: &ast.Program{
				BaseNode: base("2:4", "2:10"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("2:4", "2:10"),
						Expression: &ast.CallExpression{
							BaseNode: base("2:4", "2:10"),
							Callee: &ast.Identifier{
								Name:     "from",
								BaseNode: base("2:4", "2:8"),
							},
						},
					},
				},
			},
		},
		{
			name: "identifier with number",
			raw:  `tan2()`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:7"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("1:1", "1:7"),
						Expression: &ast.CallExpression{
							BaseNode: base("1:1", "1:7"),
							Callee: &ast.Identifier{
								Name:     "tan2",
								BaseNode: base("1:1", "1:5"),
							},
						},
					},
				},
			},
		},
		{
			name: "regex literal",
			raw:  `/.*/`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:5"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("1:1", "1:5"),
						Expression: &ast.RegexpLiteral{
							BaseNode: base("1:1", "1:5"),
							Value:    regexp.MustCompile(".*"),
						},
					},
				},
			},
		},
		{
			name: "regex literal with escape sequence",
			raw:  `/a\/b\\c\d/`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:12"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("1:1", "1:12"),
						Expression: &ast.RegexpLiteral{
							BaseNode: base("1:1", "1:12"),
							Value:    regexp.MustCompile(`a/b\\c\d`),
						},
					},
				},
			},
		},
		{
			name: "regex match operators",
			raw:  `"a" =~ /.*/ and "b" !~ /c$/`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:28"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("1:1", "1:28"),
						Expression: &ast.LogicalExpression{
							BaseNode: base("1:1", "1:28"),
							Operator: ast.AndOperator,
							Left: &ast.BinaryExpression{
								BaseNode: base("1:1", "1:12"),
								Operator: ast.RegexpMatchOperator,
								Left: &ast.StringLiteral{
									BaseNode: base("1:1", "1:4"),
									Value:    "a",
								},
								Right: &ast.RegexpLiteral{
									BaseNode: base("1:8", "1:12"),
									Value:    regexp.MustCompile(".*"),
								},
							},
							Right: &ast.BinaryExpression{
								BaseNode: base("1:17", "1:28"),
								Operator: ast.NotRegexpMatchOperator,
								Left: &ast.StringLiteral{
									BaseNode: base("1:17", "1:20"),
									Value:    "b",
								},
								Right: &ast.RegexpLiteral{
									BaseNode: base("1:24", "1:28"),
									Value:    regexp.MustCompile("c$"),
								},
							},
						},
					},
				},
			},
		},
		{
			name: "declare variable as an int",
			raw:  `howdy = 1`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:10"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "1:10"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:6"),
							Name:     "howdy",
						},
						Init: &ast.IntegerLiteral{
							BaseNode: base("1:9", "1:10"),
							Value:    1,
						},
					},
				},
			},
		},
		{
			name: "declare variable as a float",
			raw:  `howdy = 1.1`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:12"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "1:12"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:6"),
							Name:     "howdy",
						},
						Init: &ast.FloatLiteral{
							BaseNode: base("1:9", "1:12"),
							Value:    1.1,
						},
					},
				},
			},
		},
		{
			name: "declare variable as an array",
			raw:  `howdy = [1, 2, 3, 4]`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:21"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "1:21"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:6"),
							Name:     "howdy",
						},
						Init: &ast.ArrayExpression{
							BaseNode: base("1:9", "1:21"),
							Elements: []ast.Expression{
								&ast.IntegerLiteral{
									BaseNode: base("1:10", "1:11"),
									Value:    1,
								},
								&ast.IntegerLiteral{
									BaseNode: base("1:13", "1:14"),
									Value:    2,
								},
								&ast.IntegerLiteral{
									BaseNode: base("1:16", "1:17"),
									Value:    3,
								},
								&ast.IntegerLiteral{
									BaseNode: base("1:19", "1:20"),
									Value:    4,
								},
							},
						},
					},
				},
			},
		},
		{
			name: "declare variable as an empty array",
			raw:  `howdy = []`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:11"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "1:11"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:6"),
							Name:     "howdy",
						},
						Init: &ast.ArrayExpression{
							BaseNode: base("1:9", "1:11"),
						},
					},
				},
			},
		},
		{
			name: "use variable to declare something",
			raw: `howdy = 1
			from()`,
			want: &ast.Program{
				BaseNode: base("1:1", "2:10"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "1:10"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:6"),
							Name:     "howdy",
						},
						Init: &ast.IntegerLiteral{
							BaseNode: base("1:9", "1:10"),
							Value:    1,
						},
					},
					&ast.ExpressionStatement{
						BaseNode: base("2:4", "2:10"),
						Expression: &ast.CallExpression{
							BaseNode: base("2:4", "2:10"),
							Callee: &ast.Identifier{
								BaseNode: base("2:4", "2:8"),
								Name:     "from",
							},
						},
					},
				},
			},
		},
		{
			name: "variable is from statement",
			raw: `howdy = from()
			howdy.count()`,
			want: &ast.Program{
				BaseNode: base("1:1", "2:17"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "1:15"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:6"),
							Name:     "howdy",
						},
						Init: &ast.CallExpression{
							BaseNode: base("1:9", "1:15"),
							Callee: &ast.Identifier{
								BaseNode: base("1:9", "1:13"),
								Name:     "from",
							},
						},
					},
					&ast.ExpressionStatement{
						BaseNode: base("2:4", "2:17"),
						Expression: &ast.CallExpression{
							BaseNode: base("2:4", "2:17"),
							Callee: &ast.MemberExpression{
								BaseNode: base("2:4", "2:15"),
								Object: &ast.Identifier{
									BaseNode: base("2:4", "2:9"),
									Name:     "howdy",
								},
								Property: &ast.Identifier{
									BaseNode: base("2:10", "2:15"),
									Name:     "count",
								},
							},
						},
					},
				},
			},
		},
		{
			name: "pipe expression",
			raw:  `from() |> count()`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:18"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("1:1", "1:18"),
						Expression: &ast.PipeExpression{
							BaseNode: base("1:1", "1:18"),
							Argument: &ast.CallExpression{
								BaseNode: base("1:1", "1:7"),
								Callee: &ast.Identifier{
									BaseNode: base("1:1", "1:5"),
									Name:     "from",
								},
								Arguments: nil,
							},
							Call: &ast.CallExpression{
								BaseNode: base("1:11", "1:18"),
								Callee: &ast.Identifier{
									BaseNode: base("1:11", "1:16"),
									Name:     "count",
								},
								Arguments: nil,
							},
						},
					},
				},
			},
		},
		{
			name: "literal pipe expression",
			raw:  `5 |> pow2()`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:12"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("1:1", "1:12"),
						Expression: &ast.PipeExpression{
							BaseNode: base("1:1", "1:12"),
							Argument: &ast.IntegerLiteral{
								BaseNode: base("1:1", "1:2"),
								Value:    5,
							},
							Call: &ast.CallExpression{
								BaseNode: base("1:6", "1:12"),
								Callee: &ast.Identifier{
									BaseNode: base("1:6", "1:10"),
									Name:     "pow2",
								},
								Arguments: nil,
							},
						},
					},
				},
			},
		},
		{
			name: "member expression pipe expression",
			raw:  `foo.bar |> baz()`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:17"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("1:1", "1:17"),
						Expression: &ast.PipeExpression{
							BaseNode: base("1:1", "1:17"),
							Argument: &ast.MemberExpression{
								BaseNode: base("1:1", "1:8"),
								Object: &ast.Identifier{
									BaseNode: base("1:1", "1:4"),
									Name:     "foo",
								},
								Property: &ast.Identifier{
									BaseNode: base("1:5", "1:8"),
									Name:     "bar",
								},
							},
							Call: &ast.CallExpression{
								BaseNode: base("1:12", "1:17"),
								Callee: &ast.Identifier{
									BaseNode: base("1:12", "1:15"),
									Name:     "baz",
								},
								Arguments: nil,
							},
						},
					},
				},
			},
		},
		{
			name: "multiple pipe expressions",
			raw:  `from() |> range() |> filter() |> count()`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:41"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("1:1", "1:41"),
						Expression: &ast.PipeExpression{
							BaseNode: base("1:1", "1:41"),
							Argument: &ast.PipeExpression{
								BaseNode: base("1:1", "1:30"),
								Argument: &ast.PipeExpression{
									BaseNode: base("1:1", "1:18"),
									Argument: &ast.CallExpression{
										BaseNode: base("1:1", "1:7"),
										Callee: &ast.Identifier{
											BaseNode: base("1:1", "1:5"),
											Name:     "from",
										},
									},
									Call: &ast.CallExpression{
										BaseNode: base("1:11", "1:18"),
										Callee: &ast.Identifier{
											BaseNode: base("1:11", "1:16"),
											Name:     "range",
										},
									},
								},
								Call: &ast.CallExpression{
									BaseNode: base("1:22", "1:30"),
									Callee: &ast.Identifier{
										BaseNode: base("1:22", "1:28"),
										Name:     "filter",
									},
								},
							},
							Call: &ast.CallExpression{
								BaseNode: base("1:34", "1:41"),
								Callee: &ast.Identifier{
									BaseNode: base("1:34", "1:39"),
									Name:     "count",
								},
							},
						},
					},
				},
			},
		},
		{
			name: "two variables for two froms",
			raw: `howdy = from()
			doody = from()
			howdy|>count()
			doody|>sum()`,
			want: &ast.Program{
				BaseNode: base("1:1", "4:16"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "1:15"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:6"),
							Name:     "howdy",
						},
						Init: &ast.CallExpression{
							BaseNode: base("1:9", "1:15"),
							Callee: &ast.Identifier{
								BaseNode: base("1:9", "1:13"),
								Name:     "from",
							},
						},
					},
					&ast.VariableAssignment{
						BaseNode: base("2:4", "2:18"),
						ID: &ast.Identifier{
							BaseNode: base("2:4", "2:9"),
							Name:     "doody",
						},
						Init: &ast.CallExpression{
							BaseNode: base("2:12", "2:18"),
							Callee: &ast.Identifier{
								BaseNode: base("2:12", "2:16"),
								Name:     "from",
							},
						},
					},
					&ast.ExpressionStatement{
						BaseNode: base("3:4", "3:18"),
						Expression: &ast.PipeExpression{
							BaseNode: base("3:4", "3:18"),
							Argument: &ast.Identifier{
								BaseNode: base("3:4", "3:9"),
								Name:     "howdy",
							},
							Call: &ast.CallExpression{
								BaseNode: base("3:11", "3:18"),
								Callee: &ast.Identifier{
									BaseNode: base("3:11", "3:16"),
									Name:     "count",
								},
							},
						},
					},
					&ast.ExpressionStatement{
						BaseNode: base("4:4", "4:16"),
						Expression: &ast.PipeExpression{
							BaseNode: base("4:4", "4:16"),
							Argument: &ast.Identifier{
								BaseNode: base("4:4", "4:9"),
								Name:     "doody",
							},
							Call: &ast.CallExpression{
								BaseNode: base("4:11", "4:16"),
								Callee: &ast.Identifier{
									BaseNode: base("4:11", "4:14"),
									Name:     "sum",
								},
							},
						},
					},
				},
			},
		},
		{
			name: "from with database",
			raw:  `from(bucket:"telegraf/autogen")`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:32"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("1:1", "1:32"),
						Expression: &ast.CallExpression{
							BaseNode: base("1:1", "1:32"),
							Callee: &ast.Identifier{
								BaseNode: base("1:1", "1:5"),
								Name:     "from",
							},
							Arguments: []ast.Expression{
								&ast.ObjectExpression{
									BaseNode: base("1:6", "1:31"),
									Properties: []*ast.Property{
										{
											BaseNode: base("1:6", "1:31"),
											Key: &ast.Identifier{
												BaseNode: base("1:6", "1:12"),
												Name:     "bucket",
											},
											Value: &ast.StringLiteral{
												BaseNode: base("1:13", "1:31"),
												Value:    "telegraf/autogen",
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
		{
			name: "map member expressions",
			raw: `m = {key1: 1, key2:"value2"}
			m.key1
			m["key2"]
			`,
			want: &ast.Program{
				BaseNode: base("1:1", "3:13"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "1:29"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:2"),
							Name:     "m",
						},
						Init: &ast.ObjectExpression{
							BaseNode: base("1:5", "1:29"),
							Properties: []*ast.Property{
								{
									BaseNode: base("1:6", "1:13"),
									Key: &ast.Identifier{
										BaseNode: base("1:6", "1:10"),
										Name:     "key1",
									},
									Value: &ast.IntegerLiteral{
										BaseNode: base("1:12", "1:13"),
										Value:    1,
									},
								},
								{
									BaseNode: base("1:15", "1:28"),
									Key: &ast.Identifier{
										BaseNode: base("1:15", "1:19"),
										Name:     "key2",
									},
									Value: &ast.StringLiteral{
										BaseNode: base("1:20", "1:28"),
										Value:    "value2",
									},
								},
							},
						},
					},
					&ast.ExpressionStatement{
						BaseNode: base("2:4", "2:10"),
						Expression: &ast.MemberExpression{
							BaseNode: base("2:4", "2:10"),
							Object: &ast.Identifier{
								BaseNode: base("2:4", "2:5"),
								Name:     "m",
							},
							Property: &ast.Identifier{
								BaseNode: base("2:6", "2:10"),
								Name:     "key1",
							},
						},
					},
					&ast.ExpressionStatement{
						BaseNode: base("3:4", "3:13"),
						Expression: &ast.MemberExpression{
							BaseNode: base("3:4", "3:13"),
							Object: &ast.Identifier{
								BaseNode: base("3:4", "3:5"),
								Name:     "m",
							},
							Property: &ast.StringLiteral{
								BaseNode: base("3:6", "3:12"),
								Value:    "key2",
							},
						},
					},
				},
			},
		},
		{
			name: "object with string literal key",
			raw:  `x = {"a": 10}`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:14"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "1:14"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:2"),
							Name:     "x",
						},
						Init: &ast.ObjectExpression{
							BaseNode: base("1:5", "1:14"),
							Properties: []*ast.Property{
								&ast.Property{
									BaseNode: base("1:6", "1:13"),
									Key: &ast.StringLiteral{
										BaseNode: base("1:6", "1:9"),
										Value:    "a",
									},
									Value: &ast.IntegerLiteral{
										BaseNode: base("1:11", "1:13"),
										Value:    10,
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
			raw:  `x = {"a": 10, b: 11}`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:21"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "1:21"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:2"),
							Name:     "x",
						},
						Init: &ast.ObjectExpression{
							BaseNode: base("1:5", "1:21"),
							Properties: []*ast.Property{
								&ast.Property{
									BaseNode: base("1:6", "1:13"),
									Key: &ast.StringLiteral{
										BaseNode: base("1:6", "1:9"),
										Value:    "a",
									},
									Value: &ast.IntegerLiteral{
										BaseNode: base("1:11", "1:13"),
										Value:    10,
									},
								},
								&ast.Property{
									BaseNode: base("1:15", "1:20"),
									Key: &ast.Identifier{
										BaseNode: base("1:15", "1:16"),
										Name:     "b",
									},
									Value: &ast.IntegerLiteral{
										BaseNode: base("1:18", "1:20"),
										Value:    11,
									},
								},
							},
						},
					},
				},
			},
		},
		{
			name: "implicit key object literal",
			raw:  `x = {a, b}`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:11"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "1:11"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:2"),
							Name:     "x",
						},
						Init: &ast.ObjectExpression{
							BaseNode: base("1:5", "1:11"),
							Properties: []*ast.Property{
								&ast.Property{
									BaseNode: base("1:6", "1:7"),
									Key: &ast.Identifier{
										BaseNode: base("1:6", "1:7"),
										Name:     "a",
									},
								},
								&ast.Property{
									BaseNode: base("1:9", "1:10"),
									Key: &ast.Identifier{
										BaseNode: base("1:9", "1:10"),
										Name:     "b",
									},
								},
							},
						},
					},
				},
			},
		},
		{
			name: "index expression",
			raw:  `a[3]`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:5"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("1:1", "1:5"),
						Expression: &ast.IndexExpression{
							BaseNode: base("1:1", "1:5"),
							Array: &ast.Identifier{
								BaseNode: base("1:1", "1:2"),
								Name:     "a",
							},
							Index: &ast.IntegerLiteral{
								BaseNode: base("1:3", "1:4"),
								Value:    3,
							},
						},
					},
				},
			},
		},
		{
			name: "nested index expression",
			raw:  `a[3][5]`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:8"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("1:1", "1:8"),
						Expression: &ast.IndexExpression{
							BaseNode: base("1:1", "1:8"),
							Array: &ast.IndexExpression{
								BaseNode: base("1:1", "1:5"),
								Array: &ast.Identifier{
									BaseNode: base("1:1", "1:2"),
									Name:     "a",
								},
								Index: &ast.IntegerLiteral{
									BaseNode: base("1:3", "1:4"),
									Value:    3,
								},
							},
							Index: &ast.IntegerLiteral{
								BaseNode: base("1:6", "1:7"),
								Value:    5,
							},
						},
					},
				},
			},
		},
		{
			name: "access indexed object returned from function call",
			raw:  `f()[3]`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:7"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("1:1", "1:7"),
						Expression: &ast.IndexExpression{
							BaseNode: base("1:1", "1:7"),
							Array: &ast.CallExpression{
								BaseNode: base("1:1", "1:4"),
								Callee: &ast.Identifier{
									BaseNode: base("1:1", "1:2"),
									Name:     "f",
								},
							},
							Index: &ast.IntegerLiteral{
								BaseNode: base("1:5", "1:6"),
								Value:    3,
							},
						},
					},
				},
			},
		},
		{
			name: "index with member expressions",
			raw:  `a.b["c"]`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:9"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("1:1", "1:9"),
						Expression: &ast.MemberExpression{
							BaseNode: base("1:1", "1:9"),
							Object: &ast.MemberExpression{
								BaseNode: base("1:1", "1:4"),
								Object: &ast.Identifier{
									BaseNode: base("1:1", "1:2"),
									Name:     "a",
								},
								Property: &ast.Identifier{
									BaseNode: base("1:3", "1:4"),
									Name:     "b",
								},
							},
							Property: &ast.StringLiteral{
								BaseNode: base("1:5", "1:8"),
								Value:    "c",
							},
						},
					},
				},
			},
		},
		{
			name: "index with member with call expression",
			raw:  `a.b()["c"]`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:11"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("1:1", "1:11"),
						Expression: &ast.MemberExpression{
							BaseNode: base("1:1", "1:11"),
							Object: &ast.CallExpression{
								BaseNode: base("1:1", "1:6"),
								Callee: &ast.MemberExpression{
									BaseNode: base("1:1", "1:4"),
									Object: &ast.Identifier{
										BaseNode: base("1:1", "1:2"),
										Name:     "a",
									},
									Property: &ast.Identifier{
										BaseNode: base("1:3", "1:4"),
										Name:     "b",
									},
								},
							},
							Property: &ast.StringLiteral{
								BaseNode: base("1:7", "1:10"),
								Value:    "c",
							},
						},
					},
				},
			},
		},
		{
			name: "binary expression",
			raw:  `_value < 10.0`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:14"),
				Body: []ast.Statement{&ast.ExpressionStatement{
					BaseNode: base("1:1", "1:14"),
					Expression: &ast.BinaryExpression{
						BaseNode: base("1:1", "1:14"),
						Operator: ast.LessThanOperator,
						Left: &ast.Identifier{
							BaseNode: base("1:1", "1:7"),
							Name:     "_value",
						},
						Right: &ast.FloatLiteral{
							BaseNode: base("1:10", "1:14"),
							Value:    10.0,
						},
					},
				}},
			},
		},
		{
			name: "member expression binary expression",
			raw:  `r._value < 10.0`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:16"),
				Body: []ast.Statement{&ast.ExpressionStatement{
					BaseNode: base("1:1", "1:16"),
					Expression: &ast.BinaryExpression{
						BaseNode: base("1:1", "1:16"),
						Operator: ast.LessThanOperator,
						Left: &ast.MemberExpression{
							BaseNode: base("1:1", "1:9"),
							Object: &ast.Identifier{
								BaseNode: base("1:1", "1:2"),
								Name:     "r",
							},
							Property: &ast.Identifier{
								BaseNode: base("1:3", "1:9"),
								Name:     "_value",
							},
						},
						Right: &ast.FloatLiteral{
							BaseNode: base("1:12", "1:16"),
							Value:    10.0,
						},
					},
				}},
			},
		},
		{
			name: "var as binary expression of other vars",
			raw: `a = 1
            b = 2
            c = a + b
            d = a`,
			want: &ast.Program{
				BaseNode: base("1:1", "4:18"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "1:6"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:2"),
							Name:     "a",
						},
						Init: &ast.IntegerLiteral{
							BaseNode: base("1:5", "1:6"),
							Value:    1,
						},
					},
					&ast.VariableAssignment{
						BaseNode: base("2:13", "2:18"),
						ID: &ast.Identifier{
							BaseNode: base("2:13", "2:14"),
							Name:     "b",
						},
						Init: &ast.IntegerLiteral{
							BaseNode: base("2:17", "2:18"),
							Value:    2,
						},
					},
					&ast.VariableAssignment{
						BaseNode: base("3:13", "3:22"),
						ID: &ast.Identifier{
							BaseNode: base("3:13", "3:14"),
							Name:     "c",
						},
						Init: &ast.BinaryExpression{
							BaseNode: base("3:17", "3:22"),
							Operator: ast.AdditionOperator,
							Left: &ast.Identifier{
								BaseNode: base("3:17", "3:18"),
								Name:     "a",
							},
							Right: &ast.Identifier{
								BaseNode: base("3:21", "3:22"),
								Name:     "b",
							},
						},
					},
					&ast.VariableAssignment{
						BaseNode: base("4:13", "4:18"),
						ID: &ast.Identifier{
							BaseNode: base("4:13", "4:14"),
							Name:     "d",
						},
						Init: &ast.Identifier{
							BaseNode: base("4:17", "4:18"),
							Name:     "a",
						},
					},
				},
			},
		},
		{
			name: "var as unary expression of other vars",
			raw: `a = 5
            c = -a`,
			want: &ast.Program{
				BaseNode: base("1:1", "2:19"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "1:6"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:2"),
							Name:     "a",
						},
						Init: &ast.IntegerLiteral{
							BaseNode: base("1:5", "1:6"),
							Value:    5,
						},
					},
					&ast.VariableAssignment{
						BaseNode: base("2:13", "2:19"),
						ID: &ast.Identifier{
							BaseNode: base("2:13", "2:14"),
							Name:     "c",
						},
						Init: &ast.UnaryExpression{
							BaseNode: base("2:17", "2:19"),
							Operator: ast.SubtractionOperator,
							Argument: &ast.Identifier{
								BaseNode: base("2:18", "2:19"),
								Name:     "a",
							},
						},
					},
				},
			},
		},
		{
			name: "var as both binary and unary expressions",
			raw: `a = 5
            c = 10 * -a`,
			want: &ast.Program{
				BaseNode: base("1:1", "2:24"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "1:6"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:2"),
							Name:     "a",
						},
						Init: &ast.IntegerLiteral{
							BaseNode: base("1:5", "1:6"),
							Value:    5,
						},
					},
					&ast.VariableAssignment{
						BaseNode: base("2:13", "2:24"),
						ID: &ast.Identifier{
							BaseNode: base("2:13", "2:14"),
							Name:     "c",
						},
						Init: &ast.BinaryExpression{
							BaseNode: base("2:17", "2:24"),
							Operator: ast.MultiplicationOperator,
							Left: &ast.IntegerLiteral{
								BaseNode: base("2:17", "2:19"),
								Value:    10,
							},
							Right: &ast.UnaryExpression{
								BaseNode: base("2:22", "2:24"),
								Operator: ast.SubtractionOperator,
								Argument: &ast.Identifier{
									BaseNode: base("2:23", "2:24"),
									Name:     "a",
								},
							},
						},
					},
				},
			},
		},
		{
			name: "unary expressions within logical expression",
			raw: `a = 5.0
            10.0 * -a == -0.5 or a == 6.0`,
			want: &ast.Program{
				BaseNode: base("1:1", "2:42"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "1:8"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:2"),
							Name:     "a",
						},
						Init: &ast.FloatLiteral{
							BaseNode: base("1:5", "1:8"),
							Value:    5,
						},
					},
					&ast.ExpressionStatement{
						BaseNode: base("2:13", "2:42"),
						Expression: &ast.LogicalExpression{
							BaseNode: base("2:13", "2:42"),
							Operator: ast.OrOperator,
							Left: &ast.BinaryExpression{
								BaseNode: base("2:13", "2:30"),
								Operator: ast.EqualOperator,
								Left: &ast.BinaryExpression{
									BaseNode: base("2:13", "2:22"),
									Operator: ast.MultiplicationOperator,
									Left: &ast.FloatLiteral{
										BaseNode: base("2:13", "2:17"),
										Value:    10,
									},
									Right: &ast.UnaryExpression{
										BaseNode: base("2:20", "2:22"),
										Operator: ast.SubtractionOperator,
										Argument: &ast.Identifier{
											BaseNode: base("2:21", "2:22"),
											Name:     "a",
										},
									},
								},
								Right: &ast.UnaryExpression{
									BaseNode: base("2:26", "2:30"),
									Operator: ast.SubtractionOperator,
									Argument: &ast.FloatLiteral{
										BaseNode: base("2:27", "2:30"),
										Value:    0.5,
									},
								},
							},
							Right: &ast.BinaryExpression{
								BaseNode: base("2:34", "2:42"),
								Operator: ast.EqualOperator,
								Left: &ast.Identifier{
									BaseNode: base("2:34", "2:35"),
									Name:     "a",
								},
								Right: &ast.FloatLiteral{
									BaseNode: base("2:39", "2:42"),
									Value:    6,
								},
							},
						},
					},
				},
			},
		},
		{
			name: "unary expressions with too many comments",
			raw: `// define a
a = 5.0
// eval this
10.0 * -a == -0.5
	// or this
	or a == 6.0`,
			want: &ast.Program{
				BaseNode: base("2:1", "6:13"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("2:1", "2:8"),
						ID: &ast.Identifier{
							BaseNode: base("2:1", "2:2"),
							Name:     "a",
						},
						Init: &ast.FloatLiteral{
							BaseNode: base("2:5", "2:8"),
							Value:    5,
						},
					},
					&ast.ExpressionStatement{
						BaseNode: base("4:1", "6:13"),
						Expression: &ast.LogicalExpression{
							BaseNode: base("4:1", "6:13"),
							Operator: ast.OrOperator,
							Left: &ast.BinaryExpression{
								BaseNode: base("4:1", "4:18"),
								Operator: ast.EqualOperator,
								Left: &ast.BinaryExpression{
									BaseNode: base("4:1", "4:10"),
									Operator: ast.MultiplicationOperator,
									Left: &ast.FloatLiteral{
										BaseNode: base("4:1", "4:5"),
										Value:    10,
									},
									Right: &ast.UnaryExpression{
										BaseNode: base("4:8", "4:10"),
										Operator: ast.SubtractionOperator,
										Argument: &ast.Identifier{
											BaseNode: base("4:9", "4:10"),
											Name:     "a",
										},
									},
								},
								Right: &ast.UnaryExpression{
									BaseNode: base("4:14", "4:18"),
									Operator: ast.SubtractionOperator,
									Argument: &ast.FloatLiteral{
										BaseNode: base("4:15", "4:18"),
										Value:    0.5,
									},
								},
							},
							Right: &ast.BinaryExpression{
								BaseNode: base("6:5", "6:13"),
								Operator: ast.EqualOperator,
								Left: &ast.Identifier{
									BaseNode: base("6:5", "6:6"),
									Name:     "a",
								},
								Right: &ast.FloatLiteral{
									BaseNode: base("6:10", "6:13"),
									Value:    6,
								},
							},
						},
					},
				},
			},
		},
		{
			name: "expressions with function calls",
			raw:  `a = foo() == 10`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:16"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "1:16"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:2"),
							Name:     "a",
						},
						Init: &ast.BinaryExpression{
							BaseNode: base("1:5", "1:16"),
							Operator: ast.EqualOperator,
							Left: &ast.CallExpression{
								BaseNode: base("1:5", "1:10"),
								Callee: &ast.Identifier{
									BaseNode: base("1:5", "1:8"),
									Name:     "foo",
								},
							},
							Right: &ast.IntegerLiteral{
								BaseNode: base("1:14", "1:16"),
								Value:    10,
							},
						},
					},
				},
			},
		},
		{
			name: "mix unary logical and binary expressions",
			raw: `
            not (f() == 6.0 * x) or fail()`,
			want: &ast.Program{
				BaseNode: base("2:13", "2:43"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("2:13", "2:43"),
						Expression: &ast.LogicalExpression{
							BaseNode: base("2:13", "2:43"),
							Operator: ast.OrOperator,
							Left: &ast.UnaryExpression{
								BaseNode: base("2:13", "2:32"),
								Operator: ast.NotOperator,
								Argument: &ast.BinaryExpression{
									BaseNode: base("2:18", "2:32"),
									Operator: ast.EqualOperator,
									Left: &ast.CallExpression{
										BaseNode: base("2:18", "2:21"),
										Callee: &ast.Identifier{
											BaseNode: base("2:18", "2:19"),
											Name:     "f",
										},
									},
									Right: &ast.BinaryExpression{
										BaseNode: base("2:25", "2:32"),
										Operator: ast.MultiplicationOperator,
										Left: &ast.FloatLiteral{
											BaseNode: base("2:25", "2:28"),
											Value:    6,
										},
										Right: &ast.Identifier{
											BaseNode: base("2:31", "2:32"),
											Name:     "x",
										},
									},
								},
							},
							Right: &ast.CallExpression{
								BaseNode: base("2:37", "2:43"),
								Callee: &ast.Identifier{
									BaseNode: base("2:37", "2:41"),
									Name:     "fail",
								},
							},
						},
					},
				},
			},
		},
		{
			name: "mix unary logical and binary expressions with extra parens",
			raw: `
            (not (f() == 6.0 * x) or fail())`,
			want: &ast.Program{
				BaseNode: base("2:13", "2:44"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("2:14", "2:44"),
						Expression: &ast.LogicalExpression{
							BaseNode: base("2:14", "2:44"),
							Operator: ast.OrOperator,
							Left: &ast.UnaryExpression{
								BaseNode: base("2:14", "2:33"),
								Operator: ast.NotOperator,
								Argument: &ast.BinaryExpression{
									BaseNode: base("2:19", "2:33"),
									Operator: ast.EqualOperator,
									Left: &ast.CallExpression{
										BaseNode: base("2:19", "2:22"),
										Callee: &ast.Identifier{
											BaseNode: base("2:19", "2:20"),
											Name:     "f",
										},
									},
									Right: &ast.BinaryExpression{
										BaseNode: base("2:26", "2:33"),
										Operator: ast.MultiplicationOperator,
										Left: &ast.FloatLiteral{
											BaseNode: base("2:26", "2:29"),
											Value:    6,
										},
										Right: &ast.Identifier{
											BaseNode: base("2:32", "2:33"),
											Name:     "x",
										},
									},
								},
							},
							Right: &ast.CallExpression{
								BaseNode: base("2:38", "2:44"),
								Callee: &ast.Identifier{
									BaseNode: base("2:38", "2:42"),
									Name:     "fail",
								},
							},
						},
					},
				},
			},
		},
		{
			name: "logical unary operator precedence",
			raw:  `not -1 == a`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:12"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("1:1", "1:12"),
						Expression: &ast.UnaryExpression{
							BaseNode: base("1:1", "1:12"),
							Operator: ast.NotOperator,
							Argument: &ast.BinaryExpression{
								BaseNode: base("1:5", "1:12"),
								Operator: ast.EqualOperator,
								Left: &ast.UnaryExpression{
									BaseNode: base("1:5", "1:7"),
									Operator: ast.SubtractionOperator,
									Argument: &ast.IntegerLiteral{
										BaseNode: base("1:6", "1:7"),
										Value:    1,
									},
								},
								Right: &ast.Identifier{
									BaseNode: base("1:11", "1:12"),
									Name:     "a",
								},
							},
						},
					},
				},
			},
		},
		{
			name: "arrow function called",
			raw: `plusOne = (r) => r + 1
			plusOne(r:5)
			`,
			want: &ast.Program{
				BaseNode: base("1:1", "2:16"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "1:23"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:8"),
							Name:     "plusOne",
						},
						Init: &ast.FunctionExpression{
							BaseNode: base("1:11", "1:23"),
							Params: []*ast.Property{
								{
									BaseNode: base("1:12", "1:13"),
									Key: &ast.Identifier{
										BaseNode: base("1:12", "1:13"),
										Name:     "r",
									},
								},
							},
							Body: &ast.BinaryExpression{
								BaseNode: base("1:18", "1:23"),
								Operator: ast.AdditionOperator,
								Left: &ast.Identifier{
									BaseNode: base("1:18", "1:19"),
									Name:     "r",
								},
								Right: &ast.IntegerLiteral{
									BaseNode: base("1:22", "1:23"),
									Value:    1,
								},
							},
						},
					},
					&ast.ExpressionStatement{
						BaseNode: base("2:4", "2:16"),
						Expression: &ast.CallExpression{
							BaseNode: base("2:4", "2:16"),
							Callee: &ast.Identifier{
								BaseNode: base("2:4", "2:11"),
								Name:     "plusOne",
							},
							Arguments: []ast.Expression{
								&ast.ObjectExpression{
									BaseNode: base("2:12", "2:15"),
									Properties: []*ast.Property{
										{
											BaseNode: base("2:12", "2:15"),
											Key: &ast.Identifier{
												BaseNode: base("2:12", "2:13"),
												Name:     "r",
											},
											Value: &ast.IntegerLiteral{
												BaseNode: base("2:14", "2:15"),
												Value:    5,
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
		{
			name: "arrow function return map",
			raw:  `toMap = (r) =>({r:r})`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:21"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "1:21"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:6"),
							Name:     "toMap",
						},
						Init: &ast.FunctionExpression{
							BaseNode: base("1:9", "1:21"),
							Params: []*ast.Property{
								{
									BaseNode: base("1:10", "1:11"),
									Key: &ast.Identifier{
										BaseNode: base("1:10", "1:11"),
										Name:     "r",
									},
								},
							},
							Body: &ast.ObjectExpression{
								BaseNode: base("1:16", "1:21"),
								Properties: []*ast.Property{
									{
										BaseNode: base("1:17", "1:20"),
										Key: &ast.Identifier{
											BaseNode: base("1:17", "1:18"),
											Name:     "r",
										},
										Value: &ast.Identifier{
											BaseNode: base("1:19", "1:20"),
											Name:     "r",
										},
									},
								},
							},
						},
					},
				},
			},
		},
		{
			name: "arrow function with default arg",
			raw:  `addN = (r, n=5) => r + n`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:25"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "1:25"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:5"),
							Name:     "addN",
						},
						Init: &ast.FunctionExpression{
							BaseNode: base("1:8", "1:25"),
							Params: []*ast.Property{
								{
									BaseNode: base("1:9", "1:10"),
									Key: &ast.Identifier{
										BaseNode: base("1:9", "1:10"),
										Name:     "r",
									},
								},
								{
									BaseNode: base("1:12", "1:15"),
									Key: &ast.Identifier{
										BaseNode: base("1:12", "1:13"),
										Name:     "n",
									},
									Value: &ast.IntegerLiteral{
										BaseNode: base("1:14", "1:15"),
										Value:    5,
									},
								},
							},
							Body: &ast.BinaryExpression{
								BaseNode: base("1:20", "1:25"),
								Operator: ast.AdditionOperator,
								Left: &ast.Identifier{
									BaseNode: base("1:20", "1:21"),
									Name:     "r",
								},
								Right: &ast.Identifier{
									BaseNode: base("1:24", "1:25"),
									Name:     "n",
								},
							},
						},
					},
				},
			},
		},
		{
			name: "arrow function called in binary expression",
			raw: `
            plusOne = (r) => r + 1
            plusOne(r:5) == 6 or die()
			`,
			want: &ast.Program{
				BaseNode: base("2:13", "3:39"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("2:13", "2:35"),
						ID: &ast.Identifier{
							BaseNode: base("2:13", "2:20"),
							Name:     "plusOne",
						},
						Init: &ast.FunctionExpression{
							BaseNode: base("2:23", "2:35"),
							Params: []*ast.Property{
								{
									BaseNode: base("2:24", "2:25"),
									Key: &ast.Identifier{
										BaseNode: base("2:24", "2:25"),
										Name:     "r",
									},
								},
							},
							Body: &ast.BinaryExpression{
								BaseNode: base("2:30", "2:35"),
								Operator: ast.AdditionOperator,
								Left: &ast.Identifier{
									BaseNode: base("2:30", "2:31"),
									Name:     "r",
								},
								Right: &ast.IntegerLiteral{
									BaseNode: base("2:34", "2:35"),
									Value:    1,
								},
							},
						},
					},
					&ast.ExpressionStatement{
						BaseNode: base("3:13", "3:39"),
						Expression: &ast.LogicalExpression{
							BaseNode: base("3:13", "3:39"),
							Operator: ast.OrOperator,
							Left: &ast.BinaryExpression{
								BaseNode: base("3:13", "3:30"),
								Operator: ast.EqualOperator,
								Left: &ast.CallExpression{
									BaseNode: base("3:13", "3:25"),
									Callee: &ast.Identifier{
										BaseNode: base("3:13", "3:20"),
										Name:     "plusOne",
									},
									Arguments: []ast.Expression{
										&ast.ObjectExpression{
											BaseNode: base("3:21", "3:24"),
											Properties: []*ast.Property{
												{
													BaseNode: base("3:21", "3:24"),
													Key: &ast.Identifier{
														BaseNode: base("3:21", "3:22"),
														Name:     "r",
													},
													Value: &ast.IntegerLiteral{
														BaseNode: base("3:23", "3:24"),
														Value:    5,
													},
												},
											},
										},
									},
								},
								Right: &ast.IntegerLiteral{
									BaseNode: base("3:29", "3:30"),
									Value:    6,
								},
							},
							Right: &ast.CallExpression{
								BaseNode: base("3:34", "3:39"),
								Callee: &ast.Identifier{
									BaseNode: base("3:34", "3:37"),
									Name:     "die",
								},
							},
						},
					},
				},
			},
		},
		{
			name: "arrow function as single expression",
			raw:  `f = (r) => r["_measurement"] == "cpu"`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:38"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "1:38"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:2"),
							Name:     "f",
						},
						Init: &ast.FunctionExpression{
							BaseNode: base("1:5", "1:38"),
							Params: []*ast.Property{
								{
									BaseNode: base("1:6", "1:7"),
									Key: &ast.Identifier{
										BaseNode: base("1:6", "1:7"),
										Name:     "r",
									},
								},
							},
							Body: &ast.BinaryExpression{
								BaseNode: base("1:12", "1:38"),
								Operator: ast.EqualOperator,
								Left: &ast.MemberExpression{
									BaseNode: base("1:12", "1:29"),
									Object: &ast.Identifier{
										BaseNode: base("1:12", "1:13"),
										Name:     "r",
									},
									Property: &ast.StringLiteral{
										BaseNode: base("1:14", "1:28"),
										Value:    "_measurement",
									},
								},
								Right: &ast.StringLiteral{
									BaseNode: base("1:33", "1:38"),
									Value:    "cpu",
								},
							},
						},
					},
				},
			},
		},
		{
			name: "arrow function as block",
			raw: `f = (r) => { 
                m = r["_measurement"]
                return m == "cpu"
            }`,
			want: &ast.Program{
				BaseNode: base("1:1", "4:14"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "4:14"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:2"),
							Name:     "f",
						},
						Init: &ast.FunctionExpression{
							BaseNode: base("1:5", "4:14"),
							Params: []*ast.Property{
								{
									BaseNode: base("1:6", "1:7"),
									Key: &ast.Identifier{
										BaseNode: base("1:6", "1:7"),
										Name:     "r",
									},
								},
							},
							Body: &ast.Block{
								BaseNode: base("1:12", "4:14"),
								Body: []ast.Statement{
									&ast.VariableAssignment{
										BaseNode: base("2:17", "2:38"),
										ID: &ast.Identifier{
											BaseNode: base("2:17", "2:18"),
											Name:     "m",
										},
										Init: &ast.MemberExpression{
											BaseNode: base("2:21", "2:38"),
											Object: &ast.Identifier{
												BaseNode: base("2:21", "2:22"),
												Name:     "r",
											},
											Property: &ast.StringLiteral{
												BaseNode: base("2:23", "2:37"),
												Value:    "_measurement",
											},
										},
									},
									&ast.ReturnStatement{
										BaseNode: base("3:17", "3:34"),
										Argument: &ast.BinaryExpression{
											BaseNode: base("3:24", "3:34"),
											Operator: ast.EqualOperator,
											Left: &ast.Identifier{
												BaseNode: base("3:24", "3:25"),
												Name:     "m",
											},
											Right: &ast.StringLiteral{
												BaseNode: base("3:29", "3:34"),
												Value:    "cpu",
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
		{
			name: "from with filter with no parens",
			raw:  `from(bucket:"telegraf/autogen").filter(fn: (r) => r["other"]=="mem" and r["this"]=="that" or r["these"]!="those")`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:114"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("1:1", "1:114"),
						Expression: &ast.CallExpression{
							BaseNode: base("1:1", "1:114"),
							Callee: &ast.MemberExpression{
								BaseNode: base("1:1", "1:39"),
								Property: &ast.Identifier{
									BaseNode: base("1:33", "1:39"),
									Name:     "filter",
								},
								Object: &ast.CallExpression{
									BaseNode: base("1:1", "1:32"),
									Callee: &ast.Identifier{
										BaseNode: base("1:1", "1:5"),
										Name:     "from",
									},
									Arguments: []ast.Expression{
										&ast.ObjectExpression{
											BaseNode: base("1:6", "1:31"),
											Properties: []*ast.Property{
												{
													BaseNode: base("1:6", "1:31"),
													Key: &ast.Identifier{
														BaseNode: base("1:6", "1:12"),
														Name:     "bucket",
													},
													Value: &ast.StringLiteral{
														BaseNode: base("1:13", "1:31"),
														Value:    "telegraf/autogen",
													},
												},
											},
										},
									},
								},
							},
							Arguments: []ast.Expression{
								&ast.ObjectExpression{
									BaseNode: base("1:40", "1:113"),
									Properties: []*ast.Property{
										{
											BaseNode: base("1:40", "1:113"),
											Key: &ast.Identifier{
												BaseNode: base("1:40", "1:42"),
												Name:     "fn",
											},
											Value: &ast.FunctionExpression{
												BaseNode: base("1:44", "1:113"),
												Params: []*ast.Property{
													{
														BaseNode: base("1:45", "1:46"),
														Key: &ast.Identifier{
															BaseNode: base("1:45", "1:46"),
															Name:     "r",
														},
													},
												},
												Body: &ast.LogicalExpression{
													BaseNode: base("1:51", "1:113"),
													Operator: ast.OrOperator,
													Left: &ast.LogicalExpression{
														BaseNode: base("1:51", "1:90"),
														Operator: ast.AndOperator,
														Left: &ast.BinaryExpression{
															BaseNode: base("1:51", "1:68"),
															Operator: ast.EqualOperator,
															Left: &ast.MemberExpression{
																BaseNode: base("1:51", "1:61"),
																Object: &ast.Identifier{
																	BaseNode: base("1:51", "1:52"),
																	Name:     "r",
																},
																Property: &ast.StringLiteral{
																	BaseNode: base("1:53", "1:60"),
																	Value:    "other",
																},
															},
															Right: &ast.StringLiteral{
																BaseNode: base("1:63", "1:68"),
																Value:    "mem",
															},
														},
														Right: &ast.BinaryExpression{
															BaseNode: base("1:73", "1:90"),
															Operator: ast.EqualOperator,
															Left: &ast.MemberExpression{
																BaseNode: base("1:73", "1:82"),
																Object: &ast.Identifier{
																	BaseNode: base("1:73", "1:74"),
																	Name:     "r",
																},
																Property: &ast.StringLiteral{
																	BaseNode: base("1:75", "1:81"),
																	Value:    "this",
																},
															},
															Right: &ast.StringLiteral{
																BaseNode: base("1:84", "1:90"),
																Value:    "that",
															},
														},
													},
													Right: &ast.BinaryExpression{
														BaseNode: base("1:94", "1:113"),
														Operator: ast.NotEqualOperator,
														Left: &ast.MemberExpression{
															BaseNode: base("1:94", "1:104"),
															Object: &ast.Identifier{
																BaseNode: base("1:94", "1:95"),
																Name:     "r",
															},
															Property: &ast.StringLiteral{
																BaseNode: base("1:96", "1:103"),
																Value:    "these",
															},
														},
														Right: &ast.StringLiteral{
															BaseNode: base("1:106", "1:113"),
															Value:    "those",
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
				},
			},
		},
		{
			name: "from with range",
			raw:  `from(bucket:"telegraf/autogen")|>range(start:-1h, end:10m)`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:59"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("1:1", "1:59"),
						Expression: &ast.PipeExpression{
							BaseNode: base("1:1", "1:59"),
							Argument: &ast.CallExpression{
								BaseNode: base("1:1", "1:32"),
								Callee: &ast.Identifier{
									BaseNode: base("1:1", "1:5"),
									Name:     "from",
								},
								Arguments: []ast.Expression{
									&ast.ObjectExpression{
										BaseNode: base("1:6", "1:31"),
										Properties: []*ast.Property{
											{
												BaseNode: base("1:6", "1:31"),
												Key: &ast.Identifier{
													BaseNode: base("1:6", "1:12"),
													Name:     "bucket",
												},
												Value: &ast.StringLiteral{
													BaseNode: base("1:13", "1:31"),
													Value:    "telegraf/autogen",
												},
											},
										},
									},
								},
							},
							Call: &ast.CallExpression{
								BaseNode: base("1:34", "1:59"),
								Callee: &ast.Identifier{
									BaseNode: base("1:34", "1:39"),
									Name:     "range",
								},
								Arguments: []ast.Expression{
									&ast.ObjectExpression{
										BaseNode: base("1:40", "1:58"),
										Properties: []*ast.Property{
											{
												BaseNode: base("1:40", "1:49"),
												Key: &ast.Identifier{
													BaseNode: base("1:40", "1:45"),
													Name:     "start",
												},
												Value: &ast.UnaryExpression{
													BaseNode: base("1:46", "1:49"),
													Operator: ast.SubtractionOperator,
													Argument: &ast.DurationLiteral{
														BaseNode: base("1:47", "1:49"),
														Values: []ast.Duration{
															{
																Magnitude: 1,
																Unit:      "h",
															},
														},
													},
												},
											},
											{
												BaseNode: base("1:51", "1:58"),
												Key: &ast.Identifier{
													BaseNode: base("1:51", "1:54"),
													Name:     "end",
												},
												Value: &ast.DurationLiteral{
													BaseNode: base("1:55", "1:58"),
													Values: []ast.Duration{
														{
															Magnitude: 10,
															Unit:      "m",
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
				},
			},
		},
		{
			name: "from with limit",
			raw:  `from(bucket:"telegraf/autogen")|>limit(limit:100, offset:10)`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:61"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("1:1", "1:61"),
						Expression: &ast.PipeExpression{
							BaseNode: base("1:1", "1:61"),
							Argument: &ast.CallExpression{
								BaseNode: base("1:1", "1:32"),
								Callee: &ast.Identifier{
									BaseNode: base("1:1", "1:5"),
									Name:     "from",
								},
								Arguments: []ast.Expression{
									&ast.ObjectExpression{
										BaseNode: base("1:6", "1:31"),
										Properties: []*ast.Property{
											{
												BaseNode: base("1:6", "1:31"),
												Key: &ast.Identifier{
													BaseNode: base("1:6", "1:12"),
													Name:     "bucket",
												},
												Value: &ast.StringLiteral{
													BaseNode: base("1:13", "1:31"),
													Value:    "telegraf/autogen",
												},
											},
										},
									},
								},
							},
							Call: &ast.CallExpression{
								BaseNode: base("1:34", "1:61"),
								Callee: &ast.Identifier{
									BaseNode: base("1:34", "1:39"),
									Name:     "limit",
								},
								Arguments: []ast.Expression{
									&ast.ObjectExpression{
										BaseNode: base("1:40", "1:60"),
										Properties: []*ast.Property{
											{
												BaseNode: base("1:40", "1:49"),
												Key: &ast.Identifier{
													BaseNode: base("1:40", "1:45"),
													Name:     "limit",
												},
												Value: &ast.IntegerLiteral{
													BaseNode: base("1:46", "1:49"),
													Value:    100,
												},
											},
											{
												BaseNode: base("1:51", "1:60"),
												Key: &ast.Identifier{
													BaseNode: base("1:51", "1:57"),
													Name:     "offset",
												},
												Value: &ast.IntegerLiteral{
													BaseNode: base("1:58", "1:60"),
													Value:    10,
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
		},
		{
			name: "from with range and count",
			raw: `from(bucket:"mydb/autogen")
						|> range(start:-4h, stop:-2h)
						|> count()`,
			want: &ast.Program{
				BaseNode: base("1:1", "3:17"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("1:1", "3:17"),
						Expression: &ast.PipeExpression{
							BaseNode: base("1:1", "3:17"),
							Argument: &ast.PipeExpression{
								BaseNode: base("1:1", "2:36"),
								Argument: &ast.CallExpression{
									BaseNode: base("1:1", "1:28"),
									Callee: &ast.Identifier{
										BaseNode: base("1:1", "1:5"),
										Name:     "from",
									},
									Arguments: []ast.Expression{
										&ast.ObjectExpression{
											BaseNode: base("1:6", "1:27"),
											Properties: []*ast.Property{
												{
													BaseNode: base("1:6", "1:27"),
													Key: &ast.Identifier{
														BaseNode: base("1:6", "1:12"),
														Name:     "bucket",
													},
													Value: &ast.StringLiteral{
														BaseNode: base("1:13", "1:27"),
														Value:    "mydb/autogen",
													},
												},
											},
										},
									},
								},
								Call: &ast.CallExpression{
									BaseNode: base("2:10", "2:36"),
									Callee: &ast.Identifier{
										BaseNode: base("2:10", "2:15"),
										Name:     "range",
									},
									Arguments: []ast.Expression{
										&ast.ObjectExpression{
											BaseNode: base("2:16", "2:35"),
											Properties: []*ast.Property{
												{
													BaseNode: base("2:16", "2:25"),
													Key: &ast.Identifier{
														BaseNode: base("2:16", "2:21"),
														Name:     "start",
													},
													Value: &ast.UnaryExpression{
														BaseNode: base("2:22", "2:25"),
														Operator: ast.SubtractionOperator,
														Argument: &ast.DurationLiteral{
															BaseNode: base("2:23", "2:25"),
															Values: []ast.Duration{
																{
																	Magnitude: 4,
																	Unit:      "h",
																},
															},
														},
													},
												},
												{
													BaseNode: base("2:27", "2:35"),
													Key: &ast.Identifier{
														BaseNode: base("2:27", "2:31"),
														Name:     "stop",
													},
													Value: &ast.UnaryExpression{
														BaseNode: base("2:32", "2:35"),
														Operator: ast.SubtractionOperator,
														Argument: &ast.DurationLiteral{
															BaseNode: base("2:33", "2:35"),
															Values: []ast.Duration{
																{
																	Magnitude: 2,
																	Unit:      "h",
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
							Call: &ast.CallExpression{
								BaseNode: base("3:10", "3:17"),
								Callee: &ast.Identifier{
									BaseNode: base("3:10", "3:15"),
									Name:     "count",
								},
							},
						},
					},
				},
			},
		},
		{
			name: "from with range, limit and count",
			raw: `from(bucket:"mydb/autogen")
						|> range(start:-4h, stop:-2h)
						|> limit(n:10)
						|> count()`,
			want: &ast.Program{
				BaseNode: base("1:1", "4:17"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("1:1", "4:17"),
						Expression: &ast.PipeExpression{
							BaseNode: base("1:1", "4:17"),
							Argument: &ast.PipeExpression{
								BaseNode: base("1:1", "3:21"),
								Argument: &ast.PipeExpression{
									BaseNode: base("1:1", "2:36"),
									Argument: &ast.CallExpression{
										BaseNode: base("1:1", "1:28"),
										Callee: &ast.Identifier{
											BaseNode: base("1:1", "1:5"),
											Name:     "from",
										},
										Arguments: []ast.Expression{
											&ast.ObjectExpression{
												BaseNode: base("1:6", "1:27"),
												Properties: []*ast.Property{
													{
														BaseNode: base("1:6", "1:27"),
														Key: &ast.Identifier{
															BaseNode: base("1:6", "1:12"),
															Name:     "bucket",
														},
														Value: &ast.StringLiteral{
															BaseNode: base("1:13", "1:27"),
															Value:    "mydb/autogen",
														},
													},
												},
											},
										},
									},
									Call: &ast.CallExpression{
										BaseNode: base("2:10", "2:36"),
										Callee: &ast.Identifier{
											BaseNode: base("2:10", "2:15"),
											Name:     "range",
										},
										Arguments: []ast.Expression{
											&ast.ObjectExpression{
												BaseNode: base("2:16", "2:35"),
												Properties: []*ast.Property{
													{
														BaseNode: base("2:16", "2:25"),
														Key: &ast.Identifier{
															BaseNode: base("2:16", "2:21"),
															Name:     "start",
														},
														Value: &ast.UnaryExpression{
															BaseNode: base("2:22", "2:25"),
															Operator: ast.SubtractionOperator,
															Argument: &ast.DurationLiteral{
																BaseNode: base("2:23", "2:25"),
																Values: []ast.Duration{
																	{
																		Magnitude: 4,
																		Unit:      "h",
																	},
																},
															},
														},
													},
													{
														BaseNode: base("2:27", "2:35"),
														Key: &ast.Identifier{
															BaseNode: base("2:27", "2:31"),
															Name:     "stop",
														},
														Value: &ast.UnaryExpression{
															BaseNode: base("2:32", "2:35"),
															Operator: ast.SubtractionOperator,
															Argument: &ast.DurationLiteral{
																BaseNode: base("2:33", "2:35"),
																Values: []ast.Duration{
																	{
																		Magnitude: 2,
																		Unit:      "h",
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
								Call: &ast.CallExpression{
									BaseNode: base("3:10", "3:21"),
									Callee: &ast.Identifier{
										BaseNode: base("3:10", "3:15"),
										Name:     "limit",
									},
									Arguments: []ast.Expression{
										&ast.ObjectExpression{
											BaseNode: base("3:16", "3:20"),
											Properties: []*ast.Property{
												{
													BaseNode: base("3:16", "3:20"),
													Key: &ast.Identifier{
														BaseNode: base("3:16", "3:17"),
														Name:     "n",
													},
													Value: &ast.IntegerLiteral{
														BaseNode: base("3:18", "3:20"),
														Value:    10,
													},
												},
											},
										},
									},
								},
							},
							Call: &ast.CallExpression{
								BaseNode: base("4:10", "4:17"),
								Callee: &ast.Identifier{
									BaseNode: base("4:10", "4:15"),
									Name:     "count",
								},
							},
						},
					},
				},
			},
		},
		{
			name: "from with join",
			raw: `
a = from(bucket:"dbA/autogen") |> range(start:-1h)
b = from(bucket:"dbB/autogen") |> range(start:-1h)
join(tables:[a,b], on:["host"], fn: (a,b) => a["_field"] + b["_field"])`,
			want: &ast.Program{
				BaseNode: base("2:1", "4:72"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("2:1", "2:51"),
						ID: &ast.Identifier{
							BaseNode: base("2:1", "2:2"),
							Name:     "a",
						},
						Init: &ast.PipeExpression{
							BaseNode: base("2:5", "2:51"),
							Argument: &ast.CallExpression{
								BaseNode: base("2:5", "2:31"),
								Callee: &ast.Identifier{
									BaseNode: base("2:5", "2:9"),
									Name:     "from",
								},
								Arguments: []ast.Expression{
									&ast.ObjectExpression{
										BaseNode: base("2:10", "2:30"),
										Properties: []*ast.Property{
											{
												BaseNode: base("2:10", "2:30"),
												Key: &ast.Identifier{
													BaseNode: base("2:10", "2:16"),
													Name:     "bucket",
												},
												Value: &ast.StringLiteral{
													BaseNode: base("2:17", "2:30"),
													Value:    "dbA/autogen",
												},
											},
										},
									},
								},
							},
							Call: &ast.CallExpression{
								BaseNode: base("2:35", "2:51"),
								Callee: &ast.Identifier{
									BaseNode: base("2:35", "2:40"),
									Name:     "range",
								},
								Arguments: []ast.Expression{
									&ast.ObjectExpression{
										BaseNode: base("2:41", "2:50"),
										Properties: []*ast.Property{
											{
												BaseNode: base("2:41", "2:50"),
												Key: &ast.Identifier{
													BaseNode: base("2:41", "2:46"),
													Name:     "start",
												},
												Value: &ast.UnaryExpression{
													BaseNode: base("2:47", "2:50"),
													Operator: ast.SubtractionOperator,
													Argument: &ast.DurationLiteral{
														BaseNode: base("2:48", "2:50"),
														Values: []ast.Duration{
															{
																Magnitude: 1,
																Unit:      "h",
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
					},
					&ast.VariableAssignment{
						BaseNode: base("3:1", "3:51"),
						ID: &ast.Identifier{
							BaseNode: base("3:1", "3:2"),
							Name:     "b",
						},
						Init: &ast.PipeExpression{
							BaseNode: base("3:5", "3:51"),
							Argument: &ast.CallExpression{
								BaseNode: base("3:5", "3:31"),
								Callee: &ast.Identifier{
									BaseNode: base("3:5", "3:9"),
									Name:     "from",
								},
								Arguments: []ast.Expression{
									&ast.ObjectExpression{
										BaseNode: base("3:10", "3:30"),
										Properties: []*ast.Property{
											{
												BaseNode: base("3:10", "3:30"),
												Key: &ast.Identifier{
													BaseNode: base("3:10", "3:16"),
													Name:     "bucket",
												},
												Value: &ast.StringLiteral{
													BaseNode: base("3:17", "3:30"),
													Value:    "dbB/autogen",
												},
											},
										},
									},
								},
							},
							Call: &ast.CallExpression{
								BaseNode: base("3:35", "3:51"),
								Callee: &ast.Identifier{
									BaseNode: base("3:35", "3:40"),
									Name:     "range",
								},
								Arguments: []ast.Expression{
									&ast.ObjectExpression{
										BaseNode: base("3:41", "3:50"),
										Properties: []*ast.Property{
											{
												BaseNode: base("3:41", "3:50"),
												Key: &ast.Identifier{
													BaseNode: base("3:41", "3:46"),
													Name:     "start",
												},
												Value: &ast.UnaryExpression{
													BaseNode: base("3:47", "3:50"),
													Operator: ast.SubtractionOperator,
													Argument: &ast.DurationLiteral{
														BaseNode: base("3:48", "3:50"),
														Values: []ast.Duration{
															{
																Magnitude: 1,
																Unit:      "h",
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
					},
					&ast.ExpressionStatement{
						BaseNode: base("4:1", "4:72"),
						Expression: &ast.CallExpression{
							BaseNode: base("4:1", "4:72"),
							Callee: &ast.Identifier{
								BaseNode: base("4:1", "4:5"),
								Name:     "join",
							},
							Arguments: []ast.Expression{
								&ast.ObjectExpression{
									BaseNode: base("4:6", "4:71"),
									Properties: []*ast.Property{
										{
											BaseNode: base("4:6", "4:18"),
											Key: &ast.Identifier{
												BaseNode: base("4:6", "4:12"),
												Name:     "tables",
											},
											Value: &ast.ArrayExpression{
												BaseNode: base("4:13", "4:18"),
												Elements: []ast.Expression{
													&ast.Identifier{
														BaseNode: base("4:14", "4:15"),
														Name:     "a",
													},
													&ast.Identifier{
														BaseNode: base("4:16", "4:17"),
														Name:     "b",
													},
												},
											},
										},
										{
											BaseNode: base("4:20", "4:31"),
											Key: &ast.Identifier{
												BaseNode: base("4:20", "4:22"),
												Name:     "on",
											},
											Value: &ast.ArrayExpression{
												BaseNode: base("4:23", "4:31"),
												Elements: []ast.Expression{&ast.StringLiteral{
													BaseNode: base("4:24", "4:30"),
													Value:    "host",
												}},
											},
										},
										{
											BaseNode: base("4:33", "4:71"),
											Key: &ast.Identifier{
												BaseNode: base("4:33", "4:35"),
												Name:     "fn",
											},
											Value: &ast.FunctionExpression{
												BaseNode: base("4:37", "4:71"),
												Params: []*ast.Property{
													{
														BaseNode: base("4:38", "4:39"),
														Key: &ast.Identifier{
															BaseNode: base("4:38", "4:39"),
															Name:     "a",
														},
													},
													{
														BaseNode: base("4:40", "4:41"),
														Key: &ast.Identifier{
															BaseNode: base("4:40", "4:41"),
															Name:     "b",
														},
													},
												},
												Body: &ast.BinaryExpression{
													BaseNode: base("4:46", "4:71"),
													Operator: ast.AdditionOperator,
													Left: &ast.MemberExpression{
														BaseNode: base("4:46", "4:57"),
														Object: &ast.Identifier{
															BaseNode: base("4:46", "4:47"),
															Name:     "a",
														},
														Property: &ast.StringLiteral{
															BaseNode: base("4:48", "4:56"),
															Value:    "_field",
														},
													},
													Right: &ast.MemberExpression{
														BaseNode: base("4:60", "4:71"),
														Object: &ast.Identifier{
															BaseNode: base("4:60", "4:61"),
															Name:     "b",
														},
														Property: &ast.StringLiteral{
															BaseNode: base("4:62", "4:70"),
															Value:    "_field",
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
				},
			},
		},
		{
			name: "from with join with complex expression",
			raw: `
a = from(bucket:"Flux/autogen")
	|> filter(fn: (r) => r["_measurement"] == "a")
	|> range(start:-1h)

b = from(bucket:"Flux/autogen")
	|> filter(fn: (r) => r["_measurement"] == "b")
	|> range(start:-1h)

join(tables:[a,b], on:["t1"], fn: (a,b) => (a["_field"] - b["_field"]) / b["_field"])
`,
			want: &ast.Program{
				BaseNode: base("2:1", "10:86"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("2:1", "4:21"),
						ID: &ast.Identifier{
							BaseNode: base("2:1", "2:2"),
							Name:     "a",
						},
						Init: &ast.PipeExpression{
							BaseNode: base("2:5", "4:21"),
							Argument: &ast.PipeExpression{
								BaseNode: base("2:5", "3:48"),
								Argument: &ast.CallExpression{
									BaseNode: base("2:5", "2:32"),
									Callee: &ast.Identifier{
										BaseNode: base("2:5", "2:9"),
										Name:     "from",
									},
									Arguments: []ast.Expression{
										&ast.ObjectExpression{
											BaseNode: base("2:10", "2:31"),
											Properties: []*ast.Property{
												{
													BaseNode: base("2:10", "2:31"),
													Key: &ast.Identifier{
														BaseNode: base("2:10", "2:16"),
														Name:     "bucket",
													},
													Value: &ast.StringLiteral{
														BaseNode: base("2:17", "2:31"),
														Value:    "Flux/autogen",
													},
												},
											},
										},
									},
								},
								Call: &ast.CallExpression{
									BaseNode: base("3:5", "3:48"),
									Callee: &ast.Identifier{
										BaseNode: base("3:5", "3:11"),
										Name:     "filter",
									},
									Arguments: []ast.Expression{
										&ast.ObjectExpression{
											BaseNode: base("3:12", "3:47"),
											Properties: []*ast.Property{
												{
													BaseNode: base("3:12", "3:47"),
													Key: &ast.Identifier{
														BaseNode: base("3:12", "3:14"),
														Name:     "fn",
													},
													Value: &ast.FunctionExpression{
														BaseNode: base("3:16", "3:47"),
														Params: []*ast.Property{
															{
																BaseNode: base("3:17", "3:18"),
																Key: &ast.Identifier{
																	BaseNode: base("3:17", "3:18"),
																	Name:     "r",
																},
															},
														},
														Body: &ast.BinaryExpression{
															BaseNode: base("3:23", "3:47"),
															Operator: ast.EqualOperator,
															Left: &ast.MemberExpression{
																BaseNode: base("3:23", "3:40"),
																Object: &ast.Identifier{
																	BaseNode: base("3:23", "3:24"),
																	Name:     "r",
																},
																Property: &ast.StringLiteral{
																	BaseNode: base("3:25", "3:39"),
																	Value:    "_measurement",
																},
															},
															Right: &ast.StringLiteral{
																BaseNode: base("3:44", "3:47"),
																Value:    "a",
															},
														},
													},
												},
											},
										},
									},
								},
							},
							Call: &ast.CallExpression{
								BaseNode: base("4:5", "4:21"),
								Callee: &ast.Identifier{
									BaseNode: base("4:5", "4:10"),
									Name:     "range",
								},
								Arguments: []ast.Expression{
									&ast.ObjectExpression{
										BaseNode: base("4:11", "4:20"),
										Properties: []*ast.Property{
											{
												BaseNode: base("4:11", "4:20"),
												Key: &ast.Identifier{
													BaseNode: base("4:11", "4:16"),
													Name:     "start",
												},
												Value: &ast.UnaryExpression{
													BaseNode: base("4:17", "4:20"),
													Operator: ast.SubtractionOperator,
													Argument: &ast.DurationLiteral{
														BaseNode: base("4:18", "4:20"),
														Values: []ast.Duration{
															{
																Magnitude: 1,
																Unit:      "h",
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
					},
					&ast.VariableAssignment{
						BaseNode: base("6:1", "8:21"),
						ID: &ast.Identifier{
							BaseNode: base("6:1", "6:2"),
							Name:     "b",
						},
						Init: &ast.PipeExpression{
							BaseNode: base("6:5", "8:21"),
							Argument: &ast.PipeExpression{
								BaseNode: base("6:5", "7:48"),
								Argument: &ast.CallExpression{
									BaseNode: base("6:5", "6:32"),
									Callee: &ast.Identifier{
										BaseNode: base("6:5", "6:9"),
										Name:     "from",
									},
									Arguments: []ast.Expression{
										&ast.ObjectExpression{
											BaseNode: base("6:10", "6:31"),
											Properties: []*ast.Property{
												{
													BaseNode: base("6:10", "6:31"),
													Key: &ast.Identifier{
														BaseNode: base("6:10", "6:16"),
														Name:     "bucket",
													},
													Value: &ast.StringLiteral{
														BaseNode: base("6:17", "6:31"),
														Value:    "Flux/autogen",
													},
												},
											},
										},
									},
								},
								Call: &ast.CallExpression{
									BaseNode: base("7:5", "7:48"),
									Callee: &ast.Identifier{
										BaseNode: base("7:5", "7:11"),
										Name:     "filter",
									},
									Arguments: []ast.Expression{
										&ast.ObjectExpression{
											BaseNode: base("7:12", "7:47"),
											Properties: []*ast.Property{
												{
													BaseNode: base("7:12", "7:47"),
													Key: &ast.Identifier{
														BaseNode: base("7:12", "7:14"),
														Name:     "fn",
													},
													Value: &ast.FunctionExpression{
														BaseNode: base("7:16", "7:47"),
														Params: []*ast.Property{
															{
																BaseNode: base("7:17", "7:18"),
																Key: &ast.Identifier{
																	BaseNode: base("7:17", "7:18"),
																	Name:     "r",
																},
															},
														},
														Body: &ast.BinaryExpression{
															BaseNode: base("7:23", "7:47"),
															Operator: ast.EqualOperator,
															Left: &ast.MemberExpression{
																BaseNode: base("7:23", "7:40"),
																Object: &ast.Identifier{
																	BaseNode: base("7:23", "7:24"),
																	Name:     "r",
																},
																Property: &ast.StringLiteral{
																	BaseNode: base("7:25", "7:39"),
																	Value:    "_measurement",
																},
															},
															Right: &ast.StringLiteral{
																BaseNode: base("7:44", "7:47"),
																Value:    "b",
															},
														},
													},
												},
											},
										},
									},
								},
							},
							Call: &ast.CallExpression{
								BaseNode: base("8:5", "8:21"),
								Callee: &ast.Identifier{
									BaseNode: base("8:5", "8:10"),
									Name:     "range",
								},
								Arguments: []ast.Expression{
									&ast.ObjectExpression{
										BaseNode: base("8:11", "8:20"),
										Properties: []*ast.Property{
											{
												BaseNode: base("8:11", "8:20"),
												Key: &ast.Identifier{
													BaseNode: base("8:11", "8:16"),
													Name:     "start",
												},
												Value: &ast.UnaryExpression{
													BaseNode: base("8:17", "8:20"),
													Operator: ast.SubtractionOperator,
													Argument: &ast.DurationLiteral{
														BaseNode: base("8:18", "8:20"),
														Values: []ast.Duration{
															{
																Magnitude: 1,
																Unit:      "h",
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
					},
					&ast.ExpressionStatement{
						BaseNode: base("10:1", "10:86"),
						Expression: &ast.CallExpression{
							BaseNode: base("10:1", "10:86"),
							Callee: &ast.Identifier{
								BaseNode: base("10:1", "10:5"),
								Name:     "join",
							},
							Arguments: []ast.Expression{
								&ast.ObjectExpression{
									BaseNode: base("10:6", "10:85"),
									Properties: []*ast.Property{
										{
											BaseNode: base("10:6", "10:18"),
											Key: &ast.Identifier{
												BaseNode: base("10:6", "10:12"),
												Name:     "tables",
											},
											Value: &ast.ArrayExpression{
												BaseNode: base("10:13", "10:18"),
												Elements: []ast.Expression{
													&ast.Identifier{
														BaseNode: base("10:14", "10:15"),
														Name:     "a",
													},
													&ast.Identifier{
														BaseNode: base("10:16", "10:17"),
														Name:     "b",
													},
												},
											},
										},
										{
											BaseNode: base("10:20", "10:29"),
											Key: &ast.Identifier{
												BaseNode: base("10:20", "10:22"),
												Name:     "on",
											},
											Value: &ast.ArrayExpression{
												BaseNode: base("10:23", "10:29"),
												Elements: []ast.Expression{
													&ast.StringLiteral{
														BaseNode: base("10:24", "10:28"),
														Value:    "t1",
													},
												},
											},
										},
										{
											BaseNode: base("10:31", "10:85"),
											Key: &ast.Identifier{
												BaseNode: base("10:31", "10:33"),
												Name:     "fn",
											},
											Value: &ast.FunctionExpression{
												BaseNode: base("10:35", "10:85"),
												Params: []*ast.Property{
													{
														BaseNode: base("10:36", "10:37"),
														Key: &ast.Identifier{
															BaseNode: base("10:36", "10:37"),
															Name:     "a",
														},
													},
													{
														BaseNode: base("10:38", "10:39"),
														Key: &ast.Identifier{
															BaseNode: base("10:38", "10:39"),
															Name:     "b",
														},
													},
												},
												Body: &ast.BinaryExpression{
													BaseNode: base("10:45", "10:85"),
													Operator: ast.DivisionOperator,
													Left: &ast.BinaryExpression{
														BaseNode: base("10:45", "10:70"),
														Operator: ast.SubtractionOperator,
														Left: &ast.MemberExpression{
															BaseNode: base("10:45", "10:56"),
															Object: &ast.Identifier{
																BaseNode: base("10:45", "10:46"),
																Name:     "a",
															},
															Property: &ast.StringLiteral{
																BaseNode: base("10:47", "10:55"),
																Value:    "_field",
															},
														},
														Right: &ast.MemberExpression{
															BaseNode: base("10:59", "10:70"),
															Object: &ast.Identifier{
																BaseNode: base("10:59", "10:60"),
																Name:     "b",
															},
															Property: &ast.StringLiteral{
																BaseNode: base("10:61", "10:69"),
																Value:    "_field",
															},
														},
													},
													Right: &ast.MemberExpression{
														BaseNode: base("10:74", "10:85"),
														Object: &ast.Identifier{
															BaseNode: base("10:74", "10:75"),
															Name:     "b",
														},
														Property: &ast.StringLiteral{
															BaseNode: base("10:76", "10:84"),
															Value:    "_field",
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
				},
			},
		},
		{
			name: "duration literal, all units",
			raw:  `dur = 1y3mo2w1d4h1m30s1ms2µs70ns`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:34"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "1:34"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:4"),
							Name:     "dur",
						},
						Init: &ast.DurationLiteral{
							BaseNode: base("1:7", "1:34"),
							Values: []ast.Duration{
								{Magnitude: 1, Unit: "y"},
								{Magnitude: 3, Unit: "mo"},
								{Magnitude: 2, Unit: "w"},
								{Magnitude: 1, Unit: "d"},
								{Magnitude: 4, Unit: "h"},
								{Magnitude: 1, Unit: "m"},
								{Magnitude: 30, Unit: "s"},
								{Magnitude: 1, Unit: "ms"},
								{Magnitude: 2, Unit: "us"},
								{Magnitude: 70, Unit: "ns"},
							},
						},
					},
				},
			},
		},
		{
			name: "duration literal, months",
			raw:  `dur = 6mo`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:10"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "1:10"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:4"),
							Name:     "dur",
						},
						Init: &ast.DurationLiteral{
							BaseNode: base("1:7", "1:10"),
							Values: []ast.Duration{
								{Magnitude: 6, Unit: "mo"},
							},
						},
					},
				},
			},
		},
		{
			name: "duration literal, milliseconds",
			raw:  `dur = 500ms`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:12"),
				Body: []ast.Statement{&ast.VariableAssignment{
					BaseNode: base("1:1", "1:12"),
					ID: &ast.Identifier{
						BaseNode: base("1:1", "1:4"),
						Name:     "dur",
					},
					Init: &ast.DurationLiteral{
						BaseNode: base("1:7", "1:12"),
						Values: []ast.Duration{
							{Magnitude: 500, Unit: "ms"},
						},
					},
				},
				},
			},
		},
		{
			name: "duration literal, months, minutes, milliseconds",
			raw:  `dur = 6mo30m500ms`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:18"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "1:18"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:4"),
							Name:     "dur",
						},
						Init: &ast.DurationLiteral{
							BaseNode: base("1:7", "1:18"),
							Values: []ast.Duration{
								{Magnitude: 6, Unit: "mo"},
								{Magnitude: 30, Unit: "m"},
								{Magnitude: 500, Unit: "ms"},
							},
						},
					},
				},
			},
		},
		{
			name: "date literal in the default location",
			raw:  `now = 2018-11-29`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:17"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "1:17"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:4"),
							Name:     "now",
						},
						Init: &ast.DateTimeLiteral{
							BaseNode: base("1:7", "1:17"),
							Value:    mustParseTime("2018-11-29T00:00:00Z"),
						},
					},
				},
			},
		},
		{
			name: "date time literal",
			raw:  `now = 2018-11-29T09:00:00Z`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:27"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "1:27"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:4"),
							Name:     "now",
						},
						Init: &ast.DateTimeLiteral{
							BaseNode: base("1:7", "1:27"),
							Value:    mustParseTime("2018-11-29T09:00:00Z"),
						},
					},
				},
			},
		},
		{
			name: "date time literal with fractional seconds",
			raw:  `now = 2018-11-29T09:00:00.100000000Z`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:37"),
				Body: []ast.Statement{
					&ast.VariableAssignment{
						BaseNode: base("1:1", "1:37"),
						ID: &ast.Identifier{
							BaseNode: base("1:1", "1:4"),
							Name:     "now",
						},
						Init: &ast.DateTimeLiteral{
							BaseNode: base("1:7", "1:37"),
							Value:    mustParseTime("2018-11-29T09:00:00.100000000Z"),
						},
					},
				},
			},
		},
		{
			name: "unary expression with member expression",
			raw:  `not m.b`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:8"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("1:1", "1:8"),
						Expression: &ast.UnaryExpression{
							BaseNode: base("1:1", "1:8"),
							Operator: ast.NotOperator,
							Argument: &ast.MemberExpression{
								BaseNode: base("1:5", "1:8"),
								Object:   &ast.Identifier{BaseNode: base("1:5", "1:6"), Name: "m"},
								Property: &ast.Identifier{BaseNode: base("1:7", "1:8"), Name: "b"},
							},
						},
					},
				},
			},
		},
		// todo(jsternberg): fix this once we start handling errors. For now, make sure it parses
		// correctly without panicking.
		{
			name:      "function call with unbalanced braces",
			raw:       `from() |> range() |> map(fn: (r) => { return r._value )`,
			parseOnly: true,
		},
		{
			name: "string with utf-8",
			raw:  `"日本語"`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:12"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("1:1", "1:12"),
						Expression: &ast.StringLiteral{
							BaseNode: base("1:1", "1:12"),
							Value:    "日本語",
						},
					},
				},
			},
		},
		{
			name: "string with byte values",
			raw:  `"\xe6\x97\xa5\xe6\x9c\xac\xe8\xaa\x9e"`,
			want: &ast.Program{
				BaseNode: base("1:1", "1:39"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("1:1", "1:39"),
						Expression: &ast.StringLiteral{
							BaseNode: base("1:1", "1:39"),
							Value:    "日本語",
						},
					},
				},
			},
		},
		{
			name: "string with escapes",
			raw: `"newline \n
carriage return \r
horizontal tab \t
double quote \"
backslash \\
"`,
			want: &ast.Program{
				BaseNode: base("1:1", "6:2"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("1:1", "6:2"),
						Expression: &ast.StringLiteral{
							BaseNode: base("1:1", "6:2"),
							Value:    "newline \n\ncarriage return \r\nhorizontal tab \t\ndouble quote \"\nbackslash \\\n",
						},
					},
				},
			},
		},
		{
			name: "multiline string",
			raw: `"
 this is a
multiline
string"
`,
			want: &ast.Program{
				BaseNode: base("1:1", "4:8"),
				Body: []ast.Statement{
					&ast.ExpressionStatement{
						BaseNode: base("1:1", "4:8"),
						Expression: &ast.StringLiteral{
							BaseNode: base("1:1", "4:8"),
							Value:    "\n this is a\nmultiline\nstring",
						},
					},
				},
			},
		},
	} {
		runFn(tt.name, func(tb testing.TB) {
			defer func() {
				if err := recover(); err != nil {
					tb.Fatalf("unexpected panic: %s", err)
				}
			}()

			result := parser.NewAST([]byte(tt.raw))
			if tt.parseOnly {
				return
			}

			want := tt.want.Copy()
			ast.Walk(ast.CreateVisitor(func(node ast.Node) {
				v := reflect.ValueOf(node)
				loc := v.Elem().FieldByName("Loc")
				if !loc.IsValid() {
					return
				}

				l := loc.Interface().(*ast.SourceLocation)
				if l != nil {
					l.Source = source(tt.raw, l)
				}
			}), want)
			if got, want := result, tt.want; !cmp.Equal(want, got, CompareOptions...) {
				tb.Fatalf("unexpected statement -want/+got\n%s", cmp.Diff(want, got, CompareOptions...))
			}
		})
	}
}

func base(start, end string) ast.BaseNode {
	toloc := func(s string) ast.Position {
		parts := strings.SplitN(s, ":", 2)
		line, _ := strconv.Atoi(parts[0])
		column, _ := strconv.Atoi(parts[1])
		return ast.Position{
			Line:   line,
			Column: column,
		}
	}
	return ast.BaseNode{
		Loc: &ast.SourceLocation{
			Start: toloc(start),
			End:   toloc(end),
		},
	}
}

func source(src string, loc *ast.SourceLocation) string {
	if loc == nil ||
		loc.Start.Line == 0 || loc.Start.Column == 0 ||
		loc.End.Line == 0 || loc.End.Column == 0 {
		return ""
	}

	soffset := 0
	for i := loc.Start.Line - 1; i > 0; i-- {
		o := strings.Index(src[soffset:], "\n")
		if o == -1 {
			return ""
		}
		soffset += o + 1
	}
	soffset += loc.Start.Column - 1

	eoffset := 0
	for i := loc.End.Line - 1; i > 0; i-- {
		o := strings.Index(src[eoffset:], "\n")
		if o == -1 {
			return ""
		}
		eoffset += o + 1
	}
	eoffset += loc.End.Column - 1
	return src[soffset:eoffset]
}

func mustParseTime(s string) time.Time {
	ts, err := time.Parse(time.RFC3339Nano, s)
	if err != nil {
		panic(err)
	}
	return ts
}
