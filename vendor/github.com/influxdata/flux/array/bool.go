package array

// Boolean represents an abstraction over a bool array.
type Boolean interface {
	Base
	Value(i int) bool
	BooleanSlice(start, stop int) Boolean
}

// BooleanBuilder represents an abstraction over building a bool array.
type BooleanBuilder interface {
	BaseBuilder
	Append(v bool)
	AppendValues(v []bool, valid ...[]bool)

	// BuildBooleanArray will construct the array.
	BuildBooleanArray() Boolean
}
