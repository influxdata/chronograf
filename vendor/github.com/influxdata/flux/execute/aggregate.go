package execute

import (
	"fmt"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/interpreter"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/semantic"
	"github.com/pkg/errors"
)

type aggregateTransformation struct {
	d     Dataset
	cache TableBuilderCache
	agg   Aggregate

	config AggregateConfig
}

type AggregateConfig struct {
	plan.DefaultCost
	Columns []string `json:"columns"`
}

var DefaultAggregateConfig = AggregateConfig{
	Columns: []string{DefaultValueColLabel},
}

// AggregateSignature returns a function signature common to all aggregate functions,
// with any additional arguments.
func AggregateSignature(args map[string]semantic.PolyType, required []string) semantic.FunctionPolySignature {
	if args == nil {
		args = make(map[string]semantic.PolyType)
	}
	args["columns"] = semantic.NewArrayPolyType(semantic.String)
	return flux.FunctionSignature(args, required)
}

func (c AggregateConfig) Copy() AggregateConfig {
	nc := c
	if c.Columns != nil {
		nc.Columns = make([]string, len(c.Columns))
		copy(nc.Columns, c.Columns)
	}
	return nc
}

func (c *AggregateConfig) ReadArgs(args flux.Arguments) error {
	if cols, ok, err := args.GetArray("columns", semantic.String); err != nil {
		return err
	} else if ok {
		columns, err := interpreter.ToStringArray(cols)
		if err != nil {
			return err
		}
		c.Columns = columns
	} else {
		c.Columns = DefaultAggregateConfig.Columns
	}
	return nil
}

func NewAggregateTransformation(d Dataset, c TableBuilderCache, agg Aggregate, config AggregateConfig) *aggregateTransformation {
	return &aggregateTransformation{
		d:      d,
		cache:  c,
		agg:    agg,
		config: config,
	}
}

func NewAggregateTransformationAndDataset(id DatasetID, mode AccumulationMode, agg Aggregate, config AggregateConfig, a *Allocator) (*aggregateTransformation, Dataset) {
	cache := NewTableBuilderCache(a)
	d := NewDataset(id, mode, cache)
	return NewAggregateTransformation(d, cache, agg, config), d
}

func (t *aggregateTransformation) RetractTable(id DatasetID, key flux.GroupKey) error {
	//TODO(nathanielc): Store intermediate state for retractions
	return t.d.RetractTable(key)
}

func (t *aggregateTransformation) Process(id DatasetID, tbl flux.Table) error {
	builder, created := t.cache.TableBuilder(tbl.Key())
	if !created {
		return fmt.Errorf("aggregate found duplicate table with key: %v", tbl.Key())
	}

	if err := AddTableKeyCols(tbl.Key(), builder); err != nil {
		return err
	}

	builderColMap := make([]int, len(t.config.Columns))
	tableColMap := make([]int, len(t.config.Columns))
	aggregates := make([]ValueFunc, len(t.config.Columns))
	cols := tbl.Cols()
	for j, label := range t.config.Columns {
		idx := -1
		for bj, bc := range cols {
			if bc.Label == label {
				idx = bj
				break
			}
		}
		if idx < 0 {
			return fmt.Errorf("column %q does not exist", label)
		}
		c := cols[idx]
		if tbl.Key().HasCol(c.Label) {
			return errors.New("cannot aggregate columns that are part of the group key")
		}
		var vf ValueFunc
		switch c.Type {
		case flux.TBool:
			vf = t.agg.NewBoolAgg()
		case flux.TInt:
			vf = t.agg.NewIntAgg()
		case flux.TUInt:
			vf = t.agg.NewUIntAgg()
		case flux.TFloat:
			vf = t.agg.NewFloatAgg()
		case flux.TString:
			vf = t.agg.NewStringAgg()
		}
		if vf == nil {
			return fmt.Errorf("unsupported aggregate column type %v", c.Type)
		}
		aggregates[j] = vf

		var err error
		builderColMap[j], err = builder.AddCol(flux.ColMeta{
			Label: c.Label,
			Type:  vf.Type(),
		})
		if err != nil {
			return err
		}
		tableColMap[j] = idx
	}

	if err := tbl.Do(func(cr flux.ColReader) error {
		for j := range t.config.Columns {
			vf := aggregates[j]

			tj := tableColMap[j]
			c := tbl.Cols()[tj]

			switch c.Type {
			case flux.TBool:
				vf.(DoBoolAgg).DoBool(cr.Bools(tj))
			case flux.TInt:
				vf.(DoIntAgg).DoInt(cr.Ints(tj))
			case flux.TUInt:
				vf.(DoUIntAgg).DoUInt(cr.UInts(tj))
			case flux.TFloat:
				vf.(DoFloatAgg).DoFloat(cr.Floats(tj))
			case flux.TString:
				vf.(DoStringAgg).DoString(cr.Strings(tj))
			default:
				return fmt.Errorf("unsupport aggregate type %v", c.Type)
			}
		}
		return nil
	}); err != nil {
		return err
	}
	for j, vf := range aggregates {
		bj := builderColMap[j]
		// Append aggregated value
		switch vf.Type() {
		case flux.TBool:
			if err := builder.AppendBool(bj, vf.(BoolValueFunc).ValueBool()); err != nil {
				return err
			}
		case flux.TInt:
			if err := builder.AppendInt(bj, vf.(IntValueFunc).ValueInt()); err != nil {
				return err
			}
		case flux.TUInt:
			if err := builder.AppendUInt(bj, vf.(UIntValueFunc).ValueUInt()); err != nil {
				return err
			}
		case flux.TFloat:
			if err := builder.AppendFloat(bj, vf.(FloatValueFunc).ValueFloat()); err != nil {
				return err
			}
		case flux.TString:
			if err := builder.AppendString(bj, vf.(StringValueFunc).ValueString()); err != nil {
				return err
			}
		}
	}

	return AppendKeyValues(tbl.Key(), builder)
}

func (t *aggregateTransformation) UpdateWatermark(id DatasetID, mark Time) error {
	return t.d.UpdateWatermark(mark)
}
func (t *aggregateTransformation) UpdateProcessingTime(id DatasetID, pt Time) error {
	return t.d.UpdateProcessingTime(pt)
}
func (t *aggregateTransformation) Finish(id DatasetID, err error) {
	t.d.Finish(err)
}

type Aggregate interface {
	NewBoolAgg() DoBoolAgg
	NewIntAgg() DoIntAgg
	NewUIntAgg() DoUIntAgg
	NewFloatAgg() DoFloatAgg
	NewStringAgg() DoStringAgg
}

type ValueFunc interface {
	Type() flux.ColType
}
type DoBoolAgg interface {
	ValueFunc
	DoBool([]bool)
}
type DoFloatAgg interface {
	ValueFunc
	DoFloat([]float64)
}
type DoIntAgg interface {
	ValueFunc
	DoInt([]int64)
}
type DoUIntAgg interface {
	ValueFunc
	DoUInt([]uint64)
}
type DoStringAgg interface {
	ValueFunc
	DoString([]string)
}

type BoolValueFunc interface {
	ValueBool() bool
}
type FloatValueFunc interface {
	ValueFloat() float64
}
type IntValueFunc interface {
	ValueInt() int64
}
type UIntValueFunc interface {
	ValueUInt() uint64
}
type StringValueFunc interface {
	ValueString() string
}
