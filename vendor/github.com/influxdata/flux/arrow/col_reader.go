package arrow

import (
	"github.com/influxdata/flux"
	"github.com/influxdata/flux/values"
)

// colReader is a lazy constructor for converting a column from a
// column reader into an arrow array.
type colReader struct {
	cr   flux.ArrowColReader
	cols []interface{}
}

func (cr *colReader) Key() flux.GroupKey {
	return cr.cr.Key()
}

func (cr *colReader) Cols() []flux.ColMeta {
	return cr.cr.Cols()
}

func (cr *colReader) Len() int {
	return cr.cr.Len()
}

func (cr *colReader) Bools(j int) []bool {
	if c := cr.cols[j]; c != nil {
		return c.([]bool)
	}

	data := cr.cr.Bools(j)
	c := make([]bool, data.Len())
	for i := 0; i < len(c); i++ {
		c[i] = data.Value(i)
	}
	cr.cols[j] = c
	return c
}

func (cr *colReader) Ints(j int) []int64 {
	c := cr.cr.Ints(j)
	return c.Int64Values()
}

func (cr *colReader) UInts(j int) []uint64 {
	c := cr.cr.UInts(j)
	return c.Uint64Values()
}

func (cr *colReader) Floats(j int) []float64 {
	c := cr.cr.Floats(j)
	return c.Float64Values()
}

func (cr *colReader) Strings(j int) []string {
	if c := cr.cols[j]; c != nil {
		return c.([]string)
	}

	data := cr.cr.Strings(j)
	c := make([]string, data.Len())
	for i := 0; i < len(c); i++ {
		c[i] = data.ValueString(i)
	}
	cr.cols[j] = c
	return c
}

func (cr *colReader) Times(j int) []values.Time {
	if c := cr.cols[j]; c != nil {
		return c.([]values.Time)
	}

	data := cr.cr.Times(j)
	c := make([]values.Time, data.Len())
	for i := 0; i < len(c); i++ {
		c[i] = values.Time(data.Value(i))
	}
	cr.cols[j] = c
	return c
}

// ColReader creates a wrapper around an ArrowColReader that will implement the
// flux.ColReader interface. If the relevant type cannot be returned directly from
// the arrow array, this reader will lazily memoize a copy of the array as a slice.
//
// This method will be removed when the flux.ColReader interface is replaced by the
// flux.ArrowColReader interface.
func ColReader(cr flux.ArrowColReader) flux.ColReader {
	return &colReader{
		cr:   cr,
		cols: make([]interface{}, len(cr.Cols())),
	}
}
