package execute

import (
	"context"
	"fmt"

	"github.com/influxdata/flux/plan"
)

type Node interface {
	AddTransformation(t Transformation)
}

type Source interface {
	Node
	Run(ctx context.Context)
}

type CreateSource func(spec plan.ProcedureSpec, id DatasetID, ctx Administration) (Source, error)
type CreateNewPlannerSource func(spec plan.ProcedureSpec, id DatasetID, ctx Administration) (Source, error)

var procedureToSource = make(map[plan.ProcedureKind]CreateNewPlannerSource)

func RegisterSource(k plan.ProcedureKind, c CreateNewPlannerSource) {
	if procedureToSource[k] != nil {
		panic(fmt.Errorf("duplicate registration for source with procedure kind %v", k))
	}
	procedureToSource[k] = c
}
