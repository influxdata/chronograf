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

func TestDerivativeOperation_Marshaling(t *testing.T) {
	data := []byte(`{"id":"derivative","kind":"derivative","spec":{"unit":"1m","nonNegative":true}}`)
	op := &flux.Operation{
		ID: "derivative",
		Spec: &transformations.DerivativeOpSpec{
			Unit:        flux.Duration(time.Minute),
			NonNegative: true,
		},
	}
	querytest.OperationMarshalingTestHelper(t, data, op)
}

func TestDerivative_PassThrough(t *testing.T) {
	executetest.TransformationPassThroughTestHelper(t, func(d execute.Dataset, c execute.TableBuilderCache) execute.Transformation {
		s := transformations.NewDerivativeTransformation(
			d,
			c,
			&transformations.DerivativeProcedureSpec{},
		)
		return s
	})
}

func TestDerivative_Process(t *testing.T) {
	testCases := []struct {
		name string
		spec *transformations.DerivativeProcedureSpec
		data []flux.Table
		want []*executetest.Table
	}{
		{
			name: "float",
			spec: &transformations.DerivativeProcedureSpec{
				Columns:    []string{execute.DefaultValueColLabel},
				TimeColumn: execute.DefaultTimeColLabel,
				Unit:       1,
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
					{execute.Time(2), -1.0},
				},
			}},
		},
		{
			name: "float with units",
			spec: &transformations.DerivativeProcedureSpec{
				Columns:    []string{execute.DefaultValueColLabel},
				TimeColumn: execute.DefaultTimeColLabel,
				Unit:       flux.Duration(time.Second),
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1 * time.Second), 2.0},
					{execute.Time(3 * time.Second), 1.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(3 * time.Second), -0.5},
				},
			}},
		},
		{
			name: "int",
			spec: &transformations.DerivativeProcedureSpec{
				Columns:    []string{execute.DefaultValueColLabel},
				TimeColumn: execute.DefaultTimeColLabel,
				Unit:       1,
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TInt},
				},
				Data: [][]interface{}{
					{execute.Time(1), int64(20)},
					{execute.Time(2), int64(10)},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(2), -10.0},
				},
			}},
		},
		{
			name: "int with units",
			spec: &transformations.DerivativeProcedureSpec{
				Columns:    []string{execute.DefaultValueColLabel},
				TimeColumn: execute.DefaultTimeColLabel,
				Unit:       flux.Duration(time.Second),
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TInt},
				},
				Data: [][]interface{}{
					{execute.Time(1 * time.Second), int64(20)},
					{execute.Time(3 * time.Second), int64(10)},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(3 * time.Second), -5.0},
				},
			}},
		},
		{
			name: "int non negative",
			spec: &transformations.DerivativeProcedureSpec{
				Columns:     []string{execute.DefaultValueColLabel},
				TimeColumn:  execute.DefaultTimeColLabel,
				Unit:        1,
				NonNegative: true,
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TInt},
				},
				Data: [][]interface{}{
					{execute.Time(1), int64(20)},
					{execute.Time(2), int64(10)},
					{execute.Time(3), int64(20)},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(2), 10.0},
					{execute.Time(3), 10.0},
				},
			}},
		},
		{
			name: "uint",
			spec: &transformations.DerivativeProcedureSpec{
				Columns:    []string{execute.DefaultValueColLabel},
				TimeColumn: execute.DefaultTimeColLabel,
				Unit:       1,
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TUInt},
				},
				Data: [][]interface{}{
					{execute.Time(1), uint64(10)},
					{execute.Time(2), uint64(20)},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(2), 10.0},
				},
			}},
		},
		{
			name: "uint with negative result",
			spec: &transformations.DerivativeProcedureSpec{
				Columns:    []string{execute.DefaultValueColLabel},
				TimeColumn: execute.DefaultTimeColLabel,
				Unit:       1,
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TUInt},
				},
				Data: [][]interface{}{
					{execute.Time(1), uint64(20)},
					{execute.Time(2), uint64(10)},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(2), -10.0},
				},
			}},
		},
		{
			name: "uint with non negative",
			spec: &transformations.DerivativeProcedureSpec{
				Columns:     []string{execute.DefaultValueColLabel},
				TimeColumn:  execute.DefaultTimeColLabel,
				Unit:        1,
				NonNegative: true,
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TUInt},
				},
				Data: [][]interface{}{
					{execute.Time(1), uint64(20)},
					{execute.Time(2), uint64(10)},
					{execute.Time(3), uint64(20)},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(2), 10.0},
					{execute.Time(3), 10.0},
				},
			}},
		},
		{
			name: "uint with units",
			spec: &transformations.DerivativeProcedureSpec{
				Columns:    []string{execute.DefaultValueColLabel},
				TimeColumn: execute.DefaultTimeColLabel,
				Unit:       flux.Duration(time.Second),
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TUInt},
				},
				Data: [][]interface{}{
					{execute.Time(1 * time.Second), uint64(20)},
					{execute.Time(3 * time.Second), uint64(10)},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(3 * time.Second), -5.0},
				},
			}},
		},
		{
			name: "non negative one table",
			spec: &transformations.DerivativeProcedureSpec{
				Columns:     []string{execute.DefaultValueColLabel},
				TimeColumn:  execute.DefaultTimeColLabel,
				Unit:        1,
				NonNegative: true,
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), 2.0},
					{execute.Time(2), 1.0},
					{execute.Time(3), 2.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(2), 1.0},
					{execute.Time(3), 1.0},
				},
			}},
		},
		{
			name: "float with tags",
			spec: &transformations.DerivativeProcedureSpec{
				Columns:    []string{execute.DefaultValueColLabel},
				TimeColumn: execute.DefaultTimeColLabel,
				Unit:       1,
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "t", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(1), 2.0, "a"},
					{execute.Time(2), 1.0, "b"},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "t", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(2), -1.0, "b"},
				},
			}},
		},
		{
			name: "float with multiple values",
			spec: &transformations.DerivativeProcedureSpec{
				Columns:    []string{"x", "y"},
				TimeColumn: execute.DefaultTimeColLabel,
				Unit:       1,
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "x", Type: flux.TFloat},
					{Label: "y", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), 2.0, 20.0},
					{execute.Time(2), 1.0, 10.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "x", Type: flux.TFloat},
					{Label: "y", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(2), -1.0, -10.0},
				},
			}},
		},
		{
			name: "float non negative with multiple values",
			spec: &transformations.DerivativeProcedureSpec{
				Columns:     []string{"x", "y"},
				TimeColumn:  execute.DefaultTimeColLabel,
				Unit:        1,
				NonNegative: true,
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "x", Type: flux.TFloat},
					{Label: "y", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), 2.0, 20.0},
					{execute.Time(2), 1.0, 10.0},
					{execute.Time(3), 2.0, 0.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "x", Type: flux.TFloat},
					{Label: "y", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(2), 1.0, 10.0},
					{execute.Time(3), 1.0, 0.0},
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
				nil,
				func(d execute.Dataset, c execute.TableBuilderCache) execute.Transformation {
					return transformations.NewDerivativeTransformation(d, c, tc.spec)
				},
			)
		})
	}
}
