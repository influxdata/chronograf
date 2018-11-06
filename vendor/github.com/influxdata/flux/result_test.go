package flux_test

import (
	"fmt"
	"testing"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/semantic"
)

// TestColumnType tests that the column type gets returned from a semantic type correctly.
func TestColumnType(t *testing.T) {
	for _, tt := range []struct {
		typ  semantic.Type
		want flux.ColType
	}{
		{typ: semantic.String, want: flux.TString},
		{typ: semantic.Int, want: flux.TInt},
		{typ: semantic.UInt, want: flux.TUInt},
		{typ: semantic.Float, want: flux.TFloat},
		{typ: semantic.Bool, want: flux.TBool},
		{typ: semantic.Time, want: flux.TTime},
		{typ: semantic.Duration, want: flux.TInvalid},
		{typ: semantic.Regexp, want: flux.TInvalid},
		{typ: semantic.NewArrayType(semantic.String), want: flux.TInvalid},
		{typ: semantic.NewObjectType(map[string]semantic.Type{
			"foo": semantic.String,
		}), want: flux.TInvalid},
		{typ: semantic.NewFunctionType(semantic.FunctionSignature{}), want: flux.TInvalid},
	} {
		t.Run(fmt.Sprint(tt.typ), func(t *testing.T) {
			if want, got := tt.want, flux.ColumnType(tt.typ); want != got {
				t.Fatalf("unexpected type -want/+got\n\t- %s\n\t+ %s", want, got)
			}
		})
	}
}
