package functions_test

import (
	"testing"

	"github.com/influxdata/ifql/functions"
	"github.com/influxdata/ifql/query"
	"github.com/influxdata/ifql/query/execute"
	"github.com/influxdata/ifql/query/execute/executetest"
	"github.com/influxdata/ifql/query/querytest"
)

func TestMaxOperation_Marshaling(t *testing.T) {
	data := []byte(`{"id":"max","kind":"max","spec":{"useRowTime":true}}`)
	op := &query.Operation{
		ID: "max",
		Spec: &functions.MaxOpSpec{
			UseRowTime: true,
		},
	}

	querytest.OperationMarshalingTestHelper(t, data, op)
}

func TestMax_Process(t *testing.T) {
	testCases := []struct {
		name string
		data *executetest.Block
		want []execute.Row
	}{
		{
			name: "first",
			data: &executetest.Block{
				ColMeta: []execute.ColMeta{
					{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
					{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
					{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: false},
				},
				Data: [][]interface{}{
					{execute.Time(0), 10.0, "a", "y"},
					{execute.Time(10), 5.0, "a", "x"},
					{execute.Time(20), 9.0, "a", "y"},
					{execute.Time(30), 4.0, "a", "x"},
					{execute.Time(40), 6.0, "a", "y"},
					{execute.Time(50), 8.0, "a", "x"},
					{execute.Time(60), 1.0, "a", "y"},
					{execute.Time(70), 2.0, "a", "x"},
					{execute.Time(80), 3.0, "a", "y"},
					{execute.Time(90), 7.0, "a", "x"},
				},
			},
			want: []execute.Row{{
				Values: []interface{}{execute.Time(0), 10.0, "a", "y"},
			}},
		},
		{
			name: "last",
			data: &executetest.Block{
				ColMeta: []execute.ColMeta{
					{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
					{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
					{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: false},
				},
				Data: [][]interface{}{
					{execute.Time(0), 7.0, "a", "y"},
					{execute.Time(10), 5.0, "a", "x"},
					{execute.Time(20), 9.0, "a", "y"},
					{execute.Time(30), 4.0, "a", "x"},
					{execute.Time(40), 6.0, "a", "y"},
					{execute.Time(50), 8.0, "a", "x"},
					{execute.Time(60), 1.0, "a", "y"},
					{execute.Time(70), 2.0, "a", "x"},
					{execute.Time(80), 3.0, "a", "y"},
					{execute.Time(90), 10.0, "a", "x"},
				},
			},
			want: []execute.Row{{
				Values: []interface{}{execute.Time(90), 10.0, "a", "x"},
			}},
		},
		{
			name: "middle",
			data: &executetest.Block{
				ColMeta: []execute.ColMeta{
					{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
					{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
					{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
					{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: false},
				},
				Data: [][]interface{}{
					{execute.Time(0), 7.0, "a", "y"},
					{execute.Time(10), 5.0, "a", "x"},
					{execute.Time(20), 9.0, "a", "y"},
					{execute.Time(30), 4.0, "a", "x"},
					{execute.Time(40), 6.0, "a", "y"},
					{execute.Time(50), 10.0, "a", "x"},
					{execute.Time(60), 1.0, "a", "y"},
					{execute.Time(70), 2.0, "a", "x"},
					{execute.Time(80), 3.0, "a", "y"},
					{execute.Time(90), 8.0, "a", "x"},
				},
			},
			want: []execute.Row{{
				Values: []interface{}{execute.Time(50), 10.0, "a", "x"},
			}},
		},
	}
	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			executetest.RowSelectorFuncTestHelper(
				t,
				new(functions.MaxSelector),
				tc.data,
				tc.want,
			)
		})
	}
}

func BenchmarkMax(b *testing.B) {
	executetest.RowSelectorFuncBenchmarkHelper(b, new(functions.MaxSelector), NormalBlock)
}
