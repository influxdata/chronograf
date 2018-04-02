package functions

import (
	"fmt"

	"github.com/influxdata/ifql/query"
	"github.com/influxdata/ifql/query/execute"
	"github.com/influxdata/ifql/query/plan"
	"github.com/influxdata/ifql/semantic"
)

const FromKind = "from"

type FromOpSpec struct {
	Database string   `json:"database"`
	Hosts    []string `json:"hosts"`
}

var fromSignature = semantic.FunctionSignature{
	Params: map[string]semantic.Type{
		"db": semantic.String,
	},
	ReturnType: query.TableObjectType,
}

func init() {
	query.RegisterFunction(FromKind, createFromOpSpec, fromSignature)
	query.RegisterOpSpec(FromKind, newFromOp)
	plan.RegisterProcedureSpec(FromKind, newFromProcedure, FromKind)
	execute.RegisterSource(FromKind, createFromSource)
}

func createFromOpSpec(args query.Arguments, a *query.Administration) (query.OperationSpec, error) {
	db, err := args.GetRequiredString("db")
	if err != nil {
		return nil, err
	}
	spec := &FromOpSpec{
		Database: db,
	}

	if array, ok, err := args.GetArray("hosts", semantic.String); err != nil {
		return nil, err
	} else if ok {
		spec.Hosts = array.AsStrings()
	}
	return spec, nil
}

func newFromOp() query.OperationSpec {
	return new(FromOpSpec)
}

func (s *FromOpSpec) Kind() query.OperationKind {
	return FromKind
}

type FromProcedureSpec struct {
	Database string
	Hosts    []string

	BoundsSet bool
	Bounds    plan.BoundsSpec

	FilterSet bool
	Filter    *semantic.FunctionExpression

	DescendingSet bool
	Descending    bool

	LimitSet     bool
	PointsLimit  int64
	SeriesLimit  int64
	SeriesOffset int64

	WindowSet bool
	Window    plan.WindowSpec

	GroupingSet bool
	OrderByTime bool
	MergeAll    bool
	GroupKeys   []string
	GroupExcept []string
	GroupKeep   []string

	AggregateSet    bool
	AggregateMethod string
}

func newFromProcedure(qs query.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*FromOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}

	return &FromProcedureSpec{
		Database: spec.Database,
		Hosts:    spec.Hosts,
	}, nil
}

func (s *FromProcedureSpec) Kind() plan.ProcedureKind {
	return FromKind
}
func (s *FromProcedureSpec) TimeBounds() plan.BoundsSpec {
	return s.Bounds
}
func (s *FromProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(FromProcedureSpec)

	ns.Database = s.Database

	if len(s.Hosts) > 0 {
		ns.Hosts = make([]string, len(s.Hosts))
		copy(ns.Hosts, s.Hosts)
	}

	ns.BoundsSet = s.BoundsSet
	ns.Bounds = s.Bounds

	ns.FilterSet = s.FilterSet
	// TODO copy predicate
	ns.Filter = s.Filter

	ns.DescendingSet = s.DescendingSet
	ns.Descending = s.Descending

	ns.LimitSet = s.LimitSet
	ns.PointsLimit = s.PointsLimit
	ns.SeriesLimit = s.SeriesLimit
	ns.SeriesOffset = s.SeriesOffset

	ns.WindowSet = s.WindowSet
	ns.Window = s.Window

	ns.AggregateSet = s.AggregateSet
	ns.AggregateMethod = s.AggregateMethod

	return ns
}

func createFromSource(prSpec plan.ProcedureSpec, id execute.DatasetID, sr execute.StorageReader, a execute.Administration) execute.Source {
	spec := prSpec.(*FromProcedureSpec)
	var w execute.Window
	if spec.WindowSet {
		w = execute.Window{
			Every:  execute.Duration(spec.Window.Every),
			Period: execute.Duration(spec.Window.Period),
			Round:  execute.Duration(spec.Window.Round),
			Start:  a.ResolveTime(spec.Window.Start),
		}
	} else {
		duration := execute.Duration(a.ResolveTime(spec.Bounds.Stop)) - execute.Duration(a.ResolveTime(spec.Bounds.Start))
		w = execute.Window{
			Every:  duration,
			Period: duration,
			Start:  a.ResolveTime(spec.Bounds.Start),
		}
	}
	currentTime := w.Start + execute.Time(w.Period)
	bounds := execute.Bounds{
		Start: a.ResolveTime(spec.Bounds.Start),
		Stop:  a.ResolveTime(spec.Bounds.Stop),
	}
	return execute.NewStorageSource(
		id,
		sr,
		execute.ReadSpec{
			Database:        spec.Database,
			Hosts:           spec.Hosts,
			Predicate:       spec.Filter,
			PointsLimit:     spec.PointsLimit,
			SeriesLimit:     spec.SeriesLimit,
			SeriesOffset:    spec.SeriesOffset,
			Descending:      spec.Descending,
			OrderByTime:     spec.OrderByTime,
			MergeAll:        spec.MergeAll,
			GroupKeys:       spec.GroupKeys,
			GroupExcept:     spec.GroupExcept,
			GroupKeep:       spec.GroupKeep,
			AggregateMethod: spec.AggregateMethod,
		},
		bounds,
		w,
		currentTime,
	)
}
