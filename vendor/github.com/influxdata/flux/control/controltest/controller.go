// Package controltest provides a controller for use in tests.
package controltest

import (
	"context"
	"runtime"
	"runtime/debug"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/control"
)

// Controller embeds a control.Controller.
// It overrides the Query method, to return queries that require Done to be called.
// It accomplishes this by associating a finalizer with the Query that panics,
// and then clears the finalizer when Done is called.
//
// This approach is not foolproof: it is possible that garbage collection may not run during a test,
// and therefore the finalizer will not be invoked.
type Controller struct {
	*control.Controller
}

// New returns a new Controller encapsulating c.
func New(c *control.Controller) *Controller {
	return &Controller{Controller: c}
}

// Query returns the result of calling Query on the underlying control.Controller,
// wrapped to ensure that callers call Done on the resulting Query.
func (c *Controller) Query(ctx context.Context, compiler flux.Compiler) (flux.Query, error) {
	q, err := c.Controller.Query(ctx, compiler)
	if err != nil {
		return nil, err
	}

	return newRequireDoneQuery(q), nil
}

// requireDoneQuery is a flux.Query with an associated finalizer that panics if Done is never called.
type requireDoneQuery struct {
	flux.Query
}

func newRequireDoneQuery(q flux.Query) *requireDoneQuery {
	rdq := &requireDoneQuery{Query: q}
	stack := debug.Stack()
	runtime.SetFinalizer(rdq, func(*requireDoneQuery) {
		panic("Query.Done never called for query created at:\n" + string(stack))
	})
	return rdq
}

// Done clears the finalizer and calls Done on the underlying Query.
func (rdq *requireDoneQuery) Done() {
	runtime.SetFinalizer(rdq, nil)
	rdq.Query.Done()
}
