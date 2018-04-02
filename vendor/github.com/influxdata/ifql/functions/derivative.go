package functions

import (
	"fmt"
	"math"
	"time"

	"github.com/influxdata/ifql/query"
	"github.com/influxdata/ifql/query/execute"
	"github.com/influxdata/ifql/query/plan"
	"github.com/influxdata/ifql/semantic"
)

const DerivativeKind = "derivative"

type DerivativeOpSpec struct {
	Unit        query.Duration `json:"unit"`
	NonNegative bool           `json:"non_negative"`
}

var derivativeSignature = query.DefaultFunctionSignature()

func init() {
	derivativeSignature.Params["unit"] = semantic.Duration
	derivativeSignature.Params["nonNegative"] = semantic.Bool

	query.RegisterFunction(DerivativeKind, createDerivativeOpSpec, derivativeSignature)
	query.RegisterOpSpec(DerivativeKind, newDerivativeOp)
	plan.RegisterProcedureSpec(DerivativeKind, newDerivativeProcedure, DerivativeKind)
	execute.RegisterTransformation(DerivativeKind, createDerivativeTransformation)
}

func createDerivativeOpSpec(args query.Arguments, a *query.Administration) (query.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	spec := new(DerivativeOpSpec)

	if unit, ok, err := args.GetDuration("unit"); err != nil {
		return nil, err
	} else if ok {
		spec.Unit = unit
	} else {
		//Default is 1s
		spec.Unit = query.Duration(time.Second)
	}

	if nn, ok, err := args.GetBool("nonNegative"); err != nil {
		return nil, err
	} else if ok {
		spec.NonNegative = nn
	}

	return spec, nil
}

func newDerivativeOp() query.OperationSpec {
	return new(DerivativeOpSpec)
}

func (s *DerivativeOpSpec) Kind() query.OperationKind {
	return DerivativeKind
}

type DerivativeProcedureSpec struct {
	Unit        query.Duration `json:"unit"`
	NonNegative bool           `json:"non_negative"`
}

func newDerivativeProcedure(qs query.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*DerivativeOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}

	return &DerivativeProcedureSpec{
		Unit:        spec.Unit,
		NonNegative: spec.NonNegative,
	}, nil
}

func (s *DerivativeProcedureSpec) Kind() plan.ProcedureKind {
	return DerivativeKind
}
func (s *DerivativeProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(DerivativeProcedureSpec)
	*ns = *s
	return ns
}

func createDerivativeTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	s, ok := spec.(*DerivativeProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", spec)
	}
	cache := execute.NewBlockBuilderCache(a.Allocator())
	d := execute.NewDataset(id, mode, cache)
	t := NewDerivativeTransformation(d, cache, s)
	return t, d, nil
}

type derivativeTransformation struct {
	d     execute.Dataset
	cache execute.BlockBuilderCache

	unit        time.Duration
	nonNegative bool
}

func NewDerivativeTransformation(d execute.Dataset, cache execute.BlockBuilderCache, spec *DerivativeProcedureSpec) *derivativeTransformation {
	return &derivativeTransformation{
		d:           d,
		cache:       cache,
		unit:        time.Duration(spec.Unit),
		nonNegative: spec.NonNegative,
	}
}

func (t *derivativeTransformation) RetractBlock(id execute.DatasetID, meta execute.BlockMetadata) error {
	return t.d.RetractBlock(execute.ToBlockKey(meta))
}

func (t *derivativeTransformation) Process(id execute.DatasetID, b execute.Block) error {
	builder, new := t.cache.BlockBuilder(b)
	if new {
		cols := b.Cols()
		for j, c := range cols {
			switch c.Kind {
			case execute.TimeColKind:
				builder.AddCol(c)
			case execute.TagColKind:
				builder.AddCol(c)
				if c.Common {
					builder.SetCommonString(j, b.Tags()[c.Label])
				}
			case execute.ValueColKind:
				dc := c
				// Derivative always results in a float64
				dc.Type = execute.TFloat
				builder.AddCol(dc)
			}
		}
	}
	cols := b.Cols()
	derivatives := make([]*derivative, len(cols))
	for j, c := range cols {
		if c.IsValue() {
			d := newDerivative(j, t.unit, t.nonNegative)
			derivatives[j] = d
		}
	}

	b.Times().DoTime(func(ts []execute.Time, rr execute.RowReader) {
		for i, t := range ts {
			include := false
			for _, d := range derivatives {
				if d == nil {
					continue
				}
				var ok bool
				j := d.col
				switch cols[j].Type {
				case execute.TInt:
					ok = d.updateInt(t, rr.AtInt(i, j))
				case execute.TUInt:
					ok = d.updateUInt(t, rr.AtUInt(i, j))
				case execute.TFloat:
					ok = d.updateFloat(t, rr.AtFloat(i, j))
				}
				include = include || ok
			}
			if include {
				for j, c := range cols {
					switch c.Kind {
					case execute.TimeColKind:
						builder.AppendTime(j, rr.AtTime(i, j))
					case execute.TagColKind:
						builder.AppendString(j, rr.AtString(i, j))
					case execute.ValueColKind:
						//TODO(nathanielc): Write null markers when we have support for null values.
						builder.AppendFloat(j, derivatives[j].value())
					}
				}
			}
		}
	})

	return nil
}

func (t *derivativeTransformation) UpdateWatermark(id execute.DatasetID, mark execute.Time) error {
	return t.d.UpdateWatermark(mark)
}
func (t *derivativeTransformation) UpdateProcessingTime(id execute.DatasetID, pt execute.Time) error {
	return t.d.UpdateProcessingTime(pt)
}
func (t *derivativeTransformation) Finish(id execute.DatasetID, err error) {
	t.d.Finish(err)
}

func newDerivative(col int, unit time.Duration, nonNegative bool) *derivative {
	return &derivative{
		col:         col,
		first:       true,
		unit:        float64(unit),
		nonNegative: nonNegative,
	}
}

type derivative struct {
	col         int
	first       bool
	unit        float64
	nonNegative bool

	pIntValue   int64
	pUIntValue  uint64
	pFloatValue float64
	pTime       execute.Time

	v float64
}

func (d *derivative) value() float64 {
	return d.v
}

func (d *derivative) updateInt(t execute.Time, v int64) bool {
	if d.first {
		d.pTime = t
		d.pIntValue = v
		d.first = false
		d.v = math.NaN()
		return false
	}

	diff := float64(v - d.pIntValue)
	elapsed := float64(time.Duration(t-d.pTime)) / d.unit

	d.pTime = t
	d.pIntValue = v

	if d.nonNegative && diff < 0 {
		d.v = math.NaN()
		return false
	}

	d.v = diff / elapsed
	return true
}
func (d *derivative) updateUInt(t execute.Time, v uint64) bool {
	if d.first {
		d.pTime = t
		d.pUIntValue = v
		d.first = false
		d.v = math.NaN()
		return false
	}

	var diff float64
	if d.pUIntValue > v {
		// Prevent uint64 overflow by applying the negative sign after the conversion to a float64.
		diff = float64(d.pUIntValue-v) * -1
	} else {
		diff = float64(v - d.pUIntValue)
	}
	elapsed := float64(time.Duration(t-d.pTime)) / d.unit

	d.pTime = t
	d.pUIntValue = v

	if d.nonNegative && diff < 0 {
		d.v = math.NaN()
		return false
	}

	d.v = diff / elapsed
	return true
}
func (d *derivative) updateFloat(t execute.Time, v float64) bool {
	if d.first {
		d.pTime = t
		d.pFloatValue = v
		d.first = false
		d.v = math.NaN()
		return false
	}

	diff := v - d.pFloatValue
	elapsed := float64(time.Duration(t-d.pTime)) / d.unit

	d.pTime = t
	d.pFloatValue = v

	if d.nonNegative && diff < 0 {
		d.v = math.NaN()
		return false
	}

	d.v = diff / elapsed
	return true
}
