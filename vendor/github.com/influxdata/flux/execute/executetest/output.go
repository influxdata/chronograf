package executetest

import (
	"errors"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/plan"
)

// ToTestKind represents an side-effect producing kind for testing
const ToTestKind = "to-test"

// ToProcedureSpec defines an output operation. That is, an
// operation that does not transform its input data but performs a
// side effect while passing its input data through to the next op.
type ToProcedureSpec struct{}

func NewToProcedure(flux.OperationSpec, plan.Administration) (plan.ProcedureSpec, error) {
	return &ToProcedureSpec{}, nil
}

func (s *ToProcedureSpec) Kind() plan.ProcedureKind {
	return ToTestKind
}

func (s *ToProcedureSpec) Copy() plan.ProcedureSpec {
	return s
}

func (s *ToProcedureSpec) Cost(inStats []plan.Statistics) (plan.Cost, plan.Statistics) {
	return plan.Cost{}, plan.Statistics{}
}

func (s *ToProcedureSpec) Statistics() flux.Statistics {
	return flux.Statistics{}
}

// ToTransformation simulates an output or an identity transformation
type ToTransformation struct {
	d execute.Dataset
	c execute.TableBuilderCache
}

func CreateToTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	c := execute.NewTableBuilderCache(a.Allocator())
	d := execute.NewDataset(id, mode, c)
	return &ToTransformation{d: d, c: c}, d, nil
}

func (t *ToTransformation) Process(id execute.DatasetID, tbl flux.Table) error {
	if builder, new := t.c.TableBuilder(tbl.Key()); new {
		if err := execute.AddTableCols(tbl, builder); err != nil {
			return err
		}
		if err := execute.AppendTable(tbl, builder); err != nil {
			return err
		}
		return nil
	}
	return errors.New("duplicate group key")
}

func (t *ToTransformation) RetractTable(id execute.DatasetID, key flux.GroupKey) error {
	return t.d.RetractTable(key)
}

func (t *ToTransformation) UpdateWatermark(id execute.DatasetID, pt execute.Time) error {
	return t.d.UpdateWatermark(pt)
}

func (t *ToTransformation) UpdateProcessingTime(id execute.DatasetID, pt execute.Time) error {
	return t.d.UpdateProcessingTime(pt)
}

func (t *ToTransformation) Finish(id execute.DatasetID, err error) {
	t.d.Finish(err)
}
