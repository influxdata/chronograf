package functions_test

import (
	"testing"
	"time"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/functions"
	"github.com/influxdata/flux/querytest"
	"github.com/influxdata/platform"
)

func TestFrom_NewQuery(t *testing.T) {
	tests := []querytest.NewQueryTestCase{
		{
			Name:    "from no args",
			Raw:     `from()`,
			WantErr: true,
		},
		{
			Name:    "from conflicting args",
			Raw:     `from(bucket:"d", bucket:"b")`,
			WantErr: true,
		},
		{
			Name:    "from repeat arg",
			Raw:     `from(bucket:"telegraf", bucket:"oops")`,
			WantErr: true,
		},
		{
			Name:    "from",
			Raw:     `from(bucket:"telegraf", chicken:"what is this?")`,
			WantErr: true,
		},
		{
			Name:    "from bucket invalid ID",
			Raw:     `from(bucketID:"invalid")`,
			WantErr: true,
		},
		{
			Name: "from bucket ID",
			Raw:  `from(bucketID:"aaaaaaaa")`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &functions.FromOpSpec{
							BucketID: platform.ID{170, 170, 170, 170},
						},
					},
				},
			},
		},
		{
			Name: "from with database",
			Raw:  `from(bucket:"mybucket") |> range(start:-4h, stop:-2h) |> sum()`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &functions.FromOpSpec{
							Bucket: "mybucket",
						},
					},
					{
						ID: "range1",
						Spec: &functions.RangeOpSpec{
							Start: flux.Time{
								Relative:   -4 * time.Hour,
								IsRelative: true,
							},
							Stop: flux.Time{
								Relative:   -2 * time.Hour,
								IsRelative: true,
							},
							TimeCol:  "_time",
							StartCol: "_start",
							StopCol:  "_stop",
						},
					},
					{
						ID: "sum2",
						Spec: &functions.SumOpSpec{
							AggregateConfig: execute.DefaultAggregateConfig,
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "range1"},
					{Parent: "range1", Child: "sum2"},
				},
			},
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

func TestFromOperation_Marshaling(t *testing.T) {
	data := []byte(`{"id":"from","kind":"from","spec":{"bucket":"mybucket"}}`)
	op := &flux.Operation{
		ID: "from",
		Spec: &functions.FromOpSpec{
			Bucket: "mybucket",
		},
	}
	querytest.OperationMarshalingTestHelper(t, data, op)
}

func TestFromOpSpec_BucketsAccessed(t *testing.T) {
	bucketName := "my_bucket"
	bucketID, _ := platform.IDFromString("deadbeef")
	tests := []querytest.NewQueryTestCase{
		{
			Name:             "From with bucket",
			Raw:              `from(bucket:"my_bucket")`,
			WantReadBuckets:  &[]platform.BucketFilter{{Name: &bucketName}},
			WantWriteBuckets: &[]platform.BucketFilter{},
		},
		{
			Name:             "From with bucketID",
			Raw:              `from(bucketID:"deadbeef")`,
			WantReadBuckets:  &[]platform.BucketFilter{{ID: bucketID}},
			WantWriteBuckets: &[]platform.BucketFilter{},
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
