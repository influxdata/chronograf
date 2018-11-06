package transformations_test

import (
	"testing"
	"time"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/functions/transformations"
	"github.com/influxdata/flux/querytest"
)

func TestShiftOperation_Marshaling(t *testing.T) {
	data := []byte(`{"id":"shift","kind":"shift","spec":{"shift":"1h"}}`)
	op := &flux.Operation{
		ID: "shift",
		Spec: &transformations.ShiftOpSpec{
			Shift: flux.Duration(1 * time.Hour),
		},
	}
	querytest.OperationMarshalingTestHelper(t, data, op)
}

func TestShift_Process(t *testing.T) {
	cols := []flux.ColMeta{
		{Label: "t1", Type: flux.TString},
		{Label: execute.DefaultTimeColLabel, Type: flux.TTime},
		{Label: execute.DefaultValueColLabel, Type: flux.TFloat},
	}

	testCases := []struct {
		name string
		spec *transformations.ShiftProcedureSpec
		data []flux.Table
		want []*executetest.Table
	}{
		{
			name: "one table",
			spec: &transformations.ShiftProcedureSpec{
				Columns: []string{execute.DefaultTimeColLabel},
				Shift:   flux.Duration(1),
			},
			data: []flux.Table{
				&executetest.Table{
					KeyCols: []string{"t1"},
					ColMeta: cols,
					Data: [][]interface{}{
						{"a", execute.Time(1), 2.0},
						{"a", execute.Time(2), 1.0},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: []string{"t1"},
					ColMeta: cols,
					Data: [][]interface{}{
						{"a", execute.Time(2), 2.0},
						{"a", execute.Time(3), 1.0},
					},
				},
			},
		},
		{
			name: "multiple tables",
			spec: &transformations.ShiftProcedureSpec{
				Columns: []string{execute.DefaultTimeColLabel},
				Shift:   flux.Duration(2),
			},
			data: []flux.Table{
				&executetest.Table{
					KeyCols: []string{"t1"},
					ColMeta: cols,
					Data: [][]interface{}{
						{"a", execute.Time(1), 2.0},
						{"a", execute.Time(2), 1.0},
					},
				},
				&executetest.Table{
					KeyCols: []string{"t1"},
					ColMeta: cols,
					Data: [][]interface{}{
						{"b", execute.Time(3), 3.0},
						{"b", execute.Time(4), 4.0},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: []string{"t1"},
					ColMeta: cols,
					Data: [][]interface{}{
						{"a", execute.Time(3), 2.0},
						{"a", execute.Time(4), 1.0},
					},
				},
				{
					KeyCols: []string{"t1"},
					ColMeta: cols,
					Data: [][]interface{}{
						{"b", execute.Time(5), 3.0},
						{"b", execute.Time(6), 4.0},
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
					return transformations.NewShiftTransformation(d, c, tc.spec)
				},
			)
		})
	}
}
