package functions

import (
	"fmt"

	"github.com/influxdata/ifql/query"
	"github.com/influxdata/ifql/query/execute"
	"github.com/influxdata/ifql/query/plan"
)

const CumulativeSumKind = "cumulativeSum"

type CumulativeSumOpSpec struct{}

var cumulativeSumSignature = query.DefaultFunctionSignature()

func init() {
	query.RegisterFunction(CumulativeSumKind, createCumulativeSumOpSpec, cumulativeSumSignature)
	query.RegisterOpSpec(CumulativeSumKind, newCumulativeSumOp)
	plan.RegisterProcedureSpec(CumulativeSumKind, newCumulativeSumProcedure, CumulativeSumKind)
	execute.RegisterTransformation(CumulativeSumKind, createCumulativeSumTransformation)
}

func createCumulativeSumOpSpec(args query.Arguments, a *query.Administration) (query.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	spec := new(CumulativeSumOpSpec)
	return spec, nil
}

func newCumulativeSumOp() query.OperationSpec {
	return new(CumulativeSumOpSpec)
}

func (s *CumulativeSumOpSpec) Kind() query.OperationKind {
	return CumulativeSumKind
}

type CumulativeSumProcedureSpec struct{}

func newCumulativeSumProcedure(qs query.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	_, ok := qs.(*CumulativeSumOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}

	return &CumulativeSumProcedureSpec{}, nil
}

func (s *CumulativeSumProcedureSpec) Kind() plan.ProcedureKind {
	return CumulativeSumKind
}
func (s *CumulativeSumProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(CumulativeSumProcedureSpec)
	*ns = *s
	return ns
}

func createCumulativeSumTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	s, ok := spec.(*CumulativeSumProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", spec)
	}
	cache := execute.NewBlockBuilderCache(a.Allocator())
	d := execute.NewDataset(id, mode, cache)
	t := NewCumulativeSumTransformation(d, cache, s)
	return t, d, nil
}

type cumulativeSumTransformation struct {
	d     execute.Dataset
	cache execute.BlockBuilderCache
}

func NewCumulativeSumTransformation(d execute.Dataset, cache execute.BlockBuilderCache, spec *CumulativeSumProcedureSpec) *cumulativeSumTransformation {
	return &cumulativeSumTransformation{
		d:     d,
		cache: cache,
	}
}

func (t *cumulativeSumTransformation) RetractBlock(id execute.DatasetID, meta execute.BlockMetadata) error {
	return t.d.RetractBlock(execute.ToBlockKey(meta))
}

func (t *cumulativeSumTransformation) Process(id execute.DatasetID, b execute.Block) error {
	builder, new := t.cache.BlockBuilder(b)
	if new {
		execute.AddBlockCols(b, builder)
	}
	columns := b.Cols()
	cumulativeSums := cumulativeSumSlice(columns)
	b.Times().DoTime(func(ts []execute.Time, rr execute.RowReader) {
		for i, _ := range ts {
			for j, c := range columns {
				switch c.Kind {
				case execute.TimeColKind:
					builder.AppendTime(j, rr.AtTime(i, j))
				case execute.ValueColKind:
					switch c.Type {
					case execute.TInt:
						cumSum := cumulativeSums[j].addInt(rr.AtInt(i, j))
						builder.AppendInt(j, cumSum)
					case execute.TUInt:
						cumSum := cumulativeSums[j].addUInt(rr.AtUInt(i, j))
						builder.AppendUInt(j, cumSum)
					case execute.TFloat:
						cumSum := cumulativeSums[j].addFloat(rr.AtFloat(i, j))
						builder.AppendFloat(j, cumSum)
					case execute.TBool:
						builder.AppendBool(j, rr.AtBool(i, j))
					case execute.TString:
						builder.AppendString(j, rr.AtString(i, j))
					}
				case execute.TagColKind:
					builder.AppendString(j, rr.AtString(i, j))
				}
			}
		}
	})
	return nil
}

func (t *cumulativeSumTransformation) UpdateWatermark(id execute.DatasetID, mark execute.Time) error {
	return t.d.UpdateWatermark(mark)
}
func (t *cumulativeSumTransformation) UpdateProcessingTime(id execute.DatasetID, pt execute.Time) error {
	return t.d.UpdateProcessingTime(pt)
}
func (t *cumulativeSumTransformation) Finish(id execute.DatasetID, err error) {
	t.d.Finish(err)
}

type cumulativeSum struct {
	intVal   int64
	uintVal  uint64
	floatVal float64
}

func (cumSum *cumulativeSum) addInt(val int64) int64 {
	cumSum.intVal += val
	return cumSum.intVal
}

func (cumSum *cumulativeSum) addUInt(val uint64) uint64 {
	cumSum.uintVal += val
	return cumSum.uintVal
}

func (cumSum *cumulativeSum) addFloat(val float64) float64 {
	cumSum.floatVal += val
	return cumSum.floatVal
}

func cumulativeSumSlice(columns []execute.ColMeta) []*cumulativeSum {
	sumSlice := make([]*cumulativeSum, len(columns))
	for j, _ := range columns {
		sumSlice[j] = &cumulativeSum{}
	}
	return sumSlice
}
