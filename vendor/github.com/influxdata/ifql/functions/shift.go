package functions

import (
	"fmt"

	"github.com/influxdata/ifql/query"
	"github.com/influxdata/ifql/query/execute"
	"github.com/influxdata/ifql/query/plan"
	"github.com/influxdata/ifql/semantic"
)

const ShiftKind = "shift"

type ShiftOpSpec struct {
	Shift query.Duration `json:"shift"`
}

var shiftSignature = query.DefaultFunctionSignature()

func init() {
	shiftSignature.Params["shift"] = semantic.Duration

	query.RegisterFunction(ShiftKind, createShiftOpSpec, shiftSignature)
	query.RegisterOpSpec(ShiftKind, newShiftOp)
	plan.RegisterProcedureSpec(ShiftKind, newShiftProcedure, ShiftKind)
	execute.RegisterTransformation(ShiftKind, createShiftTransformation)
}

func createShiftOpSpec(args query.Arguments, a *query.Administration) (query.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	spec := new(ShiftOpSpec)

	if shift, err := args.GetRequiredDuration("shift"); err != nil {
		return nil, err
	} else {
		spec.Shift = shift
	}

	return spec, nil
}

func newShiftOp() query.OperationSpec {
	return new(ShiftOpSpec)
}

func (s *ShiftOpSpec) Kind() query.OperationKind {
	return ShiftKind
}

type ShiftProcedureSpec struct {
	Shift query.Duration
}

func newShiftProcedure(qs query.OperationSpec, _ plan.Administration) (plan.ProcedureSpec, error) {
	if spec, ok := qs.(*ShiftOpSpec); ok {
		return &ShiftProcedureSpec{Shift: spec.Shift}, nil
	}

	return nil, fmt.Errorf("invalid spec type %T", qs)
}

func (s *ShiftProcedureSpec) Kind() plan.ProcedureKind {
	return ShiftKind
}

func (s *ShiftProcedureSpec) Copy() plan.ProcedureSpec {
	return &ShiftProcedureSpec{Shift: s.Shift}
}

func createShiftTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	s, ok := spec.(*ShiftProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", spec)
	}
	cache := execute.NewBlockBuilderCache(a.Allocator())
	d := execute.NewDataset(id, mode, cache)
	t := NewShiftTransformation(d, cache, s)
	return t, d, nil
}

type shiftTransformation struct {
	d     execute.Dataset
	cache execute.BlockBuilderCache
	shift execute.Duration
}

func NewShiftTransformation(d execute.Dataset, cache execute.BlockBuilderCache, spec *ShiftProcedureSpec) *shiftTransformation {
	return &shiftTransformation{
		d:     d,
		cache: cache,
		shift: execute.Duration(spec.Shift),
	}
}

func (t *shiftTransformation) RetractBlock(id execute.DatasetID, meta execute.BlockMetadata) error {
	return t.d.RetractBlock(execute.ToBlockKey(meta))
}

func (t *shiftTransformation) Process(id execute.DatasetID, b execute.Block) error {
	builder, nw := t.cache.BlockBuilder(blockMetadata{
		tags:   b.Tags(),
		bounds: b.Bounds().Shift(t.shift),
	})

	if nw {
		execute.AddBlockCols(b, builder)
	}

	var k []execute.Time
	cols := builder.Cols()
	timeIdx := execute.TimeIdx(cols)
	b.Times().DoTime(func(ts []execute.Time, rr execute.RowReader) {
		if cap(k) < len(ts) {
			k = make([]execute.Time, len(ts))
		}
		k = k[:len(ts)]

		for i := range ts {
			k[i] = ts[i].Add(t.shift)
		}

		builder.AppendTimes(timeIdx, k)
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
					builder.AppendString(j, rr.AtString(i, j))
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

func (t *shiftTransformation) UpdateWatermark(id execute.DatasetID, mark execute.Time) error {
	return t.d.UpdateWatermark(mark)
}

func (t *shiftTransformation) UpdateProcessingTime(id execute.DatasetID, pt execute.Time) error {
	return t.d.UpdateProcessingTime(pt)
}

func (t *shiftTransformation) Finish(id execute.DatasetID, err error) {
	t.d.Finish(err)
}

func (t *shiftTransformation) SetParents(ids []execute.DatasetID) {}
