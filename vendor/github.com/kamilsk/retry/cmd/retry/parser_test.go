package main

import (
	"flag"
	"io"
	"io/ioutil"
	"testing"

	"github.com/kamilsk/retry/strategy"
	"github.com/stretchr/testify/assert"
)

func Test_parse(t *testing.T) {
	before := usage
	usage = func(output io.Writer, metadata Metadata) func() { return func() {} }
	defer func() { usage = before }()

	for _, tc := range []struct {
		name   string
		before func()
		do     func() (obtained, expected string)
		after  func()
	}{
		{
			name: "help call",
			do: func() (obtained, expected string) {
				expected = flag.ErrHelp.Error()
				if _, err := parse(ioutil.Discard, "test", "-h"); err != nil {
					obtained = err.Error()
				}
				return
			},
		},
		{
			name: "unsupported cursor",
			before: func() {
				var unsupported int
				compliance["unsupported"] = struct {
					cursor  interface{}
					usage   string
					handler func(*flag.Flag) (strategy.Strategy, error)
				}{
					cursor: &unsupported,
				}
			},
			do: func() (obtained, expected string) {
				expected = "init: an unsupported cursor type *int"
				if _, err := parse(ioutil.Discard, "test"); err != nil {
					obtained = err.Error()
				}
				return
			},
			after: func() {
				delete(compliance, "unsupported")
			},
		},
		{
			name: "invalid arguments",
			do: func() (obtained, expected string) {
				expected = "parse: flag provided but not defined: -test"
				if _, err := parse(ioutil.Discard, "test", "-test=invalid"); err != nil {
					obtained = err.Error()
				}
				return
			},
		},
		{
			name: "invalid timeout",
			do: func() (obtained, expected string) {
				expected = `parse: invalid value "Timeout" for flag -timeout: time: invalid duration Timeout`
				if _, err := parse(ioutil.Discard, "test", "-timeout=Timeout"); err != nil {
					obtained = err.Error()
				}
				return
			},
		},
		{
			name: "invalid strategy",
			do: func() (obtained, expected string) {
				expected = "parse: handle: time: invalid duration duration"
				if _, err := parse(ioutil.Discard, "test", "-delay=duration"); err != nil {
					obtained = err.Error()
				}
				return
			},
		},
		{
			name: "nothing to do",
			do: func() (obtained, expected string) {
				expected = "please provide a command to retry"
				if _, err := parse(ioutil.Discard, "test", "-delay=1s"); err != nil {
					obtained = err.Error()
				}
				return
			},
		},
		{
			name: "success",
			do: func() (obtained, expected string) {
				expected = ""
				if _, err := parse(ioutil.Discard, "test", "-delay=1s", "--", "whoami"); err != nil {
					obtained = err.Error()
				}
				return
			},
		},
	} {
		if tc.before != nil {
			tc.before()
		}

		obtained, expected := tc.do()
		assert.Equal(t, expected, obtained)

		if tc.after != nil {
			tc.after()
		}
	}
}

func Test_handle(t *testing.T) {
	for i, tc := range []struct {
		name     string
		flags    []*flag.Flag
		error    string
		expected int
	}{
		{
			name:     "empty list",
			flags:    nil,
			expected: 0,
		},
	} {
		strategies, err := handle(tc.flags)

		switch {
		case tc.error == "" && err != nil:
			t.Errorf("unexpected error %q at {%s:%d} test case", err, tc.name, i)
		case tc.error != "" && err == nil:
			t.Errorf("expected error %q, obtained nil at {%s:%d} test case", tc.error, tc.name, i)
		case tc.error != "" && err != nil && tc.error != err.Error():
			t.Errorf("expected error %q, obtained %q at {%s:%d} test case", tc.error, err, tc.name, i)
		case len(strategies) != tc.expected:
			t.Errorf("expected %d strategies, obtained %d", tc.expected, len(strategies))
		}
	}
}

func Test_parseAlgorithm(t *testing.T) {
	for i, tc := range []struct {
		name  string
		args  string
		error string
	}{
		{
			name:  "not matched",
			args:  "~",
			error: "parse algorithm: invalid argument ~",
		},
		{
			name:  "unknown algorithm",
			args:  "x",
			error: "parse algorithm: unknown algorithm x",
		},
	} {
		alg, err := parseAlgorithm(tc.args)

		switch {
		case tc.error == "" && err != nil:
			t.Errorf("unexpected error %q at {%s:%d} test case", err, tc.name, i)
		case tc.error != "" && err == nil:
			t.Errorf("expected error %q, obtained nil at {%s:%d} test case", tc.error, tc.name, i)
		case tc.error != "" && err != nil:
			if tc.error != err.Error() {
				t.Errorf("expected error %q, obtained %q at {%s:%d} test case", tc.error, err, tc.name, i)
			}
		case alg == nil:
			t.Error("expected correct algorithm, obtained nil")
		}
	}
}

func Test_parseTransform(t *testing.T) {
	for i, tc := range []struct {
		name  string
		args  string
		error string
	}{
		{
			name:  "not matched",
			args:  "~",
			error: "parse transformation: invalid argument ~",
		},
		{
			name:  "unknown transformation",
			args:  "x",
			error: "parse transformation: unknown transformation x",
		},
	} {
		tr, err := parseTransform(tc.args)

		switch {
		case tc.error == "" && err != nil:
			t.Errorf("unexpected error %q at {%s:%d} test case", err, tc.name, i)
		case tc.error != "" && err == nil:
			t.Errorf("expected error %q, obtained nil at {%s:%d} test case", tc.error, tc.name, i)
		case tc.error != "" && err != nil:
			if tc.error != err.Error() {
				t.Errorf("expected error %q, obtained %q at {%s:%d} test case", tc.error, err, tc.name, i)
			}
		case tr == nil:
			t.Error("expected correct transformation, obtained nil")
		}
	}
}
