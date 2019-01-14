package arrow_test

import (
	"testing"

	"github.com/apache/arrow/go/arrow/array"
	"github.com/apache/arrow/go/arrow/math"
	arrowmemory "github.com/apache/arrow/go/arrow/memory"
	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/flux/arrow"
	"github.com/influxdata/flux/memory"
)

func TestSum_Float64_Empty(t *testing.T) {
	t.Skip("https://issues.apache.org/jira/browse/ARROW-4081")

	b := array.NewFloat64Builder(arrowmemory.NewGoAllocator())
	vs := b.NewFloat64Array()
	b.Release()

	defer func() {
		if err := recover(); err != nil {
			t.Errorf("unexpected panic: %s", err)
		}
	}()

	if got, want := math.Float64.Sum(vs), float64(0); got != want {
		t.Errorf("unexpected sum: %v != %v", got, want)
	}
}

func TestSum_Int64_Empty(t *testing.T) {
	t.Skip("https://issues.apache.org/jira/browse/ARROW-4081")

	b := array.NewInt64Builder(arrowmemory.NewGoAllocator())
	vs := b.NewInt64Array()
	b.Release()

	defer func() {
		if err := recover(); err != nil {
			t.Errorf("unexpected panic: %s", err)
		}
	}()

	if got, want := math.Int64.Sum(vs), int64(0); got != want {
		t.Errorf("unexpected sum: %v != %v", got, want)
	}
}

func TestSum_Uint64_Empty(t *testing.T) {
	t.Skip("https://issues.apache.org/jira/browse/ARROW-4081")

	b := array.NewUint64Builder(arrowmemory.NewGoAllocator())
	vs := b.NewUint64Array()
	b.Release()

	defer func() {
		if err := recover(); err != nil {
			t.Errorf("unexpected panic: %s", err)
		}
	}()

	if got, want := math.Uint64.Sum(vs), uint64(0); got != want {
		t.Errorf("unexpected sum: %v != %v", got, want)
	}
}

func TestSlice_Int64(t *testing.T) {
	values := []int64{-5, -4, -3, -2, -1, 0, 1, 2, 3, 4}
	alloc := &memory.Allocator{}
	arr := arrow.NewInt(values, alloc)
	defer arr.Release()

	if got, want := arr.Len(), len(values); got != want {
		t.Fatalf("got=%d, want=%d", got, want)
	}

	vs := arr.Int64Values()

	if !cmp.Equal(values, vs) {
		t.Fatalf("unexpected array -want/+got\n%s", cmp.Diff(values, vs))
	}

	tests := []struct {
		interval [2]int
		panic    bool
		want     []int64
	}{
		{
			interval: [2]int{0, 0},
			want:     []int64{},
		},
		{
			interval: [2]int{0, 5},
			want:     []int64{-5, -4, -3, -2, -1},
		},
		{
			interval: [2]int{0, 10},
			want:     []int64{-5, -4, -3, -2, -1, 0, 1, 2, 3, 4},
		},
		{
			interval: [2]int{5, 10},
			want:     []int64{0, 1, 2, 3, 4},
		},
		{
			interval: [2]int{10, 10},
			want:     []int64{},
		},
		{
			interval: [2]int{2, 7},
			want:     []int64{-3, -2, -1, 0, 1},
		},
		{
			interval: [2]int{-1, 1},
			panic:    true,
		},
		{
			interval: [2]int{9, 11},
			panic:    true,
		},
	}
	for _, tc := range tests {
		tc := tc
		t.Run("", func(t *testing.T) {

			if tc.panic {
				defer func() {
					if e := recover(); e == nil {
						t.Fatalf("this should have panicked, but did not")
					}
				}()
			}

			slice := arrow.IntSlice(arr, tc.interval[0], tc.interval[1])
			defer slice.Release()

			if got, want := slice.Len(), len(tc.want); got != want {
				t.Fatalf("got=%d, want=%d", got, want)
			}

			vs := slice.Int64Values()

			if !cmp.Equal(tc.want, vs) {
				t.Errorf("unexpected slice -want/+got\n%s", cmp.Diff(tc.want, vs))
			}
		})
	}
}

func TestSlice_OutOfBounds_Int64(t *testing.T) {
	values := []int64{-5, -4, -3, -2, -1, 0, 1, 2, 3, 4}
	alloc := &memory.Allocator{}
	arr := arrow.NewInt(values, alloc)
	defer arr.Release()

	slice := arrow.IntSlice(arr, 3, 8)
	defer slice.Release()

	tests := []struct {
		index int
		panic bool
	}{
		{
			index: -1,
			panic: true,
		},
		{
			index: 5,
			panic: true,
		},
		{
			index: 0,
			panic: false,
		},
		{
			index: 4,
			panic: false,
		},
	}

	for _, tc := range tests {
		t.Run("", func(t *testing.T) {

			if tc.panic {
				defer func() {
					if e := recover(); e == nil {
						t.Fatalf("this should have panicked, but did not")
					}
				}()
			} else {
				defer func() {
					if e := recover(); e != nil {
						t.Fatalf("unexpected panic: %v", e)
					}
				}()
			}

			slice.Value(tc.index)
		})
	}
}

func TestSlice_Uint64(t *testing.T) {
	values := []uint64{0, 1, 2, 3, 4, 5, 6, 7, 8, 9}
	alloc := &memory.Allocator{}
	arr := arrow.NewUint(values, alloc)
	defer arr.Release()

	if got, want := arr.Len(), len(values); got != want {
		t.Fatalf("got=%d, want=%d", got, want)
	}

	vs := arr.Uint64Values()

	if !cmp.Equal(values, vs) {
		t.Fatalf("unexpected array -want/+got\n%s", cmp.Diff(values, vs))
	}

	tests := []struct {
		interval [2]int
		panic    bool
		want     []uint64
	}{
		{
			interval: [2]int{0, 0},
			want:     []uint64{},
		},
		{
			interval: [2]int{0, 5},
			want:     []uint64{0, 1, 2, 3, 4},
		},
		{
			interval: [2]int{0, 10},
			want:     []uint64{0, 1, 2, 3, 4, 5, 6, 7, 8, 9},
		},
		{
			interval: [2]int{5, 10},
			want:     []uint64{5, 6, 7, 8, 9},
		},
		{
			interval: [2]int{10, 10},
			want:     []uint64{},
		},
		{
			interval: [2]int{2, 7},
			want:     []uint64{2, 3, 4, 5, 6},
		},
		{
			interval: [2]int{-1, 1},
			panic:    true,
		},
		{
			interval: [2]int{9, 11},
			panic:    true,
		},
	}
	for _, tc := range tests {
		tc := tc
		t.Run("", func(t *testing.T) {

			if tc.panic {
				defer func() {
					if e := recover(); e == nil {
						t.Fatalf("this should have panicked, but did not")
					}
				}()
			}

			slice := arrow.UintSlice(arr, tc.interval[0], tc.interval[1])
			defer slice.Release()

			if got, want := slice.Len(), len(tc.want); got != want {
				t.Fatalf("got=%d, want=%d", got, want)
			}

			vs := slice.Uint64Values()

			if !cmp.Equal(tc.want, vs) {
				t.Errorf("unexpected slice -want/+got\n%s", cmp.Diff(tc.want, vs))
			}
		})
	}
}

func TestSlice_OutOfBounds_Uint64(t *testing.T) {
	values := []uint64{0, 1, 2, 3, 4, 5, 6, 7, 8, 9}
	alloc := &memory.Allocator{}
	arr := arrow.NewUint(values, alloc)
	defer arr.Release()

	slice := arrow.UintSlice(arr, 3, 8)
	defer slice.Release()

	tests := []struct {
		index int
		panic bool
	}{
		{
			index: -1,
			panic: true,
		},
		{
			index: 5,
			panic: true,
		},
		{
			index: 0,
			panic: false,
		},
		{
			index: 4,
			panic: false,
		},
	}

	for _, tc := range tests {
		t.Run("", func(t *testing.T) {

			if tc.panic {
				defer func() {
					if e := recover(); e == nil {
						t.Fatalf("this should have panicked, but did not")
					}
				}()
			} else {
				defer func() {
					if e := recover(); e != nil {
						t.Fatalf("unexpected panic: %v", e)
					}
				}()
			}

			slice.Value(tc.index)
		})
	}
}

func TestSlice_Float64(t *testing.T) {
	values := []float64{0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9}
	alloc := &memory.Allocator{}
	arr := arrow.NewFloat(values, alloc)
	defer arr.Release()

	if got, want := arr.Len(), len(values); got != want {
		t.Fatalf("got=%d, want=%d", got, want)
	}

	vs := arr.Float64Values()

	if !cmp.Equal(values, vs) {
		t.Fatalf("unexpected array -want/+got\n%s", cmp.Diff(values, vs))
	}

	tests := []struct {
		interval [2]int
		panic    bool
		want     []float64
	}{
		{
			interval: [2]int{0, 0},
			want:     []float64{},
		},
		{
			interval: [2]int{0, 5},
			want:     []float64{0.0, 0.1, 0.2, 0.3, 0.4},
		},
		{
			interval: [2]int{0, 10},
			want:     []float64{0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9},
		},
		{
			interval: [2]int{5, 10},
			want:     []float64{0.5, 0.6, 0.7, 0.8, 0.9},
		},
		{
			interval: [2]int{10, 10},
			want:     []float64{},
		},
		{
			interval: [2]int{2, 7},
			want:     []float64{0.2, 0.3, 0.4, 0.5, 0.6},
		},
		{
			interval: [2]int{-1, 1},
			panic:    true,
		},
		{
			interval: [2]int{9, 11},
			panic:    true,
		},
	}
	for _, tc := range tests {
		tc := tc
		t.Run("", func(t *testing.T) {

			if tc.panic {
				defer func() {
					if e := recover(); e == nil {
						t.Fatalf("this should have panicked, but did not")
					}
				}()
			}

			slice := arrow.FloatSlice(arr, tc.interval[0], tc.interval[1])
			defer slice.Release()

			if got, want := slice.Len(), len(tc.want); got != want {
				t.Fatalf("got=%d, want=%d", got, want)
			}

			vs := slice.Float64Values()

			if !cmp.Equal(tc.want, vs) {
				t.Errorf("unexpected slice -want/+got\n%s", cmp.Diff(tc.want, vs))
			}
		})
	}
}

func TestSlice_OutOfBounds_Float64(t *testing.T) {
	values := []float64{0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9}
	alloc := &memory.Allocator{}
	arr := arrow.NewFloat(values, alloc)
	defer arr.Release()

	slice := arrow.FloatSlice(arr, 3, 8)
	defer slice.Release()

	tests := []struct {
		index int
		panic bool
	}{
		{
			index: -1,
			panic: true,
		},
		{
			index: 5,
			panic: true,
		},
		{
			index: 0,
			panic: false,
		},
		{
			index: 4,
			panic: false,
		},
	}

	for _, tc := range tests {
		t.Run("", func(t *testing.T) {

			if tc.panic {
				defer func() {
					if e := recover(); e == nil {
						t.Fatalf("this should have panicked, but did not")
					}
				}()
			} else {
				defer func() {
					if e := recover(); e != nil {
						t.Fatalf("unexpected panic: %v", e)
					}
				}()
			}

			slice.Value(tc.index)
		})
	}
}

func TestSlice_String(t *testing.T) {
	t.Skip("https://github.com/apache/arrow/issues/3270")

	values := []string{"a", "bc", "def", "g", "hijk", "lm", "n", "opq", "rs", "tu"}
	alloc := &memory.Allocator{}
	arr := arrow.NewString(values, alloc)
	defer arr.Release()

	l := arr.Len()

	if got, want := l, len(values); got != want {
		t.Fatalf("got=%d, want=%d", got, want)
	}

	vs := make([]string, l)
	for i := 0; i < l; i++ {
		vs[i] = arr.ValueString(i)
	}

	if !cmp.Equal(values, vs) {
		t.Fatalf("unexpected array -want/+got\n%s", cmp.Diff(values, vs))
	}

	tests := []struct {
		interval [2]int
		panic    bool
		want     []string
	}{
		{
			interval: [2]int{0, 0},
			want:     []string{},
		},
		{
			interval: [2]int{0, 5},
			want:     []string{"a", "bc", "def", "g", "hijk"},
		},
		{
			interval: [2]int{0, 10},
			want:     []string{"a", "bc", "def", "g", "hijk", "lm", "n", "opq", "rs", "tu"},
		},
		{
			interval: [2]int{5, 10},
			want:     []string{"lm", "n", "opq", "rs", "tu"},
		},
		{
			interval: [2]int{10, 10},
			want:     []string{},
		},
		{
			interval: [2]int{2, 7},
			want:     []string{"def", "g", "hijk", "lm", "n"},
		},
		{
			interval: [2]int{-1, 1},
			panic:    true,
		},
		{
			interval: [2]int{9, 11},
			panic:    true,
		},
	}
	for _, tc := range tests {
		tc := tc
		t.Run("", func(t *testing.T) {

			if tc.panic {
				defer func() {
					if e := recover(); e == nil {
						t.Fatalf("this should have panicked, but did not")
					}
				}()
			}

			slice := arrow.StringSlice(arr, tc.interval[0], tc.interval[1])
			defer slice.Release()

			l = slice.Len()

			if got, want := l, len(tc.want); got != want {
				t.Fatalf("got=%d, want=%d", got, want)
			}

			vs = vs[:0]
			for i := 0; i < l; i++ {
				vs = append(vs, arr.ValueString(i))
			}

			if !cmp.Equal(tc.want, vs) {
				t.Errorf("unexpected slice -want/+got\n%s", cmp.Diff(tc.want, vs))
			}
		})
	}
}

func TestSlice_OutOfBounds_String(t *testing.T) {
	t.Skip("https://github.com/apache/arrow/issues/3270")

	values := []string{"a", "bc", "def", "g", "hijk", "lm", "n", "opq", "rs", "tu"}
	alloc := &memory.Allocator{}
	arr := arrow.NewString(values, alloc)
	defer arr.Release()

	slice := arrow.StringSlice(arr, 3, 8)
	defer slice.Release()

	tests := []struct {
		index int
		panic bool
	}{
		{
			index: -1,
			panic: true,
		},
		{
			index: 5,
			panic: true,
		},
		{
			index: 0,
			panic: false,
		},
		{
			index: 4,
			panic: false,
		},
	}

	for _, tc := range tests {
		t.Run("", func(t *testing.T) {

			if tc.panic {
				defer func() {
					if e := recover(); e == nil {
						t.Fatalf("this should have panicked, but did not")
					}
				}()
			} else {
				defer func() {
					if e := recover(); e != nil {
						t.Fatalf("unexpected panic: %v", e)
					}
				}()
			}

			slice.ValueString(tc.index)
		})
	}
}

func TestSlice_Bool(t *testing.T) {
	t.Skip("https://issues.apache.org/jira/browse/ARROW-4126")

	values := []bool{true, false, true, false, true, false, true, false, true, false}
	alloc := &memory.Allocator{}
	arr := arrow.NewBool(values, alloc)
	defer arr.Release()

	l := arr.Len()

	if got, want := l, len(values); got != want {
		t.Fatalf("got=%d, want=%d", got, want)
	}

	vs := make([]bool, l)
	for i := 0; i < l; i++ {
		vs[i] = arr.Value(i)
	}

	if !cmp.Equal(values, vs) {
		t.Fatalf("unexpected array -want/+got\n%s", cmp.Diff(values, vs))
	}

	tests := []struct {
		interval [2]int
		panic    bool
		want     []bool
	}{
		{
			interval: [2]int{0, 0},
			want:     []bool{},
		},
		{
			interval: [2]int{0, 5},
			want:     []bool{true, false, true, false, true},
		},
		{
			interval: [2]int{0, 10},
			want:     []bool{true, false, true, false, true, false, true, false, true, false},
		},
		{
			interval: [2]int{5, 10},
			want:     []bool{false, true, false, true, false},
		},
		{
			interval: [2]int{10, 10},
			want:     []bool{},
		},
		{
			interval: [2]int{2, 7},
			want:     []bool{true, false, true, false, true},
		},
		{
			interval: [2]int{-1, 1},
			panic:    true,
		},
		{
			interval: [2]int{9, 11},
			panic:    true,
		},
	}
	for _, tc := range tests {
		tc := tc
		t.Run("", func(t *testing.T) {

			if tc.panic {
				defer func() {
					if e := recover(); e == nil {
						t.Fatalf("this should have panicked, but did not")
					}
				}()
			}

			slice := arrow.BoolSlice(arr, tc.interval[0], tc.interval[1])
			defer slice.Release()

			l = slice.Len()

			if got, want := l, len(tc.want); got != want {
				t.Fatalf("got=%d, want=%d", got, want)
			}

			vs = vs[:0]
			for i := 0; i < l; i++ {
				vs = append(vs, arr.Value(i))
			}

			if !cmp.Equal(tc.want, vs) {
				t.Errorf("unexpected slice -want/+got\n%s", cmp.Diff(tc.want, vs))
			}
		})
	}
}

func TestSlice_OutOfBounds_Bool(t *testing.T) {
	t.Skip("https://issues.apache.org/jira/browse/ARROW-4126")

	values := []bool{true, false, true, false, true, false, true, false, true, false}
	alloc := &memory.Allocator{}
	arr := arrow.NewBool(values, alloc)
	defer arr.Release()

	slice := arrow.BoolSlice(arr, 3, 8)
	defer slice.Release()

	tests := []struct {
		index int
		panic bool
	}{
		{
			index: -1,
			panic: true,
		},
		{
			index: 5,
			panic: true,
		},
		{
			index: 0,
			panic: false,
		},
		{
			index: 4,
			panic: false,
		},
	}

	for _, tc := range tests {
		t.Run("", func(t *testing.T) {

			if tc.panic {
				defer func() {
					if e := recover(); e == nil {
						t.Fatalf("this should have panicked, but did not")
					}
				}()
			} else {
				defer func() {
					if e := recover(); e != nil {
						t.Fatalf("unexpected panic: %v", e)
					}
				}()
			}

			slice.Value(tc.index)
		})
	}
}
