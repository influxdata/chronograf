package execute

import (
	"fmt"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/semantic"
)

type selectorTransformation struct {
	d     Dataset
	cache TableBuilderCache

	config SelectorConfig
}

type SelectorConfig struct {
	Column string `json:"column"`
}

func (c *SelectorConfig) ReadArgs(args flux.Arguments) error {
	if col, ok, err := args.GetString("column"); err != nil {
		return err
	} else if ok {
		c.Column = col
	}
	return nil
}

func DefaultSelectorSignature() semantic.FunctionSignature {
	return semantic.FunctionSignature{
		Params: map[string]semantic.Type{
			flux.TableParameter: flux.TableObjectType,
			"column":            semantic.String,
		},
		ReturnType:   flux.TableObjectType,
		PipeArgument: flux.TableParameter,
	}
}

type rowSelectorTransformation struct {
	selectorTransformation
	selector RowSelector
}
type indexSelectorTransformation struct {
	selectorTransformation
	selector IndexSelector
}

func NewRowSelectorTransformationAndDataset(id DatasetID, mode AccumulationMode, selector RowSelector, config SelectorConfig, a *Allocator) (*rowSelectorTransformation, Dataset) {
	cache := NewTableBuilderCache(a)
	d := NewDataset(id, mode, cache)
	return NewRowSelectorTransformation(d, cache, selector, config), d
}
func NewRowSelectorTransformation(d Dataset, c TableBuilderCache, selector RowSelector, config SelectorConfig) *rowSelectorTransformation {
	return &rowSelectorTransformation{
		selectorTransformation: newSelectorTransformation(d, c, config),
		selector:               selector,
	}
}

func NewIndexSelectorTransformationAndDataset(id DatasetID, mode AccumulationMode, selector IndexSelector, config SelectorConfig, a *Allocator) (*indexSelectorTransformation, Dataset) {
	cache := NewTableBuilderCache(a)
	d := NewDataset(id, mode, cache)
	return NewIndexSelectorTransformation(d, cache, selector, config), d
}
func NewIndexSelectorTransformation(d Dataset, c TableBuilderCache, selector IndexSelector, config SelectorConfig) *indexSelectorTransformation {
	return &indexSelectorTransformation{
		selectorTransformation: newSelectorTransformation(d, c, config),
		selector:               selector,
	}
}

func newSelectorTransformation(d Dataset, c TableBuilderCache, config SelectorConfig) selectorTransformation {
	if config.Column == "" {
		config.Column = DefaultValueColLabel
	}
	return selectorTransformation{
		d:      d,
		cache:  c,
		config: config,
	}
}

func (t *selectorTransformation) RetractTable(id DatasetID, key flux.GroupKey) error {
	//TODO(nathanielc): Store intermediate state for retractions
	return t.d.RetractTable(key)
}
func (t *selectorTransformation) UpdateWatermark(id DatasetID, mark Time) error {
	return t.d.UpdateWatermark(mark)
}
func (t *selectorTransformation) UpdateProcessingTime(id DatasetID, pt Time) error {
	return t.d.UpdateProcessingTime(pt)
}
func (t *selectorTransformation) Finish(id DatasetID, err error) {
	t.d.Finish(err)
}

func (t *selectorTransformation) setupBuilder(tbl flux.Table) (TableBuilder, int, error) {
	builder, new := t.cache.TableBuilder(tbl.Key())
	if !new {
		return nil, 0, fmt.Errorf("found duplicate table with key: %v", tbl.Key())
	}
	AddTableCols(tbl, builder)

	cols := builder.Cols()
	valueIdx := ColIdx(t.config.Column, cols)
	if valueIdx < 0 {
		return nil, 0, fmt.Errorf("no column %q exists", t.config.Column)
	}
	return builder, valueIdx, nil
}

func (t *indexSelectorTransformation) Process(id DatasetID, tbl flux.Table) error {
	builder, valueIdx, err := t.setupBuilder(tbl)
	if err != nil {
		return err
	}
	valueCol := builder.Cols()[valueIdx]

	var s interface{}
	switch valueCol.Type {
	case flux.TBool:
		s = t.selector.NewBoolSelector()
	case flux.TInt:
		s = t.selector.NewIntSelector()
	case flux.TUInt:
		s = t.selector.NewUIntSelector()
	case flux.TFloat:
		s = t.selector.NewFloatSelector()
	case flux.TString:
		s = t.selector.NewStringSelector()
	default:
		return fmt.Errorf("unsupported selector type %v", valueCol.Type)
	}

	return tbl.Do(func(cr flux.ColReader) error {
		switch valueCol.Type {
		case flux.TBool:
			selected := s.(DoBoolIndexSelector).DoBool(cr.Bools(valueIdx))
			t.appendSelected(selected, builder, cr)
		case flux.TInt:
			selected := s.(DoIntIndexSelector).DoInt(cr.Ints(valueIdx))
			t.appendSelected(selected, builder, cr)
		case flux.TUInt:
			selected := s.(DoUIntIndexSelector).DoUInt(cr.UInts(valueIdx))
			t.appendSelected(selected, builder, cr)
		case flux.TFloat:
			selected := s.(DoFloatIndexSelector).DoFloat(cr.Floats(valueIdx))
			t.appendSelected(selected, builder, cr)
		case flux.TString:
			selected := s.(DoStringIndexSelector).DoString(cr.Strings(valueIdx))
			t.appendSelected(selected, builder, cr)
		default:
			return fmt.Errorf("unsupported selector type %v", valueCol.Type)
		}
		return nil
	})
}

func (t *rowSelectorTransformation) Process(id DatasetID, tbl flux.Table) error {
	builder, valueIdx, err := t.setupBuilder(tbl)
	if err != nil {
		return err
	}
	valueCol := builder.Cols()[valueIdx]

	var rower Rower

	switch valueCol.Type {
	case flux.TBool:
		rower = t.selector.NewBoolSelector()
	case flux.TInt:
		rower = t.selector.NewIntSelector()
	case flux.TUInt:
		rower = t.selector.NewUIntSelector()
	case flux.TFloat:
		rower = t.selector.NewFloatSelector()
	case flux.TString:
		rower = t.selector.NewStringSelector()
	default:
		return fmt.Errorf("unsupported selector type %v", valueCol.Type)
	}

	// if rower has a nil value, this means that the row selector doesn't
	// yet have an implementation

	if rower == nil {
		return fmt.Errorf("invalid use of function: %T has no implementation for type %v", t.selector, valueCol.Type)
	}

	tbl.Do(func(cr flux.ColReader) error {
		switch valueCol.Type {
		case flux.TBool:
			rower.(DoBoolRowSelector).DoBool(cr.Bools(valueIdx), cr)
		case flux.TInt:
			rower.(DoIntRowSelector).DoInt(cr.Ints(valueIdx), cr)
		case flux.TUInt:
			rower.(DoUIntRowSelector).DoUInt(cr.UInts(valueIdx), cr)
		case flux.TFloat:
			rower.(DoFloatRowSelector).DoFloat(cr.Floats(valueIdx), cr)
		case flux.TString:
			rower.(DoStringRowSelector).DoString(cr.Strings(valueIdx), cr)
		default:
			return fmt.Errorf("unsupported selector type %v", valueCol.Type)
		}
		return nil
	})
	rows := rower.Rows()
	t.appendRows(builder, rows)
	return nil
}

func (t *indexSelectorTransformation) appendSelected(selected []int, builder TableBuilder, cr flux.ColReader) {
	if len(selected) == 0 {
		return
	}
	cols := builder.Cols()
	for j, c := range cols {
		for _, i := range selected {
			switch c.Type {
			case flux.TBool:
				builder.AppendBool(j, cr.Bools(j)[i])
			case flux.TInt:
				builder.AppendInt(j, cr.Ints(j)[i])
			case flux.TUInt:
				builder.AppendUInt(j, cr.UInts(j)[i])
			case flux.TFloat:
				builder.AppendFloat(j, cr.Floats(j)[i])
			case flux.TString:
				builder.AppendString(j, cr.Strings(j)[i])
			case flux.TTime:
				builder.AppendTime(j, cr.Times(j)[i])
			default:
				PanicUnknownType(c.Type)
			}
		}
	}
}

func (t *rowSelectorTransformation) appendRows(builder TableBuilder, rows []Row) {
	cols := builder.Cols()
	for j, c := range cols {
		for _, row := range rows {
			v := row.Values[j]
			switch c.Type {
			case flux.TBool:
				builder.AppendBool(j, v.(bool))
			case flux.TInt:
				builder.AppendInt(j, v.(int64))
			case flux.TUInt:
				builder.AppendUInt(j, v.(uint64))
			case flux.TFloat:
				builder.AppendFloat(j, v.(float64))
			case flux.TString:
				builder.AppendString(j, v.(string))
			case flux.TTime:
				builder.AppendTime(j, v.(Time))
			default:
				PanicUnknownType(c.Type)
			}
		}
	}
}

type IndexSelector interface {
	NewBoolSelector() DoBoolIndexSelector
	NewIntSelector() DoIntIndexSelector
	NewUIntSelector() DoUIntIndexSelector
	NewFloatSelector() DoFloatIndexSelector
	NewStringSelector() DoStringIndexSelector
}
type DoBoolIndexSelector interface {
	DoBool([]bool) []int
}
type DoIntIndexSelector interface {
	DoInt([]int64) []int
}
type DoUIntIndexSelector interface {
	DoUInt([]uint64) []int
}
type DoFloatIndexSelector interface {
	DoFloat([]float64) []int
}
type DoStringIndexSelector interface {
	DoString([]string) []int
}

type RowSelector interface {
	NewBoolSelector() DoBoolRowSelector
	NewIntSelector() DoIntRowSelector
	NewUIntSelector() DoUIntRowSelector
	NewFloatSelector() DoFloatRowSelector
	NewStringSelector() DoStringRowSelector
}

type Rower interface {
	Rows() []Row
}

type DoBoolRowSelector interface {
	Rower
	DoBool(vs []bool, cr flux.ColReader)
}
type DoIntRowSelector interface {
	Rower
	DoInt(vs []int64, cr flux.ColReader)
}
type DoUIntRowSelector interface {
	Rower
	DoUInt(vs []uint64, cr flux.ColReader)
}
type DoFloatRowSelector interface {
	Rower
	DoFloat(vs []float64, cr flux.ColReader)
}
type DoStringRowSelector interface {
	Rower
	DoString(vs []string, cr flux.ColReader)
}

type Row struct {
	Values []interface{}
}

func ReadRow(i int, cr flux.ColReader) (row Row) {
	cols := cr.Cols()
	row.Values = make([]interface{}, len(cols))
	for j, c := range cols {
		switch c.Type {
		case flux.TBool:
			row.Values[j] = cr.Bools(j)[i]
		case flux.TInt:
			row.Values[j] = cr.Ints(j)[i]
		case flux.TUInt:
			row.Values[j] = cr.UInts(j)[i]
		case flux.TFloat:
			row.Values[j] = cr.Floats(j)[i]
		case flux.TString:
			row.Values[j] = cr.Strings(j)[i]
		case flux.TTime:
			row.Values[j] = cr.Times(j)[i]
		}
	}
	return
}
