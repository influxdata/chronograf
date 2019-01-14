package executetest

import (
	"math"
	"sort"
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"
	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"gonum.org/v1/gonum/floats"
)

// Two floating point values are considered
// equal if they are within tol of each other.
const tol float64 = 1e-25

// The maximum number of floating point values that are allowed
// to lie between two float64s and still be considered equal.
const ulp uint = 2

// Comparison options for floating point values.
// NaNs are considered equal, and float64s must
// be sufficiently close to be considered equal.
var floatOptions = cmp.Options{
	cmpopts.EquateNaNs(),
	cmp.FilterValues(func(x, y float64) bool {
		return !math.IsNaN(x) && !math.IsNaN(y)
	}, cmp.Comparer(func(x, y float64) bool {
		// If sufficiently close, then move on.
		// This avoids situations close to zero.
		if floats.EqualWithinAbs(x, y, tol) {
			return true
		}
		// If not sufficiently close, both floats
		// must be within ulp steps of each other.
		if !floats.EqualWithinULP(x, y, ulp) {
			return false
		}
		return true
	})),
}

func ProcessTestHelper(
	t *testing.T,
	data []flux.Table,
	want []*Table,
	wantErr error,
	create func(d execute.Dataset, c execute.TableBuilderCache) execute.Transformation,
) {
	t.Helper()

	d := NewDataset(RandomDatasetID())
	c := execute.NewTableBuilderCache(UnlimitedAllocator)
	c.SetTriggerSpec(execute.DefaultTriggerSpec)

	tx := create(d, c)

	parentID := RandomDatasetID()
	for _, b := range data {
		if err := tx.Process(parentID, b); err != nil {
			if wantErr != nil && wantErr.Error() != err.Error() {
				t.Fatalf("unexpected error -want/+got\n%s", cmp.Diff(wantErr.Error(), err.Error()))
			} else if wantErr == nil {
				t.Fatalf("expected no error, got %s", err.Error())
			}
			return
		} else if wantErr != nil {
			t.Fatalf("expected error %s, got none", wantErr.Error())
		}
	}

	got, err := TablesFromCache(c)
	if err != nil {
		t.Fatal(err)
	}

	NormalizeTables(got)
	NormalizeTables(want)

	sort.Sort(SortedTables(got))
	sort.Sort(SortedTables(want))

	if !cmp.Equal(want, got, floatOptions) {
		t.Errorf("unexpected tables -want/+got\n%s", cmp.Diff(want, got))
	}
}
