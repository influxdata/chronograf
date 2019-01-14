package arrow

import (
	"github.com/apache/arrow/go/arrow/array"
	"github.com/influxdata/flux/values"
)

type TableAppender interface {
	AppendBools(j int, values []bool) error
	AppendInts(j int, values []int64) error
	AppendUInts(j int, values []uint64) error
	AppendFloats(j int, values []float64) error
	AppendStrings(j int, values []string) error
	AppendTimes(j int, values []values.Time) error
}

func AppendBools(tbl TableAppender, j int, vs *array.Boolean) error {
	var buf [1]bool
	for i := 0; i < vs.Len(); i++ {
		buf[0] = vs.Value(i)
		if err := tbl.AppendBools(j, buf[:]); err != nil {
			return err
		}
	}
	return nil
}

func AppendInts(tbl TableAppender, j int, vs *array.Int64) error {
	return tbl.AppendInts(j, vs.Int64Values())
}

func AppendUInts(tbl TableAppender, j int, vs *array.Uint64) error {
	return tbl.AppendUInts(j, vs.Uint64Values())
}

func AppendFloats(tbl TableAppender, j int, vs *array.Float64) error {
	return tbl.AppendFloats(j, vs.Float64Values())
}

func AppendStrings(tbl TableAppender, j int, vs *array.Binary) error {
	var buf [1]string
	for i := 0; i < vs.Len(); i++ {
		buf[0] = vs.ValueString(i)
		if err := tbl.AppendStrings(j, buf[:]); err != nil {
			return err
		}
	}
	return nil
}

func AppendTimes(tbl TableAppender, j int, vs *array.Int64) error {
	var buf [1]values.Time
	for i := 0; i < vs.Len(); i++ {
		buf[0] = values.Time(vs.Value(i))
		if err := tbl.AppendTimes(j, buf[:]); err != nil {
			return err
		}
	}
	return nil
}
