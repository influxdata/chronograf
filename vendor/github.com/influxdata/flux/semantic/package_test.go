package semantic_test

import (
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/flux/parser"
	"github.com/influxdata/flux/semantic"
)

func TestCreatePackage(t *testing.T) {
	testCases := []struct {
		name     string
		script   string
		importer semantic.Importer
		want     semantic.Package
		wantErr  bool
		skip     bool
	}{
		{
			name: "simple",
			script: `
package foo

a = 1
b = 2.0

1 + 1
`,
			want: semantic.Package{
				Name: "foo",
				Type: semantic.NewObjectPolyType(
					map[string]semantic.PolyType{
						"a": semantic.Int,
						"b": semantic.Float,
					},
					nil,
					semantic.LabelSet{"a", "b"},
				),
			},
		},
		{
			name: "polymorphic package",
			script: `
package foo

identity = (x) => x
`,
			want: semantic.Package{
				Name: "foo",
				Type: semantic.NewObjectPolyType(
					map[string]semantic.PolyType{
						"identity": semantic.NewFunctionPolyType(semantic.FunctionPolySignature{
							Parameters: map[string]semantic.PolyType{
								"x": semantic.Tvar(3),
							},
							Required: semantic.LabelSet{"x"},
							Return:   semantic.Tvar(3),
						}),
					},
					nil,
					semantic.LabelSet{"identity"},
				),
			},
		},
		{
			name: "nested variables",
			script: `
package bar

a = () => {
	b = 2.0
	return b
}
`,
			want: semantic.Package{
				Name: "bar",
				Type: semantic.NewObjectPolyType(
					map[string]semantic.PolyType{
						"a": semantic.NewFunctionPolyType(semantic.FunctionPolySignature{
							Return: semantic.Float,
						}),
					},
					nil,
					semantic.LabelSet{"a"},
				),
			},
		},
		{
			name: "wrap internal package",
			script: `
package baz

import "internal"

a = internal.a
`,
			importer: importer{
				packages: map[string]semantic.Package{
					"internal": semantic.Package{
						Name: "internal",
						Type: semantic.NewObjectPolyType(
							map[string]semantic.PolyType{
								"a": semantic.Int,
								"b": semantic.Float,
							},
							nil,
							semantic.LabelSet{"a", "b"},
						),
					},
				},
			},
			want: semantic.Package{
				Name: "baz",
				Type: semantic.NewObjectPolyType(
					map[string]semantic.PolyType{
						"a": semantic.Int,
					},
					nil,
					semantic.LabelSet{"a"},
				),
			},
		},
		{
			name: "modify exported identifier",
			script: `
package foo

import "bar"

bar.x = 10
`,
			importer: importer{
				packages: map[string]semantic.Package{
					"bar": semantic.Package{
						Name: "bar",
						Type: semantic.NewObjectPolyType(
							map[string]semantic.PolyType{
								"x": semantic.Int,
							},
							nil,
							semantic.LabelSet{"x"},
						),
					},
				},
			},
			wantErr: true,
			skip:    true,
		},
	}
	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			if tc.skip {
				t.Skip()
			}
			program, err := parser.NewAST(tc.script)
			if err != nil {
				t.Fatal(err)
			}
			node, err := semantic.New(program)
			if err != nil {
				t.Fatal(err)
			}
			got, err := semantic.CreatePackage(node, tc.importer)
			if !tc.wantErr {
				if err != nil {
					t.Errorf("unexpected error %v", err)
				}
				if !cmp.Equal(tc.want, got) {
					t.Errorf("unexpected package -want/+got\n%s", cmp.Diff(tc.want, got))
				}
			} else if err == nil {
				t.Errorf("expected error")
			}
		})
	}
}
