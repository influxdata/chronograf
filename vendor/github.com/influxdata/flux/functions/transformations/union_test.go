package transformations_test

import (
	"testing"
	"time"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/functions/inputs"
	"github.com/influxdata/flux/functions/transformations"
	"github.com/influxdata/flux/querytest"
)

func TestUnion_NewQuery(t *testing.T) {
	tests := []querytest.NewQueryTestCase{
		{
			Name: "basic two-way union",
			Raw: `
				a = from(bucket:"dbA") |> range(start:-1h)
				b = from(bucket:"dbB") |> range(start:-1h)
				union(tables: [a, b])`,
			Want: &flux.Spec{Operations: []*flux.Operation{
				{
					ID:   "from0",
					Spec: &inputs.FromOpSpec{Bucket: "dbA"},
				},
				{
					ID: "range1",
					Spec: &transformations.RangeOpSpec{
						Start: flux.Time{
							Relative:   -1 * time.Hour,
							IsRelative: true,
						},
						Stop: flux.Time{
							IsRelative: true,
						},
						TimeColumn:  "_time",
						StartColumn: "_start",
						StopColumn:  "_stop",
					},
				},
				{
					ID:   "from2",
					Spec: &inputs.FromOpSpec{Bucket: "dbB"},
				},
				{
					ID: "range3",
					Spec: &transformations.RangeOpSpec{
						Start: flux.Time{
							Relative:   -1 * time.Hour,
							IsRelative: true,
						},
						Stop: flux.Time{
							IsRelative: true,
						},
						TimeColumn:  "_time",
						StartColumn: "_start",
						StopColumn:  "_stop",
					},
				},
				{
					ID:   "union4",
					Spec: &transformations.UnionOpSpec{},
				},
			},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "range1"},
					{Parent: "from2", Child: "range3"},
					{Parent: "range1", Child: "union4"},
					{Parent: "range3", Child: "union4"},
				},
			},
		},
		{
			Name: "basic three-way union",
			Raw: `
				a = from(bucket:"dbA") |> range(start:-1h)
				b = from(bucket:"dbB") |> range(start:-1h)
				c = from(bucket:"dbC") |> range(start:-1h)
				union(tables: [a, b, c])`,
			Want: &flux.Spec{Operations: []*flux.Operation{
				{
					ID:   "from0",
					Spec: &inputs.FromOpSpec{Bucket: "dbA"},
				},
				{
					ID: "range1",
					Spec: &transformations.RangeOpSpec{
						Start: flux.Time{
							Relative:   -1 * time.Hour,
							IsRelative: true,
						},
						Stop: flux.Time{
							IsRelative: true,
						},
						TimeColumn:  "_time",
						StartColumn: "_start",
						StopColumn:  "_stop",
					},
				},
				{
					ID:   "from2",
					Spec: &inputs.FromOpSpec{Bucket: "dbB"},
				},
				{
					ID: "range3",
					Spec: &transformations.RangeOpSpec{
						Start: flux.Time{
							Relative:   -1 * time.Hour,
							IsRelative: true,
						},
						Stop: flux.Time{
							IsRelative: true,
						},
						TimeColumn:  "_time",
						StartColumn: "_start",
						StopColumn:  "_stop",
					},
				},
				{
					ID:   "from4",
					Spec: &inputs.FromOpSpec{Bucket: "dbC"},
				},
				{
					ID: "range5",
					Spec: &transformations.RangeOpSpec{
						Start: flux.Time{
							Relative:   -1 * time.Hour,
							IsRelative: true,
						},
						Stop: flux.Time{
							IsRelative: true,
						},
						TimeColumn:  "_time",
						StartColumn: "_start",
						StopColumn:  "_stop",
					},
				},
				{
					ID:   "union6",
					Spec: &transformations.UnionOpSpec{},
				},
			},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "range1"},
					{Parent: "from2", Child: "range3"},
					{Parent: "from4", Child: "range5"},
					{Parent: "range1", Child: "union6"},
					{Parent: "range3", Child: "union6"},
					{Parent: "range5", Child: "union6"},
				},
			},
		},
		{
			Name: "union no argument",
			Raw: `
				union()`,
			WantErr: true,
		},
		{
			Name: "one-way union",
			Raw: `
				b = from(bucket:"dbB") |> range(start:-1h)
				union(tables: [b])`,
			WantErr: true,
		},
		{
			Name: "non-table union",
			Raw: `
				union(tables: [{a: "a"}, {a: "b"}])`,
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

func TestUnionOperation_Marshaling(t *testing.T) {
	data := []byte(`{
		"id":"union",
		"kind":"union",
		"spec":{
		}
	}`)
	op := &flux.Operation{
		ID:   "union",
		Spec: &transformations.UnionOpSpec{},
	}
	querytest.OperationMarshalingTestHelper(t, data, op)
}
