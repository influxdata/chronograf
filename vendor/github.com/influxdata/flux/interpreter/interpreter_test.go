package interpreter_test

import (
	"errors"
	"regexp"
	"strings"
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/flux/ast"
	"github.com/influxdata/flux/interpreter"
	"github.com/influxdata/flux/parser"
	"github.com/influxdata/flux/semantic"
	"github.com/influxdata/flux/semantic/semantictest"
	"github.com/influxdata/flux/values"
)

var testScope = make(map[string]values.Value)
var optionScope = make(map[string]values.Value)
var optionsObject = values.NewObject()

func addFunc(f *function) {
	testScope[f.name] = f
}

func addOption(name string, opt values.Value) {
	optionScope[name] = opt
}

func init() {
	addFunc(&function{
		name: "fortyTwo",
		t: semantic.NewFunctionPolyType(semantic.FunctionPolySignature{
			Required: nil,
			Return:   semantic.Float,
		}),
		call: func(args values.Object) (values.Value, error) {
			return values.NewFloat(42.0), nil
		},
		hasSideEffect: false,
	})
	addFunc(&function{
		name: "six",
		t: semantic.NewFunctionPolyType(semantic.FunctionPolySignature{
			Required: nil,
			Return:   semantic.Float,
		}),
		call: func(args values.Object) (values.Value, error) {
			return values.NewFloat(6.0), nil
		},
		hasSideEffect: false,
	})
	addFunc(&function{
		name: "nine",
		t: semantic.NewFunctionPolyType(semantic.FunctionPolySignature{
			Required: nil,
			Return:   semantic.Float,
		}),
		call: func(args values.Object) (values.Value, error) {
			return values.NewFloat(9.0), nil
		},
		hasSideEffect: false,
	})
	addFunc(&function{
		name: "fail",
		t: semantic.NewFunctionPolyType(semantic.FunctionPolySignature{
			Required: nil,
			Return:   semantic.Bool,
		}),
		call: func(args values.Object) (values.Value, error) {
			return nil, errors.New("fail")
		},
		hasSideEffect: false,
	})
	addFunc(&function{
		name: "plusOne",
		t: semantic.NewFunctionPolyType(semantic.FunctionPolySignature{
			Parameters:   map[string]semantic.PolyType{"x": semantic.Float},
			Required:     []string{"x"},
			Return:       semantic.Float,
			PipeArgument: "x",
		}),
		call: func(args values.Object) (values.Value, error) {
			v, ok := args.Get("x")
			if !ok {
				return nil, errors.New("missing argument x")
			}
			return values.NewFloat(v.Float() + 1), nil
		},
		hasSideEffect: false,
	})
	addFunc(&function{
		name: "sideEffect",
		t: semantic.NewFunctionPolyType(semantic.FunctionPolySignature{
			Required: nil,
			Return:   semantic.Int,
		}),
		call: func(args values.Object) (values.Value, error) {
			return values.NewInt(0), nil
		},
		hasSideEffect: true,
	})

	optionsObject.Set("name", values.NewString("foo"))
	optionsObject.Set("repeat", values.NewInt(100))

	addOption("task", optionsObject)
}

// TestEval tests whether a program can run to completion or not
func TestEval(t *testing.T) {
	testCases := []struct {
		name    string
		query   string
		wantErr bool
		want    []values.Value
	}{
		{
			name:  "call builtin function",
			query: "six()",
			want: []values.Value{
				values.NewFloat(6.0),
			},
		},
		{
			name:    "call function with fail",
			query:   "fail()",
			wantErr: true,
		},
		{
			name:    "call function with duplicate args",
			query:   "plusOne(x:1.0, x:2.0)",
			wantErr: true,
		},
		{
			name:    "call function with missing args",
			query:   "plusOne()",
			wantErr: true,
		},
		{
			name: "reassign nested scope",
			query: `
			s = () => 6
			s = s()
			`,
			wantErr: true,
		},
		{
			name: "binary expressions",
			query: `
			six = six()
			nine = nine()

			answer = fortyTwo() == six * nine
			`,
			want: []values.Value{
				values.NewFloat(6),
				values.NewFloat(9),
				values.NewBool(false),
			},
		},
		{
			name: "logical expressions short circuit",
			query: `
            six = six()
            nine = nine()

            answer = (not (fortyTwo() == six * nine)) or fail()
			`,
			want: []values.Value{
				values.NewFloat(6.0),
				values.NewFloat(9.0),
				values.NewBool(true),
			},
		},
		{
			name: "function",
			query: `
            plusSix = (r) => r + six()
            plusSix(r:1.0) == 7.0 or fail()
			`,
		},
		{
			name: "function block",
			query: `
            f = (r) => {
                r1 = 1.0 + r
                return (r + r1) / r
            }
            f(r:1.0) == 3.0 or fail()
			`,
		},
		{
			name: "function block polymorphic",
			query: `
            f = (r) => {
                r2 = r * r
                return r2 / r
            }
            f(r:2.0) == 2.0 or fail()
            f(r:2) == 2 or fail()
			`,
		},
		{
			name: "function with default param",
			query: `
            addN = (r,n=4) => r + n
            addN(r:2) == 6 or fail()
            addN(r:3,n:1) == 4 or fail()
			`,
		},
		{
			name: "scope closing",
			query: `
			x = 5
            plusX = (r) => r + x
            plusX(r:2) == 7 or fail()
			`,
		},
		{
			name: "scope closing mutable",
			query: `
			x = 5
            plusX = (r) => r + x
            plusX(r:2) == 7 or fail()
			x = 1
            plusX(r:2) == 3 or fail()
			`,
		},
		{
			name: "nested scope mutations not visible outside",
			query: `
			x = 5
            xinc = () => {
                x = x + 1
                return x
            }
            xinc() == 6 or fail()
            x == 5 or fail()
            x = 1
            xinc() == 2 or fail()
			`,
		},
		{
			name: "return map from func",
			query: `
            toMap = (a,b) => ({
                a: a,
                b: b,
            })
            m = toMap(a:1, b:false)
            m.a == 1 or fail()
            not m.b or fail()
			`,
		},
		{
			name: "pipe expression",
			query: `
			add = (a=<-,b) => a + b
			one = 1
			one |> add(b:2) == 3 or fail()
			`,
		},
		{
			name: "ignore pipe default",
			query: `
			add = (a=<-,b) => a + b
			add(a:1, b:2) == 3 or fail()
			`,
		},
		{
			name: "missing pipe",
			query: `
			add = (a=<-,b) => a + b
			add(b:2) == 3 or fail()
			`,
			wantErr: true,
		},
		{
			name: "pipe expression function",
			query: `
			add = (a=<-,b) => a + b
			six() |> add(b:2.0) == 8.0 or fail()
			`,
		},
		{
			name: "pipe builtin function",
			query: `
			six() |> plusOne() == 7.0 or fail()
			`,
			want: []values.Value{
				values.NewBool(true),
			},
		},
		{
			name: "regex match",
			query: `
			"abba" =~ /^a.*a$/ or fail()
			`,
			want: []values.Value{
				values.NewBool(true),
			},
		},
		{
			name: "regex not match",
			query: `
			"abc" =~ /^a.*a$/ and fail()
			`,
			want: []values.Value{
				values.NewBool(false),
			},
		},
		{
			name: "not regex match",
			query: `
			"abc" !~ /^a.*a$/ or fail()
			`,
			want: []values.Value{
				values.NewBool(true),
			},
		},
		{
			name: "not regex not match",
			query: `
			"abba" !~ /^a.*a$/ and fail()
			`,
			want: []values.Value{
				values.NewBool(false),
			},
		},
		{
			name: "options metadata",
			query: `
			option task = {
				name: "foo",
				repeat: 100,
			}
			task.name == "foo" or fail()
			task.repeat == 100 or fail()
			`,
			want: []values.Value{
				optionsObject,
				values.NewBool(true),
				values.NewBool(true),
			},
		},
		{
			name:  "query with side effects",
			query: `sideEffect() == 0 or fail()`,
			want: []values.Value{
				values.NewInt(0),
				values.NewBool(true),
			},
		},
		{
			name: "array index expression",
			query: `
				a = [1, 2, 3]
				x = a[1]
				x == 2 or fail()
			`,
		},
		{
			name: "array with complex index expression",
			query: `
				f = () => ({l: 0, m: 1, n: 2})
				a = [1, 2, 3]
				x = a[f().l]
				y = a[f().m]
				z = a[f().n]
				x == 1 or fail()
				y == 2 or fail()
				z == 3 or fail()
			`,
		},
		{
			name: "invalid array index expression 1",
			query: `
				a = [1, 2, 3]
				a["b"]
			`,
			wantErr: true,
		},
		{
			name: "invalid array index expression 2",
			query: `
				a = [1, 2, 3]
				f = () => "1"
				a[f()]
			`,
			wantErr: true,
		},
	}

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			program, err := parser.NewAST(tc.query)
			if err != nil {
				t.Fatal(err)
			}
			graph, err := semantic.New(program)
			if err != nil {
				t.Fatal(err)
			}

			// Create new interpreter scope for each test case
			itrp := interpreter.NewInterpreter(optionScope, testScope, interpreter.NewTypeScope())

			err = itrp.Eval(graph, nil)
			if !tc.wantErr && err != nil {
				t.Fatal(err)
			} else if tc.wantErr && err == nil {
				t.Fatal("expected error")
			}

			if tc.want != nil && !cmp.Equal(tc.want, itrp.Package().SideEffects(), semantictest.CmpOptions...) {
				t.Fatalf("unexpected side effect values -want/+got: \n%s", cmp.Diff(tc.want, itrp.Package().SideEffects(), semantictest.CmpOptions...))
			}
		})
	}

}

func TestInterpreter_TypeErrors(t *testing.T) {
	testCases := []struct {
		name    string
		program string
		err     string
	}{
		{
			name: "no pipe arg",
			program: `
				f = () => 0
				g = () => 1 |> f()
				`,
			err: `function does not take a pipe argument`,
		},
		{
			name: "called without pipe args",
			program: `
				f = (x=<-) => x
				g = () => f()
			`,
			err: `function requires a pipe argument`,
		},
		{
			name: "unify with different pipe args 1",
			program: `
				f = (x) => 0 |> x()
				f(x: (v=<-) => v)
				f(x: (w=<-) => w)
			`,
		},
		{
			// This program should type check.
			// arg is any function that takes a pipe argument.
			// arg's pipe parameter can be named anything.
			name: "unify with different pipe args 2",
			program: `
				f = (arg=(x=<-) => x, w) => w |> arg()
				f(arg: (v=<-) => v, w: 0)
			`,
		},
		{
			// This program should not type check.
			// A function that requires a parameter named "arg" cannot unify
			// with a function whose "arg" parameter is also a pipe parameter.
			name: "unify pipe and non-pipe args with same name",
			program: `
				f = (x, y) => x(arg: y)
				f(x: (arg=<-) => arg, y: 0)
			`,
			err: "function does not take a pipe argument",
		},
		{
			// This program should not type check.
			// arg is a function that must take a pipe argument. Even
			// though arg defaults to a function that takes an input
			// param x, if x is not a pipe param then it cannot type check.
			name: "pipe and non-pipe parameters with the same name",
			program: `
				f = (arg=(x=<-) => x) => 0 |> arg()
				g = () => f(arg: (x) => 5 + x)
			`,
			err: `function does not take a parameter "x"`,
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			ast, err := parser.NewAST(tc.program)
			if err != nil {
				t.Fatal(err)
			}
			graph, err := semantic.New(ast)
			if err != nil {
				t.Fatal(err)
			}
			itrp := interpreter.NewInterpreter(nil, nil, interpreter.NewTypeScope())
			if err := itrp.Eval(graph, nil); err == nil {
				if tc.err != "" {
					t.Error("expected type error, but program executed successfully")
				}
			} else {
				if tc.err == "" {
					t.Errorf("expected zero errors, but got %v", err)
				} else if !strings.Contains(err.Error(), "type error") {
					t.Errorf("expected type error, but got the following: %v", err)
				} else if !strings.Contains(err.Error(), tc.err) {
					t.Errorf("wrong error message\n expected error message to contain: %q\n actual error message: %q\n", tc.err, err.Error())
				}
			}
		})
	}
}

func TestInterpreter_MultiPhaseInterpretation(t *testing.T) {
	testCases := []struct {
		name     string
		builtins []string
		program  string
		wantErr  bool
		want     []values.Value
	}{
		{
			// Evaluate two builtin functions in a single phase
			name: "2-phase interpretation",
			builtins: []string{
				`
					_highestOrLowest = (table=<-, reducer) => table |> reducer()
					highestCurrent = (table=<-) => table |> _highestOrLowest(reducer: (table=<-) => table)
				`,
			},
			program: `5 |> highestCurrent()`,
		},
		{
			// Evaluate two builtin functions each in a separate phase
			name: "3-phase interpretation",
			builtins: []string{
				`_highestOrLowest = (table=<-, reducer) => table |> reducer()`,
				`highestCurrent = (table=<-) => table |> _highestOrLowest(reducer: (table=<-) => table)`,
			},
			program: `5 |> highestCurrent()`,
		},
		{
			// Type-check function expression even though it is not called
			// Program is correctly typed so it should not throw any type errors
			name:     "builtin not called - no type error",
			builtins: []string{`_highestOrLowest = (table=<-, reducer) => table |> reducer()`},
			program:  `f = () => 5 |> _highestOrLowest(reducer: (table=<-) => table)`,
		},
		{
			// Type-check function expression even though it is not called
			// Program should not type check due to missing pipe parameter
			name:     "builtin not called - type error",
			builtins: []string{`_highestOrLowest = (table=<-) => table`},
			program:  `f = () => _highestOrLowest()`,
			wantErr:  true,
		},
		{
			name:     "query function with side effects",
			builtins: []string{`foo = () => {sideEffect() return 1}`},
			program:  `foo()`,
			want: []values.Value{
				values.NewInt(0),
				values.NewInt(1),
			},
		},
	}
	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			optionCopy := copyScope(optionScope)
			testScopeCopy := copyScope(testScope)
			types := interpreter.NewTypeScope()
			itrp := interpreter.NewMutableInterpreter(optionCopy, testScopeCopy, types)

			for _, builtin := range tc.builtins {
				if err := eval(itrp, nil, builtin); err != nil {
					t.Fatal("evaluation of builtin failed: ", err)
				}
			}

			itrp = interpreter.NewInterpreter(optionCopy, testScopeCopy, types)

			if err := eval(itrp, nil, tc.program); err != nil && !tc.wantErr {
				t.Fatal("program evaluation failed: ", err)
			} else if err == nil && tc.wantErr {
				t.Fatal("expected to error during program evaluation")
			}

			if tc.want != nil && !cmp.Equal(tc.want, itrp.Package().SideEffects(), semantictest.CmpOptions...) {
				t.Fatalf("unexpected side effect values -want/+got: \n%s", cmp.Diff(tc.want, itrp.Package().SideEffects(), semantictest.CmpOptions...))
			}

		})
	}
}

func copyScope(scope map[string]values.Value) map[string]values.Value {
	cpy := make(map[string]values.Value)
	for k, v := range scope {
		cpy[k] = v
	}
	return cpy
}

func TestResolver(t *testing.T) {
	var got semantic.Expression
	f := &function{
		name: "resolver",
		t: semantic.NewFunctionPolyType(semantic.FunctionPolySignature{
			Parameters: map[string]semantic.PolyType{
				"f": semantic.NewFunctionPolyType(semantic.FunctionPolySignature{
					Parameters: map[string]semantic.PolyType{"r": semantic.Int},
					Required:   []string{"r"},
					Return:     semantic.Int,
				}),
			},
			Required: []string{"f"},
			Return:   semantic.Int,
		}),
		call: func(args values.Object) (values.Value, error) {
			f, ok := args.Get("f")
			if !ok {
				return nil, errors.New("missing argument f")
			}
			resolver, ok := f.Function().(interpreter.Resolver)
			if !ok {
				return nil, errors.New("function cannot be resolved")
			}
			g, err := resolver.Resolve()
			if err != nil {
				return nil, err
			}
			got = g.(semantic.Expression)
			return nil, nil
		},
		hasSideEffect: false,
	}
	scope := make(map[string]values.Value)
	scope[f.name] = f

	program, err := parser.NewAST(`
	x = 42
	resolver(f: (r) => r + x)
`)
	if err != nil {
		t.Fatal(err)
	}

	graph, err := semantic.New(program)
	if err != nil {
		t.Fatal(err)
	}

	itrp := interpreter.NewInterpreter(nil, scope, interpreter.NewTypeScope())

	if err := itrp.Eval(graph, nil); err != nil {
		t.Fatal(err)
	}

	want := &semantic.FunctionExpression{
		Block: &semantic.FunctionBlock{
			Parameters: &semantic.FunctionParameters{
				List: []*semantic.FunctionParameter{{Key: &semantic.Identifier{Name: "r"}}},
			},
			Body: &semantic.BinaryExpression{
				Operator: ast.AdditionOperator,
				Left:     &semantic.IdentifierExpression{Name: "r"},
				Right:    &semantic.IntegerLiteral{Value: 42},
			},
		},
	}
	if !cmp.Equal(want, got, semantictest.CmpOptions...) {
		t.Errorf("unexpected resoved function: -want/+got\n%s", cmp.Diff(want, got, semantictest.CmpOptions...))
	}
}

type function struct {
	name          string
	t             semantic.PolyType
	call          func(args values.Object) (values.Value, error)
	hasSideEffect bool
}

func (f *function) Type() semantic.Type {
	t, _ := f.t.MonoType()
	return t
}
func (f *function) PolyType() semantic.PolyType {
	return f.t
}

func (f *function) Str() string {
	panic(values.UnexpectedKind(semantic.Function, semantic.String))
}
func (f *function) Int() int64 {
	panic(values.UnexpectedKind(semantic.Function, semantic.Int))
}
func (f *function) UInt() uint64 {
	panic(values.UnexpectedKind(semantic.Function, semantic.UInt))
}
func (f *function) Float() float64 {
	panic(values.UnexpectedKind(semantic.Function, semantic.Float))
}
func (f *function) Bool() bool {
	panic(values.UnexpectedKind(semantic.Function, semantic.Bool))
}
func (f *function) Time() values.Time {
	panic(values.UnexpectedKind(semantic.Function, semantic.Time))
}
func (f *function) Duration() values.Duration {
	panic(values.UnexpectedKind(semantic.Function, semantic.Duration))
}
func (f *function) Regexp() *regexp.Regexp {
	panic(values.UnexpectedKind(semantic.Function, semantic.Regexp))
}
func (f *function) Array() values.Array {
	panic(values.UnexpectedKind(semantic.Function, semantic.Array))
}
func (f *function) Object() values.Object {
	panic(values.UnexpectedKind(semantic.Function, semantic.Object))
}
func (f *function) Function() values.Function {
	return f
}
func (f *function) Equal(rhs values.Value) bool {
	if f.Type() != rhs.Type() {
		return false
	}
	v, ok := rhs.(*function)
	return ok && (f == v)
}
func (f *function) HasSideEffect() bool {
	return f.hasSideEffect
}

func (f *function) Call(args values.Object) (values.Value, error) {
	return f.call(args)
}
