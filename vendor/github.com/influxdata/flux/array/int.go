package array

// Int represents an abstraction over an integer array.
type Int interface {
	Base
	Value(i int) int64
	IntSlice(start, stop int) Int

	// Int64Values will return the underlying slice for the Int array. It is the size
	// of the array and null values will be present, but the data at null indexes will be invalid.
	Int64Values() []int64
}

// IntBuilder represents an abstraction over building a int array.
type IntBuilder interface {
	BaseBuilder
	Append(v int64)
	AppendValues(v []int64, valid ...[]bool)

	// BuildIntArray will construct the array.
	BuildIntArray() Int
}
