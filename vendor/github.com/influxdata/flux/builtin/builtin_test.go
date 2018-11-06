package builtin_test

import (
	"testing"

	_ "github.com/influxdata/flux/builtin"
)

func TestBuiltins(t *testing.T) {
	t.Log("Testing that importing builtins does not panic")
}
