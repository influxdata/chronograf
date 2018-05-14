package executetest

import (
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/ifql/query/execute"
)

func RowSelectorFuncTestHelper(t *testing.T, selector execute.RowSelector, data execute.Block, want []execute.Row) {
	t.Helper()

	s := selector.NewFloatSelector()
	values, err := data.Values()
	if err != nil {
		t.Fatal(err)
	}
	values.DoFloat(s.DoFloat)

	got := s.Rows()

	if !cmp.Equal(want, got) {
		t.Errorf("unexpected value -want/+got\n%s", cmp.Diff(want, got))
	}
}

var rows []execute.Row

func RowSelectorFuncBenchmarkHelper(b *testing.B, selector execute.RowSelector, data execute.Block) {
	b.Helper()
	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		s := selector.NewFloatSelector()
		values, err := data.Values()
		if err != nil {
			b.Fatal(err)
		}
		values.DoFloat(s.DoFloat)
		rows = s.Rows()
	}
}

func IndexSelectorFuncTestHelper(t *testing.T, selector execute.IndexSelector, data execute.Block, want [][]int) {
	t.Helper()

	var got [][]int
	s := selector.NewFloatSelector()
	values, err := data.Values()
	if err != nil {
		t.Fatal(err)
	}
	values.DoFloat(func(vs []float64, rr execute.RowReader) {
		var cpy []int
		selected := s.DoFloat(vs)
		t.Log(selected)
		if len(selected) > 0 {
			cpy = make([]int, len(selected))
			copy(cpy, selected)
		}
		got = append(got, cpy)
	})

	if !cmp.Equal(want, got) {
		t.Errorf("unexpected value -want/+got\n%s", cmp.Diff(want, got))
	}
}

func IndexSelectorFuncBenchmarkHelper(b *testing.B, selector execute.IndexSelector, data execute.Block) {
	b.Helper()
	b.ResetTimer()
	var got [][]int
	for n := 0; n < b.N; n++ {
		s := selector.NewFloatSelector()
		values, err := data.Values()
		if err != nil {
			b.Fatal(err)
		}
		values.DoFloat(func(vs []float64, rr execute.RowReader) {
			got = append(got, s.DoFloat(vs))
		})
	}
}
