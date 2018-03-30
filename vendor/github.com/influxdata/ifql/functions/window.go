package functions

import (
	"fmt"

	"github.com/influxdata/ifql/query"
	"github.com/influxdata/ifql/query/execute"
	"github.com/influxdata/ifql/query/plan"
	"github.com/influxdata/ifql/semantic"
	"github.com/pkg/errors"
)

const WindowKind = "window"

type WindowOpSpec struct {
	Every      query.Duration    `json:"every"`
	Period     query.Duration    `json:"period"`
	Start      query.Time        `json:"start"`
	Round      query.Duration    `json:"round"`
	Triggering query.TriggerSpec `json:"triggering"`
}

var windowSignature = query.DefaultFunctionSignature()

func init() {
	windowSignature.Params["every"] = semantic.Duration
	windowSignature.Params["period"] = semantic.Duration
	windowSignature.Params["round"] = semantic.Duration
	windowSignature.Params["start"] = semantic.Time

	query.RegisterFunction(WindowKind, createWindowOpSpec, windowSignature)
	query.RegisterOpSpec(WindowKind, newWindowOp)
	plan.RegisterProcedureSpec(WindowKind, newWindowProcedure, WindowKind)
	execute.RegisterTransformation(WindowKind, createWindowTransformation)
}

func createWindowOpSpec(args query.Arguments, a *query.Administration) (query.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	spec := new(WindowOpSpec)
	every, everySet, err := args.GetDuration("every")
	if err != nil {
		return nil, err
	}
	if everySet {
		spec.Every = query.Duration(every)
	}
	period, periodSet, err := args.GetDuration("period")
	if err != nil {
		return nil, err
	}
	if periodSet {
		spec.Every = period
	}
	if round, ok, err := args.GetDuration("round"); err != nil {
		return nil, err
	} else if ok {
		spec.Round = round
	}
	if start, ok, err := args.GetTime("start"); err != nil {
		return nil, err
	} else if ok {
		spec.Start = start
	}

	if !everySet && !periodSet {
		return nil, errors.New(`window function requires at least one of "every" or "period" to be set`)
	}
	// Apply defaults
	if !everySet {
		spec.Every = spec.Period
	}
	if !periodSet {
		spec.Period = spec.Every
	}
	return spec, nil
}

func newWindowOp() query.OperationSpec {
	return new(WindowOpSpec)
}

func (s *WindowOpSpec) Kind() query.OperationKind {
	return WindowKind
}

type WindowProcedureSpec struct {
	Window     plan.WindowSpec
	Triggering query.TriggerSpec
}

func newWindowProcedure(qs query.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	s, ok := qs.(*WindowOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}
	p := &WindowProcedureSpec{
		Window: plan.WindowSpec{
			Every:  s.Every,
			Period: s.Period,
			Round:  s.Round,
			Start:  s.Start,
		},
		Triggering: s.Triggering,
	}
	if p.Triggering == nil {
		p.Triggering = query.DefaultTrigger
	}
	return p, nil
}

func (s *WindowProcedureSpec) Kind() plan.ProcedureKind {
	return WindowKind
}
func (s *WindowProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(WindowProcedureSpec)
	ns.Window = s.Window
	ns.Triggering = s.Triggering
	return ns
}

func (s *WindowProcedureSpec) TriggerSpec() query.TriggerSpec {
	return s.Triggering
}

func createWindowTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	s, ok := spec.(*WindowProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", spec)
	}
	cache := execute.NewBlockBuilderCache(a.Allocator())
	d := execute.NewDataset(id, mode, cache)
	t := NewFixedWindowTransformation(d, cache, a.Bounds(), execute.Window{
		Every:  execute.Duration(s.Window.Every),
		Period: execute.Duration(s.Window.Period),
		Round:  execute.Duration(s.Window.Round),
		Start:  a.ResolveTime(s.Window.Start),
	})
	return t, d, nil
}

type fixedWindowTransformation struct {
	d      execute.Dataset
	cache  execute.BlockBuilderCache
	w      execute.Window
	bounds execute.Bounds

	offset execute.Duration
}

func NewFixedWindowTransformation(
	d execute.Dataset,
	cache execute.BlockBuilderCache,
	bounds execute.Bounds,
	w execute.Window,
) execute.Transformation {
	offset := execute.Duration(w.Start - w.Start.Truncate(w.Every))
	return &fixedWindowTransformation{
		d:      d,
		cache:  cache,
		w:      w,
		bounds: bounds,
		offset: offset,
	}
}

func (t *fixedWindowTransformation) RetractBlock(id execute.DatasetID, meta execute.BlockMetadata) (err error) {
	tagKey := meta.Tags().Key()
	t.cache.ForEachBuilder(func(bk execute.BlockKey, bld execute.BlockBuilder) {
		if err != nil {
			return
		}
		if bld.Bounds().Overlaps(meta.Bounds()) && tagKey == bld.Tags().Key() {
			err = t.d.RetractBlock(bk)
		}
	})
	return
}

func (t *fixedWindowTransformation) Process(id execute.DatasetID, b execute.Block) error {
	cols := b.Cols()
	valueIdx := execute.ValueIdx(cols)
	valueCol := cols[valueIdx]
	times := b.Times()
	times.DoTime(func(ts []execute.Time, rr execute.RowReader) {
		for i, time := range ts {
			bounds := t.getWindowBounds(time)
			for _, bnds := range bounds {
				builder, new := t.cache.BlockBuilder(blockMetadata{
					tags:   b.Tags(),
					bounds: bnds,
				})
				if new {
					builder.AddCol(execute.TimeCol)
					builder.AddCol(valueCol)
					execute.AddTags(b.Tags(), builder)
				}
				colMap := execute.AddNewCols(b, builder)

				execute.AppendRow(i, rr, builder, colMap)
			}
		}
	})
	return nil
}

func (t *fixedWindowTransformation) getWindowBounds(now execute.Time) []execute.Bounds {
	stop := now.Truncate(t.w.Every) + execute.Time(t.offset)
	if now >= stop {
		stop += execute.Time(t.w.Every)
	}
	start := stop - execute.Time(t.w.Period)

	var bounds []execute.Bounds

	for now >= start {
		bnds := execute.Bounds{
			Start: start,
			Stop:  stop,
		}

		// Check global bounds
		if bnds.Stop > t.bounds.Stop {
			bnds.Stop = t.bounds.Stop
		}

		if bnds.Start < t.bounds.Start {
			bnds.Start = t.bounds.Start
		}

		// Check bounds again since we just clamped them.
		if bnds.Contains(now) {
			bounds = append(bounds, bnds)
		}

		// Shift up to next bounds
		stop += execute.Time(t.w.Every)
		start += execute.Time(t.w.Every)
	}

	return bounds
}

func (t *fixedWindowTransformation) UpdateWatermark(id execute.DatasetID, mark execute.Time) error {
	return t.d.UpdateWatermark(mark)
}
func (t *fixedWindowTransformation) UpdateProcessingTime(id execute.DatasetID, pt execute.Time) error {
	return t.d.UpdateProcessingTime(pt)
}
func (t *fixedWindowTransformation) Finish(id execute.DatasetID, err error) {
	t.d.Finish(err)
}
