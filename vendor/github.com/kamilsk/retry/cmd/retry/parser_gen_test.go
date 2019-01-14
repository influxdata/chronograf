package main

import (
	"bytes"
	"flag"
	"io/ioutil"
	"testing"
)

var update = flag.Bool("update", false, "update .golden files")

type value string

func (v value) String() string {
	return string(v)
}

func (v value) Set(n string) error {
	p := &v
	*p = value(n)
	return nil
}

func Test_handle_generated(t *testing.T) {
	for i, tc := range []struct {
		name     string
		flags    []*flag.Flag
		error    string
		expected int
	}{
		{
			name: "infinite",
			flags: []*flag.Flag{
				{
					Name: "infinite",
				},
			},
			expected: 1,
		},
		{
			name: "limit",
			flags: []*flag.Flag{
				{
					Name:  "limit",
					Value: value("1"),
				},
			},
			expected: 1,
		},
		{
			name: "limit: invalid attemptLimit",
			flags: []*flag.Flag{
				{
					Name:  "limit",
					Value: value("attemptLimit"),
				},
			},
			error: `handle: strconv.ParseUint: parsing "attemptLimit": invalid syntax`,
		},
		{
			name: "delay",
			flags: []*flag.Flag{
				{
					Name:  "delay",
					Value: value("1s"),
				},
			},
			expected: 1,
		},
		{
			name: "delay: invalid duration",
			flags: []*flag.Flag{
				{
					Name:  "delay",
					Value: value("duration"),
				},
			},
			error: "handle: time: invalid duration duration",
		},
		{
			name: "wait",
			flags: []*flag.Flag{
				{
					Name:  "wait",
					Value: value("1s,1s,1s,1s,1s"),
				},
			},
			expected: 1,
		},
		{
			name: "wait: invalid duration",
			flags: []*flag.Flag{
				{
					Name:  "wait",
					Value: value("1s,1s,duration,1s,1s"),
				},
			},
			error: "handle: time: invalid duration duration",
		},
		{
			name: "backoff",
			flags: []*flag.Flag{
				{
					Name:  "backoff",
					Value: value("inc:1s,1s"),
				},
			},
			expected: 1,
		},
		{
			name: "backoff: unknown algorithm",
			flags: []*flag.Flag{
				{
					Name:  "backoff",
					Value: value("x"),
				},
			},
			error: "handle: parse algorithm: unknown algorithm x",
		},
		{
			name: "backoff with jitter",
			flags: []*flag.Flag{
				{
					Name:  "tbackoff",
					Value: value("inc:1s,1s full"),
				},
			},
			expected: 1,
		},
		{
			name: "backoff with jitter: invalid argument count",
			flags: []*flag.Flag{
				{
					Name:  "tbackoff",
					Value: value("inc:1s,1s"),
				},
			},
			error: "handle: invalid argument count",
		},
		{
			name: "backoff with jitter: unknown algorithm",
			flags: []*flag.Flag{
				{
					Name:  "tbackoff",
					Value: value("x full"),
				},
			},
			error: "handle: parse algorithm: unknown algorithm x",
		},
		{
			name: "backoff with jitter: unknown transformation",
			flags: []*flag.Flag{
				{
					Name:  "tbackoff",
					Value: value("inc:1s,1s x"),
				},
			},
			error: "handle: parse transformation: unknown transformation x",
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

func Test_parseAlgorithm_generated(t *testing.T) {
	for i, tc := range []struct {
		name  string
		args  string
		error string
	}{
		{
			name: "incremental",
			args: "inc:1s,1s",
		},
		{
			name:  "incremental: invalid argument count",
			args:  "inc:1s",
			error: "invalid argument count",
		},
		{
			name:  "incremental: invalid initial",
			args:  "inc:initial,1s",
			error: "time: invalid duration initial",
		},
		{
			name:  "incremental: invalid increment",
			args:  "inc:1s,increment",
			error: "time: invalid duration increment",
		},
		{
			name: "linear",
			args: "lin:1s",
		},
		{
			name:  "linear: invalid factor",
			args:  "lin:factor",
			error: "time: invalid duration factor",
		},
		{
			name: "exponential",
			args: "exp:1s,1.0",
		},
		{
			name:  "exponential: invalid argument count",
			args:  "exp:1s",
			error: "invalid argument count",
		},
		{
			name:  "exponential: invalid factor",
			args:  "exp:factor,1.0",
			error: "time: invalid duration factor",
		},
		{
			name:  "exponential: invalid base",
			args:  "exp:1s,base",
			error: `strconv.ParseFloat: parsing "base": invalid syntax`,
		},
		{
			name: "binary exponential",
			args: "binexp:1s",
		},
		{
			name:  "binary exponential: invalid factor",
			args:  "binexp:factor",
			error: "time: invalid duration factor",
		},
		{
			name: "fibonacci",
			args: "fib:1s",
		},
		{
			name:  "fibonacci: invalid factor",
			args:  "fib:factor",
			error: "time: invalid duration factor",
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

func Test_parseTransform_generated(t *testing.T) {
	for i, tc := range []struct {
		name  string
		args  string
		error string
	}{
		{
			name: "full",
			args: "full",
		},
		{
			name: "equal",
			args: "equal",
		},
		{
			name: "deviation",
			args: "dev:1.0",
		},
		{
			name:  "deviation: invalid factor",
			args:  "dev:factor",
			error: `strconv.ParseFloat: parsing "factor": invalid syntax`,
		},
		{
			name: "normal distribution",
			args: "ndist:1.0",
		},
		{
			name:  "normal distribution: invalid standardDeviation",
			args:  "ndist:standardDeviation",
			error: `strconv.ParseFloat: parsing "standardDeviation": invalid syntax`,
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

func Test_usage(t *testing.T) {
	buf := bytes.NewBuffer(nil)
	golden := "fixtures/usage.golden"

	{
		usage(buf, Metadata{
			BinName: "test",
			Commit:  commit, BuildDate: date, Version: version,
			Compiler: "test", Platform: "test", GoVersion: "test",
		})()
	}

	actual := buf.Bytes()

	if *update {
		if err := ioutil.WriteFile(golden, actual, 0644); err != nil {
			t.Error(err)
		}
	}

	expected, err := ioutil.ReadFile(golden)
	if err != nil {
		t.Error(err)
	}

	if !bytes.Equal(actual, expected) {
		t.Error("unexpected usage message")
	}
}
