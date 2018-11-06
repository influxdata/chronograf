package transformations_test

import (
	"errors"
	"testing"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/functions/transformations"
)

func TestKeyValues_Process(t *testing.T) {
	testCases := []struct {
		name    string
		spec    *transformations.KeyValuesProcedureSpec
		data    []flux.Table
		want    []*executetest.Table
		wantErr error
	}{
		{
			name: "no group key",
			spec: &transformations.KeyValuesProcedureSpec{KeyColumns: []string{"tag1"}},
			data: []flux.Table{
				&executetest.Table{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "tag0", Type: flux.TString},
						{Label: "tag1", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0, "a", "b"},
						{execute.Time(2), 2.0, "a", "c"},
						{execute.Time(3), 2.0, "a", "b"},
						{execute.Time(4), 2.0, "a", "d"},
					},
				},
			},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_key", Type: flux.TString},
					{Label: "_value", Type: flux.TString},
				},
				Data: [][]interface{}{
					{"tag1", "b"},
					{"tag1", "c"},
					{"tag1", "d"},
				},
			}},
		},
		{
			name: "column outside group key",
			spec: &transformations.KeyValuesProcedureSpec{KeyColumns: []string{"tag1"}},
			data: []flux.Table{
				&executetest.Table{
					KeyCols: []string{"tag0"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "tag0", Type: flux.TString},
						{Label: "tag1", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0, "a", "b"},
						{execute.Time(2), 2.0, "a", "c"},
						{execute.Time(3), 2.0, "a", "b"},
						{execute.Time(4), 2.0, "a", "d"},
					},
				},
			},
			want: []*executetest.Table{{
				KeyCols: []string{"tag0"},
				ColMeta: []flux.ColMeta{
					{Label: "tag0", Type: flux.TString},
					{Label: "_key", Type: flux.TString},
					{Label: "_value", Type: flux.TString},
				},
				Data: [][]interface{}{
					{"a", "tag1", "b"},
					{"a", "tag1", "c"},
					{"a", "tag1", "d"},
				},
			}},
		},
		{
			name: "column inside group key",
			spec: &transformations.KeyValuesProcedureSpec{KeyColumns: []string{"tag0"}},
			data: []flux.Table{
				&executetest.Table{
					KeyCols: []string{"tag0"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "tag0", Type: flux.TString},
						{Label: "tag1", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0, "a", "b"},
						{execute.Time(2), 2.0, "a", "c"},
						{execute.Time(3), 2.0, "a", "b"},
						{execute.Time(4), 2.0, "a", "d"},
					},
				},
			},
			want: []*executetest.Table{{
				KeyCols: []string{"tag0"},
				ColMeta: []flux.ColMeta{
					{Label: "tag0", Type: flux.TString},
					{Label: "_key", Type: flux.TString},
					{Label: "_value", Type: flux.TString},
				},
				Data: [][]interface{}{
					{"a", "tag0", "a"},
				},
			}},
		},
		{
			name: "two tables",
			spec: &transformations.KeyValuesProcedureSpec{KeyColumns: []string{"tag1"}},
			data: []flux.Table{
				&executetest.Table{
					KeyCols: []string{"tag0"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "tag0", Type: flux.TString},
						{Label: "tag1", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0, "a", "b"},
						{execute.Time(2), 2.0, "a", "c"},
						{execute.Time(3), 2.0, "a", "b"},
						{execute.Time(4), 2.0, "a", "d"},
					},
				},
				&executetest.Table{
					KeyCols: []string{"tag0"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "tag0", Type: flux.TString},
						{Label: "tag1", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0, "x", "b"},
						{execute.Time(2), 2.0, "x", "c"},
						{execute.Time(3), 2.0, "x", "b"},
						{execute.Time(4), 2.0, "x", "e"},
					},
				},
			},
			want: []*executetest.Table{{
				KeyCols: []string{"tag0"},
				ColMeta: []flux.ColMeta{
					{Label: "tag0", Type: flux.TString},
					{Label: "_key", Type: flux.TString},
					{Label: "_value", Type: flux.TString},
				},
				Data: [][]interface{}{
					{"a", "tag1", "b"},
					{"a", "tag1", "c"},
					{"a", "tag1", "d"},
				},
			},
				{
					KeyCols: []string{"tag0"},
					ColMeta: []flux.ColMeta{
						{Label: "tag0", Type: flux.TString},
						{Label: "_key", Type: flux.TString},
						{Label: "_value", Type: flux.TString},
					},
					Data: [][]interface{}{
						{"x", "tag1", "b"},
						{"x", "tag1", "c"},
						{"x", "tag1", "e"},
					},
				}},
		},
		{
			name: "two columns no group key",
			spec: &transformations.KeyValuesProcedureSpec{KeyColumns: []string{"tag0", "tag1"}},
			data: []flux.Table{
				&executetest.Table{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "tag0", Type: flux.TString},
						{Label: "tag1", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0, "a", "b"},
						{execute.Time(2), 2.0, "a", "c"},
						{execute.Time(3), 2.0, "a", "b"},
						{execute.Time(4), 2.0, "a", "d"},
					},
				},
			},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_key", Type: flux.TString},
					{Label: "_value", Type: flux.TString},
				},
				Data: [][]interface{}{
					{"tag0", "a"},
					{"tag1", "b"},
					{"tag1", "c"},
					{"tag1", "d"},
				},
			}},
		},
		{
			name: "two columns with group key",
			spec: &transformations.KeyValuesProcedureSpec{KeyColumns: []string{"tag0", "tag1"}},
			data: []flux.Table{
				&executetest.Table{
					KeyCols: []string{"tag0"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "tag0", Type: flux.TString},
						{Label: "tag1", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0, "a", "b"},
						{execute.Time(2), 2.0, "a", "c"},
						{execute.Time(3), 2.0, "a", "b"},
						{execute.Time(4), 2.0, "a", "d"},
					},
				},
			},
			want: []*executetest.Table{{
				KeyCols: []string{"tag0"},
				ColMeta: []flux.ColMeta{
					{Label: "tag0", Type: flux.TString},
					{Label: "_key", Type: flux.TString},
					{Label: "_value", Type: flux.TString},
				},
				Data: [][]interface{}{
					{"a", "tag0", "a"},
					{"a", "tag1", "b"},
					{"a", "tag1", "c"},
					{"a", "tag1", "d"},
				},
			}},
		},
		{
			name: "no matching columns",
			spec: &transformations.KeyValuesProcedureSpec{KeyColumns: []string{"tagX", "tagY"}},
			data: []flux.Table{
				&executetest.Table{
					KeyCols: []string{"tag0"},
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "tag0", Type: flux.TString},
						{Label: "tag1", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0, "a", "b"},
						{execute.Time(2), 2.0, "a", "c"},
						{execute.Time(3), 2.0, "a", "b"},
						{execute.Time(4), 2.0, "a", "d"},
					},
				},
			},
			wantErr: errors.New("no columns matched by keyColumns parameter"),
		},
	}
	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			executetest.ProcessTestHelper(
				t,
				tc.data,
				tc.want,
				tc.wantErr,
				func(d execute.Dataset, c execute.TableBuilderCache) execute.Transformation {
					return transformations.NewKeyValuesTransformation(d, c, tc.spec)
				},
			)
		})
	}
}
