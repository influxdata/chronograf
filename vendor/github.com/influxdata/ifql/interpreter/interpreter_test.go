package interpreter_test

import (
	"errors"
	"fmt"
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/ifql/ast"
	"github.com/influxdata/ifql/interpreter"
	"github.com/influxdata/ifql/parser"
	"github.com/influxdata/ifql/semantic"
	"github.com/influxdata/ifql/semantic/semantictest"
)

var testScope = interpreter.NewScope()
var testDeclarations = make(map[string]semantic.VariableDeclaration)

func init() {
	testScope.Set("fortyTwo", function{
		name: "fortyTwo",
		call: func(args interpreter.Arguments, d interpreter.Domain) (interpreter.Value, error) {
			return interpreter.NewFloatValue(42.0), nil
		},
	})
	testScope.Set("six", function{
		name: "six",
		call: func(args interpreter.Arguments, d interpreter.Domain) (interpreter.Value, error) {
			return interpreter.NewFloatValue(6.0), nil
		},
	})
	testScope.Set("nine", function{
		name: "nine",
		call: func(args interpreter.Arguments, d interpreter.Domain) (interpreter.Value, error) {
			return interpreter.NewFloatValue(9.0), nil
		},
	})
	testScope.Set("fail", function{
		name: "fail",
		call: func(args interpreter.Arguments, d interpreter.Domain) (interpreter.Value, error) {
			return nil, errors.New("fail")
		},
	})
	testScope.Set("plusOne", function{
		name: "plusOne",
		call: func(args interpreter.Arguments, d interpreter.Domain) (interpreter.Value, error) {
			v, err := args.GetRequiredFloat("x")
			if err != nil {
				return nil, err
			}
			return interpreter.NewFloatValue(v + 1), nil
		},
	})
	testDeclarations["plusOne"] = semantic.NewExternalVariableDeclaration(
		"plusOne",
		semantic.NewFunctionType(semantic.FunctionSignature{
			Params:       map[string]semantic.Type{"x": semantic.Float},
			ReturnType:   semantic.Float,
			PipeArgument: "x",
		}),
	)
}

// TestEval tests whether a program can run to completion or not
func TestEval(t *testing.T) {
	testCases := []struct {
		name    string
		query   string
		wantErr bool
	}{
		{
			name:  "call function",
			query: "six()",
		},
		{
			name:    "call function with fail",
			query:   "fail()",
			wantErr: true,
		},
		{
			name: "reassign nested scope",
			query: `
			six = six()
			six()
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
		},
		{
			name: "logical expressions short circuit",
			query: `
            six = six()
            nine = nine()

            answer = (not (fortyTwo() == six * nine)) or fail()
			`,
		},
		{
			name: "arrow function",
			query: `
            plusSix = (r) => r + six()
            plusSix(r:1.0) == 7.0 or fail()
			`,
		},
		{
			name: "arrow function block",
			query: `
            f = (r) => {
                r2 = r * r
                return (r - r2) / r2
            }
            f(r:2.0) == -0.5 or fail()
			`,
		},
		{
			name: "arrow function with default param",
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
		},
		{
			name: "regex match",
			query: `
			"abba" =~ /^a.*a$/ or fail()
			`,
		},
		{
			name: "regex not match",
			query: `
			"abc" =~ /^a.*a$/ and fail()
			`,
		},
		{
			name: "not regex match",
			query: `
			"abc" !~ /^a.*a$/ or fail()
			`,
		},
		{
			name: "not regex not match",
			query: `
			"abba" !~ /^a.*a$/ and fail()
			`,
		},
	}

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			program, err := parser.NewAST(tc.query)
			if err != nil {
				t.Fatal(err)
			}
			graph, err := semantic.New(program, testDeclarations)
			if err != nil {
				t.Fatal(err)
			}

			err = interpreter.Eval(graph, testScope.Nest(), nil)
			if !tc.wantErr && err != nil {
				t.Fatal(err)
			} else if tc.wantErr && err == nil {
				t.Fatal("expected error")
			}
		})
	}

}
func TestFunction_Resolve(t *testing.T) {
	var got *semantic.FunctionExpression
	scope := interpreter.NewScope()
	scope.Set("resolver", function{
		name: "resolver",
		call: func(args interpreter.Arguments, d interpreter.Domain) (interpreter.Value, error) {
			f, err := args.GetRequiredFunction("f")
			if err != nil {
				return nil, err
			}
			got, err = f.Resolve()
			if err != nil {
				return nil, err
			}
			return nil, nil
		},
	})

	program, err := parser.NewAST(`
	x = 42
	resolver(f: (r) => r + x)
`)
	if err != nil {
		t.Fatal(err)
	}

	graph, err := semantic.New(program, testDeclarations)
	if err != nil {
		t.Fatal(err)
	}

	if err := interpreter.Eval(graph, scope, nil); err != nil {
		t.Fatal(err)
	}

	want := &semantic.FunctionExpression{
		Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "r"}}},
		Body: &semantic.BinaryExpression{
			Operator: ast.AdditionOperator,
			Left:     &semantic.IdentifierExpression{Name: "r"},
			Right:    &semantic.IntegerLiteral{Value: 42},
		},
	}
	if !cmp.Equal(want, got, semantictest.CmpOptions...) {
		t.Errorf("unexpected resoved function: -want/+got\n%s", cmp.Diff(want, got, semantictest.CmpOptions...))
	}
}

type function struct {
	name string
	call func(args interpreter.Arguments, d interpreter.Domain) (interpreter.Value, error)
}

func (f function) Type() semantic.Type {
	//TODO(nathanielc): Return a complete function type
	return semantic.Function
}

func (f function) Value() interface{} {
	return f
}
func (f function) Property(name string) (interpreter.Value, error) {
	return nil, fmt.Errorf("property %q does not exist", name)
}

func (f function) Call(args interpreter.Arguments, d interpreter.Domain) (interpreter.Value, error) {
	return f.call(args, d)
}

func (f function) Resolve() (*semantic.FunctionExpression, error) {
	return nil, fmt.Errorf("function %q cannot be resolved", f.name)
}
