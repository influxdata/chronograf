package protocol

import "time"

// Tag holds the keys and values for a bunch of Tag k/v pairs
type Tag struct {
	Key   string
	Value string
}

// Field holds the keys and values for a bunch of Metric Field k/v pairs
type Field struct {
	Key   string
	Value interface{}
}

// Metric is the interface for marshaling, if you implement this interface you can be marshalled into the line protocol.  Woot!
type Metric interface {
	Time() time.Time
	Name() string
	TagList() []*Tag
	FieldList() []*Field
}

// FieldSortOrder is a type for controlling if Fields are sorted
type FieldSortOrder int

const (
	// NoSortFields tells the Decoder to not sort the fields
	NoSortFields FieldSortOrder = iota

	// SortFields tells the Decoder to sort the fields
	SortFields
)

// FieldTypeSupport is a type for the parser to understand its type support
type FieldTypeSupport int

const (
	// UintSupport means the parser understands uint64s and can store them without having to convert to int64
	UintSupport FieldTypeSupport = 1 << iota
)

// MetricError is an error causing a metric to be unserializable.
type MetricError struct {
	s string
}

func (e MetricError) Error() string {
	return e.s
}

// FieldError is an error causing a field to be unserializable.
type FieldError struct {
	s string
}

func (e FieldError) Error() string {
	return e.s
}

var (
	// ErrNeedMoreSpace tells us that the Decoder's io.Reader is full
	ErrNeedMoreSpace = &MetricError{"need more space"}

	// ErrInvalidName tells us that the chosen name is invalid
	ErrInvalidName = &MetricError{"invalid name"}

	// ErrNoFields tells us that there were no serializable fields in the line/metric
	ErrNoFields = &MetricError{"no serializable fields"}
)
