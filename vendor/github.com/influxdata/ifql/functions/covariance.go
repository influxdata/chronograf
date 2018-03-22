package functions

import (
	"fmt"
	"math"

	"github.com/influxdata/ifql/query"
	"github.com/influxdata/ifql/query/execute"
	"github.com/influxdata/ifql/query/plan"
	"github.com/influxdata/ifql/semantic"
	"github.com/pkg/errors"
)

const CovarianceKind = "covariance"

type CovarianceOpSpec struct {
	PearsonCorrelation bool `json:"pearsonr"`
}

var covarianceSignature = query.DefaultFunctionSignature()

func init() {
	covarianceSignature.Params["pearsonr"] = semantic.Bool

	query.RegisterBuiltIn("covariance", covarianceBuiltIn)
	query.RegisterFunction(CovarianceKind, createCovarianceOpSpec, covarianceSignature)
	query.RegisterOpSpec(CovarianceKind, newCovarianceOp)
	plan.RegisterProcedureSpec(CovarianceKind, newCovarianceProcedure, CovarianceKind)
	execute.RegisterTransformation(CovarianceKind, createCovarianceTransformation)
}

// covarianceBuiltIn defines a `cov` function with an automatic join.
var covarianceBuiltIn = `
cov = (x,y,on,pearsonr=false) =>
    join(
        tables:{x:x, y:y},
        on:on,
        fn: (t) => ({x:t.x._value, y:t.y._value}),
    )
    |> covariance(pearsonr:pearsonr)

pearsonr = (x,y,on) => cov(x:x, y:y, on:on, pearsonr:true)
`

func createCovarianceOpSpec(args query.Arguments, a *query.Administration) (query.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	spec := new(CovarianceOpSpec)
	pearsonr, ok, err := args.GetBool("pearsonr")
	if err != nil {
		return nil, err
	} else if ok {
		spec.PearsonCorrelation = pearsonr
	}
	return spec, nil
}

func newCovarianceOp() query.OperationSpec {
	return new(CovarianceOpSpec)
}

func (s *CovarianceOpSpec) Kind() query.OperationKind {
	return CovarianceKind
}

type CovarianceProcedureSpec struct {
	PearsonCorrelation bool
}

func newCovarianceProcedure(qs query.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*CovarianceOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}

	return &CovarianceProcedureSpec{
		PearsonCorrelation: spec.PearsonCorrelation,
	}, nil
}

func (s *CovarianceProcedureSpec) Kind() plan.ProcedureKind {
	return CovarianceKind
}
func (s *CovarianceProcedureSpec) Copy() plan.ProcedureSpec {
	return new(CovarianceProcedureSpec)
}

type CovarianceTransformation struct {
	d      execute.Dataset
	cache  execute.BlockBuilderCache
	bounds execute.Bounds
	spec   CovarianceProcedureSpec

	yIdx int

	n,
	xm1,
	ym1,
	xm2,
	ym2,
	xym2 float64
}

func createCovarianceTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	s, ok := spec.(*CovarianceProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", spec)
	}
	cache := execute.NewBlockBuilderCache(a.Allocator())
	d := execute.NewDataset(id, mode, cache)
	t := NewCovarianceTransformation(d, cache, s, a.Bounds())
	return t, d, nil
}

func NewCovarianceTransformation(d execute.Dataset, cache execute.BlockBuilderCache, spec *CovarianceProcedureSpec, bounds execute.Bounds) *CovarianceTransformation {
	return &CovarianceTransformation{
		d:      d,
		cache:  cache,
		bounds: bounds,
		spec:   *spec,
	}
}

func (t *CovarianceTransformation) RetractBlock(id execute.DatasetID, meta execute.BlockMetadata) error {
	key := execute.ToBlockKey(meta)
	return t.d.RetractBlock(key)
}

func (t *CovarianceTransformation) Process(id execute.DatasetID, b execute.Block) error {
	cols := b.Cols()
	builder, new := t.cache.BlockBuilder(blockMetadata{
		bounds: t.bounds,
		tags:   b.Tags(),
	})
	if new {
		builder.AddCol(execute.TimeCol)
		execute.AddTags(b.Tags(), builder)
		builder.AddCol(execute.ColMeta{
			Label: execute.DefaultValueColLabel,
			Kind:  execute.ValueColKind,
			Type:  execute.TFloat,
		})
	}
	var xIdx, yIdx = -1, -1
	for j, c := range cols {
		if c.IsValue() {
			if xIdx == -1 {
				xIdx = j
			} else if yIdx == -1 {
				yIdx = j
			} else {
				return errors.New("covariance only supports two values")
			}
		}
	}
	if xIdx == -1 {
		return errors.New("covariance must receive exactly two value columns, no value columns found")
	}
	if yIdx == -1 {
		return errors.New("covariance must receive exactly two value columns, only one value column found")
	}
	if cols[xIdx].Type != cols[yIdx].Type {
		return errors.New("cannot compute the covariance between different types")
	}
	t.yIdx = yIdx
	t.reset()
	values := b.Col(xIdx)
	switch typ := cols[xIdx].Type; typ {
	case execute.TFloat:
		values.DoFloat(t.DoFloat)
	default:
		return fmt.Errorf("covariance does not support %v", typ)
	}

	timeIdx := 0
	valueIdx := len(builder.Cols()) - 1

	// Add row for aggregate values
	builder.AppendTime(timeIdx, b.Bounds().Stop)
	builder.AppendFloat(valueIdx, t.value())

	return nil
}

func (t *CovarianceTransformation) reset() {
	t.n = 0
	t.xm1 = 0
	t.ym1 = 0
	t.xm2 = 0
	t.ym2 = 0
	t.xym2 = 0
}
func (t *CovarianceTransformation) DoFloat(xs []float64, rr execute.RowReader) {
	var xdelta, ydelta, xdelta2, ydelta2 float64
	for i, x := range xs {
		y := rr.AtFloat(i, t.yIdx)

		t.n++

		// Update means
		xdelta = x - t.xm1
		ydelta = y - t.ym1
		t.xm1 += xdelta / t.n
		t.ym1 += ydelta / t.n

		// Update variance sums
		xdelta2 = x - t.xm1
		ydelta2 = y - t.ym1
		t.xm2 += xdelta * xdelta2
		t.ym2 += ydelta * ydelta2

		// Update covariance sum
		// Covariance is symetric so we do not need to compute the yxm2 value.
		t.xym2 += xdelta * ydelta2
	}
}
func (t *CovarianceTransformation) value() float64 {
	if t.n < 2 {
		return math.NaN()
	}
	if t.spec.PearsonCorrelation {
		return (t.xym2) / math.Sqrt(t.xm2*t.ym2)
	}
	return t.xym2 / (t.n - 1)
}

func (t *CovarianceTransformation) UpdateWatermark(id execute.DatasetID, mark execute.Time) error {
	return t.d.UpdateWatermark(mark)
}

func (t *CovarianceTransformation) UpdateProcessingTime(id execute.DatasetID, pt execute.Time) error {
	return t.d.UpdateProcessingTime(pt)
}

func (t *CovarianceTransformation) Finish(id execute.DatasetID, err error) {
	t.d.Finish(err)
}
