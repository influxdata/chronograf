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

func TestIntegralOperation_Marshaling(t *testing.T) {
	data := []byte(`{"id":"integral","kind":"integral","spec":{"unit":"1m"}}`)
	op := &flux.Operation{
		ID: "integral",
		Spec: &transformations.IntegralOpSpec{
			Unit: flux.Duration(time.Minute),
		},
	}
	querytest.OperationMarshalingTestHelper(t, data, op)
}

func TestIntegral_PassThrough(t *testing.T) {
	executetest.TransformationPassThroughTestHelper(t, func(d execute.Dataset, c execute.TableBuilderCache) execute.Transformation {
		s := transformations.NewIntegralTransformation(
			d,
			c,
			&transformations.IntegralProcedureSpec{},
		)
		return s
	})
}

func TestIntegral_Process(t *testing.T) {
	testCases := []struct {
		name string
		spec *transformations.IntegralProcedureSpec
		data []flux.Table
		want []*executetest.Table
	}{
		{
			name: "float",
			spec: &transformations.IntegralProcedureSpec{
				Unit:            1,
				TimeColumn:      execute.DefaultTimeColLabel,
				AggregateConfig: execute.DefaultAggregateConfig,
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
					{execute.Time(1), execute.Time(3), execute.Time(1), 2.0},
					{execute.Time(1), execute.Time(3), execute.Time(2), 1.0},
				},
			}},
			want: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), 1.5},
				},
			}},
		},
		{
			name: "float with units",
			spec: &transformations.IntegralProcedureSpec{
				Unit:            flux.Duration(time.Second),
				TimeColumn:      execute.DefaultTimeColLabel,
				AggregateConfig: execute.DefaultAggregateConfig,
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
					{execute.Time(1 * time.Second), execute.Time(4 * time.Second), execute.Time(1 * time.Second), 2.0},
					{execute.Time(1 * time.Second), execute.Time(4 * time.Second), execute.Time(3 * time.Second), 1.0},
				},
			}},
			want: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1 * time.Second), execute.Time(4 * time.Second), 3.0},
				},
			}},
		},
		{
			name: "float with tags",
			spec: &transformations.IntegralProcedureSpec{
				Unit:            1,
				TimeColumn:      execute.DefaultTimeColLabel,
				AggregateConfig: execute.DefaultAggregateConfig,
			},
			data: []flux.Table{&executetest.Table{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "t", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), execute.Time(1), 2.0, "a"},
					{execute.Time(1), execute.Time(3), execute.Time(2), 1.0, "b"},
				},
			}},
			want: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(3), 1.5},
				},
			}},
		},
		{
			name: "float with multiple values",
			spec: &transformations.IntegralProcedureSpec{
				Unit:       1,
				TimeColumn: execute.DefaultTimeColLabel,
				AggregateConfig: execute.AggregateConfig{
					Columns: []string{"x", "y"},
				},
			},
			data: []flux.Table{&executetest.Table{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_time", Type: flux.TTime},
					{Label: "x", Type: flux.TFloat},
					{Label: "y", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(5), execute.Time(1), 2.0, 20.0},
					{execute.Time(1), execute.Time(5), execute.Time(2), 1.0, 10.0},
					{execute.Time(1), execute.Time(5), execute.Time(3), 2.0, 20.0},
					{execute.Time(1), execute.Time(5), execute.Time(4), 1.0, 10.0},
				},
			}},
			want: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "x", Type: flux.TFloat},
					{Label: "y", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), execute.Time(5), 4.5, 45.0},
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
					return transformations.NewIntegralTransformation(d, c, tc.spec)
				},
			)
		})
	}
}
