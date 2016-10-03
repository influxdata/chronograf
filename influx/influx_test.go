package influx_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/influxdata/mrfusion"
	"github.com/influxdata/mrfusion/influx"
	"github.com/influxdata/mrfusion/log"
	"golang.org/x/net/context"
)

func Test_Influx_MakesRequestsToQueryEndpoint(t *testing.T) {
	t.Parallel()
	called := false
	ts := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		rw.WriteHeader(http.StatusOK)
		rw.Write([]byte(`{}`))
		called = true
		if path := r.URL.Path; path != "/query" {
			t.Error("Expected the path to contain `/query` but was", path)
		}
	}))
	defer ts.Close()

	var series mrfusion.TimeSeries
	series, err := influx.NewClient(ts.URL, log.New())
	if err != nil {
		t.Fatal("Unexpected error initializing client: err:", err)
	}

	query := mrfusion.Query{
		Command: "show databases",
	}
	_, err = series.Query(context.Background(), query)
	if err != nil {
		t.Fatal("Expected no error but was", err)
	}

	if called == false {
		t.Error("Expected http request to Influx but there was none")
	}
}

func Test_Influx_CancelsInFlightRequests(t *testing.T) {
	t.Parallel()

	started := make(chan bool, 1)
	finished := make(chan bool, 1)
	ts := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		started <- true
		time.Sleep(20 * time.Millisecond)
		finished <- true
	}))
	defer func() {
		ts.CloseClientConnections()
		ts.Close()
	}()

	series, _ := influx.NewClient(ts.URL, log.New())
	ctx, cancel := context.WithCancel(context.Background())

	errs := make(chan (error))
	go func() {
		query := mrfusion.Query{
			Command: "show databases",
		}

		_, err := series.Query(ctx, query)
		errs <- err
	}()

	timer := time.NewTimer(10 * time.Second)
	defer timer.Stop()

	select {
	case s := <-started:
		if !s {
			t.Errorf("Expected cancellation during request processing. Started: %t", s)
		}
	case <-timer.C:
		t.Fatalf("Expected server to finish")
	}

	cancel()

	select {
	case f := <-finished:
		if !f {
			t.Errorf("Expected cancellation during request processing. Finished: %t", f)
		}
	case <-timer.C:
		t.Fatalf("Expected server to finish")
	}

	err := <-errs
	if err != mrfusion.ErrUpstreamTimeout {
		t.Error("Expected timeout error but wasn't. err was", err)
	}
}

func Test_Influx_RejectsInvalidHosts(t *testing.T) {
	_, err := influx.NewClient(":", log.New())
	if err == nil {
		t.Fatal("Expected err but was nil")
	}
}

func Test_Influx_ReportsInfluxErrs(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		rw.WriteHeader(http.StatusOK)
	}))
	defer ts.Close()

	cl, err := influx.NewClient(ts.URL, log.New())
	if err != nil {
		t.Fatal("Encountered unexpected error while initializing influx client: err:", err)
	}

	_, err = cl.Query(context.Background(), mrfusion.Query{"show shards", "_internal", "autogen"})
	if err == nil {
		t.Fatal("Expected an error but received none")
	}
}
