package execute

import (
	"fmt"
	"strings"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/values"
)

type groupKey struct {
	cols   []flux.ColMeta
	values []values.Value
}

func NewGroupKey(cols []flux.ColMeta, values []values.Value) flux.GroupKey {
	return &groupKey{
		cols:   cols,
		values: values,
	}
}

func (k *groupKey) Cols() []flux.ColMeta {
	return k.cols
}
func (k *groupKey) HasCol(label string) bool {
	return ColIdx(label, k.cols) >= 0
}
func (k *groupKey) LabelValue(label string) values.Value {
	if !k.HasCol(label) {
		return nil
	}
	return k.Value(ColIdx(label, k.cols))
}
func (k *groupKey) Value(j int) values.Value {
	return k.values[j]
}
func (k *groupKey) ValueBool(j int) bool {
	return k.values[j].Bool()
}
func (k *groupKey) ValueUInt(j int) uint64 {
	return k.values[j].UInt()
}
func (k *groupKey) ValueInt(j int) int64 {
	return k.values[j].Int()
}
func (k *groupKey) ValueFloat(j int) float64 {
	return k.values[j].Float()
}
func (k *groupKey) ValueString(j int) string {
	return k.values[j].Str()
}
func (k *groupKey) ValueDuration(j int) Duration {
	return k.values[j].Duration()
}
func (k *groupKey) ValueTime(j int) Time {
	return k.values[j].Time()
}

func (k *groupKey) Equal(o flux.GroupKey) bool {
	return groupKeyEqual(k, o)
}

func (k *groupKey) Less(o flux.GroupKey) bool {
	return groupKeyLess(k, o)
}

func (k *groupKey) String() string {
	var b strings.Builder
	b.WriteRune('{')
	for j, c := range k.cols {
		if j != 0 {
			b.WriteRune(',')
		}
		fmt.Fprintf(&b, "%s=%v", c.Label, k.values[j])
	}
	b.WriteRune('}')
	return b.String()
}

func groupKeyEqual(a, b flux.GroupKey) bool {
	aCols := a.Cols()
	bCols := b.Cols()
	if len(aCols) != len(bCols) {
		return false
	}
	for j, c := range aCols {
		if aCols[j] != bCols[j] {
			return false
		}
		switch c.Type {
		case flux.TBool:
			if a.ValueBool(j) != b.ValueBool(j) {
				return false
			}
		case flux.TInt:
			if a.ValueInt(j) != b.ValueInt(j) {
				return false
			}
		case flux.TUInt:
			if a.ValueUInt(j) != b.ValueUInt(j) {
				return false
			}
		case flux.TFloat:
			if a.ValueFloat(j) != b.ValueFloat(j) {
				return false
			}
		case flux.TString:
			if a.ValueString(j) != b.ValueString(j) {
				return false
			}
		case flux.TTime:
			if a.ValueTime(j) != b.ValueTime(j) {
				return false
			}
		}
	}
	return true
}

func groupKeyLess(a, b flux.GroupKey) bool {
	aCols := a.Cols()
	bCols := b.Cols()
	if av, bv := len(aCols), len(bCols); av != bv {
		return av < bv
	}
	for j, c := range aCols {
		if av, bv := aCols[j].Label, bCols[j].Label; av != bv {
			return av < bv
		}
		if av, bv := aCols[j].Type, bCols[j].Type; av != bv {
			return av < bv
		}
		switch c.Type {
		case flux.TBool:
			if av, bv := a.ValueBool(j), b.ValueBool(j); av != bv {
				return av
			}
		case flux.TInt:
			if av, bv := a.ValueInt(j), b.ValueInt(j); av != bv {
				return av < bv
			}
		case flux.TUInt:
			if av, bv := a.ValueUInt(j), b.ValueUInt(j); av != bv {
				return av < bv
			}
		case flux.TFloat:
			if av, bv := a.ValueFloat(j), b.ValueFloat(j); av != bv {
				return av < bv
			}
		case flux.TString:
			if av, bv := a.ValueString(j), b.ValueString(j); av != bv {
				return av < bv
			}
		case flux.TTime:
			if av, bv := a.ValueTime(j), b.ValueTime(j); av != bv {
				return av < bv
			}
		}
	}
	return false
}
