package staticarray

import "github.com/influxdata/flux/array"

var _ array.Int = Int(nil)

type Int []int64

func (a Int) IsNull(i int) bool {
	return false
}

func (a Int) IsValid(i int) bool {
	return i >= 0 && i < len(a)
}

func (a Int) Len() int {
	return len(a)
}

func (a Int) NullN() int {
	return 0
}

func (a Int) Value(i int) int64 {
	return a[i]
}

func (a Int) Slice(start, stop int) array.Base {
	return a.IntSlice(start, stop)
}

func (a Int) IntSlice(start, stop int) array.Int {
	return Int(a[start:stop])
}

func (a Int) Int64Values() []int64 {
	return []int64(a)
}

var _ array.IntBuilder = (*IntBuilder)(nil)

type IntBuilder []int64

func (b *IntBuilder) Len() int {
	if b == nil {
		return 0
	}
	return len(*b)
}

func (b *IntBuilder) Cap() int {
	if b == nil {
		return 0
	}
	return cap(*b)
}

func (b *IntBuilder) Reserve(n int) {
	if b == nil {
		*b = make([]int64, 0, n)
		return
	} else if cap(*b) < n {
		newB := make([]int64, len(*b), n)
		copy(newB, *b)
		*b = newB
	}
}

func (b *IntBuilder) BuildArray() array.Base {
	return b.BuildIntArray()
}

func (b *IntBuilder) Append(v int64) {
	if b == nil {
		*b = append([]int64{}, v)
		return
	}
	*b = append(*b, v)
}

func (b *IntBuilder) AppendNull() {
	// The staticarray does not support nulls so it will do the current behavior of just appending
	// the zero value.
	b.Append(0)
}

func (b *IntBuilder) AppendValues(v []int64, valid ...[]bool) {
	// We ignore the valid array since it does not apply to this implementation type.
	if b == nil {
		*b = append([]int64{}, v...)
		return
	}
	*b = append(*b, v...)
}

func (b *IntBuilder) BuildIntArray() array.Int {
	if b == nil {
		return Int(nil)
	}
	return Int(*b)
}
