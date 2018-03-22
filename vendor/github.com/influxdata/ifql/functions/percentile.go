package functions

import (
	"fmt"
	"math"
	"sort"

	"github.com/influxdata/ifql/query"
	"github.com/influxdata/ifql/query/execute"
	"github.com/influxdata/ifql/query/plan"
	"github.com/influxdata/ifql/semantic"
	"github.com/influxdata/tdigest"
	"github.com/pkg/errors"
)

const PercentileKind = "percentile"
const ExactPercentileKind = "exact-percentile"

type PercentileOpSpec struct {
	Percentile  float64 `json:"percentile"`
	Compression float64 `json:"compression"`
	Exact       bool    `json:"exact"`
}

var percentileSignature = query.DefaultFunctionSignature()

func init() {
	percentileSignature.Params["p"] = semantic.Float

	query.RegisterFunction(PercentileKind, createPercentileOpSpec, percentileSignature)
	query.RegisterBuiltIn("percentile", percentileBuiltin)

	query.RegisterOpSpec(PercentileKind, newPercentileOp)
	plan.RegisterProcedureSpec(PercentileKind, newPercentileProcedure, PercentileKind)
	execute.RegisterTransformation(PercentileKind, createPercentileTransformation)
	execute.RegisterTransformation(ExactPercentileKind, createExactPercentileTransformation)
}

var percentileBuiltin = `
// median returns the 50th percentile.
// By default an approximate percentile is computed, this can be disabled by passing exact:true.
// Using the exact method requires that the entire data set can fit in memory.
median = (exact=false, compression=0.0, table=<-) => percentile(table:table, p:0.5, exact:exact, compression:compression)
`

func createPercentileOpSpec(args query.Arguments, a *query.Administration) (query.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	spec := new(PercentileOpSpec)
	p, err := args.GetRequiredFloat("p")
	if err != nil {
		return nil, err
	}
	spec.Percentile = p

	if spec.Percentile < 0 || spec.Percentile > 1 {
		return nil, errors.New("percentile must be between 0 and 1.")
	}

	if c, ok, err := args.GetFloat("compression"); err != nil {
		return nil, err
	} else if ok {
		spec.Compression = c
	}

	if exact, ok, err := args.GetBool("exact"); err != nil {
		return nil, err
	} else if ok {
		spec.Exact = exact
	}

	if spec.Compression > 0 && spec.Exact {
		return nil, errors.New("cannot specify both compression and exact.")
	}

	// Set default Compression if not exact
	if !spec.Exact && spec.Compression == 0 {
		spec.Compression = 1000
	}

	return spec, nil
}

func newPercentileOp() query.OperationSpec {
	return new(PercentileOpSpec)
}

func (s *PercentileOpSpec) Kind() query.OperationKind {
	return PercentileKind
}

type PercentileProcedureSpec struct {
	Percentile  float64 `json:"percentile"`
	Compression float64 `json:"compression"`
}

func (s *PercentileProcedureSpec) Kind() plan.ProcedureKind {
	return PercentileKind
}
func (s *PercentileProcedureSpec) Copy() plan.ProcedureSpec {
	return &PercentileProcedureSpec{
		Percentile:  s.Percentile,
		Compression: s.Compression,
	}
}

type ExactPercentileProcedureSpec struct {
	Percentile float64 `json:"percentile"`
}

func (s *ExactPercentileProcedureSpec) Kind() plan.ProcedureKind {
	return ExactPercentileKind
}
func (s *ExactPercentileProcedureSpec) Copy() plan.ProcedureSpec {
	return &ExactPercentileProcedureSpec{Percentile: s.Percentile}
}

func newPercentileProcedure(qs query.OperationSpec, a plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*PercentileOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}
	if spec.Exact {
		return &ExactPercentileProcedureSpec{
			Percentile: spec.Percentile,
		}, nil
	}
	return &PercentileProcedureSpec{
		Percentile:  spec.Percentile,
		Compression: spec.Compression,
	}, nil
}

type PercentileAgg struct {
	Quantile,
	Compression float64

	digest *tdigest.TDigest
}

func createPercentileTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	ps, ok := spec.(*PercentileProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", ps)
	}
	agg := &PercentileAgg{
		Quantile:    ps.Percentile,
		Compression: ps.Compression,
	}
	t, d := execute.NewAggregateTransformationAndDataset(id, mode, a.Bounds(), agg, a.Allocator())
	return t, d, nil
}

func (a *PercentileAgg) reset() {
	a.digest = tdigest.NewWithCompression(a.Compression)
}
func (a *PercentileAgg) NewBoolAgg() execute.DoBoolAgg {
	return nil
}

func (a *PercentileAgg) NewIntAgg() execute.DoIntAgg {
	return nil
}

func (a *PercentileAgg) NewUIntAgg() execute.DoUIntAgg {
	return nil
}

func (a *PercentileAgg) NewFloatAgg() execute.DoFloatAgg {
	a.reset()
	return a
}

func (a *PercentileAgg) NewStringAgg() execute.DoStringAgg {
	return nil
}

func (a *PercentileAgg) DoFloat(vs []float64) {
	for _, v := range vs {
		a.digest.Add(v, 1)
	}
}

func (a *PercentileAgg) Type() execute.DataType {
	return execute.TFloat
}
func (a *PercentileAgg) ValueFloat() float64 {
	return a.digest.Quantile(a.Quantile)
}

type ExactPercentileAgg struct {
	Quantile float64

	data []float64
}

func createExactPercentileTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	ps, ok := spec.(*ExactPercentileProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", ps)
	}
	agg := &ExactPercentileAgg{
		Quantile: ps.Percentile,
	}
	t, d := execute.NewAggregateTransformationAndDataset(id, mode, a.Bounds(), agg, a.Allocator())
	return t, d, nil
}

func (a *ExactPercentileAgg) reset() {
	a.data = a.data[0:0]
}
func (a *ExactPercentileAgg) NewBoolAgg() execute.DoBoolAgg {
	return nil
}

func (a *ExactPercentileAgg) NewIntAgg() execute.DoIntAgg {
	return nil
}

func (a *ExactPercentileAgg) NewUIntAgg() execute.DoUIntAgg {
	return nil
}

func (a *ExactPercentileAgg) NewFloatAgg() execute.DoFloatAgg {
	a.reset()
	return a
}

func (a *ExactPercentileAgg) NewStringAgg() execute.DoStringAgg {
	return nil
}

func (a *ExactPercentileAgg) DoFloat(vs []float64) {
	a.data = append(a.data, vs...)
}

func (a *ExactPercentileAgg) Type() execute.DataType {
	return execute.TFloat
}

func (a *ExactPercentileAgg) ValueFloat() float64 {
	sort.Float64s(a.data)

	x := a.Quantile * float64(len(a.data)-1)
	x0 := math.Floor(x)
	x1 := math.Ceil(x)

	if x0 == x1 {
		return a.data[int(x0)]
	}

	// Linear interpolate
	y0 := a.data[int(x0)]
	y1 := a.data[int(x1)]
	y := y0*(x1-x) + y1*(x-x0)

	return y
}
