package control

import (
	"context"
	"testing"
	"time"

	"github.com/influxdata/flux"
	_ "github.com/influxdata/flux/builtin"
	"github.com/influxdata/flux/functions/inputs"
	"github.com/influxdata/flux/internal/pkg/syncutil"
	"github.com/influxdata/flux/memory"
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

	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer func() {
		if err := ctrl.Shutdown(ctx); err != nil {
			t.Fatal(err)
		}
		cancel()
	}()

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

func TestController_PlanQuery_Failure(t *testing.T) {
	// this compiler returns a spec that cannot be planned
	// (no range to push into from)
	compiler := &mock.Compiler{
		CompileFn: func(ctx context.Context) (*flux.Spec, error) {
			return &flux.Spec{
				Operations: []*flux.Operation{{
					ID:   "from",
					Spec: &inputs.FromOpSpec{Bucket: "telegraf"},
				}},
			}, nil
		},
	}

	ctrl := New(Config{})

	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer func() {
		if err := ctrl.Shutdown(ctx); err != nil {
			t.Fatal(err)
		}
		cancel()
	}()

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

	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer func() {
		if err := ctrl.Shutdown(ctx); err != nil {
			t.Fatal(err)
		}
		cancel()
	}()

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
	executor.ExecuteFn = func(context.Context, *plan.PlanSpec, *memory.Allocator) (map[string]flux.Result, error) {
		return nil, errors.New("expected")
	}

	ctrl := New(Config{})
	ctrl.executor = executor

	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer func() {
		if err := ctrl.Shutdown(ctx); err != nil {
			t.Fatal(err)
		}
		cancel()
	}()

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
	executor.ExecuteFn = func(context.Context, *plan.PlanSpec, *memory.Allocator) (map[string]flux.Result, error) {
		// Return an empty result.
		return map[string]flux.Result{}, nil
	}

	ctrl := New(Config{})
	ctrl.executor = executor

	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer func() {
		if err := ctrl.Shutdown(ctx); err != nil {
			t.Fatal(err)
		}
		cancel()
	}()

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
	executor.ExecuteFn = func(context.Context, *plan.PlanSpec, *memory.Allocator) (map[string]flux.Result, error) {
		<-done
		return nil, nil
	}

	ctrl := New(Config{})
	ctrl.executor = executor

	cctx, ccancel := context.WithTimeout(context.Background(), time.Second)
	defer func() {
		if err := ctrl.Shutdown(cctx); err != nil {
			t.Fatal(err)
		}
		ccancel()
	}()

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

func TestController_CancelledContextPropagatesToExecutor(t *testing.T) {
	t.Parallel()

	executor := mock.NewExecutor()
	executor.ExecuteFn = func(ctx context.Context, _ *plan.PlanSpec, _ *memory.Allocator) (map[string]flux.Result, error) {
		<-ctx.Done() // Unblock only when context has been cancelled
		return nil, nil
	}

	ctrl := New(Config{})
	ctrl.executor = executor

	cctx, ccancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer func() {
		if err := ctrl.Shutdown(cctx); err != nil {
			t.Fatal(err)
		}
		ccancel()
	}()

	// Parent query context
	pctx, pcancel := context.WithCancel(context.Background())

	// done signals that ExecuteFn returned
	done := make(chan struct{})

	go func() {
		q, err := ctrl.Query(pctx, mockCompiler)
		if err != nil {
			t.Errorf("unexpected error: %s", err)
		}
		// Ready will unblock when executor unblocks
		<-q.Ready()
		// TODO(jlapacik): query should expose error if cancelled during execution
		// if q.Err() == nil {
		//     t.Errorf("expected error; cancelled query context before execution finished")
		// }
		q.Done()
		close(done)
	}()

	waitCheckDelay := 500 * time.Millisecond

	select {
	case <-done:
		t.Fatalf("ExecuteFn returned before parent context was cancelled")
	case <-time.After(waitCheckDelay):
		// Okay.
	}

	pcancel()

	select {
	case <-done:
		// Okay.
	case <-time.After(waitCheckDelay):
		t.Fatalf("ExecuteFn didn't return after parent context canceled")
	}
}

func TestController_Shutdown(t *testing.T) {
	executor := mock.NewExecutor()
	ctrl := New(Config{})
	ctrl.executor = executor

	// Create a bunch of queries and never call Ready which should leave them in the controller.
	queries := make([]flux.Query, 0, 10)
	for i := 0; i < 10; i++ {
		q, err := ctrl.Query(context.Background(), mockCompiler)
		if err != nil {
			t.Errorf("unexpected error: %s", err)
			continue
		}
		queries = append(queries, q)
	}

	// Run shutdown which should wait until the queries are finished.
	var wg syncutil.WaitGroup
	wg.Do(func() error {
		return ctrl.Shutdown(context.Background())
	})

	// A new query should be rejected.
	if _, err := ctrl.Query(context.Background(), mockCompiler); err == nil {
		t.Error("expected error")
	}

	// There should be 10 active queries.
	if want, got := 10, len(ctrl.Queries()); want != got {
		t.Fatalf("unexpected query count -want/+got\n\t- %d\n\t+ %d", want, got)
	}

	// Mark each of the queries as done.
	for _, q := range queries {
		q := q
		wg.Do(func() error {
			<-q.Ready()
			q.Done()
			return nil
		})
	}

	if err := wg.Wait(); err != nil {
		t.Fatalf("unexpected error: %s", err)
	}

	// There should be no queries.
	if want, got := 0, len(ctrl.Queries()); want != got {
		t.Fatalf("unexpected query count -want/+got\n\t- %d\n\t+ %d", want, got)
	}
}

func TestController_Statistics(t *testing.T) {
	ctrl := New(Config{})
	ctrl.executor = mock.NewExecutor()

	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer func() {
		if err := ctrl.Shutdown(ctx); err != nil {
			t.Fatal(err)
		}
		cancel()
	}()

	// Run the query. It should return an error.
	q, err := ctrl.Query(context.Background(), mockCompiler)
	if err != nil {
		t.Fatalf("unexpected error: %s", err)
	}

	<-q.Ready()
	time.Sleep(time.Millisecond)
	q.Done()

	statser, ok := q.(flux.Statisticser)
	if !ok {
		t.Fatal("query does not implement flux.Statisticser")
	}

	// Ensure this works without
	stats := statser.Statistics()
	if stats.TotalDuration == 0 {
		t.Fatal("total duration should be greater than zero")
	}
}
