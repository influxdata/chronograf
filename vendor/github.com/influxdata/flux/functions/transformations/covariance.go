package transformations

import (
	"fmt"
	"math"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/semantic"
	"github.com/pkg/errors"
)

const CovarianceKind = "covariance"

type CovarianceOpSpec struct {
	PearsonCorrelation bool   `json:"pearsonr"`
	ValueDst           string `json:"valueDst"`
	execute.AggregateConfig
}

func init() {
	var covarianceSignature = execute.AggregateSignature(
		map[string]semantic.PolyType{
			"pearsonr": semantic.Bool,
			"valueDst": semantic.String,
		},
		nil,
	)
	flux.RegisterBuiltIn("covariance", covarianceBuiltIn)
	flux.RegisterFunction(CovarianceKind, createCovarianceOpSpec, covarianceSignature)
	flux.RegisterOpSpec(CovarianceKind, newCovarianceOp)
	plan.RegisterProcedureSpec(CovarianceKind, newCovarianceProcedure, CovarianceKind)
	execute.RegisterTransformation(CovarianceKind, createCovarianceTransformation)
}

// covarianceBuiltIn defines a `cov` function with an automatic join.
var covarianceBuiltIn = `
cov = (x,y,on,pearsonr=false) =>
    join(
        tables:{x:x, y:y},
        on:on,
    )
    |> covariance(pearsonr:pearsonr, columns:["_value_x","_value_y"])

pearsonr = (x,y,on) => cov(x:x, y:y, on:on, pearsonr:true)
`

func createCovarianceOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
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

	label, ok, err := args.GetString("valueDst")
	if err != nil {
		return nil, err
	} else if ok {
		spec.ValueDst = label
	} else {
		spec.ValueDst = execute.DefaultValueColLabel
	}

	if err := spec.AggregateConfig.ReadArgs(args); err != nil {
		return nil, err
	}
	if len(spec.Columns) != 2 {
		return nil, errors.New("must provide exactly two columns")
	}
	return spec, nil
}

func newCovarianceOp() flux.OperationSpec {
	return new(CovarianceOpSpec)
}

func (s *CovarianceOpSpec) Kind() flux.OperationKind {
	return CovarianceKind
}

type CovarianceProcedureSpec struct {
	PearsonCorrelation bool
	ValueLabel         string
	execute.AggregateConfig
}

func newCovarianceProcedure(qs flux.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*CovarianceOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}

	return &CovarianceProcedureSpec{
		PearsonCorrelation: spec.PearsonCorrelation,
		ValueLabel:         spec.ValueDst,
		AggregateConfig:    spec.AggregateConfig,
	}, nil
}

func (s *CovarianceProcedureSpec) Kind() plan.ProcedureKind {
	return CovarianceKind
}

func (s *CovarianceProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(CovarianceProcedureSpec)
	*ns = *s

	ns.AggregateConfig = s.AggregateConfig.Copy()

	return ns
}

type CovarianceTransformation struct {
	d     execute.Dataset
	cache execute.TableBuilderCache
	spec  CovarianceProcedureSpec

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
	cache := execute.NewTableBuilderCache(a.Allocator())
	d := execute.NewDataset(id, mode, cache)
	t := NewCovarianceTransformation(d, cache, s)
	return t, d, nil
}

func NewCovarianceTransformation(d execute.Dataset, cache execute.TableBuilderCache, spec *CovarianceProcedureSpec) *CovarianceTransformation {
	return &CovarianceTransformation{
		d:     d,
		cache: cache,
		spec:  *spec,
	}
}

func (t *CovarianceTransformation) RetractTable(id execute.DatasetID, key flux.GroupKey) error {
	return t.d.RetractTable(key)
}

func (t *CovarianceTransformation) Process(id execute.DatasetID, tbl flux.Table) error {
	cols := tbl.Cols()
	builder, created := t.cache.TableBuilder(tbl.Key())
	if !created {
		return fmt.Errorf("covariance found duplicate table with key: %v", tbl.Key())
	}
	err := execute.AddTableKeyCols(tbl.Key(), builder)
	if err != nil {
		return err
	}
	valueIdx, err := builder.AddCol(flux.ColMeta{
		Label: t.spec.ValueLabel,
		Type:  flux.TFloat,
	})
	if err != nil {
		return err
	}
	xIdx := execute.ColIdx(t.spec.Columns[0], cols)
	yIdx := execute.ColIdx(t.spec.Columns[1], cols)

	if cols[xIdx].Type != cols[yIdx].Type {
		return errors.New("cannot compute the covariance between different types")
	}

	t.reset()
	err = tbl.Do(func(cr flux.ColReader) error {
		switch typ := cols[xIdx].Type; typ {
		case flux.TFloat:
			t.DoFloat(cr.Floats(xIdx), cr.Floats(yIdx))
		default:
			return fmt.Errorf("covariance does not support %v", typ)
		}
		return nil
	})
	if err != nil {
		return err
	}

	if err := execute.AppendKeyValues(tbl.Key(), builder); err != nil {
		return err
	}
	return builder.AppendFloat(valueIdx, t.value())
}

func (t *CovarianceTransformation) reset() {
	t.n = 0
	t.xm1 = 0
	t.ym1 = 0
	t.xm2 = 0
	t.ym2 = 0
	t.xym2 = 0
}
func (t *CovarianceTransformation) DoFloat(xs, ys []float64) {
	var xdelta, ydelta, xdelta2, ydelta2 float64
	for i, x := range xs {
		y := ys[i]

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
