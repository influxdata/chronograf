package transformations

import (
	"fmt"
	"math"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/semantic"
	"github.com/influxdata/flux/values"
	"github.com/pkg/errors"
)

const WindowKind = "window"

type WindowOpSpec struct {
	Every       flux.Duration    `json:"every"`
	Period      flux.Duration    `json:"period"`
	Start       flux.Time        `json:"start"`
	Round       flux.Duration    `json:"round"`
	Triggering  flux.TriggerSpec `json:"triggering"`
	TimeColumn  string           `json:"timeColumn"`
	StopColumn  string           `json:"stopColumn"`
	StartColumn string           `json:"startColumn"`
	CreateEmpty bool             `json:"createEmpty"`
}

var infinityVar = values.NewDuration(math.MaxInt64)

func init() {
	windowSignature := flux.FunctionSignature(
		map[string]semantic.PolyType{
			"every":       semantic.Duration,
			"period":      semantic.Duration,
			"round":       semantic.Duration,
			"start":       semantic.Tvar(1), // See similar TODO on range about type classes
			"timeColumn":  semantic.String,
			"startColumn": semantic.String,
			"stopColumn":  semantic.String,
			"createEmpty": semantic.Bool,
		},
		nil,
	)

	flux.RegisterFunction(WindowKind, createWindowOpSpec, windowSignature)
	flux.RegisterOpSpec(WindowKind, newWindowOp)
	flux.RegisterBuiltInValue("inf", infinityVar)
	plan.RegisterProcedureSpec(WindowKind, newWindowProcedure, WindowKind)
	execute.RegisterTransformation(WindowKind, createWindowTransformation)
}

func createWindowOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	spec := new(WindowOpSpec)
	every, everySet, err := args.GetDuration("every")
	if err != nil {
		return nil, err
	}
	if everySet {
		spec.Every = flux.Duration(every)
	}
	period, periodSet, err := args.GetDuration("period")
	if err != nil {
		return nil, err
	}
	if periodSet {
		spec.Period = period
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

	if label, ok, err := args.GetString("timeColumn"); err != nil {
		return nil, err
	} else if ok {
		spec.TimeColumn = label
	} else {
		spec.TimeColumn = execute.DefaultTimeColLabel
	}
	if label, ok, err := args.GetString("startColumn"); err != nil {
		return nil, err
	} else if ok {
		spec.StartColumn = label
	} else {
		spec.StartColumn = execute.DefaultStartColLabel
	}
	if label, ok, err := args.GetString("stopColumn"); err != nil {
		return nil, err
	} else if ok {
		spec.StopColumn = label
	} else {
		spec.StopColumn = execute.DefaultStopColLabel
	}
	if createEmpty, ok, err := args.GetBool("createEmpty"); err != nil {
		return nil, err
	} else if ok {
		spec.CreateEmpty = createEmpty
	} else {
		spec.CreateEmpty = false
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

func newWindowOp() flux.OperationSpec {
	return new(WindowOpSpec)
}

func (s *WindowOpSpec) Kind() flux.OperationKind {
	return WindowKind
}

type WindowProcedureSpec struct {
	plan.DefaultCost
	Window     plan.WindowSpec
	Triggering flux.TriggerSpec
	TimeColumn,
	StartColumn,
	StopColumn string
	CreateEmpty bool
}

func newWindowProcedure(qs flux.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
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
		Triggering:  s.Triggering,
		TimeColumn:  s.TimeColumn,
		StartColumn: s.StartColumn,
		StopColumn:  s.StopColumn,
		CreateEmpty: s.CreateEmpty,
	}
	if p.Triggering == nil {
		p.Triggering = flux.DefaultTrigger
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

func (s *WindowProcedureSpec) TriggerSpec() flux.TriggerSpec {
	return s.Triggering
}

func createWindowTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	s, ok := spec.(*WindowProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", spec)
	}
	cache := execute.NewTableBuilderCache(a.Allocator())
	d := execute.NewDataset(id, mode, cache)
	var start execute.Time
	if s.Window.Start.IsZero() {
		start = a.ResolveTime(flux.Now).Truncate(execute.Duration(s.Window.Every))
	} else {
		start = a.ResolveTime(s.Window.Start)
	}

	bounds := a.StreamContext().Bounds()
	if bounds == nil {
		return nil, nil, errors.New("nil bounds passed to window")
	}

	t := NewFixedWindowTransformation(
		d,
		cache,
		*bounds,
		execute.Window{
			Every:  execute.Duration(s.Window.Every),
			Period: execute.Duration(s.Window.Period),
			Round:  execute.Duration(s.Window.Round),
			Start:  start,
		},
		s.TimeColumn,
		s.StartColumn,
		s.StopColumn,
		s.CreateEmpty,
	)
	return t, d, nil
}

type fixedWindowTransformation struct {
	d         execute.Dataset
	cache     execute.TableBuilderCache
	w         execute.Window
	bounds    execute.Bounds
	allBounds []execute.Bounds

	offset execute.Duration

	timeCol,
	startCol,
	stopCol string
	createEmpty bool
}

func NewFixedWindowTransformation(
	d execute.Dataset,
	cache execute.TableBuilderCache,
	bounds execute.Bounds,
	w execute.Window,
	timeCol,
	startCol,
	stopCol string,
	createEmpty bool,
) execute.Transformation {
	offset := execute.Duration(w.Start - w.Start.Truncate(w.Every))
	t := &fixedWindowTransformation{
		d:           d,
		cache:       cache,
		w:           w,
		bounds:      bounds,
		offset:      offset,
		timeCol:     timeCol,
		startCol:    startCol,
		stopCol:     stopCol,
		createEmpty: createEmpty,
	}

	if createEmpty {
		t.generateWindowsWithinBounds()
	}

	return t
}

func (t *fixedWindowTransformation) RetractTable(id execute.DatasetID, key flux.GroupKey) (err error) {
	panic("not implemented")
}

func (t *fixedWindowTransformation) Process(id execute.DatasetID, tbl flux.Table) error {
	timeIdx := execute.ColIdx(t.timeCol, tbl.Cols())
	if timeIdx < 0 {
		return fmt.Errorf("missing time column %q", t.timeCol)
	}

	newCols := make([]flux.ColMeta, 0, len(tbl.Cols())+2)
	keyCols := make([]flux.ColMeta, 0, len(tbl.Cols())+2)
	keyColMap := make([]int, 0, len(tbl.Cols())+2)
	startColIdx := -1
	stopColIdx := -1
	for j, c := range tbl.Cols() {
		keyIdx := execute.ColIdx(c.Label, tbl.Key().Cols())
		keyed := keyIdx >= 0
		if c.Label == t.startCol {
			startColIdx = j
			keyed = true
		}
		if c.Label == t.stopCol {
			stopColIdx = j
			keyed = true
		}
		newCols = append(newCols, c)
		if keyed {
			keyCols = append(keyCols, c)
			keyColMap = append(keyColMap, keyIdx)
		}
	}
	if startColIdx == -1 {
		startColIdx = len(newCols)
		c := flux.ColMeta{
			Label: t.startCol,
			Type:  flux.TTime,
		}
		newCols = append(newCols, c)
		keyCols = append(keyCols, c)
		keyColMap = append(keyColMap, len(keyColMap))
	}
	if stopColIdx == -1 {
		stopColIdx = len(newCols)
		c := flux.ColMeta{
			Label: t.stopCol,
			Type:  flux.TTime,
		}
		newCols = append(newCols, c)
		keyCols = append(keyCols, c)
		keyColMap = append(keyColMap, len(keyColMap))
	}

	// Abort processing if no data will match bounds
	if t.bounds.IsEmpty() {
		return nil
	}

	for _, bnds := range t.allBounds {
		key := t.newWindowGroupKey(tbl, keyCols, bnds, keyColMap)
		builder, created := t.cache.TableBuilder(key)
		if created {
			for _, c := range newCols {
				_, err := builder.AddCol(c)
				if err != nil {
					return err
				}
			}
		}
	}

	return tbl.Do(func(cr flux.ColReader) error {
		l := cr.Len()
		for i := 0; i < l; i++ {
			tm := cr.Times(timeIdx)[i]
			bounds := t.getWindowBounds(tm)

			for _, bnds := range bounds {
				key := t.newWindowGroupKey(tbl, keyCols, bnds, keyColMap)
				builder, created := t.cache.TableBuilder(key)
				if created {
					for _, c := range newCols {
						_, err := builder.AddCol(c)
						if err != nil {
							return err
						}
					}
				}

				for j, c := range builder.Cols() {
					switch c.Label {
					case t.startCol:
						if err := builder.AppendTime(startColIdx, bnds.Start); err != nil {
							return err
						}
					case t.stopCol:
						if err := builder.AppendTime(stopColIdx, bnds.Stop); err != nil {
							return err
						}
					default:
						if err := builder.AppendValue(j, execute.ValueForRow(cr, i, j)); err != nil {
							return err
						}
					}
				}
			}
		}
		return nil
	})
}

func (t *fixedWindowTransformation) newWindowGroupKey(tbl flux.Table, keyCols []flux.ColMeta, bnds execute.Bounds, keyColMap []int) flux.GroupKey {
	cols := make([]flux.ColMeta, len(keyCols))
	vs := make([]values.Value, len(keyCols))
	for j, c := range keyCols {
		cols[j] = c
		switch c.Label {
		case t.startCol:
			vs[j] = values.NewTime(bnds.Start)
		case t.stopCol:
			vs[j] = values.NewTime(bnds.Stop)
		default:
			vs[j] = tbl.Key().Value(keyColMap[j])
		}
	}
	return execute.NewGroupKey(cols, vs)
}

func (t *fixedWindowTransformation) generateInitialBounds(boundsStart, boundsStop execute.Time) (execute.Time, execute.Time) {
	stop := boundsStart.Truncate(t.w.Every) + execute.Time(t.offset)
	if boundsStop >= stop {
		stop += execute.Time(t.w.Every)
	}
	start := stop - execute.Time(t.w.Period)

	return start, stop
}

func (t *fixedWindowTransformation) clipBounds(bnds *execute.Bounds) {
	// Check against procedure bounds
	if bnds.Stop > t.bounds.Stop {
		bnds.Stop = t.bounds.Stop
	}

	if bnds.Start < t.bounds.Start {
		bnds.Start = t.bounds.Start
	}
}

func (t *fixedWindowTransformation) getWindowBounds(now execute.Time) []execute.Bounds {
	if t.w.Every == infinityVar.Duration() {
		return []execute.Bounds{t.bounds}
	}
	start, stop := t.generateInitialBounds(now, now)

	var bounds []execute.Bounds

	for now >= start {
		bnds := execute.Bounds{
			Start: start,
			Stop:  stop,
		}

		t.clipBounds(&bnds)
		bounds = append(bounds, bnds)

		stop += execute.Time(t.w.Every)
		start += execute.Time(t.w.Every)
	}

	return bounds
}

func (t *fixedWindowTransformation) generateWindowsWithinBounds() {
	if t.w.Every == infinityVar.Duration() {
		t.allBounds = []execute.Bounds{
			{Start: execute.MinTime, Stop: execute.MaxTime},
		}
		return
	}
	start, stop := t.generateInitialBounds(t.bounds.Start, t.bounds.Stop)

	var bounds []execute.Bounds

	for t.bounds.Stop > start {
		bnds := execute.Bounds{
			Start: start,
			Stop:  stop,
		}

		t.clipBounds(&bnds)
		bounds = append(bounds, bnds)

		start += execute.Time(t.w.Every)
		stop += execute.Time(t.w.Every)
	}
	t.allBounds = bounds
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
