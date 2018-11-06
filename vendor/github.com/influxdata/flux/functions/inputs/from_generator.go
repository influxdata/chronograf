package inputs

import (
	"fmt"
	"time"

	"github.com/influxdata/flux/values"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/compiler"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/interpreter"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/semantic"
)

const FromGeneratorKind = "fromGenerator"

type FromGeneratorOpSpec struct {
	Start time.Time                    `json:"start"`
	Stop  time.Time                    `json:"stop"`
	Count int64                        `json:"count"`
	Fn    *semantic.FunctionExpression `json:"fn"`
}

func init() {
	fromGeneratorSignature := semantic.FunctionPolySignature{
		Parameters: map[string]semantic.PolyType{
			"start": semantic.Time,
			"stop":  semantic.Time,
			"count": semantic.Int,
			"fn": semantic.NewFunctionPolyType(semantic.FunctionPolySignature{
				Parameters: map[string]semantic.PolyType{
					"n": semantic.Int,
				},
				Required: semantic.LabelSet{"n"},
				Return:   semantic.Int,
			}),
		},
		Required: semantic.LabelSet{"start", "stop", "count", "fn"},
		Return:   flux.TableObjectType,
	}
	flux.RegisterFunction(FromGeneratorKind, createFromGeneratorOpSpec, fromGeneratorSignature)
	flux.RegisterOpSpec(FromGeneratorKind, newFromGeneratorOp)
	plan.RegisterProcedureSpec(FromGeneratorKind, newFromGeneratorProcedure, FromGeneratorKind)
	execute.RegisterSource(FromGeneratorKind, createFromGeneratorSource)
}

func createFromGeneratorOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	spec := new(FromGeneratorOpSpec)

	if t, err := args.GetRequiredTime("start"); err != nil {
		return nil, err
	} else {
		spec.Start = t.Time(time.Now())
	}

	if t, err := args.GetRequiredTime("stop"); err != nil {
		return nil, err
	} else {
		spec.Stop = t.Time(time.Now())
	}

	if i, err := args.GetRequiredInt("count"); err != nil {
		return nil, err
	} else {
		spec.Count = i
	}

	if f, err := args.GetRequiredFunction("fn"); err != nil {
		return nil, err
	} else {
		fn, err := interpreter.ResolveFunction(f)
		if err != nil {
			return nil, err
		}
		spec.Fn = fn
	}

	return spec, nil
}

func newFromGeneratorOp() flux.OperationSpec {
	return new(FromGeneratorOpSpec)
}

func (s *FromGeneratorOpSpec) Kind() flux.OperationKind {
	return FromGeneratorKind
}

type FromGeneratorProcedureSpec struct {
	plan.DefaultCost
	Start time.Time
	Stop  time.Time
	Count int64
	Fn    compiler.Func
}

func newFromGeneratorProcedure(qs flux.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	// TODO: copy over data from the OpSpec to the ProcedureSpec
	spec, ok := qs.(*FromGeneratorOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}

	fn, _, err := compiler.CompileFnParam(spec.Fn, semantic.Int, semantic.Int)
	if err != nil {
		return nil, err
	}
	return &FromGeneratorProcedureSpec{
		Count: spec.Count,
		Start: spec.Start,
		Stop:  spec.Stop,
		Fn:    fn,
	}, nil
}

func (s *FromGeneratorProcedureSpec) Kind() plan.ProcedureKind {
	return FromGeneratorKind
}

func (s *FromGeneratorProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(FromGeneratorProcedureSpec)

	return ns
}

func createFromGeneratorSource(prSpec plan.ProcedureSpec, dsid execute.DatasetID, a execute.Administration) (execute.Source, error) {
	spec, ok := prSpec.(*FromGeneratorProcedureSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", prSpec)
	}

	s := NewGeneratorSource(a.Allocator())
	s.Start = spec.Start
	s.Stop = spec.Stop
	s.Count = spec.Count
	s.Fn = spec.Fn

	return CreateSourceFromDecoder(s, dsid, a)
}

type GeneratorSource struct {
	done  bool
	Start time.Time
	Stop  time.Time
	Count int64
	alloc *execute.Allocator
	Fn    compiler.Func
}

func NewGeneratorSource(a *execute.Allocator) *GeneratorSource {
	return &GeneratorSource{alloc: a}
}

func (s *GeneratorSource) Connect() error {
	return nil
}

func (s *GeneratorSource) Fetch() (bool, error) {
	return !s.done, nil
}

func (s *GeneratorSource) Decode() (flux.Table, error) {
	defer func() {
		s.done = true
	}()
	ks := []flux.ColMeta{
		flux.ColMeta{
			Label: "_start",
			Type:  flux.TTime,
		},
		flux.ColMeta{
			Label: "_stop",
			Type:  flux.TTime,
		},
	}
	vs := []values.Value{
		values.NewTime(values.ConvertTime(s.Start)),
		values.NewTime(values.ConvertTime(s.Stop)),
	}
	groupKey := execute.NewGroupKey(ks, vs)
	b := execute.NewColListTableBuilder(groupKey, s.alloc)

	cols := []flux.ColMeta{
		flux.ColMeta{
			Label: "_time",
			Type:  flux.TTime,
		},
		flux.ColMeta{
			Label: "_value",
			Type:  flux.TInt,
		},
	}

	for _, col := range cols {
		_, err := b.AddCol(col)
		if err != nil {
			return nil, err
		}
	}

	cols = b.Cols()

	deltaT := s.Stop.Sub(s.Start) / time.Duration(s.Count)
	timeIdx := execute.ColIdx("_time", cols)
	valueIdx := execute.ColIdx("_value", cols)
	for i := 0; i < int(s.Count); i++ {
		b.AppendTime(timeIdx, values.ConvertTime(s.Start.Add(time.Duration(i)*deltaT)))
		in := values.NewObject()
		in.Set("n", values.NewInt(int64(i)))
		v, err := s.Fn.EvalInt(in)
		if err != nil {
			return nil, err
		}
		if err := b.AppendInt(valueIdx, v); err != nil {
			return nil, err
		}
	}

	return b.Table()
}
