package staticarray

import "github.com/influxdata/flux/array"

var _ array.Float = Float(nil)

type Float []float64

func (a Float) IsNull(i int) bool {
	return false
}

func (a Float) IsValid(i int) bool {
	return i >= 0 && i < len(a)
}

func (a Float) Len() int {
	return len(a)
}

func (a Float) NullN() int {
	return 0
}

func (a Float) Value(i int) float64 {
	return a[i]
}

func (a Float) Slice(start, stop int) array.Base {
	return a.FloatSlice(start, stop)
}

func (a Float) FloatSlice(start, stop int) array.Float {
	return Float(a[start:stop])
}

func (a Float) Float64Values() []float64 {
	return []float64(a)
}

var _ array.FloatBuilder = (*FloatBuilder)(nil)

type FloatBuilder []float64

func (b *FloatBuilder) Len() int {
	if b == nil {
		return 0
	}
	return len(*b)
}

func (b *FloatBuilder) Cap() int {
	if b == nil {
		return 0
	}
	return cap(*b)
}

func (b *FloatBuilder) Reserve(n int) {
	if b == nil {
		*b = make([]float64, 0, n)
		return
	} else if cap(*b) < n {
		newB := make([]float64, len(*b), n)
		copy(newB, *b)
		*b = newB
	}
}

func (b *FloatBuilder) BuildArray() array.Base {
	return b.BuildFloatArray()
}

func (b *FloatBuilder) Append(v float64) {
	if b == nil {
		*b = append([]float64{}, v)
		return
	}
	*b = append(*b, v)
}

func (b *FloatBuilder) AppendNull() {
	// The staticarray does not support nulls so it will do the current behavior of just appending
	// the zero value.
	b.Append(0)
}

func (b *FloatBuilder) AppendValues(v []float64, valid ...[]bool) {
	// We ignore the valid array since it does not apply to this implementation type.
	if b == nil {
		*b = append([]float64{}, v...)
		return
	}
	*b = append(*b, v...)
}

func (b *FloatBuilder) BuildFloatArray() array.Float {
	if b == nil {
		return Float(nil)
	}
	return Float(*b)
}
