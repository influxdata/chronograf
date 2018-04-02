package functions

import (
	"fmt"

	"github.com/influxdata/ifql/query"
	"github.com/influxdata/ifql/query/execute"
	"github.com/influxdata/ifql/query/plan"
	"github.com/influxdata/ifql/semantic"
)

const SetKind = "set"

type SetOpSpec struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

var setSignature = query.DefaultFunctionSignature()

func init() {
	setSignature.Params["key"] = semantic.String
	setSignature.Params["value"] = semantic.String

	query.RegisterFunction(SetKind, createSetOpSpec, setSignature)
	query.RegisterOpSpec(SetKind, newSetOp)
	plan.RegisterProcedureSpec(SetKind, newSetProcedure, SetKind)
	execute.RegisterTransformation(SetKind, createSetTransformation)
}

func createSetOpSpec(args query.Arguments, a *query.Administration) (query.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	spec := new(SetOpSpec)
	key, err := args.GetRequiredString("key")
	if err != nil {
		return nil, err
	}
	spec.Key = key

	value, err := args.GetRequiredString("value")
	if err != nil {
		return nil, err
	}
	spec.Value = value

	return spec, nil
}

func newSetOp() query.OperationSpec {
	return new(SetOpSpec)
}

func (s *SetOpSpec) Kind() query.OperationKind {
	return SetKind
}

type SetProcedureSpec struct {
	Key, Value string
}

func newSetProcedure(qs query.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	s, ok := qs.(*SetOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}
	p := &SetProcedureSpec{
		Key:   s.Key,
		Value: s.Value,
	}
	return p, nil
}

func (s *SetProcedureSpec) Kind() plan.ProcedureKind {
	return SetKind
}
func (s *SetProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(SetProcedureSpec)
	ns.Key = s.Key
	ns.Value = s.Value
	return ns
}

func createSetTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	s, ok := spec.(*SetProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", spec)
	}
	cache := execute.NewBlockBuilderCache(a.Allocator())
	d := execute.NewDataset(id, mode, cache)
	t := NewSetTransformation(d, cache, s)
	return t, d, nil
}

type setTransformation struct {
	d     execute.Dataset
	cache execute.BlockBuilderCache

	key, value string
}

func NewSetTransformation(
	d execute.Dataset,
	cache execute.BlockBuilderCache,
	spec *SetProcedureSpec,
) execute.Transformation {
	return &setTransformation{
		d:     d,
		cache: cache,
		key:   spec.Key,
		value: spec.Value,
	}
}

func (t *setTransformation) RetractBlock(id execute.DatasetID, meta execute.BlockMetadata) error {
	// TODO
	return nil
}

func (t *setTransformation) Process(id execute.DatasetID, b execute.Block) error {
	tags := b.Tags()
	isCommon := false
	if v, ok := tags[t.key]; ok {
		isCommon = true
		if v != t.value {
			tags = tags.Copy()
			tags[t.key] = t.value
		}
	}
	builder, new := t.cache.BlockBuilder(blockMetadata{
		tags:   tags,
		bounds: b.Bounds(),
	})
	if new {
		// Add columns
		found := false
		cols := b.Cols()
		for j, c := range cols {
			if c.Label == t.key {
				found = true
			}
			builder.AddCol(c)
			if c.IsTag() && c.Common {
				builder.SetCommonString(j, tags[c.Label])
			}
		}
		if !found {
			builder.AddCol(execute.ColMeta{
				Label:  t.key,
				Type:   execute.TString,
				Kind:   execute.TagColKind,
				Common: isCommon,
			})
		}
	}
	cols := builder.Cols()
	setIdx := 0
	for j, c := range cols {
		if c.Label == t.key {
			setIdx = j
			break
		}
	}
	timeIdx := execute.TimeIdx(cols)
	b.Col(timeIdx).DoTime(func(ts []execute.Time, rr execute.RowReader) {
		builder.AppendTimes(timeIdx, ts)
		for j, c := range cols {
			if j == timeIdx || c.Common {
				continue
			}
			for i := range ts {
				switch c.Type {
				case execute.TBool:
					builder.AppendBool(j, rr.AtBool(i, j))
				case execute.TInt:
					builder.AppendInt(j, rr.AtInt(i, j))
				case execute.TUInt:
					builder.AppendUInt(j, rr.AtUInt(i, j))
				case execute.TFloat:
					builder.AppendFloat(j, rr.AtFloat(i, j))
				case execute.TString:
					// Set new value
					var v string
					if j == setIdx {
						v = t.value
					} else {
						v = rr.AtString(i, j)
					}
					builder.AppendString(j, v)
				case execute.TTime:
					builder.AppendTime(j, rr.AtTime(i, j))
				default:
					execute.PanicUnknownType(c.Type)
				}
			}
		}
	})
	return nil
}

func (t *setTransformation) UpdateWatermark(id execute.DatasetID, mark execute.Time) error {
	return t.d.UpdateWatermark(mark)
}
func (t *setTransformation) UpdateProcessingTime(id execute.DatasetID, pt execute.Time) error {
	return t.d.UpdateProcessingTime(pt)
}
func (t *setTransformation) Finish(id execute.DatasetID, err error) {
	t.d.Finish(err)
}
