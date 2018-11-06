package executetest

import (
	"sort"
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"
	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
)

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

	if !cmp.Equal(want, got, cmpopts.EquateNaNs()) {
		t.Errorf("unexpected tables -want/+got\n%s", cmp.Diff(want, got))
	}
}
