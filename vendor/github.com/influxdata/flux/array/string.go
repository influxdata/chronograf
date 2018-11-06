package array

// String represents an abstraction over a string array.
type String interface {
	Base
	Value(i int) string
	StringSlice(start, stop int) String
}

// StringBuilder represents an abstraction over building a string array.
type StringBuilder interface {
	BaseBuilder
	Append(v string)
	AppendValues(v []string, valid ...[]bool)

	// BuildStringArray will construct the array.
	BuildStringArray() String
}
