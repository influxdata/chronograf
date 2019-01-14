package arrow

import (
	"github.com/apache/arrow/go/arrow/array"
	arrowmemory "github.com/apache/arrow/go/arrow/memory"
	"github.com/influxdata/flux/memory"
)

func NewBool(vs []bool, alloc *memory.Allocator) *array.Boolean {
	b := NewBoolBuilder(alloc)
	b.Reserve(len(vs))
	for _, v := range vs {
		b.UnsafeAppend(v)
	}
	a := b.NewBooleanArray()
	b.Release()
	return a
}

func BoolSlice(arr *array.Boolean, i, j int) *array.Boolean {
	data := array.NewSliceData(arr.Data(), int64(i), int64(j))
	defer data.Release()
	return array.NewBooleanData(data)
}

func NewBoolBuilder(a *memory.Allocator) *array.BooleanBuilder {
	return array.NewBooleanBuilder(&allocator{
		Allocator: arrowmemory.NewGoAllocator(),
		alloc:     a,
	})
}
