package edit_test

import (
	"testing"
	"time"

	"github.com/influxdata/flux/ast"
	"github.com/influxdata/flux/ast/edit"
	"github.com/influxdata/flux/parser"
	"github.com/influxdata/flux/semantic"
	"github.com/influxdata/flux/values"
	"github.com/pkg/errors"
)

func TestEditor(t *testing.T) {
	testCases := []struct {
		name        string
		in          string
		edited      string
		unchanged   bool
		errorWanted bool
		edit        func(node ast.Node) (bool, error)
	}{
		{
			name: "no_option",
			in: `from(bucket: "test")
	|> range(start: 2018-05-23T13:09:22.885021542Z)`,
			unchanged: true,
			edit: func(node ast.Node) (bool, error) {
				return edit.Option(node, "from", nil)
			},
		},
		{
			name:      "option_wrong_id",
			in:        `option foo = 1`,
			unchanged: true,
			edit: func(node ast.Node) (bool, error) {
				return edit.Option(node, "bar", nil)
			},
		},
		{
			name: "sets_option",
			in: `option foo = 1
option bar = 1`,
			edited: `option foo = 1
option bar = 42`,
			edit: func(node ast.Node) (bool, error) {
				literal := edit.CreateLiteral(values.New(int64(42)))
				return edit.Option(node, "bar", edit.OptionValueFn(literal))
			},
		},
		{
			name: "updates_object",
			in: `option foo = 1
option task = {
	name: "bar",
	every: 1m,
	delay: 1m,
	cron: "20 * * *",
	retry: 5,
}`,
			edited: `option foo = 1
option task = {
	name: "bar",
	every: 7200000000000ns,
	delay: 2520000000000ns,
	cron: "buz",
	retry: 10,
}`,
			edit: func(node ast.Node) (bool, error) {
				return edit.Option(node, "task", edit.OptionObjectFn(map[string]values.Value{
					"every": values.New(values.Duration(2 * time.Hour)),
					"delay": values.New(values.Duration(42 * time.Minute)),
					"cron":  values.New("buz"),
					"retry": values.NewInt(10),
				}))
			},
		},
		{
			name: "error_key_not_found",
			in: `option foo = 1
option task = {
	name: "bar",
	every: 1m,
	delay: 1m,
	cron: "20 * * *",
	retry: 5,
}`,
			errorWanted: true,
			edit: func(node ast.Node) (bool, error) {
				return edit.Option(node, "task", edit.OptionObjectFn(map[string]values.Value{
					"foo":   values.New("foo"), // should cause error
					"every": values.New(values.Duration(2 * time.Hour)),
				}))
			},
		},
		{
			name:   "sets_option_to_array",
			in:     `option foo = "edit me"`,
			edited: `option foo = [1, 2, 3, 4]`,
			edit: func(node ast.Node) (bool, error) {
				literal := edit.CreateLiteral(values.NewArrayWithBacking(semantic.Int, []values.Value{
					values.NewInt(1),
					values.NewInt(2),
					values.NewInt(3),
					values.NewInt(4),
				}))
				return edit.Option(node, "foo", edit.OptionValueFn(literal))
			},
		},
		{
			name:   "sets_option_to_object",
			in:     `option foo = "edit me"`,
			edited: `option foo = {x: "x", y: "y"}`,
			edit: func(node ast.Node) (bool, error) {
				literal := edit.CreateLiteral(values.NewObjectWithValues(map[string]values.Value{
					"x": values.New("x"),
					"y": values.New("y"),
				}))
				return edit.Option(node, "foo", edit.OptionValueFn(literal))
			},
		},
		{
			name:   "sets_option_mixed",
			in:     `option foo = "edit me"`,
			edited: `option foo = {x: {a: [1, 2, 3]}, y: [[1], [2, 3]], z: [{a: 1}, {b: 2}]}`,
			edit: func(node ast.Node) (bool, error) {
				x := values.NewObjectWithValues(map[string]values.Value{
					"a": values.NewArrayWithBacking(semantic.Array, []values.Value{
						values.NewInt(1),
						values.NewInt(2),
						values.NewInt(3),
					}),
				})
				y := values.NewArrayWithBacking(semantic.Array, []values.Value{
					values.NewArrayWithBacking(semantic.Int, []values.Value{
						values.NewInt(1),
					}),
					values.NewArrayWithBacking(semantic.Int, []values.Value{
						values.NewInt(2),
						values.NewInt(3),
					}),
				})
				z := values.NewArrayWithBacking(semantic.Object, []values.Value{
					values.NewObjectWithValues(map[string]values.Value{
						"a": values.NewInt(1),
					}),
					values.NewObjectWithValues(map[string]values.Value{
						"b": values.NewInt(2),
					}),
				})

				literal := edit.CreateLiteral(values.NewObjectWithValues(map[string]values.Value{
					"x": x,
					"y": y,
					"z": z,
				}))
				return edit.Option(node, "foo", edit.OptionValueFn(literal))
			},
		},
		{
			name:   "sets_option_to_function_call",
			in:     `option location = "edit me"`,
			edited: `option location = loadLocation(name: "America/Denver")`,
			edit: func(node ast.Node) (bool, error) {
				literal := &ast.CallExpression{
					Callee: &ast.Identifier{Name: "loadLocation"},
					Arguments: []ast.Expression{&ast.ObjectExpression{Properties: []*ast.Property{
						{
							Key:   &ast.Identifier{Name: "name"},
							Value: &ast.StringLiteral{Value: "America/Denver"},
						},
					}}},
				}
				return edit.Option(node, "location", edit.OptionValueFn(literal))
			},
		},
		{
			name: "sets_option_to_function",
			in:   `option now = "edit me"`,
			edited: `option now = () =>
	(2018-12-03T20:52:48.464942Z)`,
			edit: func(node ast.Node) (bool, error) {
				t, err := values.ParseTime("2018-12-03T20:52:48.464942000Z")
				if err != nil {
					panic(err)
				}

				literal := &ast.FunctionExpression{
					Params: []*ast.Property{},
					Body:   edit.CreateLiteral(values.New(t)),
				}
				return edit.Option(node, "now", edit.OptionValueFn(literal))
			},
		},
	}

	for _, tc := range testCases {
		tc := tc
		if tc.unchanged {
			tc.edited = tc.in
		}

		t.Run(tc.name, func(t *testing.T) {
			p, err := parser.NewAST(tc.in)
			if err != nil {
				t.Fatal(errors.Wrapf(err, "input program has bad syntax:\n%s", tc.in))
			}

			edited, err := tc.edit(p)
			if err != nil && tc.errorWanted {
				return
			}

			if err != nil {
				t.Fatal(errors.Wrap(err, "got unexpected error from edit"))
			}

			if edited && tc.unchanged {
				t.Fatal("unexpected option edit")
			}

			out := ast.Format(p)

			if out != tc.edited {
				t.Errorf("\nexpected:\n%s\nedited:\n%s\n", tc.edited, out)
			}
		})
	}
}
