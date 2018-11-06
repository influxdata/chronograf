package execute_test

import (
	"sort"
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"
	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/functions/transformations"
)

func TestAggregate_Process(t *testing.T) {
	sumAgg := new(transformations.SumAgg)
	countAgg := new(transformations.CountAgg)
	testCases := []struct {
		name   string
		agg    execute.Aggregate
		config execute.AggregateConfig
		data   []*executetest.Table
		want   []*executetest.Table
	}{
		{
			name:   "single",
			config: execute.DefaultAggregateConfig,
			agg:    sumAgg,
			data: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(0), execute.Time(100), execute.Time(0), 0.0},
					{execute.Time(0), execute.Time(100), execute.Time(10), 1.0},
					{execute.Time(0), execute.Time(100), execute.Time(20), 2.0},
					{execute.Time(0), execute.Time(100), execute.Time(30), 3.0},
					{execute.Time(0), execute.Time(100), execute.Time(40), 4.0},
					{execute.Time(0), execute.Time(100), execute.Time(50), 5.0},
					{execute.Time(0), execute.Time(100), execute.Time(60), 6.0},
					{execute.Time(0), execute.Time(100), execute.Time(70), 7.0},
					{execute.Time(0), execute.Time(100), execute.Time(80), 8.0},
					{execute.Time(0), execute.Time(100), execute.Time(90), 9.0},
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
					{execute.Time(0), execute.Time(100), 45.0},
				},
			}},
		},
		{
			name: "single use start time",
			config: execute.AggregateConfig{
				Columns: []string{execute.DefaultValueColLabel},
			},
			agg: sumAgg,
			data: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(0), execute.Time(100), execute.Time(0), 0.0},
					{execute.Time(0), execute.Time(100), execute.Time(10), 1.0},
					{execute.Time(0), execute.Time(100), execute.Time(20), 2.0},
					{execute.Time(0), execute.Time(100), execute.Time(30), 3.0},
					{execute.Time(0), execute.Time(100), execute.Time(40), 4.0},
					{execute.Time(0), execute.Time(100), execute.Time(50), 5.0},
					{execute.Time(0), execute.Time(100), execute.Time(60), 6.0},
					{execute.Time(0), execute.Time(100), execute.Time(70), 7.0},
					{execute.Time(0), execute.Time(100), execute.Time(80), 8.0},
					{execute.Time(0), execute.Time(100), execute.Time(90), 9.0},
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
					{execute.Time(0), execute.Time(100), 45.0},
				},
			}},
		},
		{
			name:   "multiple tables",
			config: execute.DefaultAggregateConfig,
			agg:    sumAgg,
			data: []*executetest.Table{
				{
					KeyCols: []string{"_start", "_stop"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(0), execute.Time(100), execute.Time(0), 0.0},
						{execute.Time(0), execute.Time(100), execute.Time(10), 1.0},
						{execute.Time(0), execute.Time(100), execute.Time(20), 2.0},
						{execute.Time(0), execute.Time(100), execute.Time(30), 3.0},
						{execute.Time(0), execute.Time(100), execute.Time(40), 4.0},
						{execute.Time(0), execute.Time(100), execute.Time(50), 5.0},
						{execute.Time(0), execute.Time(100), execute.Time(60), 6.0},
						{execute.Time(0), execute.Time(100), execute.Time(70), 7.0},
						{execute.Time(0), execute.Time(100), execute.Time(80), 8.0},
						{execute.Time(0), execute.Time(100), execute.Time(90), 9.0},
					},
				},
				{
					KeyCols: []string{"_start", "_stop"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(100), execute.Time(200), execute.Time(100), 10.0},
						{execute.Time(100), execute.Time(200), execute.Time(110), 11.0},
						{execute.Time(100), execute.Time(200), execute.Time(120), 12.0},
						{execute.Time(100), execute.Time(200), execute.Time(130), 13.0},
						{execute.Time(100), execute.Time(200), execute.Time(140), 14.0},
						{execute.Time(100), execute.Time(200), execute.Time(150), 15.0},
						{execute.Time(100), execute.Time(200), execute.Time(160), 16.0},
						{execute.Time(100), execute.Time(200), execute.Time(170), 17.0},
						{execute.Time(100), execute.Time(200), execute.Time(180), 18.0},
						{execute.Time(100), execute.Time(200), execute.Time(190), 19.0},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: []string{"_start", "_stop"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(0), execute.Time(100), 45.0},
					},
				},
				{
					KeyCols: []string{"_start", "_stop"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(100), execute.Time(200), 145.0},
					},
				},
			},
		},
		{
			name:   "multiple tables with keyed columns",
			config: execute.DefaultAggregateConfig,
			agg:    sumAgg,
			data: []*executetest.Table{
				{
					KeyCols: []string{"_start", "_stop", "t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "t1", Type: flux.TString},
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(0), execute.Time(100), "a", execute.Time(0), 0.0},
						{execute.Time(0), execute.Time(100), "a", execute.Time(10), 1.0},
						{execute.Time(0), execute.Time(100), "a", execute.Time(20), 2.0},
						{execute.Time(0), execute.Time(100), "a", execute.Time(30), 3.0},
						{execute.Time(0), execute.Time(100), "a", execute.Time(40), 4.0},
						{execute.Time(0), execute.Time(100), "a", execute.Time(50), 5.0},
						{execute.Time(0), execute.Time(100), "a", execute.Time(60), 6.0},
						{execute.Time(0), execute.Time(100), "a", execute.Time(70), 7.0},
						{execute.Time(0), execute.Time(100), "a", execute.Time(80), 8.0},
						{execute.Time(0), execute.Time(100), "a", execute.Time(90), 9.0},
					},
				},
				{
					KeyCols: []string{"_start", "_stop", "t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "t1", Type: flux.TString},
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(0), execute.Time(100), "b", execute.Time(0), 0.3},
						{execute.Time(0), execute.Time(100), "b", execute.Time(10), 1.3},
						{execute.Time(0), execute.Time(100), "b", execute.Time(20), 2.3},
						{execute.Time(0), execute.Time(100), "b", execute.Time(30), 3.3},
						{execute.Time(0), execute.Time(100), "b", execute.Time(40), 4.3},
						{execute.Time(0), execute.Time(100), "b", execute.Time(50), 5.3},
						{execute.Time(0), execute.Time(100), "b", execute.Time(60), 6.3},
						{execute.Time(0), execute.Time(100), "b", execute.Time(70), 7.3},
						{execute.Time(0), execute.Time(100), "b", execute.Time(80), 8.3},
						{execute.Time(0), execute.Time(100), "b", execute.Time(90), 9.3},
					},
				},
				{
					KeyCols: []string{"_start", "_stop", "t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "t1", Type: flux.TString},
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(100), execute.Time(200), "a", execute.Time(100), 10.0},
						{execute.Time(100), execute.Time(200), "a", execute.Time(110), 11.0},
						{execute.Time(100), execute.Time(200), "a", execute.Time(120), 12.0},
						{execute.Time(100), execute.Time(200), "a", execute.Time(130), 13.0},
						{execute.Time(100), execute.Time(200), "a", execute.Time(140), 14.0},
						{execute.Time(100), execute.Time(200), "a", execute.Time(150), 15.0},
						{execute.Time(100), execute.Time(200), "a", execute.Time(160), 16.0},
						{execute.Time(100), execute.Time(200), "a", execute.Time(170), 17.0},
						{execute.Time(100), execute.Time(200), "a", execute.Time(180), 18.0},
						{execute.Time(100), execute.Time(200), "a", execute.Time(190), 19.0},
					},
				},
				{
					KeyCols: []string{"_start", "_stop", "t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "t1", Type: flux.TString},
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(100), execute.Time(200), "b", execute.Time(100), 10.3},
						{execute.Time(100), execute.Time(200), "b", execute.Time(110), 11.3},
						{execute.Time(100), execute.Time(200), "b", execute.Time(120), 12.3},
						{execute.Time(100), execute.Time(200), "b", execute.Time(130), 13.3},
						{execute.Time(100), execute.Time(200), "b", execute.Time(140), 14.3},
						{execute.Time(100), execute.Time(200), "b", execute.Time(150), 15.3},
						{execute.Time(100), execute.Time(200), "b", execute.Time(160), 16.3},
						{execute.Time(100), execute.Time(200), "b", execute.Time(170), 17.3},
						{execute.Time(100), execute.Time(200), "b", execute.Time(180), 18.3},
						{execute.Time(100), execute.Time(200), "b", execute.Time(190), 19.3},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: []string{"_start", "_stop", "t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "t1", Type: flux.TString},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(0), execute.Time(100), "a", 45.0},
					},
				},
				{
					KeyCols: []string{"_start", "_stop", "t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "t1", Type: flux.TString},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(100), execute.Time(200), "a", 145.0},
					},
				},
				{
					KeyCols: []string{"_start", "_stop", "t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "t1", Type: flux.TString},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(0), execute.Time(100), "b", 48.0},
					},
				},
				{
					KeyCols: []string{"_start", "_stop", "t1"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "t1", Type: flux.TString},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(100), execute.Time(200), "b", 148.0},
					},
				},
			},
		},
		{
			name: "multiple values",
			config: execute.AggregateConfig{
				Columns: []string{"x", "y"},
			},
			agg: sumAgg,
			data: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_time", Type: flux.TTime},
					{Label: "x", Type: flux.TFloat},
					{Label: "y", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(0), execute.Time(100), execute.Time(0), 0.0, 0.0},
					{execute.Time(0), execute.Time(100), execute.Time(10), 1.0, -1.0},
					{execute.Time(0), execute.Time(100), execute.Time(20), 2.0, -2.0},
					{execute.Time(0), execute.Time(100), execute.Time(30), 3.0, -3.0},
					{execute.Time(0), execute.Time(100), execute.Time(40), 4.0, -4.0},
					{execute.Time(0), execute.Time(100), execute.Time(50), 5.0, -5.0},
					{execute.Time(0), execute.Time(100), execute.Time(60), 6.0, -6.0},
					{execute.Time(0), execute.Time(100), execute.Time(70), 7.0, -7.0},
					{execute.Time(0), execute.Time(100), execute.Time(80), 8.0, -8.0},
					{execute.Time(0), execute.Time(100), execute.Time(90), 9.0, -9.0},
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
					{execute.Time(0), execute.Time(100), 45.0, -45.0},
				},
			}},
		},
		{
			name: "multiple values changing types",
			config: execute.AggregateConfig{
				Columns: []string{"x", "y"},
			},
			agg: countAgg,
			data: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_time", Type: flux.TTime},
					{Label: "x", Type: flux.TFloat},
					{Label: "y", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(0), execute.Time(100), execute.Time(0), 0.0, 0.0},
					{execute.Time(0), execute.Time(100), execute.Time(10), 1.0, -1.0},
					{execute.Time(0), execute.Time(100), execute.Time(20), 2.0, -2.0},
					{execute.Time(0), execute.Time(100), execute.Time(30), 3.0, -3.0},
					{execute.Time(0), execute.Time(100), execute.Time(40), 4.0, -4.0},
					{execute.Time(0), execute.Time(100), execute.Time(50), 5.0, -5.0},
					{execute.Time(0), execute.Time(100), execute.Time(60), 6.0, -6.0},
					{execute.Time(0), execute.Time(100), execute.Time(70), 7.0, -7.0},
					{execute.Time(0), execute.Time(100), execute.Time(80), 8.0, -8.0},
					{execute.Time(0), execute.Time(100), execute.Time(90), 9.0, -9.0},
				},
			}},
			want: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "x", Type: flux.TInt},
					{Label: "y", Type: flux.TInt},
				},
				Data: [][]interface{}{
					{execute.Time(0), execute.Time(100), int64(10), int64(10)},
				},
			}},
		},
	}
	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			d := executetest.NewDataset(executetest.RandomDatasetID())
			c := execute.NewTableBuilderCache(executetest.UnlimitedAllocator)
			c.SetTriggerSpec(execute.DefaultTriggerSpec)

			agg := execute.NewAggregateTransformation(d, c, tc.agg, tc.config)

			parentID := executetest.RandomDatasetID()
			for _, b := range tc.data {
				if err := agg.Process(parentID, b); err != nil {
					t.Fatal(err)
				}
			}

			got, err := executetest.TablesFromCache(c)
			if err != nil {
				t.Fatal(err)
			}

			executetest.NormalizeTables(got)
			executetest.NormalizeTables(tc.want)

			sort.Sort(executetest.SortedTables(got))
			sort.Sort(executetest.SortedTables(tc.want))

			if !cmp.Equal(tc.want, got, cmpopts.EquateNaNs()) {
				t.Errorf("unexpected tables -want/+got\n%s", cmp.Diff(tc.want, got))
			}
		})
	}
}
