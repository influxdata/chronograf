package staticarray

import (
	"github.com/influxdata/flux/array"
	"github.com/influxdata/flux/values"
)

var _ array.Time = Time(nil)

type Time []values.Time

func (a Time) IsNull(i int) bool {
	return false
}

func (a Time) IsValid(i int) bool {
	return i >= 0 && i < len(a)
}

func (a Time) Len() int {
	return len(a)
}

func (a Time) NullN() int {
	return 0
}

func (a Time) Value(i int) values.Time {
	return a[i]
}

func (a Time) Slice(start, stop int) array.Base {
	return a.TimeSlice(start, stop)
}

func (a Time) TimeSlice(start, stop int) array.Time {
	return Time(a[start:stop])
}

func (a Time) TimeValues() []values.Time {
	return []values.Time(a)
}

var _ array.TimeBuilder = (*TimeBuilder)(nil)

type TimeBuilder []values.Time

func (b *TimeBuilder) Len() int {
	if b == nil {
		return 0
	}
	return len(*b)
}

func (b *TimeBuilder) Cap() int {
	if b == nil {
		return 0
	}
	return cap(*b)
}

func (b *TimeBuilder) Reserve(n int) {
	if b == nil {
		*b = make([]values.Time, 0, n)
		return
	} else if cap(*b) < n {
		newB := make([]values.Time, len(*b), n)
		copy(newB, *b)
		*b = newB
	}
}

func (b *TimeBuilder) BuildArray() array.Base {
	return b.BuildTimeArray()
}

func (b *TimeBuilder) Append(v values.Time) {
	if b == nil {
		*b = append([]values.Time{}, v)
		return
	}
	*b = append(*b, v)
}

func (b *TimeBuilder) AppendNull() {
	// The staticarray does not support nulls so it will do the current behavior of just appending
	// the zero value.
	b.Append(0)
}

func (b *TimeBuilder) AppendValues(v []values.Time, valid ...[]bool) {
	// We ignore the valid array since it does not apply to this implementation type.
	if b == nil {
		*b = append([]values.Time{}, v...)
		return
	}
	*b = append(*b, v...)
}

func (b *TimeBuilder) BuildTimeArray() array.Time {
	if b == nil {
		return Time(nil)
	}
	return Time(*b)
}
