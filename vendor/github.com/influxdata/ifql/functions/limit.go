package functions

import (
	"fmt"

	"github.com/influxdata/ifql/query"
	"github.com/influxdata/ifql/query/execute"
	"github.com/influxdata/ifql/query/plan"
	"github.com/influxdata/ifql/semantic"
)

const LimitKind = "limit"

// LimitOpSpec limits the number of rows returned per block.
// Currently offset is not supported.
type LimitOpSpec struct {
	N int64 `json:"n"`
	//Offset int64 `json:"offset"`
}

var limitSignature = query.DefaultFunctionSignature()

func init() {
	integralSignature.Params["n"] = semantic.Int

	query.RegisterFunction(LimitKind, createLimitOpSpec, limitSignature)
	query.RegisterOpSpec(LimitKind, newLimitOp)
	plan.RegisterProcedureSpec(LimitKind, newLimitProcedure, LimitKind)
	// TODO register a range transformation. Currently range is only supported if it is pushed down into a select procedure.
	execute.RegisterTransformation(LimitKind, createLimitTransformation)
}

func createLimitOpSpec(args query.Arguments, a *query.Administration) (query.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	spec := new(LimitOpSpec)

	n, err := args.GetRequiredInt("n")
	if err != nil {
		return nil, err
	}
	spec.N = n

	return spec, nil
}

func newLimitOp() query.OperationSpec {
	return new(LimitOpSpec)
}

func (s *LimitOpSpec) Kind() query.OperationKind {
	return LimitKind
}

type LimitProcedureSpec struct {
	N int64 `json:"n"`
	//Offset int64 `json:"offset"`
}

func newLimitProcedure(qs query.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*LimitOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}
	return &LimitProcedureSpec{
		N: spec.N,
		//Offset: spec.Offset,
	}, nil
}

func (s *LimitProcedureSpec) Kind() plan.ProcedureKind {
	return LimitKind
}
func (s *LimitProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(LimitProcedureSpec)
	ns.N = s.N
	//ns.Offset = s.Offset
	return ns
}

func (s *LimitProcedureSpec) PushDownRules() []plan.PushDownRule {
	return []plan.PushDownRule{{
		Root:    FromKind,
		Through: []plan.ProcedureKind{GroupKind, RangeKind, FilterKind},
	}}
}
func (s *LimitProcedureSpec) PushDown(root *plan.Procedure, dup func() *plan.Procedure) {
	selectSpec := root.Spec.(*FromProcedureSpec)
	if selectSpec.LimitSet {
		root = dup()
		selectSpec = root.Spec.(*FromProcedureSpec)
		selectSpec.LimitSet = false
		selectSpec.PointsLimit = 0
		selectSpec.SeriesLimit = 0
		selectSpec.SeriesOffset = 0
		return
	}
	selectSpec.LimitSet = true
	selectSpec.PointsLimit = s.N
	selectSpec.SeriesLimit = 0
	selectSpec.SeriesOffset = 0
}

func createLimitTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	s, ok := spec.(*LimitProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", spec)
	}
	cache := execute.NewBlockBuilderCache(a.Allocator())
	d := execute.NewDataset(id, mode, cache)
	t := NewLimitTransformation(d, cache, s)
	return t, d, nil
}

type limitTransformation struct {
	d     execute.Dataset
	cache execute.BlockBuilderCache

	n int

	colMap []int
}

func NewLimitTransformation(d execute.Dataset, cache execute.BlockBuilderCache, spec *LimitProcedureSpec) *limitTransformation {
	return &limitTransformation{
		d:     d,
		cache: cache,
		n:     int(spec.N),
	}
}

func (t *limitTransformation) RetractBlock(id execute.DatasetID, meta execute.BlockMetadata) error {
	return t.d.RetractBlock(execute.ToBlockKey(meta))
}

func (t *limitTransformation) Process(id execute.DatasetID, b execute.Block) error {
	builder, new := t.cache.BlockBuilder(b)
	if new {
		execute.AddBlockCols(b, builder)
	}

	ncols := builder.NCols()
	if cap(t.colMap) < ncols {
		t.colMap = make([]int, ncols)
		for j := range t.colMap {
			t.colMap[j] = j
		}
	} else {
		t.colMap = t.colMap[:ncols]
	}

	// AppendBlock with limit
	n := t.n
	times := b.Times()

	cols := builder.Cols()
	timeIdx := execute.TimeIdx(cols)
	times.DoTime(func(ts []execute.Time, rr execute.RowReader) {
		l := len(ts)
		if l > n {
			l = n
		}
		n -= l
		builder.AppendTimes(timeIdx, ts[:l])
		for j, c := range cols {
			if j == timeIdx || c.Common {
				continue
			}
			for i := range ts[:l] {
				switch c.Type {
				case execute.TBool:
					builder.AppendBool(j, rr.AtBool(i, t.colMap[j]))
				case execute.TInt:
					builder.AppendInt(j, rr.AtInt(i, t.colMap[j]))
				case execute.TUInt:
					builder.AppendUInt(j, rr.AtUInt(i, t.colMap[j]))
				case execute.TFloat:
					builder.AppendFloat(j, rr.AtFloat(i, t.colMap[j]))
				case execute.TString:
					builder.AppendString(j, rr.AtString(i, t.colMap[j]))
				case execute.TTime:
					builder.AppendTime(j, rr.AtTime(i, t.colMap[j]))
				default:
					execute.PanicUnknownType(c.Type)
				}
			}
		}
	})
	return nil
}

func (t *limitTransformation) UpdateWatermark(id execute.DatasetID, mark execute.Time) error {
	return t.d.UpdateWatermark(mark)
}
func (t *limitTransformation) UpdateProcessingTime(id execute.DatasetID, pt execute.Time) error {
	return t.d.UpdateProcessingTime(pt)
}
func (t *limitTransformation) Finish(id execute.DatasetID, err error) {
	t.d.Finish(err)
}
