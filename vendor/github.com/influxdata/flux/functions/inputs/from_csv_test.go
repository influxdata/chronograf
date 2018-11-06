package inputs_test

import (
	"github.com/influxdata/flux/functions/inputs"
	"testing"
	"time"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/functions/transformations"
	"github.com/influxdata/flux/querytest"
)

func TestFromCSV_NewQuery(t *testing.T) {
	tests := []querytest.NewQueryTestCase{
		{
			Name:    "from no args",
			Raw:     `fromCSV()`,
			WantErr: true,
		},
		{
			Name:    "from conflicting args",
			Raw:     `fromCSV(csv:"d", file:"b")`,
			WantErr: true,
		},
		{
			Name:    "from repeat arg",
			Raw:     `from(csv:"telegraf", csv:"oops")`,
			WantErr: true,
		},
		{
			Name:    "from",
			Raw:     `from(csv:"telegraf", chicken:"what is this?")`,
			WantErr: true,
		},
		{
			Name: "fromCSV text",
			Raw:  `fromCSV(csv: "1,2") |> range(start:-4h, stop:-2h) |> sum()`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "fromCSV0",
						Spec: &inputs.FromCSVOpSpec{
							CSV: "1,2",
						},
					},
					{
						ID: "range1",
						Spec: &transformations.RangeOpSpec{
							Start: flux.Time{
								Relative:   -4 * time.Hour,
								IsRelative: true,
							},
							Stop: flux.Time{
								Relative:   -2 * time.Hour,
								IsRelative: true,
							},
							TimeColumn:  "_time",
							StartColumn: "_start",
							StopColumn:  "_stop",
						},
					},
					{
						ID: "sum2",
						Spec: &transformations.SumOpSpec{
							AggregateConfig: execute.DefaultAggregateConfig,
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "fromCSV0", Child: "range1"},
					{Parent: "range1", Child: "sum2"},
				},
			},
		},
		{
			Name:    "fromCSV File",
			Raw:     `fromCSV(file: "f.txt") |> range(start:-4h, stop:-2h) |> sum()`,
			WantErr: true,
		},
	}
	for _, tc := range tests {
		tc := tc
		t.Run(tc.Name, func(t *testing.T) {
			t.Parallel()
			querytest.NewQueryTestHelper(t, tc)
		})
	}
}

func TestFromCSVOperation_Marshaling(t *testing.T) {
	data := []byte(`{"id":"fromCSV","kind":"fromCSV","spec":{"csv":"1,2"}}`)
	op := &flux.Operation{
		ID: "fromCSV",
		Spec: &inputs.FromCSVOpSpec{
			CSV: "1,2",
		},
	}
	querytest.OperationMarshalingTestHelper(t, data, op)
}
