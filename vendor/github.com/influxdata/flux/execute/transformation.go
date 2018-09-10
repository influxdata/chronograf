package execute

import (
	"fmt"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/platform"
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
	OrganizationID() platform.ID

	ResolveTime(qt flux.Time) Time
	StreamContext() StreamContext
	Allocator() *Allocator
	Parents() []DatasetID
	ConvertID(plan.ProcedureID) DatasetID

	Dependencies() Dependencies
}

// Dependencies represents the provided dependencies to the execution environment.
// The dependencies is opaque.
type Dependencies map[string]interface{}

type CreateTransformation func(id DatasetID, mode AccumulationMode, spec plan.ProcedureSpec, a Administration) (Transformation, Dataset, error)

var procedureToTransformation = make(map[plan.ProcedureKind]CreateTransformation)

func RegisterTransformation(k plan.ProcedureKind, c CreateTransformation) {
	if procedureToTransformation[k] != nil {
		panic(fmt.Errorf("duplicate registration for transformation with procedure kind %v", k))
	}
	procedureToTransformation[k] = c
}
