package transformations_test

import (
	"testing"
	"time"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/ast"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/functions/transformations"
	"github.com/influxdata/flux/querytest"
	"github.com/influxdata/flux/semantic"
)

func TestStateTrackingOperation_Marshaling(t *testing.T) {
	data := []byte(`{"id":"id","kind":"stateTracking","spec":{"countColumn":"c","durationColumn":"d","durationUnit":"1m"}}`)
	op := &flux.Operation{
		ID: "id",
		Spec: &transformations.StateTrackingOpSpec{
			CountColumn:    "c",
			DurationColumn: "d",
			DurationUnit:   flux.Duration(time.Minute),
		},
	}
	querytest.OperationMarshalingTestHelper(t, data, op)
}

func TestStateTracking_Process(t *testing.T) {
	gt5 := &semantic.FunctionExpression{
		Block: &semantic.FunctionBlock{
			Parameters: &semantic.FunctionParameters{
				List: []*semantic.FunctionParameter{{Key: &semantic.Identifier{Name: "r"}}},
			},
			Body: &semantic.BinaryExpression{
				Operator: ast.GreaterThanOperator,
				Left: &semantic.MemberExpression{
					Object:   &semantic.IdentifierExpression{Name: "r"},
					Property: "_value",
				},
				Right: &semantic.FloatLiteral{Value: 5.0},
			},
		},
	}
	testCases := []struct {
		name string
		spec *transformations.StateTrackingProcedureSpec
		data []flux.Table
		want []*executetest.Table
	}{
		{
			name: "one table",
			spec: &transformations.StateTrackingProcedureSpec{
				CountColumn:    "count",
				DurationColumn: "duration",
				DurationUnit:   1,
				Fn:             gt5,
				TimeCol:        "_time",
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), 2.0},
					{execute.Time(2), 1.0},
					{execute.Time(3), 6.0},
					{execute.Time(4), 7.0},
					{execute.Time(5), 8.0},
					{execute.Time(6), 1.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "count", Type: flux.TInt},
					{Label: "duration", Type: flux.TInt},
				},
				Data: [][]interface{}{
					{execute.Time(1), 2.0, int64(-1), int64(-1)},
					{execute.Time(2), 1.0, int64(-1), int64(-1)},
					{execute.Time(3), 6.0, int64(1), int64(0)},
					{execute.Time(4), 7.0, int64(2), int64(1)},
					{execute.Time(5), 8.0, int64(3), int64(2)},
					{execute.Time(6), 1.0, int64(-1), int64(-1)},
				},
			}},
		},
		{
			name: "only duration",
			spec: &transformations.StateTrackingProcedureSpec{
				DurationColumn: "duration",
				DurationUnit:   1,
				Fn:             gt5,
				TimeCol:        "_time",
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), 2.0},
					{execute.Time(2), 1.0},
					{execute.Time(3), 6.0},
					{execute.Time(4), 7.0},
					{execute.Time(5), 8.0},
					{execute.Time(6), 1.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "duration", Type: flux.TInt},
				},
				Data: [][]interface{}{
					{execute.Time(1), 2.0, int64(-1)},
					{execute.Time(2), 1.0, int64(-1)},
					{execute.Time(3), 6.0, int64(0)},
					{execute.Time(4), 7.0, int64(1)},
					{execute.Time(5), 8.0, int64(2)},
					{execute.Time(6), 1.0, int64(-1)},
				},
			}},
		},
		{
			name: "only count",
			spec: &transformations.StateTrackingProcedureSpec{
				CountColumn: "count",
				Fn:          gt5,
				TimeCol:     "_time",
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), 2.0},
					{execute.Time(2), 1.0},
					{execute.Time(3), 6.0},
					{execute.Time(4), 7.0},
					{execute.Time(5), 8.0},
					{execute.Time(6), 1.0},
				},
			}},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "count", Type: flux.TInt},
				},
				Data: [][]interface{}{
					{execute.Time(1), 2.0, int64(-1)},
					{execute.Time(2), 1.0, int64(-1)},
					{execute.Time(3), 6.0, int64(1)},
					{execute.Time(4), 7.0, int64(2)},
					{execute.Time(5), 8.0, int64(3)},
					{execute.Time(6), 1.0, int64(-1)},
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
					tx, err := transformations.NewStateTrackingTransformation(d, c, tc.spec)
					if err != nil {
						t.Fatal(err)
					}
					return tx
				},
			)
		})
	}
}
