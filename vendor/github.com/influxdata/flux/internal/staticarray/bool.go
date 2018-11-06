package staticarray

import "github.com/influxdata/flux/array"

var _ array.Boolean = Boolean(nil)

type Boolean []bool

func (a Boolean) IsNull(i int) bool {
	return false
}

func (a Boolean) IsValid(i int) bool {
	return i >= 0 && i < len(a)
}

func (a Boolean) Len() int {
	return len(a)
}

func (a Boolean) NullN() int {
	return 0
}

func (a Boolean) Value(i int) bool {
	return a[i]
}

func (a Boolean) Slice(start, stop int) array.Base {
	return a.BooleanSlice(start, stop)
}

func (a Boolean) BooleanSlice(start, stop int) array.Boolean {
	return Boolean(a[start:stop])
}

var _ array.BooleanBuilder = (*BooleanBuilder)(nil)

type BooleanBuilder []bool

func (b *BooleanBuilder) Len() int {
	if b == nil {
		return 0
	}
	return len(*b)
}

func (b *BooleanBuilder) Cap() int {
	if b == nil {
		return 0
	}
	return cap(*b)
}

func (b *BooleanBuilder) Reserve(n int) {
	if b == nil {
		*b = make([]bool, 0, n)
		return
	} else if cap(*b) < n {
		newB := make([]bool, len(*b), n)
		copy(newB, *b)
		*b = newB
	}
}

func (b *BooleanBuilder) BuildArray() array.Base {
	return b.BuildBooleanArray()
}

func (b *BooleanBuilder) Append(v bool) {
	if b == nil {
		*b = append([]bool{}, v)
		return
	}
	*b = append(*b, v)
}

func (b *BooleanBuilder) AppendNull() {
	// The staticarray does not support nulls so it will do the current behavior of just appending
	// the zero value.
	b.Append(false)
}

func (b *BooleanBuilder) AppendValues(v []bool, valid ...[]bool) {
	// We ignore the valid array since it does not apply to this implementation type.
	if b == nil {
		*b = append([]bool{}, v...)
		return
	}
	*b = append(*b, v...)
}

func (b *BooleanBuilder) BuildBooleanArray() array.Boolean {
	if b == nil {
		return Boolean(nil)
	}
	return Boolean(*b)
}
