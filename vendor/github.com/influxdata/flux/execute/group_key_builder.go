package execute

import (
	"fmt"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/values"
)

// GroupKeyBuilder is used to construct a GroupKey by keeping a mutable copy in memory.
type GroupKeyBuilder struct {
	cols   []flux.ColMeta
	values []values.Value
	err    error
}

// NewGroupKeyBuilder creates a new GroupKeyBuilder from an existing GroupKey.
// If the GroupKey passed is nil, a blank GroupKeyBuilder is constructed.
func NewGroupKeyBuilder(key flux.GroupKey) *GroupKeyBuilder {
	gkb := &GroupKeyBuilder{}
	if key != nil {
		gkb.cols = append(gkb.cols, key.Cols()...)
		gkb.values = append(gkb.values, key.Values()...)
	}
	return gkb
}

// AddKeyValue will add a new group key to the existing builder.
func (gkb *GroupKeyBuilder) AddKeyValue(key string, value values.Value) *GroupKeyBuilder {
	if gkb.err != nil {
		return gkb
	}

	cm := flux.ColMeta{
		Label: key,
		Type:  flux.ColumnType(value.Type()),
	}
	if cm.Type == flux.TInvalid {
		gkb.err = fmt.Errorf("invalid group key type: %s", value.Type())
		return gkb
	}
	gkb.cols = append(gkb.cols, cm)
	gkb.values = append(gkb.values, value)
	return gkb
}

// Len returns the current length of the group key.
func (gkb *GroupKeyBuilder) Len() int {
	return len(gkb.cols)
}

// Grow will grow the internal capacity of the group key to the given number.
func (gkb *GroupKeyBuilder) Grow(n int) {
	if cap(gkb.cols) < n {
		cols := make([]flux.ColMeta, len(gkb.cols), n)
		copy(cols, gkb.cols)
		gkb.cols = cols
	}
	if cap(gkb.values) < n {
		values := make([]values.Value, len(gkb.values), n)
		copy(values, gkb.values)
		gkb.values = values
	}
}

// Build will construct the GroupKey. If there is any problem with the
// GroupKey (such as one of the columns is not a valid type), the error
// will be returned here.
func (gkb *GroupKeyBuilder) Build() (flux.GroupKey, error) {
	if gkb.err != nil {
		return nil, gkb.err
	}
	return NewGroupKey(gkb.cols, gkb.values), nil
}
