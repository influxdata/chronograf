package tests_test

import (
	"context"
	"io/ioutil"
	"os"
	"path/filepath"
	"testing"

	"github.com/influxdata/flux"
	_ "github.com/influxdata/flux/functions/inputs"          // Import the built-in inputs
	_ "github.com/influxdata/flux/functions/outputs"         // Import the built-in outputs
	_ "github.com/influxdata/flux/functions/tests"           // Import the built-in functions
	_ "github.com/influxdata/flux/functions/transformations" // Import the built-in functions
	"github.com/influxdata/flux/lang"
	_ "github.com/influxdata/flux/options" // Import the built-in options
	"github.com/influxdata/flux/querytest"
)

func init() {
	flux.RegisterBuiltIn("loadTest", loadTestBuiltin)
	flux.FinalizeBuiltIns()
}

var loadTestBuiltin = `
// loadData is a function that's referenced in all the transformation tests.  
// it's registered here so that we can register a different loadData function for 
// each platform/binary.  
testLoadData = (file) => fromCSV(file:file)`

var skipTests = map[string]string{
	"string_max":                  "error: invalid use of function: *functions.MaxSelector has no implementation for type string (https://github.com/influxdata/platform/issues/224)",
	"null_as_value":               "null not supported as value in influxql (https://github.com/influxdata/platform/issues/353)",
	"string_interp":               "string interpolation not working as expected in flux (https://github.com/influxdata/platform/issues/404)",
	"to":                          "to functions are not supported in the testing framework (https://github.com/influxdata/flux/issues/77)",
	"covariance_missing_column_1": "need to support known errors in new test framework (https://github.com/influxdata/flux/issues/536)",
	"covariance_missing_column_2": "need to support known errors in new test framework (https://github.com/influxdata/flux/issues/536)",
	"drop_before_rename":          "need to support known errors in new test framework (https://github.com/influxdata/flux/issues/536)",
	"drop_referenced":             "need to support known errors in new test framework (https://github.com/influxdata/flux/issues/536)",
	"yield":                       "yield requires special test case (https://github.com/influxdata/flux/issues/535)",
}

var querier = querytest.NewQuerier()

type AssertionError interface {
	Assertion() bool
}

func withEachFluxFile(t testing.TB, fn func(prefix, caseName string)) {
	dir, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	path := filepath.Join(dir, "testdata")
	os.Chdir(path)

	fluxFiles, err := filepath.Glob("*.flux")
	if err != nil {
		t.Fatalf("error searching for Flux files: %s", err)
	}

	for _, fluxFile := range fluxFiles {
		ext := filepath.Ext(fluxFile)
		prefix := fluxFile[0 : len(fluxFile)-len(ext)]
		_, caseName := filepath.Split(prefix)
		fn(prefix, caseName)
	}
}

func Test_QueryEndToEnd(t *testing.T) {
	withEachFluxFile(t, func(prefix, caseName string) {
		reason, skip := skipTests[caseName]

		fluxName := caseName + ".flux"
		t.Run(fluxName, func(t *testing.T) {
			if skip {
				t.Skip(reason)
			}
			testFlux(t, querier, prefix, ".flux")
		})
	})
}

func Benchmark_QueryEndToEnd(b *testing.B) {
	withEachFluxFile(b, func(prefix, caseName string) {
		reason, skip := skipTests[caseName]

		fluxName := caseName + ".flux"
		b.Run(fluxName, func(b *testing.B) {
			if skip {
				b.Skip(reason)
			}
			b.ResetTimer()
			b.ReportAllocs()
			for i := 0; i < b.N; i++ {
				testFlux(b, querier, prefix, ".flux")
			}
		})
	})
}

func testFlux(t testing.TB, querier *querytest.Querier, prefix, queryExt string) {
	q, err := ioutil.ReadFile(prefix + queryExt)
	if err != nil {
		t.Fatal(err)
	}

	if err != nil {
		t.Fatal(err)
	}

	c := lang.FluxCompiler{
		Query: string(q),
	}

	r, err := querier.C.Query(context.Background(), c)
	if err != nil {
		t.Fatalf("test error %s", err)
	}
	defer r.Done()
	result, ok := <-r.Ready()
	if !ok {
		t.Fatalf("TEST error retrieving query result: %s", r.Err())
	}
	for _, v := range result {
		err := v.Tables().Do(func(tbl flux.Table) error {
			return nil
		})
		if err != nil {
			if assertionErr, ok := err.(AssertionError); ok {
				t.Error(assertionErr)
			} else {
				t.Fatal(err)
			}
		}
	}
}
