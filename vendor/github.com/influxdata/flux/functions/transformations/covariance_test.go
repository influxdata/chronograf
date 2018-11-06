package transformations_test

import (
	"testing"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/functions/inputs"
	"github.com/influxdata/flux/functions/transformations"
	"github.com/influxdata/flux/querytest"
)

func TestCovariance_NewQuery(t *testing.T) {
	tests := []querytest.NewQueryTestCase{
		{
			Name: "simple covariance",
			Raw:  `from(bucket:"mybucket") |> covariance(columns:["a","b"],)`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &inputs.FromOpSpec{
							Bucket: "mybucket",
						},
					},
					{
						ID: "covariance1",
						Spec: &transformations.CovarianceOpSpec{
							ValueDst: execute.DefaultValueColLabel,
							AggregateConfig: execute.AggregateConfig{
								Columns: []string{"a", "b"},
							},
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "covariance1"},
				},
			},
		},
		{
			Name: "pearsonr",
			Raw:  `from(bucket:"mybucket")|>covariance(columns:["a","b"],pearsonr:true)`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &inputs.FromOpSpec{
							Bucket: "mybucket",
						},
					},
					{
						ID: "covariance1",
						Spec: &transformations.CovarianceOpSpec{
							ValueDst:           execute.DefaultValueColLabel,
							PearsonCorrelation: true,
							AggregateConfig: execute.AggregateConfig{
								Columns: []string{"a", "b"},
							},
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "covariance1"},
				},
			},
		},
		{
			Name: "global covariance",
			Raw:  `cov(x: from(bucket:"mybucket"), y:from(bucket:"mybucket"), on:["host"], pearsonr:true)`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &inputs.FromOpSpec{
							Bucket: "mybucket",
						},
					},
					{
						ID: "from1",
						Spec: &inputs.FromOpSpec{
							Bucket: "mybucket",
						},
					},
					{
						ID: "join2",
						Spec: &transformations.JoinOpSpec{
							On: []string{"host"},
							TableNames: map[flux.OperationID]string{
								"from0": "x",
								"from1": "y",
							},
							Method: "inner",
						},
					},
					{
						ID: "covariance3",
						Spec: &transformations.CovarianceOpSpec{
							ValueDst:           execute.DefaultValueColLabel,
							PearsonCorrelation: true,
							AggregateConfig: execute.AggregateConfig{
								Columns: []string{"_value_x", "_value_y"},
							},
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "join2"},
					{Parent: "from1", Child: "join2"},
					{Parent: "join2", Child: "covariance3"},
				},
			},
		},
	}
	for _, tc := range tests {
		tc := tc
		t.Run(tc.Name, func(t *testing.T) {
			t.Parallel()
			querytest.NewQueryTestHelper(t, tc)
		})
	}
}

func TestCovarianceOperation_Marshaling(t *testing.T) {
	data := []byte(`{
		"id":"covariance",
		"kind":"covariance",
		"spec":{
			"pearsonr":true
		}
	}`)
	op := &flux.Operation{
		ID: "covariance",
		Spec: &transformations.CovarianceOpSpec{
			PearsonCorrelation: true,
		},
	}
	querytest.OperationMarshalingTestHelper(t, data, op)
}

func TestCovariance_Process(t *testing.T) {
	testCases := []struct {
		name string
		spec *transformations.CovarianceProcedureSpec
		data []flux.Table
		want []*executetest.Table
	}{
		{
			name: "variance",
			spec: &transformations.CovarianceProcedureSpec{
				ValueLabel: execute.DefaultValueColLabel,
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
					{execute.Time(0), execute.Time(5), execute.Time(0), 1.0, 1.0},
					{execute.Time(0), execute.Time(5), execute.Time(1), 2.0, 2.0},
					{execute.Time(0), execute.Time(5), execute.Time(2), 3.0, 3.0},
					{execute.Time(0), execute.Time(5), execute.Time(3), 4.0, 4.0},
					{execute.Time(0), execute.Time(5), execute.Time(4), 5.0, 5.0},
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
					{execute.Time(0), execute.Time(5), 2.5},
				},
			}},
		},
		{
			name: "negative covariance",
			spec: &transformations.CovarianceProcedureSpec{
				ValueLabel: execute.DefaultValueColLabel,
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
					{execute.Time(0), execute.Time(5), execute.Time(0), 1.0, 5.0},
					{execute.Time(0), execute.Time(5), execute.Time(1), 2.0, 4.0},
					{execute.Time(0), execute.Time(5), execute.Time(2), 3.0, 3.0},
					{execute.Time(0), execute.Time(5), execute.Time(3), 4.0, 2.0},
					{execute.Time(0), execute.Time(5), execute.Time(4), 5.0, 1.0},
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
					{execute.Time(0), execute.Time(5), -2.5},
				},
			}},
		},
		{
			name: "small covariance",
			spec: &transformations.CovarianceProcedureSpec{
				ValueLabel: execute.DefaultValueColLabel,
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
					{execute.Time(0), execute.Time(5), execute.Time(0), 1.0, 1.0},
					{execute.Time(0), execute.Time(5), execute.Time(1), 2.0, 1.0},
					{execute.Time(0), execute.Time(5), execute.Time(2), 3.0, 1.0},
					{execute.Time(0), execute.Time(5), execute.Time(3), 4.0, 1.0},
					{execute.Time(0), execute.Time(5), execute.Time(4), 5.0, 2.0},
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
					{execute.Time(0), execute.Time(5), 0.5},
				},
			}},
		},
		{
			name: "pearson correlation",
			spec: &transformations.CovarianceProcedureSpec{
				ValueLabel:         execute.DefaultValueColLabel,
				PearsonCorrelation: true,
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
					{execute.Time(0), execute.Time(5), execute.Time(0), 1.0, 1.0},
					{execute.Time(0), execute.Time(5), execute.Time(1), 2.0, 2.0},
					{execute.Time(0), execute.Time(5), execute.Time(2), 3.0, 3.0},
					{execute.Time(0), execute.Time(5), execute.Time(3), 4.0, 4.0},
					{execute.Time(0), execute.Time(5), execute.Time(4), 5.0, 5.0},
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
					{execute.Time(0), execute.Time(5), 1.0},
				},
			}},
		},
		{
			name: "pearson correlation opposite",
			spec: &transformations.CovarianceProcedureSpec{
				ValueLabel:         execute.DefaultValueColLabel,
				PearsonCorrelation: true,
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
					{execute.Time(0), execute.Time(5), execute.Time(0), 1.0, 5.0},
					{execute.Time(0), execute.Time(5), execute.Time(1), 2.0, 4.0},
					{execute.Time(0), execute.Time(5), execute.Time(2), 3.0, 3.0},
					{execute.Time(0), execute.Time(5), execute.Time(3), 4.0, 2.0},
					{execute.Time(0), execute.Time(5), execute.Time(4), 5.0, 1.0},
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
					{execute.Time(0), execute.Time(5), -1.0},
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
					return transformations.NewCovarianceTransformation(d, c, tc.spec)
				},
			)
		})
	}
}
