package ast_test

import (
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/flux/ast"
	"github.com/influxdata/flux/parser"
	"github.com/pkg/errors"
)

var skip = map[string]string{
	"array_expr":     "without pars -> bad syntax, with pars formatting removes them",
	"conditional":    "how is a conditional expression defined in spec?",
	"multi_var_decl": "how is a variable declaration with multiple declarations represented?",
}

func TestFormat(t *testing.T) {
	testCases := []struct {
		name   string
		script string
	}{
		{
			name: "arrow_fn",
			script: `(r) =>
	(r.user == "user1")`,
		},
		{
			name: "fn_decl",
			script: `add = (a, b) =>
	(a + b)`,
		},
		{
			name:   "fn_call",
			script: `add(a: 1, b: 2)`,
		},
		{
			name:   "multi_var_decl",
			script: `var(a = 1, b = 2, c = 3)`,
		},
		{
			name:   "object",
			script: `{a: 1, b: {c: 11, d: 12}}`,
		},
		{
			name:   "implicit key object literal",
			script: `{a, b, c}`,
		},
		{
			name:   "object with string literal keys",
			script: `{"a": 1, "b": 2}`,
		},
		{
			name:   "object with mixed keys",
			script: `{"a": 1, b: 2}`,
		},
		{
			name:   "member",
			script: `object.property`,
		},
		{
			name: "array",
			script: `a = [1, 2, 3]

a[i]`,
		},
		{
			name:   "array_expr",
			script: `a[(i+1)]`,
		},
		{
			name:   "conditional",
			script: `test?cons:alt`,
		},
		{
			name:   "float",
			script: `0.1`,
		},
		{
			name:   "duration",
			script: `365d`,
		},
		{
			name:   "duration_multiple",
			script: `1d1m1s`,
		},
		{
			name:   "time",
			script: `2018-05-22T19:53:00Z`,
		},
		{
			name:   "regexp",
			script: `/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/`,
		},
		{
			name:   "regexp_escape",
			script: `/^http:\/\/\w+\.com$/`,
		},
		{
			name:   "return",
			script: `return 42`,
		},
		{
			name:   "option",
			script: `option foo = {a: 1}`,
		},
		{
			name: "nil_value_as_default",
			script: `foo = (arg=[]) =>
	(1)`,
		},
		{
			name: "non_nil_value_as_default",
			script: `foo = (arg=[1, 2]) =>
	(1)`,
		},
		{
			name: "block",
			script: `foo = () => {
	foo(f: 1)
	1 + 1
}`,
		},
		{
			name:   "string",
			script: `"foo"`,
		},
		{
			name: "string multiline",
			script: `"this is
a string
with multiple lines"`,
		},
		{
			name:   "string with escape",
			script: `"foo \\ \" \r\n"`,
		},
		{
			name:   "string with byte value",
			script: `"\xe6\x97\xa5\xe6\x9c\xac\xe8\xaa\x9e"`,
		},
		{
			name:   "package",
			script: `package foo`,
		},
		{
			name: "imports",
			script: `import "path/foo"
import bar "path/bar"`,
		},
		{
			name: "program_no_package",
			script: `import foo "path/foo"

foo.from(bucket: "testdb")
	|> range(start: 2018-05-20T19:53:26Z)`,
		},
		{
			name: "program_no_import",
			script: `package foo

from(bucket: "testdb")
	|> range(start: 2018-05-20T19:53:26Z)`,
		},
		{
			name: "program_package_import",
			script: `package foo

import "path/foo"
import bar "path/bar"

from(bucket: "testdb")
	|> range(start: 2018-05-20T19:53:26Z)`,
		},
		{
			name: "simple",
			script: `from(bucket: "testdb")
	|> range(start: 2018-05-20T19:53:26Z)
	|> filter(fn: (r) =>
		(r.name =~ /.*0/))
	|> group(by: ["_measurement", "_start"])
	|> map(fn: (r) =>
		({_time: r._time, io_time: r._value}))`,
		},
		{
			name: "medium",
			script: `from(bucket: "testdb")
	|> range(start: 2018-05-20T19:53:26Z)
	|> filter(fn: (r) =>
		(r.name =~ /.*0/))
	|> group(by: ["_measurement", "_start"])
	|> map(fn: (r) =>
		({_time: r._time, io_time: r._value}))`,
		},
		{
			name: "complex",
			script: `left = from(bucket: "test")
	|> range(start: 2018-05-22T19:53:00Z, stop: 2018-05-22T19:55:00Z)
	|> drop(columns: ["_start", "_stop"])
	|> filter(fn: (r) =>
		(r.user == "user1"))
	|> group(by: ["user"])
right = from(bucket: "test")
	|> range(start: 2018-05-22T19:53:00Z, stop: 2018-05-22T19:55:00Z)
	|> drop(columns: ["_start", "_stop"])
	|> filter(fn: (r) =>
		(r.user == "user2"))
	|> group(by: ["_measurement"])

join(tables: {left: left, right: right}, on: ["_time", "_measurement"])`,
		},
		{
			name: "option",
			script: `option task = {
	name: "foo",
	every: 1h,
	delay: 10m,
	cron: "02***",
	retry: 5,
}

from(bucket: "test")
	|> range(start: 2018-05-22T19:53:26Z)
	|> window(every: task.every)
	|> group(by: ["_field", "host"])
	|> sum()
	|> to(bucket: "test", tagColumns: ["host", "_field"])`,
		},
		{
			name: "functions",
			script: `foo = () =>
	(from(bucket: "testdb"))
bar = (x=<-) =>
	(x
		|> filter(fn: (r) =>
			(r.name =~ /.*0/)))
baz = (y=<-) =>
	(y
		|> map(fn: (r) =>
			({_time: r._time, io_time: r._value})))

foo()
	|> bar()
	|> baz()`,
		},
		{
			name: "multi_indent",
			script: `_sortLimit = (n, desc, columns=["_value"], tables=<-) =>
	(tables
		|> sort(columns: columns, desc: desc)
		|> limit(n: n))
_highestOrLowest = (n, _sortLimit, reducer, columns=["_value"], by, tables=<-) =>
	(tables
		|> group(by: by)
		|> reducer()
		|> group(none: true)
		|> _sortLimit(n: n, columns: columns))
highestAverage = (n, columns=["_value"], by, tables=<-) =>
	(tables
		|> _highestOrLowest(
			n: n,
			columns: columns,
			by: by,
			reducer: (tables=<-) =>
				(tables
					|> mean(columns: [columns[0]])),
			_sortLimit: top,
		))`,
		},
	}

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			if reason, ok := skip[tc.name]; ok {
				t.Skip(reason)
			}

			originalProgram, err := parser.NewAST(tc.script)
			if err != nil {
				t.Fatal(errors.Wrapf(err, "original program has bad syntax:\n%s", tc.script))
			}

			stringResult := ast.Format(originalProgram)

			if tc.script != stringResult {
				t.Errorf("unexpected output: -want/+got:\n %s", cmp.Diff(tc.script, stringResult))
			}
		})
	}
}
func TestFormat_Raw(t *testing.T) {
	testCases := []struct {
		name   string
		node   ast.Node
		script string
	}{
		{
			name: "string escape",
			node: &ast.StringLiteral{
				Value: "foo \\ \" \r\n",
			},
			script: "\"foo \\\\ \\\" \r\n\"",
		},
	}
	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			got := ast.Format(tc.node)
			if tc.script != got {
				t.Errorf("unexpected output: -want/+got:\n %s", cmp.Diff(tc.script, got))
			}
		})
	}
}
