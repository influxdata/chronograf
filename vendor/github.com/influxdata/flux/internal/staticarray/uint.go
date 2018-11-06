package staticarray

import "github.com/influxdata/flux/array"

var _ array.UInt = UInt(nil)

type UInt []uint64

func (a UInt) IsNull(i int) bool {
	return false
}

func (a UInt) IsValid(i int) bool {
	return i >= 0 && i < len(a)
}

func (a UInt) Len() int {
	return len(a)
}

func (a UInt) NullN() int {
	return 0
}

func (a UInt) Value(i int) uint64 {
	return a[i]
}

func (a UInt) Slice(start, stop int) array.Base {
	return a.UIntSlice(start, stop)
}

func (a UInt) UIntSlice(start, stop int) array.UInt {
	return UInt(a[start:stop])
}

func (a UInt) Uint64Values() []uint64 {
	return []uint64(a)
}

var _ array.UIntBuilder = (*UIntBuilder)(nil)

type UIntBuilder []uint64

func (b *UIntBuilder) Len() int {
	if b == nil {
		return 0
	}
	return len(*b)
}

func (b *UIntBuilder) Cap() int {
	if b == nil {
		return 0
	}
	return cap(*b)
}

func (b *UIntBuilder) Reserve(n int) {
	if b == nil {
		*b = make([]uint64, 0, n)
		return
	} else if cap(*b) < n {
		newB := make([]uint64, len(*b), n)
		copy(newB, *b)
		*b = newB
	}
}

func (b *UIntBuilder) BuildArray() array.Base {
	return b.BuildUIntArray()
}

func (b *UIntBuilder) Append(v uint64) {
	if b == nil {
		*b = append([]uint64{}, v)
		return
	}
	*b = append(*b, v)
}

func (b *UIntBuilder) AppendNull() {
	// The staticarray does not support nulls so it will do the current behavior of just appending
	// the zero value.
	b.Append(0)
}

func (b *UIntBuilder) AppendValues(v []uint64, valid ...[]bool) {
	// We ignore the valid array since it does not apply to this implementation type.
	if b == nil {
		*b = append([]uint64{}, v...)
		return
	}
	*b = append(*b, v...)
}

func (b *UIntBuilder) BuildUIntArray() array.UInt {
	if b == nil {
		return UInt(nil)
	}
	return UInt(*b)
}
