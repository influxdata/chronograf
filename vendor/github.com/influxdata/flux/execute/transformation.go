package execute

import (
	"context"
	"fmt"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/memory"
	"github.com/influxdata/flux/plan"
)

type Transformation interface {
	RetractTable(id DatasetID, key flux.GroupKey) error
	Process(id DatasetID, tbl flux.Table) error
	UpdateWatermark(id DatasetID, t Time) error
	UpdateProcessingTime(id DatasetID, t Time) error
	Finish(id DatasetID, err error)
}

// StreamContext represents necessary context for a single stream of
// query data.
type StreamContext interface {
	Bounds() *Bounds
}

type Administration interface {
	Context() context.Context

	ResolveTime(qt flux.Time) Time
	StreamContext() StreamContext
	Allocator() *memory.Allocator
	Parents() []DatasetID

	Dependencies() Dependencies
}

// Dependencies represents the provided dependencies to the execution environment.
// The dependencies is opaque.
type Dependencies map[string]interface{}

type CreateTransformation func(id DatasetID, mode AccumulationMode, spec plan.ProcedureSpec, a Administration) (Transformation, Dataset, error)
type CreateNewPlannerTransformation func(id DatasetID, mode AccumulationMode, spec plan.ProcedureSpec, a Administration) (Transformation, Dataset, error)

var procedureToTransformation = make(map[plan.ProcedureKind]CreateNewPlannerTransformation)

func RegisterTransformation(k plan.ProcedureKind, c CreateNewPlannerTransformation) {
	if procedureToTransformation[k] != nil {
		panic(fmt.Errorf("duplicate registration for transformation with procedure kind %v", k))
	}
	procedureToTransformation[k] = c
}
