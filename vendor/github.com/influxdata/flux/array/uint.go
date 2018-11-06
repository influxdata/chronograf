package array

// UInt represents an abstraction over an unsigned array.
type UInt interface {
	Base
	Value(i int) uint64
	UIntSlice(start, stop int) UInt

	// Uint64Values will return the underlying slice for the UInt array. It is the size
	// of the array and null values will be present, but the data at null indexes will be invalid.
	Uint64Values() []uint64
}

// UIntBuilder represents an abstraction over building a uint array.
type UIntBuilder interface {
	BaseBuilder
	Append(v uint64)
	AppendValues(v []uint64, valid ...[]bool)

	// BuildUIntArray will construct the array.
	BuildUIntArray() UInt
}
