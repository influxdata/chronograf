package functions_test

import (
	"testing"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/functions"
	"github.com/influxdata/flux/querytest"
)

func TestSortOperation_Marshaling(t *testing.T) {
	data := []byte(`{"id":"sort","kind":"sort","spec":{"cols":["t1","t2"],"desc":true}}`)
	op := &flux.Operation{
		ID: "sort",
		Spec: &functions.SortOpSpec{
			Cols: []string{"t1", "t2"},
			Desc: true,
		},
	}
	querytest.OperationMarshalingTestHelper(t, data, op)
}

func TestSort_PassThrough(t *testing.T) {
	executetest.TransformationPassThroughTestHelper(t, func(d execute.Dataset, c execute.TableBuilderCache) execute.Transformation {
		s := functions.NewSortTransformation(
			d,
			c,
			&functions.SortProcedureSpec{
				Cols: []string{"_value"},
				Desc: true,
			},
		)
		return s
	})
}

func TestSort_Process(t *testing.T) {
	testCases := []struct {
		name string
		spec *functions.SortProcedureSpec
		data []flux.Table
		want []*executetest.Table
	}{
		{
			name: "one table",
			spec: &functions.SortProcedureSpec{
				Cols: []string{"_value"},
				Desc: false,
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
				},
				Data: [][]interface{}{
					{execute.Time(2), 1.0},
					{execute.Time(1), 2.0},
				},
			}},
		},
		{
			name: "one table descending",
			spec: &functions.SortProcedureSpec{
				Cols: []string{"_value"},
				Desc: true,
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), 1.0},
					{execute.Time(2), 2.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(2), 2.0},
					{execute.Time(1), 1.0},
				},
			}},
		},
		{
			name: "one table multiple columns",
			spec: &functions.SortProcedureSpec{
				Cols: []string{"_value", "time"},
				Desc: false,
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(2), 2.0},
					{execute.Time(1), 1.0},
					{execute.Time(2), 1.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), 1.0},
					{execute.Time(2), 1.0},
					{execute.Time(2), 2.0},
				},
			}},
		},
		{
			name: "one table multiple columns descending",
			spec: &functions.SortProcedureSpec{
				Cols: []string{"_value", "time"},
				Desc: true,
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), 1.0},
					{execute.Time(2), 1.0},
					{execute.Time(2), 2.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(2), 2.0},
					{execute.Time(2), 1.0},
					{execute.Time(1), 1.0},
				},
			}},
		},
		{
			name: "one table multiple columns with key",
			spec: &functions.SortProcedureSpec{
				Cols: []string{"_time", "_stop"},
				Desc: true,
			},
			data: []flux.Table{&executetest.Table{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), execute.Time(1), 1.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 1.0},
					{execute.Time(1), execute.Time(3), execute.Time(3), 2.0},
				},
			}},
			want: []*executetest.Table{{
				KeyCols: []string{"_stop", "_start"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), execute.Time(3), 2.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 1.0},
					{execute.Time(1), execute.Time(3), execute.Time(1), 1.0},
				},
			}},
		},
		{
			name: "multiple tables",
			spec: &functions.SortProcedureSpec{
				Cols: []string{"_value"},
				Desc: false,
			},
			data: []flux.Table{
				&executetest.Table{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "t1", Type: flux.TString},
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{"a", execute.Time(1), 3.0},
						{"a", execute.Time(2), 2.0},
						{"a", execute.Time(2), 1.0},
					},
				},
				&executetest.Table{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "t1", Type: flux.TString},
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{"b", execute.Time(3), 3.0},
						{"b", execute.Time(3), 2.0},
						{"b", execute.Time(4), 1.0},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "t1", Type: flux.TString},
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{"a", execute.Time(2), 1.0},
						{"a", execute.Time(2), 2.0},
						{"a", execute.Time(1), 3.0},
					},
				},
				{
					KeyCols: []string{"t1"},
					ColMeta: []flux.ColMeta{
						{Label: "t1", Type: flux.TString},
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{"b", execute.Time(4), 1.0},
						{"b", execute.Time(3), 2.0},
						{"b", execute.Time(3), 3.0},
					},
				},
			},
		},
		{
			name: "one table multiple columns with tags",
			spec: &functions.SortProcedureSpec{
				Cols: []string{"_field", "_value"},
				Desc: false,
			},
			data: []flux.Table{
				&executetest.Table{
					KeyCols: []string{"host"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "host", Type: flux.TString},
						{Label: "_field", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "hostA", "F1"},
						{execute.Time(1), 2.0, "hostA", "F2"},
						{execute.Time(1), 3.0, "hostA", "F3"},
						{execute.Time(2), 4.0, "hostA", "F1"},
						{execute.Time(2), 5.0, "hostA", "F2"},
						{execute.Time(2), 6.0, "hostA", "F3"},
					},
				},
				&executetest.Table{
					KeyCols: []string{"host"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "host", Type: flux.TString},
						{Label: "_field", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "hostB", "F1"},
						{execute.Time(1), 2.0, "hostB", "F2"},
						{execute.Time(1), 3.0, "hostB", "F3"},
						{execute.Time(2), 4.0, "hostB", "F1"},
						{execute.Time(2), 5.0, "hostB", "F2"},
						{execute.Time(2), 6.0, "hostB", "F3"},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: []string{"host"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "host", Type: flux.TString},
						{Label: "_field", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "hostA", "F1"},
						{execute.Time(2), 4.0, "hostA", "F1"},
						{execute.Time(1), 2.0, "hostA", "F2"},
						{execute.Time(2), 5.0, "hostA", "F2"},
						{execute.Time(1), 3.0, "hostA", "F3"},
						{execute.Time(2), 6.0, "hostA", "F3"},
					},
				},
				{
					KeyCols: []string{"host"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "host", Type: flux.TString},
						{Label: "_field", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 1.0, "hostB", "F1"},
						{execute.Time(2), 4.0, "hostB", "F1"},
						{execute.Time(1), 2.0, "hostB", "F2"},
						{execute.Time(2), 5.0, "hostB", "F2"},
						{execute.Time(1), 3.0, "hostB", "F3"},
						{execute.Time(2), 6.0, "hostB", "F3"},
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
					return functions.NewSortTransformation(d, c, tc.spec)
				},
			)
		})
	}
}
