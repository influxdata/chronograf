package complete_test

import (
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/flux/complete"
	"github.com/influxdata/flux/interpreter"
	"github.com/influxdata/flux/semantic"
	"github.com/influxdata/flux/values"
)

func TestNames(t *testing.T) {
	s := interpreter.NewScope()
	var v values.Value
	s.Set("boom", v)
	s.Set("tick", v)

	c := complete.NewCompleter(s)

	results := c.Names()
	expected := []string{
		"boom",
		"tick",
	}

	if !cmp.Equal(results, expected) {
		t.Error(cmp.Diff(results, expected), "unexpected names from declarations")
	}
}

func TestValue(t *testing.T) {
	name := "foo"
	scope := interpreter.NewScope()
	value := values.NewInt(5)
	scope.Set(name, value)

	v, _ := complete.NewCompleter(scope).Value(name)

	if !cmp.Equal(value, v) {
		t.Error(cmp.Diff(value, v), "unexpected value for name")
	}
}

func TestFunctionNames(t *testing.T) {
	boom := values.NewFunction(
		"boom",
		semantic.NewFunctionType(semantic.FunctionSignature{}),
		func(values.Object) (values.Value, error) { return nil, nil },
		false,
	)
	s := interpreter.NewScope()
	s.Set("boom", boom)
	c := complete.NewCompleter(s)
	results := c.FunctionNames()

	expected := []string{
		"boom",
	}

	if !cmp.Equal(results, expected) {
		t.Error(cmp.Diff(results, expected), "unexpected function names")
	}
}

func TestFunctionSuggestion(t *testing.T) {
	name := "bar"
	bar := values.NewFunction(
		name,
		semantic.NewFunctionType(semantic.FunctionSignature{
			Parameters: map[string]semantic.Type{
				"start": semantic.Time,
				"stop":  semantic.Time,
			},
		}),
		func(values.Object) (values.Value, error) { return nil, nil },
		false,
	)
	s := interpreter.NewScope()
	s.Set(name, bar)
	result, _ := complete.NewCompleter(s).FunctionSuggestion(name)

	expected := complete.FunctionSuggestion{
		Params: map[string]string{
			"start": semantic.Time.String(),
			"stop":  semantic.Time.String(),
		},
	}

	if !cmp.Equal(result, expected) {
		t.Error(cmp.Diff(result, expected), "does not match expected suggestion")
	}
}
