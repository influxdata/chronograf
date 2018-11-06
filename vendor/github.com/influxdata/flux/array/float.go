package array

// Float represents an abstraction over a float array.
type Float interface {
	Base
	Value(i int) float64
	FloatSlice(start, stop int) Float

	// Float64Values will return the underlying slice for the Float array. It is the size
	// of the array and null values will be present, but the data at null indexes will be invalid.
	Float64Values() []float64
}

// FloatBuilder represents an abstraction over building a float array.
type FloatBuilder interface {
	BaseBuilder
	Append(v float64)
	AppendValues(v []float64, valid ...[]bool)

	// BuildFloatArray will construct the array.
	BuildFloatArray() Float
}
