package inputs_test

import (
	"testing"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/functions/inputs"
	"github.com/influxdata/flux/querytest"
)

func TestFromInfluxJSON_NewQuery(t *testing.T) {
	tests := []querytest.NewQueryTestCase{
		{
			Name:    "from no args",
			Raw:     `fromInfluxJSON()`,
			WantErr: true,
		},
		{
			Name:    "from conflicting args",
			Raw:     `fromInfluxJSON(json:"d", file:"b")`,
			WantErr: true,
		},
		{
			Name:    "from repeat arg",
			Raw:     `from(json:"telegraf", json:"oops")`,
			WantErr: true,
		},
		{
			Name: "fromInfluxJSON text",
			Raw:  `fromInfluxJSON(json: "{results: []}")`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "fromInfluxJSON0",
						Spec: &inputs.FromInfluxJSONOpSpec{
							JSON: "{results: []}",
						},
					},
				},
			},
		},
	}
	for _, tc := range tests {
		tc := tc
		t.Run(tc.Name, func(t *testing.T) {
			querytest.NewQueryTestHelper(t, tc)
		})
	}
}
