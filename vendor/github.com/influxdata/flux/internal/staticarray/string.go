package staticarray

import "github.com/influxdata/flux/array"

var _ array.String = String(nil)

type String []string

func (a String) IsNull(i int) bool {
	return false
}

func (a String) IsValid(i int) bool {
	return i >= 0 && i < len(a)
}

func (a String) Len() int {
	return len(a)
}

func (a String) NullN() int {
	return 0
}

func (a String) Value(i int) string {
	return a[i]
}

func (a String) Slice(start, stop int) array.Base {
	return a.StringSlice(start, stop)
}

func (a String) StringSlice(start, stop int) array.String {
	return String(a[start:stop])
}

var _ array.StringBuilder = (*StringBuilder)(nil)

type StringBuilder []string

func (b *StringBuilder) Len() int {
	if b == nil {
		return 0
	}
	return len(*b)
}

func (b *StringBuilder) Cap() int {
	if b == nil {
		return 0
	}
	return cap(*b)
}

func (b *StringBuilder) Reserve(n int) {
	if b == nil {
		*b = make([]string, 0, n)
		return
	} else if cap(*b) < n {
		newB := make([]string, len(*b), n)
		copy(newB, *b)
		*b = newB
	}
}

func (b *StringBuilder) BuildArray() array.Base {
	return b.BuildStringArray()
}

func (b *StringBuilder) Append(v string) {
	if b == nil {
		*b = append([]string{}, v)
		return
	}
	*b = append(*b, v)
}

func (b *StringBuilder) AppendNull() {
	// The staticarray does not support nulls so it will do the current behavior of just appending
	// the zero value.
	b.Append("")
}

func (b *StringBuilder) AppendValues(v []string, valid ...[]bool) {
	// We ignore the valid array since it does not apply to this implementation type.
	if b == nil {
		*b = append([]string{}, v...)
		return
	}
	*b = append(*b, v...)
}

func (b *StringBuilder) BuildStringArray() array.String {
	if b == nil {
		return String(nil)
	}
	return String(*b)
}
