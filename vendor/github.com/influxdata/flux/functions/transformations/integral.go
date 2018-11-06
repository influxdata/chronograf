package transformations

import (
	"fmt"
	"time"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/semantic"
)

const IntegralKind = "integral"

type IntegralOpSpec struct {
	Unit       flux.Duration `json:"unit"`
	TimeColumn string        `json:"timeColumn"`
	execute.AggregateConfig
}

func init() {
	integralSignature := execute.AggregateSignature(
		map[string]semantic.PolyType{
			"unit":       semantic.Duration,
			"timeColumn": semantic.String,
		},
		nil,
	)

	flux.RegisterFunction(IntegralKind, createIntegralOpSpec, integralSignature)
	flux.RegisterOpSpec(IntegralKind, newIntegralOp)
	plan.RegisterProcedureSpec(IntegralKind, newIntegralProcedure, IntegralKind)
	execute.RegisterTransformation(IntegralKind, createIntegralTransformation)
}

func createIntegralOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	spec := new(IntegralOpSpec)

	if unit, ok, err := args.GetDuration("unit"); err != nil {
		return nil, err
	} else if ok {
		spec.Unit = unit
	} else {
		//Default is 1s
		spec.Unit = flux.Duration(time.Second)
	}

	if timeValue, ok, err := args.GetString("timeColumn"); err != nil {
		return nil, err
	} else if ok {
		spec.TimeColumn = timeValue
	} else {
		spec.TimeColumn = execute.DefaultTimeColLabel
	}

	if err := spec.AggregateConfig.ReadArgs(args); err != nil {
		return nil, err
	}
	return spec, nil
}

func newIntegralOp() flux.OperationSpec {
	return new(IntegralOpSpec)
}

func (s *IntegralOpSpec) Kind() flux.OperationKind {
	return IntegralKind
}

type IntegralProcedureSpec struct {
	Unit       flux.Duration `json:"unit"`
	TimeColumn string        `json:"timeColumn"`
	execute.AggregateConfig
}

func newIntegralProcedure(qs flux.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*IntegralOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}

	return &IntegralProcedureSpec{
		Unit:            spec.Unit,
		TimeColumn:      spec.TimeColumn,
		AggregateConfig: spec.AggregateConfig,
	}, nil
}

func (s *IntegralProcedureSpec) Kind() plan.ProcedureKind {
	return IntegralKind
}
func (s *IntegralProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(IntegralProcedureSpec)
	*ns = *s

	ns.AggregateConfig = s.AggregateConfig.Copy()

	return ns
}

func createIntegralTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	s, ok := spec.(*IntegralProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", spec)
	}
	cache := execute.NewTableBuilderCache(a.Allocator())
	d := execute.NewDataset(id, mode, cache)
	t := NewIntegralTransformation(d, cache, s)
	return t, d, nil
}

type integralTransformation struct {
	d     execute.Dataset
	cache execute.TableBuilderCache

	spec IntegralProcedureSpec
}

func NewIntegralTransformation(d execute.Dataset, cache execute.TableBuilderCache, spec *IntegralProcedureSpec) *integralTransformation {
	return &integralTransformation{
		d:     d,
		cache: cache,
		spec:  *spec,
	}
}

func (t *integralTransformation) RetractTable(id execute.DatasetID, key flux.GroupKey) error {
	return t.d.RetractTable(key)
}

func (t *integralTransformation) Process(id execute.DatasetID, tbl flux.Table) error {
	builder, created := t.cache.TableBuilder(tbl.Key())
	if !created {
		return fmt.Errorf("integral found duplicate table with key: %v", tbl.Key())
	}

	if err := execute.AddTableKeyCols(tbl.Key(), builder); err != nil {
		return err
	}

	cols := tbl.Cols()
	integrals := make([]*integral, len(cols))
	colMap := make([]int, len(cols))

	for j, c := range cols {
		if execute.ContainsStr(t.spec.Columns, c.Label) {
			integrals[j] = newIntegral(time.Duration(t.spec.Unit))

			var err error
			colMap[j], err = builder.AddCol(flux.ColMeta{
				Label: c.Label,
				Type:  flux.TFloat,
			})
			if err != nil {
				return err
			}
		}
	}

	timeIdx := execute.ColIdx(t.spec.TimeColumn, cols)
	if timeIdx < 0 {
		return fmt.Errorf("no column %q exists", t.spec.TimeColumn)
	}
	if err := tbl.Do(func(cr flux.ColReader) error {
		for j, in := range integrals {
			if in == nil {
				continue
			}
			l := cr.Len()
			for i := 0; i < l; i++ {
				tm := cr.Times(timeIdx)[i]
				in.updateFloat(tm, cr.Floats(j)[i])
			}
		}
		return nil
	}); err != nil {
		return err
	}

	if err := execute.AppendKeyValues(tbl.Key(), builder); err != nil {
		return err
	}
	for j, in := range integrals {
		if in == nil {
			continue
		}
		if err := builder.AppendFloat(colMap[j], in.value()); err != nil {
			return err
		}
	}

	return nil
}

func (t *integralTransformation) UpdateWatermark(id execute.DatasetID, mark execute.Time) error {
	return t.d.UpdateWatermark(mark)
}
func (t *integralTransformation) UpdateProcessingTime(id execute.DatasetID, pt execute.Time) error {
	return t.d.UpdateProcessingTime(pt)
}
func (t *integralTransformation) Finish(id execute.DatasetID, err error) {
	t.d.Finish(err)
}

func newIntegral(unit time.Duration) *integral {
	return &integral{
		first: true,
		unit:  float64(unit),
	}
}

type integral struct {
	first bool
	unit  float64

	pFloatValue float64
	pTime       execute.Time

	sum float64
}

func (in *integral) value() float64 {
	return in.sum
}

func (in *integral) updateFloat(t execute.Time, v float64) {
	if in.first {
		in.pTime = t
		in.pFloatValue = v
		in.first = false
		return
	}

	elapsed := float64(t-in.pTime) / in.unit
	in.sum += 0.5 * (v + in.pFloatValue) * elapsed

	in.pTime = t
	in.pFloatValue = v
}
