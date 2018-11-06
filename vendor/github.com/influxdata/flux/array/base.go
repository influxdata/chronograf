package array

// Base defines the base interface for working with any array type.
// All array types share this common interface.
type Base interface {
	IsNull(i int) bool
	IsValid(i int) bool
	Len() int
	NullN() int
	Slice(start, stop int) Base
}

// BaseBuilder defines the base interface for building an array of a given array type.
// All builder types share this common interface.
type BaseBuilder interface {
	// Len returns the currently allocated length for the array builder.
	Len() int

	// Cap returns the current capacity of the underlying array.
	Cap() int

	// Reserve ensures there is enough space for appending n elements by checking
	// the capacity and calling resize if necessary.
	Reserve(n int)

	// AppendNull will append a null value to the array.
	AppendNull()

	// BuildArray will construct the array.
	BuildArray() Base
}
