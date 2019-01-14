package flux_test

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strconv"
	"testing"
	"time"

	"github.com/influxdata/flux/functions/inputs"

	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"
	"github.com/influxdata/flux"
	"github.com/influxdata/flux/functions/transformations"
	_ "github.com/influxdata/flux/options"
	"github.com/influxdata/flux/parser"
	"github.com/influxdata/flux/semantic"
	"github.com/influxdata/flux/values"
)

func init() {
	flux.FinalizeBuiltIns()
}

var ignoreUnexportedQuerySpec = cmpopts.IgnoreUnexported(flux.Spec{})

func TestSpec_JSON(t *testing.T) {
	srcData := []byte(`
{
	"operations":[
		{
			"id": "from",
			"kind": "from",
			"spec": {
				"bucket":"mybucket"
			}
		},
		{
			"id": "range",
			"kind": "range",
			"spec": {
				"start": "-4h",
				"stop": "now"
			}
		},
		{
			"id": "sum",
			"kind": "sum"
		}
	],
	"edges":[
		{"parent":"from","child":"range"},
		{"parent":"range","child":"sum"}
	]
}
	`)

	// Ensure we can properly unmarshal a query
	gotQ := flux.Spec{}
	if err := json.Unmarshal(srcData, &gotQ); err != nil {
		t.Fatal(err)
	}
	expQ := flux.Spec{
		Operations: []*flux.Operation{
			{
				ID: "from",
				Spec: &inputs.FromOpSpec{
					Bucket: "mybucket",
				},
			},
			{
				ID: "range",
				Spec: &transformations.RangeOpSpec{
					Start: flux.Time{
						Relative:   -4 * time.Hour,
						IsRelative: true,
					},
					Stop: flux.Time{
						IsRelative: true,
					},
				},
			},
			{
				ID:   "sum",
				Spec: &transformations.SumOpSpec{},
			},
		},
		Edges: []flux.Edge{
			{Parent: "from", Child: "range"},
			{Parent: "range", Child: "sum"},
		},
	}
	if !cmp.Equal(gotQ, expQ, ignoreUnexportedQuerySpec) {
		t.Errorf("unexpected query:\n%s", cmp.Diff(gotQ, expQ, ignoreUnexportedQuerySpec))
	}

	// Ensure we can properly marshal a query
	data, err := json.Marshal(expQ)
	if err != nil {
		t.Fatal(err)
	}
	if err := json.Unmarshal(data, &gotQ); err != nil {
		t.Fatal(err)
	}
	if !cmp.Equal(gotQ, expQ, ignoreUnexportedQuerySpec) {
		t.Errorf("unexpected query after marshalling: -want/+got %s", cmp.Diff(expQ, gotQ, ignoreUnexportedQuerySpec))
	}
}

func TestSpec_Walk(t *testing.T) {
	testCases := []struct {
		query     *flux.Spec
		walkOrder []flux.OperationID
		err       error
	}{
		{
			query: &flux.Spec{},
			err:   errors.New("query has no root nodes"),
		},
		{
			query: &flux.Spec{
				Operations: []*flux.Operation{
					{ID: "a"},
					{ID: "b"},
				},
				Edges: []flux.Edge{
					{Parent: "a", Child: "b"},
					{Parent: "a", Child: "c"},
				},
			},
			err: errors.New("edge references unknown child operation \"c\""),
		},
		{
			query: &flux.Spec{
				Operations: []*flux.Operation{
					{ID: "a"},
					{ID: "b"},
					{ID: "b"},
				},
				Edges: []flux.Edge{
					{Parent: "a", Child: "b"},
					{Parent: "a", Child: "b"},
				},
			},
			err: errors.New("found duplicate operation ID \"b\""),
		},
		{
			query: &flux.Spec{
				Operations: []*flux.Operation{
					{ID: "a"},
					{ID: "b"},
					{ID: "c"},
				},
				Edges: []flux.Edge{
					{Parent: "a", Child: "b"},
					{Parent: "b", Child: "c"},
					{Parent: "c", Child: "b"},
				},
			},
			err: errors.New("found cycle in query"),
		},
		{
			query: &flux.Spec{
				Operations: []*flux.Operation{
					{ID: "a"},
					{ID: "b"},
					{ID: "c"},
					{ID: "d"},
				},
				Edges: []flux.Edge{
					{Parent: "a", Child: "b"},
					{Parent: "b", Child: "c"},
					{Parent: "c", Child: "d"},
					{Parent: "d", Child: "b"},
				},
			},
			err: errors.New("found cycle in query"),
		},
		{
			query: &flux.Spec{
				Operations: []*flux.Operation{
					{ID: "a"},
					{ID: "b"},
					{ID: "c"},
					{ID: "d"},
				},
				Edges: []flux.Edge{
					{Parent: "a", Child: "b"},
					{Parent: "b", Child: "c"},
					{Parent: "c", Child: "d"},
				},
			},
			walkOrder: []flux.OperationID{
				"a", "b", "c", "d",
			},
		},
		{
			query: &flux.Spec{
				Operations: []*flux.Operation{
					{ID: "a"},
					{ID: "b"},
					{ID: "c"},
					{ID: "d"},
				},
				Edges: []flux.Edge{
					{Parent: "a", Child: "b"},
					{Parent: "a", Child: "c"},
					{Parent: "b", Child: "d"},
					{Parent: "c", Child: "d"},
				},
			},
			walkOrder: []flux.OperationID{
				"a", "c", "b", "d",
			},
		},
		{
			query: &flux.Spec{
				Operations: []*flux.Operation{
					{ID: "a"},
					{ID: "b"},
					{ID: "c"},
					{ID: "d"},
				},
				Edges: []flux.Edge{
					{Parent: "a", Child: "c"},
					{Parent: "b", Child: "c"},
					{Parent: "c", Child: "d"},
				},
			},
			walkOrder: []flux.OperationID{
				"b", "a", "c", "d",
			},
		},
		{
			query: &flux.Spec{
				Operations: []*flux.Operation{
					{ID: "a"},
					{ID: "b"},
					{ID: "c"},
					{ID: "d"},
				},
				Edges: []flux.Edge{
					{Parent: "a", Child: "c"},
					{Parent: "b", Child: "d"},
				},
			},
			walkOrder: []flux.OperationID{
				"b", "d", "a", "c",
			},
		},
	}
	for i, tc := range testCases {
		tc := tc
		t.Run(strconv.Itoa(i), func(t *testing.T) {
			var gotOrder []flux.OperationID
			err := tc.query.Walk(func(o *flux.Operation) error {
				gotOrder = append(gotOrder, o.ID)
				return nil
			})
			if tc.err == nil {
				if err != nil {
					t.Fatal(err)
				}
			} else {
				if err == nil {
					t.Fatalf("expected error: %q", tc.err)
				} else if got, exp := err.Error(), tc.err.Error(); got != exp {
					t.Fatalf("unexpected errors: got %q exp %q", got, exp)
				}
			}

			if !cmp.Equal(gotOrder, tc.walkOrder) {
				t.Fatalf("unexpected walk order -want/+got %s", cmp.Diff(tc.walkOrder, gotOrder))
			}
		})
	}
}

// Example_option demonstrates retrieving an option from the Flux interpreter
func Example_option() {
	// Instantiate a new Flux interpreter with pre-populated option and global scopes
	itrp := flux.NewInterpreter()

	// Retrieve the default value for an option
	nowFunc := itrp.Option("now")

	// The now option is a function value whose default behavior is to return
	// the current system time when called. The function now() doesn't take
	// any arguments so can be called with nil.
	nowTime, _ := nowFunc.Function().Call(nil)
	fmt.Fprintf(os.Stderr, "The current system time (UTC) is: %v\n", nowTime)
	// Output:
}

// Example_setOption demonstrates setting an option from the Flux interpreter
func Example_setOption() {
	// Instantiate a new Flux interpreter with pre-populated option and global scopes
	itrp := flux.NewInterpreter()

	// Set a new option from the interpreter
	itrp.SetOption("dummy_option", values.NewInt(3))

	fmt.Printf("dummy_option = %d", itrp.Option("dummy_option").Int())
	// Output: dummy_option = 3
}

// Example_overrideDefaultOptionExternally demonstrates how declaring an option
// in a Flux script will change that option's binding in the options scope of the interpreter.
func Example_overrideDefaultOptionExternally() {
	queryString := `
		now = () => 2018-07-13T00:00:00Z
		what_time_is_it = now()`

	itrp := flux.NewInterpreter()

	ast, _ := parser.NewAST(queryString)
	semanticProgram, _ := semantic.New(ast)

	// Evaluate program
	err := itrp.Eval(semanticProgram, nil)
	if err != nil {
		fmt.Println(err)
	}

	// After evaluating the program, lookup the value of what_time_is_it
	now, _ := itrp.GlobalScope().Lookup("what_time_is_it")

	// what_time_is_it? Why it's ....
	fmt.Printf("The new current time (UTC) is: %v", now)
	// Output: The new current time (UTC) is: 2018-07-13T00:00:00.000000000Z
}

// Example_overrideDefaultOptionInternally demonstrates how one can override a default
// option that is used in a query before that query is evaluated by the interpreter.
func Example_overrideDefaultOptionInternally() {
	queryString := `what_time_is_it = now()`

	itrp := flux.NewInterpreter()

	ast, _ := parser.NewAST(queryString)
	semanticProgram, _ := semantic.New(ast)

	// Define a new now function which returns a static time value of 2018-07-13T00:00:00.000000000Z
	timeValue := time.Date(2018, 7, 13, 0, 0, 0, 0, time.UTC)
	functionName := "newTime"
	functionType := semantic.NewFunctionType(semantic.FunctionSignature{
		Return: semantic.Time,
	})
	functionCall := func(args values.Object) (values.Value, error) {
		return values.NewTime(values.ConvertTime(timeValue)), nil
	}
	sideEffect := false

	newNowFunc := values.NewFunction(functionName, functionType, functionCall, sideEffect)

	// Override the default now function with the new one
	itrp.SetOption("now", newNowFunc)

	// Evaluate program
	err := itrp.Eval(semanticProgram, nil)
	if err != nil {
		fmt.Println(err)
	}

	// After evaluating the program, lookup the value of what_time_is_it
	now, _ := itrp.GlobalScope().Lookup("what_time_is_it")

	// what_time_is_it? Why it's ....
	fmt.Printf("The new current time (UTC) is: %v", now)
	// Output: The new current time (UTC) is: 2018-07-13T00:00:00.000000000Z
}
