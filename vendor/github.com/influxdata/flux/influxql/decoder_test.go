package influxql_test

import (
	"io/ioutil"
	"strings"
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/influxql"
)

func TestDecoder(t *testing.T) {
	exp := []executetest.Result{
		{
			Nm: "0",
			Tbls: []*executetest.Table{{
				KeyCols: []string{"_measurement", "host", "_field"},
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_measurement", Type: flux.TString},
					{Label: "host", Type: flux.TString},
					{Label: "_field", Type: flux.TString},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(0), "cpu", "server01", "usage_user", 0.0},
				},
			}},
		},
	}
	for i := range exp {
		exp[i].Normalize()
	}

	dec := influxql.NewResultDecoder(executetest.UnlimitedAllocator)
	ri, err := dec.Decode(ioutil.NopCloser(strings.NewReader(`
{
	"results": [
		{
			"statement_id": 0,
			"series": [
				{
					"name": "cpu",
					"tags": {
						"host": "server01"
					},
					"columns": ["time", "usage_user"],
					"values": [
						["1970-01-01T00:00:00Z", 0.0]
					]
				}
			]
		}
	]
}
`)))
	if err != nil {
		t.Fatalf("unexpected error: %s", err)
	}

	var got []executetest.Result
	for ri.More() {
		next := ri.Next()

		res := executetest.Result{
			Nm: next.Name(),
		}

		if err := next.Tables().Do(func(table flux.Table) error {
			tbl, err := executetest.ConvertTable(table)
			if err != nil {
				return err
			}
			res.Tbls = append(res.Tbls, tbl)
			return nil
		}); err != nil {
			t.Fatalf("unexpected error: %s", err)
		}
		got = append(got, res)
	}

	if !cmp.Equal(exp, got) {
		t.Fatalf("unexpected result -want/+got:\n%s", cmp.Diff(exp, got))
	}
}
