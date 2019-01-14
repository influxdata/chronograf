package transformations

import (
	"fmt"
	"math"
	"sort"

	"github.com/apache/arrow/go/arrow/array"
	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/memory"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/semantic"
	"github.com/influxdata/tdigest"
	"github.com/pkg/errors"
)

const PercentileKind = "percentile"
const ExactPercentileAggKind = "exact-percentile-aggregate"
const ExactPercentileSelectKind = "exact-percentile-selector"

const (
	methodEstimateTdigest = "estimate_tdigest"
	methodExactMean       = "exact_mean"
	methodExactSelector   = "exact_selector"
)

type PercentileOpSpec struct {
	Percentile  float64 `json:"percentile"`
	Compression float64 `json:"compression"`
	Method      string  `json:"method"`
	// percentile is either an aggregate, or a selector based on the options
	execute.AggregateConfig
	execute.SelectorConfig
}

func init() {
	percentileSignature := flux.FunctionSignature(
		map[string]semantic.PolyType{
			"column":      semantic.String,
			"percentile":  semantic.Float,
			"compression": semantic.Float,
			"method":      semantic.String,
		},
		[]string{"percentile"},
	)

	flux.RegisterFunction(PercentileKind, createPercentileOpSpec, percentileSignature)
	flux.RegisterBuiltIn("median", medianBuiltin)

	flux.RegisterOpSpec(PercentileKind, newPercentileOp)
	plan.RegisterProcedureSpec(PercentileKind, newPercentileProcedure, PercentileKind)
	execute.RegisterTransformation(PercentileKind, createPercentileTransformation)
	execute.RegisterTransformation(ExactPercentileAggKind, createExactPercentileAggTransformation)
	execute.RegisterTransformation(ExactPercentileSelectKind, createExactPercentileSelectTransformation)
}

var medianBuiltin = `
// median returns the 50th percentile.
// By default an approximate percentile is computed, this can be disabled by passing exact:true.
// Using the exact method requires that the entire data set can fit in memory.
median = (method="estimate_tdigest", compression=0.0, tables=<-) =>
    tables
        |> percentile(percentile:0.5, method:method, compression:compression)
`

func createPercentileOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	spec := new(PercentileOpSpec)
	p, err := args.GetRequiredFloat("percentile")
	if err != nil {
		return nil, err
	}
	spec.Percentile = p

	if spec.Percentile < 0 || spec.Percentile > 1 {
		return nil, errors.New("percentile must be between 0 and 1.")
	}

	if m, ok, err := args.GetString("method"); err != nil {
		return nil, err
	} else if ok {
		spec.Method = m
	}

	if c, ok, err := args.GetFloat("compression"); err != nil {
		return nil, err
	} else if ok {
		spec.Compression = c
	}

	if spec.Compression > 0 && spec.Method != methodEstimateTdigest {
		return nil, errors.New("compression parameter is only valid for method estimate_tdigest.")
	}

	// Set default Compression if not exact
	if spec.Method == methodEstimateTdigest && spec.Compression == 0 {
		spec.Compression = 1000
	}

	if err := spec.AggregateConfig.ReadArgs(args); err != nil {
		return nil, err
	}

	if err := spec.SelectorConfig.ReadArgs(args); err != nil {
		return nil, err
	}

	return spec, nil
}

func newPercentileOp() flux.OperationSpec {
	return new(PercentileOpSpec)
}

func (s *PercentileOpSpec) Kind() flux.OperationKind {
	return PercentileKind
}

type TDigestPercentileProcedureSpec struct {
	Percentile  float64 `json:"percentile"`
	Compression float64 `json:"compression"`
	execute.AggregateConfig
}

func (s *TDigestPercentileProcedureSpec) Kind() plan.ProcedureKind {
	return PercentileKind
}
func (s *TDigestPercentileProcedureSpec) Copy() plan.ProcedureSpec {
	return &TDigestPercentileProcedureSpec{
		Percentile:      s.Percentile,
		Compression:     s.Compression,
		AggregateConfig: s.AggregateConfig,
	}
}

type ExactPercentileAggProcedureSpec struct {
	Percentile float64 `json:"percentile"`
	execute.AggregateConfig
}

func (s *ExactPercentileAggProcedureSpec) Kind() plan.ProcedureKind {
	return ExactPercentileAggKind
}
func (s *ExactPercentileAggProcedureSpec) Copy() plan.ProcedureSpec {
	return &ExactPercentileAggProcedureSpec{Percentile: s.Percentile, AggregateConfig: s.AggregateConfig}
}

type ExactPercentileSelectProcedureSpec struct {
	Percentile float64 `json:"percentile"`
	execute.SelectorConfig
}

func (s *ExactPercentileSelectProcedureSpec) Kind() plan.ProcedureKind {
	return ExactPercentileSelectKind
}
func (s *ExactPercentileSelectProcedureSpec) Copy() plan.ProcedureSpec {
	return &ExactPercentileSelectProcedureSpec{Percentile: s.Percentile}
}

func newPercentileProcedure(qs flux.OperationSpec, a plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*PercentileOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}

	switch spec.Method {
	case methodExactMean:
		return &ExactPercentileAggProcedureSpec{
			Percentile:      spec.Percentile,
			AggregateConfig: spec.AggregateConfig,
		}, nil
	case methodExactSelector:
		return &ExactPercentileSelectProcedureSpec{
			Percentile: spec.Percentile,
		}, nil
	case methodEstimateTdigest:
		fallthrough
	default:
		// default to estimated percentile
		return &TDigestPercentileProcedureSpec{
			Percentile:      spec.Percentile,
			Compression:     spec.Compression,
			AggregateConfig: spec.AggregateConfig,
		}, nil
	}
}

type PercentileAgg struct {
	Quantile,
	Compression float64

	digest *tdigest.TDigest
}

func createPercentileTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	ps, ok := spec.(*TDigestPercentileProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", ps)
	}
	agg := &PercentileAgg{
		Quantile:    ps.Percentile,
		Compression: ps.Compression,
	}
	t, d := execute.NewAggregateTransformationAndDataset(id, mode, agg, ps.AggregateConfig, a.Allocator())
	return t, d, nil
}
func (a *PercentileAgg) Copy() *PercentileAgg {
	na := new(PercentileAgg)
	*na = *a
	na.digest = tdigest.NewWithCompression(na.Compression)
	return na
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
	return a.Copy()
}

func (a *PercentileAgg) NewStringAgg() execute.DoStringAgg {
	return nil
}

func (a *PercentileAgg) DoFloat(vs *array.Float64) {
	for _, v := range vs.Float64Values() {
		a.digest.Add(v, 1)
	}
}

func (a *PercentileAgg) Type() flux.ColType {
	return flux.TFloat
}
func (a *PercentileAgg) ValueFloat() float64 {
	return a.digest.Quantile(a.Quantile)
}

type ExactPercentileAgg struct {
	Quantile float64
	data     []float64
}

func createExactPercentileAggTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	ps, ok := spec.(*ExactPercentileAggProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", ps)
	}
	agg := &ExactPercentileAgg{
		Quantile: ps.Percentile,
	}
	t, d := execute.NewAggregateTransformationAndDataset(id, mode, agg, ps.AggregateConfig, a.Allocator())
	return t, d, nil
}

func (a *ExactPercentileAgg) Copy() *ExactPercentileAgg {
	na := new(ExactPercentileAgg)
	*na = *a
	na.data = nil
	return na
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
	return a.Copy()
}

func (a *ExactPercentileAgg) NewStringAgg() execute.DoStringAgg {
	return nil
}

func (a *ExactPercentileAgg) DoFloat(vs *array.Float64) {
	a.data = append(a.data, vs.Float64Values()...)
}

func (a *ExactPercentileAgg) Type() flux.ColType {
	return flux.TFloat
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

func createExactPercentileSelectTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	ps, ok := spec.(*ExactPercentileSelectProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", ps)
	}

	cache := execute.NewTableBuilderCache(a.Allocator())
	d := execute.NewDataset(id, mode, cache)
	t := NewExactPercentileSelectorTransformation(d, cache, ps, a.Allocator())

	return t, d, nil
}

type ExactPercentileSelectorTransformation struct {
	d     execute.Dataset
	cache execute.TableBuilderCache
	spec  ExactPercentileSelectProcedureSpec
	a     *memory.Allocator
}

func NewExactPercentileSelectorTransformation(d execute.Dataset, cache execute.TableBuilderCache, spec *ExactPercentileSelectProcedureSpec, a *memory.Allocator) *ExactPercentileSelectorTransformation {
	if spec.SelectorConfig.Column == "" {
		spec.SelectorConfig.Column = execute.DefaultValueColLabel
	}

	sel := &ExactPercentileSelectorTransformation{
		d:     d,
		cache: cache,
		spec:  *spec,
		a:     a,
	}
	return sel
}

func (t *ExactPercentileSelectorTransformation) Process(id execute.DatasetID, tbl flux.Table) error {
	valueIdx := execute.ColIdx(t.spec.Column, tbl.Cols())
	if valueIdx < 0 {
		return fmt.Errorf("no column %q exists", t.spec.Column)
	}

	copyTable := execute.NewColListTableBuilder(tbl.Key(), t.a)
	if err := execute.AddTableCols(tbl, copyTable); err != nil {
		return err
	}
	if err := execute.AppendTable(tbl, copyTable); err != nil {
		return err
	}
	copyTable.Sort([]string{t.spec.Column}, false)

	n := copyTable.NRows()
	index := getQuantileIndex(t.spec.Percentile, n)
	row := copyTable.GetRow(index)

	builder, created := t.cache.TableBuilder(tbl.Key())
	if !created {
		return fmt.Errorf("found duplicate table with key: %v", tbl.Key())
	}
	if err := execute.AddTableCols(tbl, builder); err != nil {
		return err
	}

	for j, col := range builder.Cols() {
		v, ok := row.Get(col.Label)
		if !ok {
			return fmt.Errorf("unexpected column in percentile select")
		}
		if err := builder.AppendValue(j, v); err != nil {
			return err
		}
	}

	return nil
}

func getQuantileIndex(quantile float64, len int) int {
	x := quantile * float64(len)
	index := int(math.Ceil(x))
	if index > 0 {
		index--
	}
	return index
}

func (t *ExactPercentileSelectorTransformation) RetractTable(id execute.DatasetID, key flux.GroupKey) error {
	return t.d.RetractTable(key)
}

func (t *ExactPercentileSelectorTransformation) UpdateWatermark(id execute.DatasetID, mark execute.Time) error {
	return t.d.UpdateWatermark(mark)
}

func (t *ExactPercentileSelectorTransformation) UpdateProcessingTime(id execute.DatasetID, pt execute.Time) error {
	return t.d.UpdateProcessingTime(pt)
}

func (t *ExactPercentileSelectorTransformation) Finish(id execute.DatasetID, err error) {
	t.d.Finish(err)
}
