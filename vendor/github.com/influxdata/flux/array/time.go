package array

import "github.com/influxdata/flux/values"

// Time represents an abstraction over a time array.
type Time interface {
	Base
	Value(i int) values.Time
	TimeSlice(start, stop int) Time

	// TimeValues will return the underlying slice for the Time array. It is the size
	// of the array and null values will be present, but the data at null indexes will be invalid.
	TimeValues() []values.Time
}

// TimeBuilder represents an abstraction over building a time array.
type TimeBuilder interface {
	BaseBuilder
	Append(v values.Time)
	AppendValues(v []values.Time, valid ...[]bool)

	// BuildTimeArray will construct the array.
	BuildTimeArray() Time
}
