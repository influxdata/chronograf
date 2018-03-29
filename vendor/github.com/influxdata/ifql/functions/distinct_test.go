package functions_test

import (
	"testing"

	"github.com/influxdata/ifql/functions"
	"github.com/influxdata/ifql/query"
	"github.com/influxdata/ifql/query/execute"
	"github.com/influxdata/ifql/query/execute/executetest"
	"github.com/influxdata/ifql/query/querytest"
)

func TestDistinctOperation_Marshaling(t *testing.T) {
	data := []byte(`{"id":"distinct","kind":"distinct","spec":{"column":"_value"}}`)
	op := &query.Operation{
		ID: "distinct",
		Spec: &functions.DistinctOpSpec{
			Column: "_value",
		},
	}
	querytest.OperationMarshalingTestHelper(t, data, op)
}

func TestDistinct_PassThrough(t *testing.T) {
	executetest.TransformationPassThroughTestHelper(t, func(d execute.Dataset, c execute.BlockBuilderCache) execute.Transformation {
		s := functions.NewDistinctTransformation(
			d,
			c,
			&functions.DistinctProcedureSpec{
				Column: "_value",
			},
		)
		return s
	})
}

func TestDistinct_Process(t *testing.T) {
	testCases := []struct {
		name string
		spec *functions.DistinctProcedureSpec
		data []execute.Block
		want []*executetest.Block
	}{
		{
			name: "one block",
			spec: &functions.DistinctProcedureSpec{
				Column: "_value",
			},
			data: []execute.Block{&executetest.Block{
				Bnds: execute.Bounds{
					Start: 1,
					Stop:  5,
				},
				ColMeta: []execute.ColMeta{
					{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
					{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
				},
				Data: [][]interface{}{
					{execute.Time(1), 2.0},
					{execute.Time(2), 1.0},
					{execute.Time(3), 3.0},
					{execute.Time(4), 1.0},
				},
			}},
			want: []*executetest.Block{{
				Bnds: execute.Bounds{
					Start: 1,
					Stop:  5,
				},
				ColMeta: []execute.ColMeta{
					{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
					{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
				},
				Data: [][]interface{}{
					{execute.Time(1), 2.0},
					{execute.Time(2), 1.0},
					{execute.Time(3), 3.0},
				},
			}},
		},
		{
			name: "distinct tag",
			spec: &functions.DistinctProcedureSpec{
				Column: "t1",
			},
			data: []execute.Block{&executetest.Block{
				Bnds: execute.Bounds{
					Start: 1,
					Stop:  5,
				},
				ColMeta: []execute.ColMeta{
					{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
					{Label: "t1", Type: execute.TString, Kind: execute.TagColKind},
					{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
				},
				Data: [][]interface{}{
					{execute.Time(1), "a", 2.0},
					{execute.Time(2), "a", 1.0},
					{execute.Time(3), "b", 3.0},
					{execute.Time(4), "c", 1.0},
				},
			}},
			want: []*executetest.Block{{
				Bnds: execute.Bounds{
					Start: 1,
					Stop:  5,
				},
				ColMeta: []execute.ColMeta{
					{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
					{Label: "t1", Type: execute.TString, Kind: execute.TagColKind},
					{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
				},
				Data: [][]interface{}{
					{execute.Time(1), "a", 2.0},
					{execute.Time(3), "b", 3.0},
					{execute.Time(4), "c", 1.0},
				},
			}},
		},
		{
			name: "distinct times",
			spec: &functions.DistinctProcedureSpec{
				Column: "_time",
			},
			data: []execute.Block{&executetest.Block{
				Bnds: execute.Bounds{
					Start: 1,
					Stop:  5,
				},
				ColMeta: []execute.ColMeta{
					{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
					{Label: "t1", Type: execute.TString, Kind: execute.TagColKind},
					{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
				},
				Data: [][]interface{}{
					{execute.Time(1), "a", 2.0},
					{execute.Time(2), "a", 1.0},
					{execute.Time(3), "b", 3.0},
					{execute.Time(3), "c", 1.0},
				},
			}},
			want: []*executetest.Block{{
				Bnds: execute.Bounds{
					Start: 1,
					Stop:  5,
				},
				ColMeta: []execute.ColMeta{
					{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
					{Label: "t1", Type: execute.TString, Kind: execute.TagColKind},
					{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
				},
				Data: [][]interface{}{
					{execute.Time(1), "a", 2.0},
					{execute.Time(2), "a", 1.0},
					{execute.Time(3), "b", 3.0},
				},
			}},
		},
	}
	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			executetest.ProcessTestHelper(
				t,
				tc.data,
				tc.want,
				func(d execute.Dataset, c execute.BlockBuilderCache) execute.Transformation {
					return functions.NewDistinctTransformation(d, c, tc.spec)
				},
			)
		})
	}
}
