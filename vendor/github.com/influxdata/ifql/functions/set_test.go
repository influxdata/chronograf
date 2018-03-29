package functions_test

import (
	"testing"

	"github.com/influxdata/ifql/functions"
	"github.com/influxdata/ifql/query"
	"github.com/influxdata/ifql/query/execute"
	"github.com/influxdata/ifql/query/execute/executetest"
	"github.com/influxdata/ifql/query/querytest"
)

func TestSetOperation_Marshaling(t *testing.T) {
	data := []byte(`{"id":"set","kind":"set","spec":{"key":"t1","value":"v1"}}`)
	op := &query.Operation{
		ID: "set",
		Spec: &functions.SetOpSpec{
			Key:   "t1",
			Value: "v1",
		},
	}

	querytest.OperationMarshalingTestHelper(t, data, op)
}

func TestSet_Process(t *testing.T) {
	testCases := []struct {
		name string
		spec *functions.SetProcedureSpec
		data []execute.Block
		want []*executetest.Block
	}{
		{
			name: "new col",
			spec: &functions.SetProcedureSpec{
				Key:   "t1",
				Value: "bob",
			},
			data: []execute.Block{&executetest.Block{
				Bnds: execute.Bounds{
					Start: 1,
					Stop:  3,
				},
				ColMeta: []execute.ColMeta{
					{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
					{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
				},
				Data: [][]interface{}{
					{execute.Time(1), 2.0},
					{execute.Time(2), 1.0},
				},
			}},
			want: []*executetest.Block{{
				Bnds: execute.Bounds{
					Start: 1,
					Stop:  3,
				},
				ColMeta: []execute.ColMeta{
					{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
					{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
					{Label: "t1", Type: execute.TString, Kind: execute.TagColKind},
				},
				Data: [][]interface{}{
					{execute.Time(1), 2.0, "bob"},
					{execute.Time(2), 1.0, "bob"},
				},
			}},
		},
		{
			name: "replace col",
			spec: &functions.SetProcedureSpec{
				Key:   "t1",
				Value: "bob",
			},
			data: []execute.Block{&executetest.Block{
				Bnds: execute.Bounds{
					Start: 1,
					Stop:  3,
				},
				ColMeta: []execute.ColMeta{
					{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
					{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
					{Label: "t1", Type: execute.TString, Kind: execute.TagColKind},
				},
				Data: [][]interface{}{
					{execute.Time(1), 1.0, "jim"},
					{execute.Time(2), 2.0, "sue"},
				},
			}},
			want: []*executetest.Block{{
				Bnds: execute.Bounds{
					Start: 1,
					Stop:  3,
				},
				ColMeta: []execute.ColMeta{
					{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
					{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
					{Label: "t1", Type: execute.TString, Kind: execute.TagColKind},
				},
				Data: [][]interface{}{
					{execute.Time(1), 1.0, "bob"},
					{execute.Time(2), 2.0, "bob"},
				},
			}},
		},
		{
			name: "replace common col",
			spec: &functions.SetProcedureSpec{
				Key:   "t1",
				Value: "bob",
			},
			data: []execute.Block{&executetest.Block{
				Bnds: execute.Bounds{
					Start: 1,
					Stop:  3,
				},
				ColMeta: []execute.ColMeta{
					{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
					{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
					{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					{Label: "t2", Type: execute.TString, Kind: execute.TagColKind},
				},
				Data: [][]interface{}{
					{execute.Time(1), 1.0, "alice", "a"},
					{execute.Time(2), 1.0, "alice", "b"},
				},
			}},
			want: []*executetest.Block{{
				Bnds: execute.Bounds{
					Start: 1,
					Stop:  3,
				},
				ColMeta: []execute.ColMeta{
					{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
					{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
					{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					{Label: "t2", Type: execute.TString, Kind: execute.TagColKind},
				},
				Data: [][]interface{}{
					{execute.Time(1), 1.0, "bob", "a"},
					{execute.Time(2), 1.0, "bob", "b"},
				},
			}},
		},
		{
			name: "replace common col, merging blocks",
			spec: &functions.SetProcedureSpec{
				Key:   "t1",
				Value: "bob",
			},
			data: []execute.Block{
				&executetest.Block{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  5,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "alice"},
						{execute.Time(2), 1.0, "alice"},
					},
				},
				&executetest.Block{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  5,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					},
					Data: [][]interface{}{
						{execute.Time(3), 3.0, "sue"},
						{execute.Time(4), 5.0, "sue"},
					},
				},
			},
			want: []*executetest.Block{{
				Bnds: execute.Bounds{
					Start: 1,
					Stop:  5,
				},
				ColMeta: []execute.ColMeta{
					{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
					{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
					{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
				},
				Data: [][]interface{}{
					{execute.Time(1), 1.0, "bob"},
					{execute.Time(2), 1.0, "bob"},
					{execute.Time(3), 3.0, "bob"},
					{execute.Time(4), 5.0, "bob"},
				},
			}},
		},
		{
			name: "new common col, multiple blocks",
			spec: &functions.SetProcedureSpec{
				Key:   "t2",
				Value: "bob",
			},
			data: []execute.Block{
				&executetest.Block{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  5,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "alice"},
						{execute.Time(2), 1.0, "alice"},
					},
				},
				&executetest.Block{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  5,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					},
					Data: [][]interface{}{
						{execute.Time(3), 3.0, "sue"},
						{execute.Time(4), 5.0, "sue"},
					},
				},
			},
			want: []*executetest.Block{
				{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  5,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
						{Label: "t2", Type: execute.TString, Kind: execute.TagColKind},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "alice", "bob"},
						{execute.Time(2), 1.0, "alice", "bob"},
					},
				},
				{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  5,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
						{Label: "t2", Type: execute.TString, Kind: execute.TagColKind},
					},
					Data: [][]interface{}{
						{execute.Time(3), 3.0, "sue", "bob"},
						{execute.Time(4), 5.0, "sue", "bob"},
					},
				},
			},
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
					return functions.NewSetTransformation(d, c, tc.spec)
				},
			)
		})
	}
}
