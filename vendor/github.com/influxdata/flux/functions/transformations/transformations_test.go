package transformations_test

import (
	"bytes"
	"context"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/andreyvit/diff"
	"github.com/influxdata/flux"
	_ "github.com/influxdata/flux/builtin"
	"github.com/influxdata/flux/csv"
	"github.com/influxdata/flux/lang"
	"github.com/influxdata/flux/querytest"
)

var skipTests = map[string]string{
	"derivative":                "derivative not supported by influxql (https://github.com/influxdata/platform/issues/93)",
	"filter_by_tags":            "arbitrary filtering not supported by influxql (https://github.com/influxdata/platform/issues/94)",
	"window_group_mean_ungroup": "error in influxql: failed to run query: timeValue column \"_start\" does not exist (https://github.com/influxdata/platform/issues/97)",
	"string_max":                "error: invalid use of function: *functions.MaxSelector has no implementation for type string (https://github.com/influxdata/platform/issues/224)",
	"null_as_value":             "null not supported as value in influxql (https://github.com/influxdata/platform/issues/353)",
	"difference_panic":          "difference() panics when no table is supplied",
	"string_interp":             "string interpolation not working as expected in flux (https://github.com/influxdata/platform/issues/404)",
	"to":                        "to functions are not supported in the testing framework (https://github.com/influxdata/flux/issues/77)",
	"task_per_line":             "bug in group by caused by heterogeneous table schemas (https://github.com/influxdata/flux/issues/100)",
}

var querier = querytest.NewQuerier()

func withEachFluxFile(t testing.TB, fn func(prefix, caseName string)) {
	dir, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	path := filepath.Join(dir, "testdata")

	fluxFiles, err := filepath.Glob(filepath.Join(path, "*.flux"))
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
		if skip {
			b.Skip(reason)
		}

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

	csvInFilename := prefix + ".in.csv"
	csvOut, err := ioutil.ReadFile(prefix + ".out.csv")
	if err != nil {
		t.Fatal(err)
	}

	c := querytest.FromCSVCompiler{
		Compiler: lang.FluxCompiler{
			Query: string(q),
		},
		InputFile: csvInFilename,
	}
	d := csv.DefaultDialect()

	QueryTestCheckSpec(t, querier, c, d, string(csvOut))
}

func QueryTestCheckSpec(t testing.TB, querier *querytest.Querier, c flux.Compiler, d flux.Dialect, want string) {
	t.Helper()

	var buf bytes.Buffer
	_, err := querier.Query(context.Background(), &buf, c, d)
	if err != nil {
		t.Errorf("failed to run query: %v", err)
		return
	}

	got := buf.String()

	if g, w := strings.TrimSpace(got), strings.TrimSpace(want); g != w {
		t.Errorf("result not as expected want(-) got (+):\n%v", diff.LineDiff(w, g))
	}
}
