package functions

import (
	"fmt"
	"math"

	"github.com/influxdata/ifql/query"
	"github.com/influxdata/ifql/query/execute"
	"github.com/influxdata/ifql/query/plan"
	"github.com/influxdata/ifql/semantic"
)

const DifferenceKind = "difference"

type DifferenceOpSpec struct {
	NonNegative bool `json:"non_negative"`
}

var differenceSignature = query.DefaultFunctionSignature()

func init() {
	differenceSignature.Params["nonNegative"] = semantic.Bool

	query.RegisterFunction(DifferenceKind, createDifferenceOpSpec, differenceSignature)
	query.RegisterOpSpec(DifferenceKind, newDifferenceOp)
	plan.RegisterProcedureSpec(DifferenceKind, newDifferenceProcedure, DifferenceKind)
	execute.RegisterTransformation(DifferenceKind, createDifferenceTransformation)
}

func createDifferenceOpSpec(args query.Arguments, a *query.Administration) (query.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	err := a.AddParentFromArgs(args)
	if err != nil {
		return nil, err
	}

	spec := new(DifferenceOpSpec)

	if nn, ok, err := args.GetBool("nonNegative"); err != nil {
		return nil, err
	} else if ok {
		spec.NonNegative = nn
	}

	return spec, nil
}

func newDifferenceOp() query.OperationSpec {
	return new(DifferenceOpSpec)
}

func (s *DifferenceOpSpec) Kind() query.OperationKind {
	return DifferenceKind
}

type DifferenceProcedureSpec struct {
	NonNegative bool `json:"non_negative"`
}

func newDifferenceProcedure(qs query.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*DifferenceOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}

	return &DifferenceProcedureSpec{
		NonNegative: spec.NonNegative,
	}, nil
}

func (s *DifferenceProcedureSpec) Kind() plan.ProcedureKind {
	return DifferenceKind
}
func (s *DifferenceProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(DifferenceProcedureSpec)
	*ns = *s
	return ns
}

func createDifferenceTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	s, ok := spec.(*DifferenceProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", spec)
	}
	cache := execute.NewBlockBuilderCache(a.Allocator())
	d := execute.NewDataset(id, mode, cache)
	t := NewDifferenceTransformation(d, cache, s)
	return t, d, nil
}

type differenceTransformation struct {
	d     execute.Dataset
	cache execute.BlockBuilderCache

	nonNegative bool
}

func NewDifferenceTransformation(d execute.Dataset, cache execute.BlockBuilderCache, spec *DifferenceProcedureSpec) *differenceTransformation {
	return &differenceTransformation{
		d:           d,
		cache:       cache,
		nonNegative: spec.NonNegative,
	}
}

func (t *differenceTransformation) RetractBlock(id execute.DatasetID, meta execute.BlockMetadata) error {
	return t.d.RetractBlock(execute.ToBlockKey(meta))
}

func (t *differenceTransformation) Process(id execute.DatasetID, b execute.Block) error {
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
				var typ execute.DataType
				switch c.Type {
				case execute.TInt, execute.TUInt:
					typ = execute.TInt
				case execute.TFloat:
					typ = execute.TFloat
				}
				builder.AddCol(execute.ColMeta{
					Label: c.Label,
					Kind:  execute.ValueColKind,
					Type:  typ,
				})
			}
		}
	}
	cols := b.Cols()
	differences := make([]*difference, len(cols))
	for j, c := range cols {
		if c.IsValue() {
			d := newDifference(j, t.nonNegative)
			differences[j] = d
		}
	}

	b.Times().DoTime(func(ts []execute.Time, rr execute.RowReader) {
		for i := range ts {
			include := false
			for _, d := range differences {
				if d == nil {
					continue
				}
				var ok bool
				j := d.col
				switch cols[j].Type {
				case execute.TInt:
					ok = d.updateInt(rr.AtInt(i, j))
				case execute.TUInt:
					ok = d.updateUInt(rr.AtUInt(i, j))
				case execute.TFloat:
					ok = d.updateFloat(rr.AtFloat(i, j))
				}
				include = include || ok
			}
			if include {
				for j, c := range builder.Cols() {
					switch c.Kind {
					case execute.TimeColKind:
						builder.AppendTime(j, rr.AtTime(i, j))
					case execute.TagColKind:
						builder.AppendString(j, rr.AtString(i, j))
					case execute.ValueColKind:
						//TODO(nathanielc): Write null markers when we have support for null values.
						switch c.Type {
						case execute.TInt:
							builder.AppendInt(j, differences[j].valueInt())
						case execute.TFloat:
							builder.AppendFloat(j, differences[j].valueFloat())
						}
					}
				}
			}
		}
	})

	return nil
}

func (t *differenceTransformation) UpdateWatermark(id execute.DatasetID, mark execute.Time) error {
	return t.d.UpdateWatermark(mark)
}
func (t *differenceTransformation) UpdateProcessingTime(id execute.DatasetID, pt execute.Time) error {
	return t.d.UpdateProcessingTime(pt)
}
func (t *differenceTransformation) Finish(id execute.DatasetID, err error) {
	t.d.Finish(err)
}

func newDifference(col int, nonNegative bool) *difference {
	return &difference{
		col:         col,
		first:       true,
		nonNegative: nonNegative,
	}
}

type difference struct {
	col         int
	first       bool
	nonNegative bool

	pIntValue   int64
	pUIntValue  uint64
	pFloatValue float64

	diffInt   int64
	diffFloat float64
}

func (d *difference) valueInt() int64 {
	return d.diffInt
}
func (d *difference) valueFloat() float64 {
	return d.diffFloat
}

func (d *difference) updateInt(v int64) bool {
	if d.first {
		d.pIntValue = v
		d.first = false
		d.diffInt = 0
		return false
	}

	d.diffInt = v - d.pIntValue

	d.pIntValue = v

	if d.nonNegative && d.diffInt < 0 {
		d.diffInt = 0
		return false
	}

	return true
}
func (d *difference) updateUInt(v uint64) bool {
	if d.first {
		d.pUIntValue = v
		d.first = false
		d.diffInt = 0
		return false
	}

	if d.pUIntValue > v {
		d.diffInt = int64(d.pUIntValue-v) * -1
	} else {
		d.diffInt = int64(v - d.pUIntValue)
	}

	d.pUIntValue = v

	if d.nonNegative && d.diffInt < 0 {
		d.diffInt = 0
		return false
	}

	return true
}
func (d *difference) updateFloat(v float64) bool {
	if d.first {
		d.pFloatValue = v
		d.first = false
		d.diffFloat = math.NaN()
		return false
	}

	d.diffFloat = v - d.pFloatValue
	d.pFloatValue = v

	if d.nonNegative && d.diffFloat < 0 {
		d.diffFloat = math.NaN()
		return false
	}

	return true
}
