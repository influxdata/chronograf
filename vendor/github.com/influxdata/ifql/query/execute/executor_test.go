package execute_test

import (
	"context"
	"math"
	"testing"
	"time"

	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/ifql/ast"
	"github.com/influxdata/ifql/functions"
	"github.com/influxdata/ifql/query"
	"github.com/influxdata/ifql/query/execute"
	"github.com/influxdata/ifql/query/execute/executetest"
	"github.com/influxdata/ifql/query/plan"
	"github.com/influxdata/ifql/semantic"
)

var epoch = time.Unix(0, 0)

func TestExecutor_Execute(t *testing.T) {
	testCases := []struct {
		name string
		src  []execute.Block
		plan *plan.PlanSpec
		exp  map[string][]*executetest.Block
	}{
		{
			name: "simple aggregate",
			src: []execute.Block{&executetest.Block{
				Bnds: execute.Bounds{
					Start: 1,
					Stop:  5,
				},
				ColMeta: []execute.ColMeta{
					execute.TimeCol,
					execute.ColMeta{
						Label: execute.DefaultValueColLabel,
						Type:  execute.TFloat,
						Kind:  execute.ValueColKind,
					},
				},
				Data: [][]interface{}{
					{execute.Time(0), 1.0},
					{execute.Time(1), 2.0},
					{execute.Time(2), 3.0},
					{execute.Time(3), 4.0},
					{execute.Time(4), 5.0},
				},
			}},
			plan: &plan.PlanSpec{
				Now: epoch.Add(5),
				Resources: query.ResourceManagement{
					ConcurrencyQuota: 1,
					MemoryBytesQuota: math.MaxInt64,
				},
				Bounds: plan.BoundsSpec{
					Start: query.Time{Absolute: time.Unix(0, 1)},
					Stop:  query.Time{Absolute: time.Unix(0, 5)},
				},
				Procedures: map[plan.ProcedureID]*plan.Procedure{
					plan.ProcedureIDFromOperationID("from"): {
						ID: plan.ProcedureIDFromOperationID("from"),
						Spec: &functions.FromProcedureSpec{
							Database:  "mydb",
							BoundsSet: true,
							Bounds: plan.BoundsSpec{
								Start: query.Time{
									Relative:   -5,
									IsRelative: true,
								},
							},
						},
						Parents:  nil,
						Children: []plan.ProcedureID{plan.ProcedureIDFromOperationID("sum")},
					},
					plan.ProcedureIDFromOperationID("sum"): {
						ID:   plan.ProcedureIDFromOperationID("sum"),
						Spec: &functions.SumProcedureSpec{},
						Parents: []plan.ProcedureID{
							plan.ProcedureIDFromOperationID("from"),
						},
						Children: nil,
					},
				},
				Results: map[string]plan.YieldSpec{
					plan.DefaultYieldName: {ID: plan.ProcedureIDFromOperationID("sum")},
				},
			},
			exp: map[string][]*executetest.Block{
				plan.DefaultYieldName: []*executetest.Block{{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  5,
					},
					ColMeta: []execute.ColMeta{
						execute.TimeCol,
						execute.ColMeta{
							Label: execute.DefaultValueColLabel,
							Type:  execute.TFloat,
							Kind:  execute.ValueColKind,
						},
					},
					Data: [][]interface{}{
						{execute.Time(5), 15.0},
					},
				}},
			},
		},
		{
			name: "simple join",
			src: []execute.Block{&executetest.Block{
				Bnds: execute.Bounds{
					Start: 1,
					Stop:  5,
				},
				ColMeta: []execute.ColMeta{
					execute.TimeCol,
					execute.ColMeta{
						Label: execute.DefaultValueColLabel,
						Type:  execute.TInt,
						Kind:  execute.ValueColKind,
					},
				},
				Data: [][]interface{}{
					{execute.Time(0), int64(1)},
					{execute.Time(1), int64(2)},
					{execute.Time(2), int64(3)},
					{execute.Time(3), int64(4)},
					{execute.Time(4), int64(5)},
				},
			}},
			plan: &plan.PlanSpec{
				Now: epoch.Add(5),
				Resources: query.ResourceManagement{
					ConcurrencyQuota: 1,
					MemoryBytesQuota: math.MaxInt64,
				},
				Bounds: plan.BoundsSpec{
					Start: query.Time{Absolute: time.Unix(0, 1)},
					Stop:  query.Time{Absolute: time.Unix(0, 5)},
				},
				Procedures: map[plan.ProcedureID]*plan.Procedure{
					plan.ProcedureIDFromOperationID("from"): {
						ID: plan.ProcedureIDFromOperationID("from"),
						Spec: &functions.FromProcedureSpec{
							Database:  "mydb",
							BoundsSet: true,
							Bounds: plan.BoundsSpec{
								Start: query.Time{
									Relative:   -5,
									IsRelative: true,
								},
							},
						},
						Parents:  nil,
						Children: []plan.ProcedureID{plan.ProcedureIDFromOperationID("sum")},
					},
					plan.ProcedureIDFromOperationID("sum"): {
						ID:   plan.ProcedureIDFromOperationID("sum"),
						Spec: &functions.SumProcedureSpec{},
						Parents: []plan.ProcedureID{
							plan.ProcedureIDFromOperationID("from"),
						},
						Children: []plan.ProcedureID{plan.ProcedureIDFromOperationID("join")},
					},
					plan.ProcedureIDFromOperationID("count"): {
						ID:   plan.ProcedureIDFromOperationID("count"),
						Spec: &functions.CountProcedureSpec{},
						Parents: []plan.ProcedureID{
							plan.ProcedureIDFromOperationID("from"),
						},
						Children: []plan.ProcedureID{plan.ProcedureIDFromOperationID("join")},
					},
					plan.ProcedureIDFromOperationID("join"): {
						ID: plan.ProcedureIDFromOperationID("join"),
						Spec: &functions.MergeJoinProcedureSpec{
							TableNames: map[plan.ProcedureID]string{
								plan.ProcedureIDFromOperationID("sum"):   "sum",
								plan.ProcedureIDFromOperationID("count"): "count",
							},
							Fn: &semantic.FunctionExpression{
								Params: []*semantic.FunctionParam{{Key: &semantic.Identifier{Name: "t"}}},
								Body: &semantic.BinaryExpression{
									Operator: ast.DivisionOperator,
									Left: &semantic.MemberExpression{
										Object: &semantic.MemberExpression{
											Object: &semantic.IdentifierExpression{
												Name: "t",
											},
											Property: "sum",
										},
										Property: "_value",
									},
									Right: &semantic.MemberExpression{
										Object: &semantic.MemberExpression{
											Object: &semantic.IdentifierExpression{
												Name: "t",
											},
											Property: "count",
										},
										Property: "_value",
									},
								},
							},
						},
						Parents: []plan.ProcedureID{
							plan.ProcedureIDFromOperationID("sum"),
							plan.ProcedureIDFromOperationID("count"),
						},
						Children: nil,
					},
				},
				Results: map[string]plan.YieldSpec{
					plan.DefaultYieldName: {ID: plan.ProcedureIDFromOperationID("join")},
				},
			},
			exp: map[string][]*executetest.Block{
				plan.DefaultYieldName: []*executetest.Block{{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  5,
					},
					ColMeta: []execute.ColMeta{
						execute.TimeCol,
						execute.ColMeta{
							Label: execute.DefaultValueColLabel,
							Type:  execute.TInt,
							Kind:  execute.ValueColKind,
						},
					},
					Data: [][]interface{}{
						{execute.Time(5), int64(3)},
					},
				}},
			},
		},
		{
			name: "multiple aggregates",
			src: []execute.Block{&executetest.Block{
				Bnds: execute.Bounds{
					Start: 1,
					Stop:  5,
				},
				ColMeta: []execute.ColMeta{
					execute.TimeCol,
					execute.ColMeta{
						Label: execute.DefaultValueColLabel,
						Type:  execute.TFloat,
						Kind:  execute.ValueColKind,
					},
				},
				Data: [][]interface{}{
					{execute.Time(0), 1.0},
					{execute.Time(1), 2.0},
					{execute.Time(2), 3.0},
					{execute.Time(3), 4.0},
					{execute.Time(4), 5.0},
				},
			}},
			plan: &plan.PlanSpec{
				Now: epoch.Add(5),
				Resources: query.ResourceManagement{
					ConcurrencyQuota: 1,
					MemoryBytesQuota: math.MaxInt64,
				},
				Bounds: plan.BoundsSpec{
					Start: query.Time{Absolute: time.Unix(0, 1)},
					Stop:  query.Time{Absolute: time.Unix(0, 5)},
				},
				Procedures: map[plan.ProcedureID]*plan.Procedure{
					plan.ProcedureIDFromOperationID("from"): {
						ID: plan.ProcedureIDFromOperationID("from"),
						Spec: &functions.FromProcedureSpec{
							Database:  "mydb",
							BoundsSet: true,
							Bounds: plan.BoundsSpec{
								Start: query.Time{
									Relative:   -5,
									IsRelative: true,
								},
							},
						},
						Parents: nil,
						Children: []plan.ProcedureID{
							plan.ProcedureIDFromOperationID("sum"),
							plan.ProcedureIDFromOperationID("mean"),
						},
					},
					plan.ProcedureIDFromOperationID("sum"): {
						ID:   plan.ProcedureIDFromOperationID("sum"),
						Spec: &functions.SumProcedureSpec{},
						Parents: []plan.ProcedureID{
							plan.ProcedureIDFromOperationID("from"),
						},
						Children: nil,
					},
					plan.ProcedureIDFromOperationID("mean"): {
						ID:   plan.ProcedureIDFromOperationID("mean"),
						Spec: &functions.MeanProcedureSpec{},
						Parents: []plan.ProcedureID{
							plan.ProcedureIDFromOperationID("from"),
						},
						Children: nil,
					},
				},
				Results: map[string]plan.YieldSpec{
					"sum":  {ID: plan.ProcedureIDFromOperationID("sum")},
					"mean": {ID: plan.ProcedureIDFromOperationID("mean")},
				},
			},
			exp: map[string][]*executetest.Block{
				"sum": []*executetest.Block{{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  5,
					},
					ColMeta: []execute.ColMeta{
						execute.TimeCol,
						execute.ColMeta{
							Label: execute.DefaultValueColLabel,
							Type:  execute.TFloat,
							Kind:  execute.ValueColKind,
						},
					},
					Data: [][]interface{}{
						{execute.Time(5), 15.0},
					},
				}},
				"mean": []*executetest.Block{{
					Bnds: execute.Bounds{
						Start: 1,
						Stop:  5,
					},
					ColMeta: []execute.ColMeta{
						execute.TimeCol,
						execute.ColMeta{
							Label: execute.DefaultValueColLabel,
							Type:  execute.TFloat,
							Kind:  execute.ValueColKind,
						},
					},
					Data: [][]interface{}{
						{execute.Time(5), 3.0},
					},
				}},
			},
		},
	}

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			c := execute.Config{
				StorageReader: &storageReader{blocks: tc.src},
			}
			exe := execute.NewExecutor(c)
			results, err := exe.Execute(context.Background(), tc.plan)
			if err != nil {
				t.Fatal(err)
			}
			got := make(map[string][]*executetest.Block, len(results))
			for name, r := range results {
				if err := r.Blocks().Do(func(b execute.Block) error {
					got[name] = append(got[name], executetest.ConvertBlock(b))
					return nil
				}); err != nil {
					t.Fatal(err)
				}
			}

			if !cmp.Equal(got, tc.exp) {
				t.Error("unexpected results -want/+got", cmp.Diff(tc.exp, got))
			}
		})
	}
}

type storageReader struct {
	blocks []execute.Block
}

func (s storageReader) Close() {}
func (s storageReader) Read(context.Context, map[string]string, execute.ReadSpec, execute.Time, execute.Time) (execute.BlockIterator, error) {
	return &storageBlockIterator{
		s: s,
	}, nil
}

type storageBlockIterator struct {
	s storageReader
}

func (bi *storageBlockIterator) Do(f func(execute.Block) error) error {
	for _, b := range bi.s.blocks {
		if err := f(b); err != nil {
			return err
		}
	}
	return nil
}
