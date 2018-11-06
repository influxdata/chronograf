package transformations_test

import (
	"testing"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/functions/transformations"
	"github.com/influxdata/flux/querytest"
)

func TestSetOperation_Marshaling(t *testing.T) {
	data := []byte(`{"id":"set","kind":"set","spec":{"key":"t1","value":"v1"}}`)
	op := &flux.Operation{
		ID: "set",
		Spec: &transformations.SetOpSpec{
			Key:   "t1",
			Value: "v1",
		},
	}

	querytest.OperationMarshalingTestHelper(t, data, op)
}

func TestSet_Process(t *testing.T) {
	testCases := []struct {
		name string
		spec *transformations.SetProcedureSpec
		data []flux.Table
		want []*executetest.Table
	}{
		{
			name: "new col",
			spec: &transformations.SetProcedureSpec{
				Key:   "t1",
				Value: "bob",
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), 2.0},
					{execute.Time(2), 1.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "t1", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(1), 2.0, "bob"},
					{execute.Time(2), 1.0, "bob"},
				},
			}},
		},
		{
			name: "replace col",
			spec: &transformations.SetProcedureSpec{
				Key:   "t1",
				Value: "bob",
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "t1", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(1), 1.0, "jim"},
					{execute.Time(2), 2.0, "sue"},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "t1", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(1), 1.0, "bob"},
					{execute.Time(2), 2.0, "bob"},
				},
			}},
		},
		{
			name: "replace key col",
			spec: &transformations.SetProcedureSpec{
				Key:   "t1",
				Value: "bob",
			},
			data: []flux.Table{&executetest.Table{
				KeyCols: []string{"t1"},
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "t1", Type: flux.TString},
					{Label: "t2", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(1), 1.0, "alice", "a"},
					{execute.Time(2), 1.0, "alice", "b"},
				},
			}},
			want: []*executetest.Table{{
				KeyCols: []string{"t1"},
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "t1", Type: flux.TString},
					{Label: "t2", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(1), 1.0, "bob", "a"},
					{execute.Time(2), 1.0, "bob", "b"},
				},
			}},
		},
		{
			name: "replace common col, merging tables",
			spec: &transformations.SetProcedureSpec{
				Key:   "t1",
				Value: "bob",
			},
			data: []flux.Table{
				&executetest.Table{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "alice"},
						{execute.Time(2), 1.0, "alice"},
					},
				},
				&executetest.Table{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(3), 3.0, "sue"},
						{execute.Time(4), 5.0, "sue"},
					},
				},
			},
			want: []*executetest.Table{{
				KeyCols: []string{"t1"},
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "t1", Type: flux.TString},
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
			name: "new common col, multiple tables",
			spec: &transformations.SetProcedureSpec{
				Key:   "t2",
				Value: "bob",
			},
			data: []flux.Table{
				&executetest.Table{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "alice"},
						{execute.Time(2), 1.0, "alice"},
					},
				},
				&executetest.Table{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(3), 3.0, "sue"},
						{execute.Time(4), 5.0, "sue"},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "alice", "bob"},
						{execute.Time(2), 1.0, "alice", "bob"},
					},
				},
				{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "t1", Type: flux.TString},
						{Label: "t2", Type: flux.TString},
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
				nil,
				func(d execute.Dataset, c execute.TableBuilderCache) execute.Transformation {
					return transformations.NewSetTransformation(d, c, tc.spec)
				},
			)
		})
	}
}
