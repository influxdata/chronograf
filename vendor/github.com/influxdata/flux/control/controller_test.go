package control

import (
	"context"
	"testing"
	"time"

	"github.com/influxdata/flux"
	_ "github.com/influxdata/flux/builtin"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/mock"
	"github.com/influxdata/flux/plan"
	"github.com/pkg/errors"
	"github.com/prometheus/client_golang/prometheus"
	dto "github.com/prometheus/client_model/go"
)

var mockCompiler *mock.Compiler

func init() {
	mockCompiler = new(mock.Compiler)
	mockCompiler.CompileFn = func(ctx context.Context) (*flux.Spec, error) {
		return flux.Compile(ctx, `from(bucket: "telegraf") |> range(start: -5m) |> mean()`, time.Now())
	}
}

func TestController_CompileQuery_Failure(t *testing.T) {
	compiler := &mock.Compiler{
		CompileFn: func(ctx context.Context) (*flux.Spec, error) {
			return nil, errors.New("expected")
		},
	}

	ctrl := New(Config{})

	// Run the query. It should return an error.
	if _, err := ctrl.Query(context.Background(), compiler); err == nil {
		t.Fatal("expected error")
	}

	// Verify the metrics say there are no queries.
	gauge, err := ctrl.metrics.all.GetMetricWithLabelValues()
	if err != nil {
		t.Fatalf("unexpected error: %s", err)
	}

	metric := &dto.Metric{}
	if err := gauge.Write(metric); err != nil {
		t.Fatalf("unexpected error: %s", err)
	}

	if got, exp := int(metric.Gauge.GetValue()), 0; got != exp {
		t.Fatalf("unexpected metric value: exp=%d got=%d", exp, got)
	}
}

func TestController_EnqueueQuery_Failure(t *testing.T) {
	compiler := &mock.Compiler{
		CompileFn: func(ctx context.Context) (*flux.Spec, error) {
			// This returns an invalid spec so that enqueueing the query fails.
			// TODO(jsternberg): We should probably move the validation step to compilation
			// instead as it makes more sense. In that case, we would still need to verify
			// that enqueueing the query was successful in some way.
			return &flux.Spec{}, nil
		},
	}

	ctrl := New(Config{})

	// Run the query. It should return an error.
	if _, err := ctrl.Query(context.Background(), compiler); err == nil {
		t.Fatal("expected error")
	}

	// Verify the metrics say there are no queries.
	for name, gaugeVec := range map[string]*prometheus.GaugeVec{
		"all":      ctrl.metrics.all,
		"queueing": ctrl.metrics.queueing,
	} {
		gauge, err := gaugeVec.GetMetricWithLabelValues()
		if err != nil {
			t.Fatalf("unexpected error: %s", err)
		}

		metric := &dto.Metric{}
		if err := gauge.Write(metric); err != nil {
			t.Fatalf("unexpected error: %s", err)
		}

		if got, exp := int(metric.Gauge.GetValue()), 0; got != exp {
			t.Fatalf("unexpected %s metric value: exp=%d got=%d", name, exp, got)
		}
	}
}

func TestController_ExecuteQuery_Failure(t *testing.T) {
	executor := mock.NewExecutor()
	executor.ExecuteFn = func(context.Context, *plan.PlanSpec, *execute.Allocator) (map[string]flux.Result, error) {
		return nil, errors.New("expected")
	}

	ctrl := New(Config{})
	ctrl.executor = executor

	// Run a query and then wait for it to be ready.
	q, err := ctrl.Query(context.Background(), mockCompiler)
	if err != nil {
		t.Fatalf("unexpected error: %s", err)
	}

	// We do not care about the results, just that the query is ready.
	<-q.Ready()

	if err := q.Err(); err == nil {
		t.Fatal("expected error")
	} else if got, want := err.Error(), "failed to execute query: expected"; got != want {
		t.Fatalf("unexpected error: exp=%s want=%s", want, got)
	}

	// Now finish the query by using Done.
	q.Done()

	// Verify the metrics say there are no queries.
	gauge, err := ctrl.metrics.all.GetMetricWithLabelValues()
	if err != nil {
		t.Fatalf("unexpected error: %s", err)
	}

	metric := &dto.Metric{}
	if err := gauge.Write(metric); err != nil {
		t.Fatalf("unexpected error: %s", err)
	}

	if got, exp := int(metric.Gauge.GetValue()), 0; got != exp {
		t.Fatalf("unexpected metric value: exp=%d got=%d", exp, got)
	}
}

func TestController_CancelQuery(t *testing.T) {
	executor := mock.NewExecutor()
	executor.ExecuteFn = func(context.Context, *plan.PlanSpec, *execute.Allocator) (map[string]flux.Result, error) {
		// Return an empty result.
		return map[string]flux.Result{}, nil
	}

	ctrl := New(Config{})
	ctrl.executor = executor

	// Run a query and then wait for it to be ready.
	q, err := ctrl.Query(context.Background(), mockCompiler)
	if err != nil {
		t.Fatalf("unexpected error: %s", err)
	}

	// We do not care about the results, just that the query is ready.
	<-q.Ready()

	// Cancel the query. This should result in it switching to the canceled state.
	q.Cancel()

	// Now finish the query by using Done.
	q.Done()

	// Verify the metrics say there are no queries.
	gauge, err := ctrl.metrics.all.GetMetricWithLabelValues()
	if err != nil {
		t.Fatalf("unexpected error: %s", err)
	}

	metric := &dto.Metric{}
	if err := gauge.Write(metric); err != nil {
		t.Fatalf("unexpected error: %s", err)
	}

	if got, exp := int(metric.Gauge.GetValue()), 0; got != exp {
		t.Fatalf("unexpected metric value: exp=%d got=%d", exp, got)
	}
}

func TestController_BlockedExecutor(t *testing.T) {
	done := make(chan struct{})

	executor := mock.NewExecutor()
	executor.ExecuteFn = func(context.Context, *plan.PlanSpec, *execute.Allocator) (map[string]flux.Result, error) {
		<-done
		return nil, nil
	}

	ctrl := New(Config{})
	ctrl.executor = executor

	// Run a query that will cause the controller to stall.
	q, err := ctrl.Query(context.Background(), mockCompiler)
	if err != nil {
		t.Fatalf("unexpected error: %s", err)
	}
	defer func() {
		close(done)
		<-q.Ready()
		q.Done()
	}()

	// Run another query. It should block in the Query call and then unblock when we cancel
	// the context.
	ctx, cancel := context.WithCancel(context.Background())
	go func() {
		defer cancel()
		timer := time.NewTimer(10 * time.Millisecond)
		select {
		case <-timer.C:
		case <-done:
			timer.Stop()
		}
	}()

	if _, err := ctrl.Query(ctx, mockCompiler); err == nil {
		t.Fatal("expected error")
	} else if got, want := err, context.Canceled; got != want {
		t.Fatalf("unexpected error: got=%q want=%q", got, want)
	}
}
