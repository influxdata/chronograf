package transformations

import (
	"fmt"
	"math"
	"regexp"
	"sort"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/interpreter"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/semantic"
	"github.com/influxdata/flux/values"
	"github.com/pkg/errors"
)

const HistogramKind = "histogram"

type HistogramOpSpec struct {
	Column           string    `json:"column"`
	UpperBoundColumn string    `json:"upperBoundColumn"`
	CountColumn      string    `json:"countColumn"`
	Buckets          []float64 `json:"buckets"`
	Normalize        bool      `json:"normalize"`
}

func init() {
	histogramSignature := execute.AggregateSignature(
		map[string]semantic.PolyType{
			"column":           semantic.String,
			"upperBoundColumn": semantic.String,
			"buckets":          semantic.NewArrayPolyType(semantic.Float),
			"normalize":        semantic.Bool,
		},
		[]string{"buckets"},
	)

	flux.RegisterFunction(HistogramKind, createHistogramOpSpec, histogramSignature)
	flux.RegisterBuiltInValue("linearBuckets", linearBuckets{})
	flux.RegisterBuiltInValue("logarithmicBuckets", logarithmicBuckets{})
	flux.RegisterOpSpec(HistogramKind, newHistogramOp)
	plan.RegisterProcedureSpec(HistogramKind, newHistogramProcedure, HistogramKind)
	execute.RegisterTransformation(HistogramKind, createHistogramTransformation)
}

func createHistogramOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	spec := new(HistogramOpSpec)

	if col, ok, err := args.GetString("column"); err != nil {
		return nil, err
	} else if ok {
		spec.Column = col
	} else {
		spec.Column = execute.DefaultValueColLabel
	}
	if col, ok, err := args.GetString("upperBoundColumn"); err != nil {
		return nil, err
	} else if ok {
		spec.UpperBoundColumn = col
	} else {
		spec.UpperBoundColumn = DefaultUpperBoundColumnLabel
	}
	if col, ok, err := args.GetString("countColumn"); err != nil {
		return nil, err
	} else if ok {
		spec.CountColumn = col
	} else {
		spec.CountColumn = execute.DefaultValueColLabel
	}
	bucketsArry, err := args.GetRequiredArray("buckets", semantic.Float)
	if err != nil {
		return nil, err
	}
	spec.Buckets, err = interpreter.ToFloatArray(bucketsArry)
	if err != nil {
		return nil, err
	}
	if normalize, ok, err := args.GetBool("normalize"); err != nil {
		return nil, err
	} else if ok {
		spec.Normalize = normalize
	}

	return spec, nil
}

func newHistogramOp() flux.OperationSpec {
	return new(HistogramOpSpec)
}

func (s *HistogramOpSpec) Kind() flux.OperationKind {
	return HistogramKind
}

type HistogramProcedureSpec struct {
	plan.DefaultCost
	HistogramOpSpec
}

func newHistogramProcedure(qs flux.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*HistogramOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}

	return &HistogramProcedureSpec{
		HistogramOpSpec: *spec,
	}, nil
}

func (s *HistogramProcedureSpec) Kind() plan.ProcedureKind {
	return HistogramKind
}
func (s *HistogramProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(HistogramProcedureSpec)
	*ns = *s
	if len(s.Buckets) > 0 {
		ns.Buckets = make([]float64, len(s.Buckets))
		copy(ns.Buckets, s.Buckets)
	}
	return ns
}

func createHistogramTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	s, ok := spec.(*HistogramProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", spec)
	}
	cache := execute.NewTableBuilderCache(a.Allocator())
	d := execute.NewDataset(id, mode, cache)
	t := NewHistogramTransformation(d, cache, s)
	return t, d, nil
}

type histogramTransformation struct {
	d     execute.Dataset
	cache execute.TableBuilderCache

	spec HistogramProcedureSpec
}

func NewHistogramTransformation(d execute.Dataset, cache execute.TableBuilderCache, spec *HistogramProcedureSpec) *histogramTransformation {
	sort.Float64s(spec.Buckets)
	return &histogramTransformation{
		d:     d,
		cache: cache,
		spec:  *spec,
	}
}

func (t *histogramTransformation) RetractTable(id execute.DatasetID, key flux.GroupKey) error {
	return t.d.RetractTable(key)
}

func (t *histogramTransformation) Process(id execute.DatasetID, tbl flux.Table) error {
	builder, created := t.cache.TableBuilder(tbl.Key())
	if !created {
		return fmt.Errorf("histogram found duplicate table with key: %v", tbl.Key())
	}
	valueIdx := execute.ColIdx(t.spec.Column, tbl.Cols())
	if valueIdx < 0 {
		return fmt.Errorf("column %q is missing", t.spec.Column)
	}
	if col := tbl.Cols()[valueIdx]; col.Type != flux.TFloat {
		return fmt.Errorf("column %q must be a float got %v", t.spec.Column, col.Type)
	}

	err := execute.AddTableKeyCols(tbl.Key(), builder)
	if err != nil {
		return err
	}
	boundIdx, err := builder.AddCol(flux.ColMeta{
		Label: t.spec.UpperBoundColumn,
		Type:  flux.TFloat,
	})
	if err != nil {
		return err
	}
	countIdx, err := builder.AddCol(flux.ColMeta{
		Label: t.spec.CountColumn,
		Type:  flux.TFloat,
	})
	if err != nil {
		return err
	}
	totalRows := 0.0
	counts := make([]float64, len(t.spec.Buckets))
	err = tbl.Do(func(cr flux.ColReader) error {
		totalRows += float64(cr.Len())
		for _, v := range cr.Floats(valueIdx) {
			idx := sort.Search(len(t.spec.Buckets), func(i int) bool {
				return v <= t.spec.Buckets[i]
			})
			if idx >= len(t.spec.Buckets) {
				// Greater than highest bucket, or not found
				return fmt.Errorf("found value greater than any bucket, %d %d %f %f", idx, len(t.spec.Buckets), v, t.spec.Buckets[len(t.spec.Buckets)-1])
			}
			// Increment counter
			counts[idx]++
		}
		return nil
	})
	if err != nil {
		return err
	}

	// Add records making counts cumulative
	total := 0.0
	for i, v := range counts {
		if err := execute.AppendKeyValues(tbl.Key(), builder); err != nil {
			return err
		}
		count := v + total
		if t.spec.Normalize {
			count /= totalRows
		}
		if err := builder.AppendFloat(countIdx, count); err != nil {
			return err
		}
		if err := builder.AppendFloat(boundIdx, t.spec.Buckets[i]); err != nil {
			return err
		}
		total += v
	}
	return nil
}

func (t *histogramTransformation) UpdateWatermark(id execute.DatasetID, mark execute.Time) error {
	return t.d.UpdateWatermark(mark)
}
func (t *histogramTransformation) UpdateProcessingTime(id execute.DatasetID, pt execute.Time) error {
	return t.d.UpdateProcessingTime(pt)
}
func (t *histogramTransformation) Finish(id execute.DatasetID, err error) {
	t.d.Finish(err)
}

// linearBuckets is a helper function for creating buckets spaced linearly
type linearBuckets struct{}

var linearBucketsType = semantic.NewFunctionType(semantic.FunctionSignature{
	Parameters: map[string]semantic.Type{
		"start":    semantic.Float,
		"width":    semantic.Float,
		"count":    semantic.Int,
		"infinity": semantic.Bool,
	},
	Required: semantic.LabelSet{"start", "width", "count"},
	Return:   semantic.NewArrayType(semantic.Float),
})
var linearBucketsPolyType = linearBucketsType.PolyType()

func (b linearBuckets) Type() semantic.Type {
	return linearBucketsType
}
func (b linearBuckets) PolyType() semantic.PolyType {
	return linearBucketsPolyType
}

func (b linearBuckets) Str() string {
	panic(values.UnexpectedKind(semantic.String, semantic.Function))
}

func (b linearBuckets) Int() int64 {
	panic(values.UnexpectedKind(semantic.Int, semantic.Function))
}

func (b linearBuckets) UInt() uint64 {
	panic(values.UnexpectedKind(semantic.UInt, semantic.Function))
}

func (b linearBuckets) Float() float64 {
	panic(values.UnexpectedKind(semantic.Float, semantic.Function))
}

func (b linearBuckets) Bool() bool {
	panic(values.UnexpectedKind(semantic.Bool, semantic.Function))
}

func (b linearBuckets) Time() values.Time {
	panic(values.UnexpectedKind(semantic.Time, semantic.Function))
}

func (b linearBuckets) Duration() values.Duration {
	panic(values.UnexpectedKind(semantic.Duration, semantic.Function))
}

func (b linearBuckets) Regexp() *regexp.Regexp {
	panic(values.UnexpectedKind(semantic.Regexp, semantic.Function))
}

func (b linearBuckets) Array() values.Array {
	panic(values.UnexpectedKind(semantic.Array, semantic.Function))
}

func (b linearBuckets) Object() values.Object {
	panic(values.UnexpectedKind(semantic.Object, semantic.Function))
}

func (b linearBuckets) Function() values.Function {
	return b
}

func (b linearBuckets) Equal(rhs values.Value) bool {
	if b.Type() != rhs.Type() {
		return false
	}
	_, ok := rhs.(linearBuckets)
	return ok
}

func (b linearBuckets) HasSideEffect() bool {
	return false
}

func (b linearBuckets) Call(args values.Object) (values.Value, error) {
	startV, ok := args.Get("start")
	if !ok {
		return nil, errors.New("start is required")
	}
	if startV.Type() != semantic.Float {
		return nil, errors.New("start must be a float")
	}
	widthV, ok := args.Get("width")
	if !ok {
		return nil, errors.New("width is required")
	}
	if widthV.Type() != semantic.Float {
		return nil, errors.New("width must be a float")
	}
	countV, ok := args.Get("count")
	if !ok {
		return nil, errors.New("count is required")
	}
	if countV.Type() != semantic.Int {
		return nil, errors.New("count must be an int")
	}
	infV, ok := args.Get("infinity")
	if !ok {
		infV = values.NewBool(true)
	}
	if infV.Type() != semantic.Bool {
		return nil, errors.New("infinity must be a bool")
	}
	start := startV.Float()
	width := widthV.Float()
	count := countV.Int()
	inf := infV.Bool()
	l := int(count)
	if inf {
		l++
	}
	elements := make([]values.Value, l)
	bound := start
	for i := 0; i < l; i++ {
		elements[i] = values.NewFloat(bound)
		bound += width
	}
	if inf {
		elements[l-1] = values.NewFloat(math.Inf(1))
	}
	counts := values.NewArrayWithBacking(semantic.Float, elements)
	return counts, nil
}

// logarithmicBuckets is a helper function for creating buckets spaced by an logarithmic factor.
type logarithmicBuckets struct{}

var logarithmicBucketsType = semantic.NewFunctionType(semantic.FunctionSignature{
	Parameters: map[string]semantic.Type{
		"start":    semantic.Float,
		"factor":   semantic.Float,
		"count":    semantic.Int,
		"infinity": semantic.Bool,
	},
	Required: semantic.LabelSet{"start", "factor", "count"},
	Return:   semantic.NewArrayType(semantic.Float),
})
var logarithmicBucketsPolyType = logarithmicBucketsType.PolyType()

func (b logarithmicBuckets) Type() semantic.Type {
	return logarithmicBucketsType
}
func (b logarithmicBuckets) PolyType() semantic.PolyType {
	return logarithmicBucketsPolyType
}

func (b logarithmicBuckets) Str() string {
	panic(values.UnexpectedKind(semantic.String, semantic.Function))
}

func (b logarithmicBuckets) Int() int64 {
	panic(values.UnexpectedKind(semantic.Int, semantic.Function))
}

func (b logarithmicBuckets) UInt() uint64 {
	panic(values.UnexpectedKind(semantic.UInt, semantic.Function))
}

func (b logarithmicBuckets) Float() float64 {
	panic(values.UnexpectedKind(semantic.Float, semantic.Function))
}

func (b logarithmicBuckets) Bool() bool {
	panic(values.UnexpectedKind(semantic.Bool, semantic.Function))
}

func (b logarithmicBuckets) Time() values.Time {
	panic(values.UnexpectedKind(semantic.Time, semantic.Function))
}

func (b logarithmicBuckets) Duration() values.Duration {
	panic(values.UnexpectedKind(semantic.Duration, semantic.Function))
}

func (b logarithmicBuckets) Regexp() *regexp.Regexp {
	panic(values.UnexpectedKind(semantic.Regexp, semantic.Function))
}

func (b logarithmicBuckets) Array() values.Array {
	panic(values.UnexpectedKind(semantic.Array, semantic.Function))
}

func (b logarithmicBuckets) Object() values.Object {
	panic(values.UnexpectedKind(semantic.Object, semantic.Function))
}

func (b logarithmicBuckets) Function() values.Function {
	return b
}

func (b logarithmicBuckets) Equal(rhs values.Value) bool {
	if b.Type() != rhs.Type() {
		return false
	}
	_, ok := rhs.(logarithmicBuckets)
	return ok
}

func (b logarithmicBuckets) HasSideEffect() bool {
	return false
}

func (b logarithmicBuckets) Call(args values.Object) (values.Value, error) {
	startV, ok := args.Get("start")
	if !ok {
		return nil, errors.New("start is required")
	}
	if startV.Type() != semantic.Float {
		return nil, errors.New("start must be a float")
	}
	factorV, ok := args.Get("factor")
	if !ok {
		return nil, errors.New("factor is required")
	}
	if factorV.Type() != semantic.Float {
		return nil, errors.New("factor must be a float")
	}
	countV, ok := args.Get("count")
	if !ok {
		return nil, errors.New("count is required")
	}
	if countV.Type() != semantic.Int {
		return nil, errors.New("count must be an int")
	}
	infV, ok := args.Get("infinity")
	if !ok {
		infV = values.NewBool(true)
	}
	if infV.Type() != semantic.Bool {
		return nil, errors.New("infinity must be a bool")
	}
	start := startV.Float()
	factor := factorV.Float()
	count := countV.Int()
	inf := infV.Bool()
	l := int(count)
	if inf {
		l++
	}
	elements := make([]values.Value, l)
	bound := start
	for i := 0; i < l; i++ {
		elements[i] = values.NewFloat(bound)
		bound *= factor
	}
	if inf {
		elements[l-1] = values.NewFloat(math.Inf(1))
	}
	counts := values.NewArrayWithBacking(semantic.Float, elements)
	return counts, nil
}
