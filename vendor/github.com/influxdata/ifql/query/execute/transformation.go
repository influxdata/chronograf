package execute

import (
	"fmt"

	"github.com/influxdata/ifql/query"
	"github.com/influxdata/ifql/query/plan"
)

type Transformation interface {
	RetractBlock(id DatasetID, meta BlockMetadata) error
	Process(id DatasetID, b Block) error
	UpdateWatermark(id DatasetID, t Time) error
	UpdateProcessingTime(id DatasetID, t Time) error
	Finish(id DatasetID, err error)
}

type Administration interface {
	ResolveTime(qt query.Time) Time
	Bounds() Bounds
	Allocator() *Allocator
	Parents() []DatasetID
	ConvertID(plan.ProcedureID) DatasetID
}

type CreateTransformation func(id DatasetID, mode AccumulationMode, spec plan.ProcedureSpec, a Administration) (Transformation, Dataset, error)

var procedureToTransformation = make(map[plan.ProcedureKind]CreateTransformation)

func RegisterTransformation(k plan.ProcedureKind, c CreateTransformation) {
	if procedureToTransformation[k] != nil {
		panic(fmt.Errorf("duplicate registration for transformation with procedure kind %v", k))
	}
	procedureToTransformation[k] = c
}
