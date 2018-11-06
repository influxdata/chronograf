package transformations_test

import (
	"testing"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/functions/transformations"
)

func TestKeys_Process(t *testing.T) {
	testCases := []struct {
		name string
		spec *transformations.KeysProcedureSpec
		data []flux.Table
		want []*executetest.Table
	}{
		{
			name: "one table",
			spec: &transformations.KeysProcedureSpec{},
			data: []flux.Table{
				&executetest.Table{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "tag0", Type: flux.TString},
						{Label: "tag1", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0},
					},
				},
			},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_value", Type: flux.TString},
				},
				Data: [][]interface{}{
					{"_time"},
					{"_value"},
					{"tag0"},
					{"tag1"},
				},
			}},
		},
		{
			name: "one table except",
			spec: &transformations.KeysProcedureSpec{Except: []string{"_value", "_time"}},
			data: []flux.Table{
				&executetest.Table{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "tag0", Type: flux.TString},
						{Label: "tag1", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(1), 2.0},
					},
				},
			},
			want: []*executetest.Table{{
				ColMeta: []flux.ColMeta{
					{Label: "_value", Type: flux.TString},
				},
				Data: [][]interface{}{
					{"tag0"},
					{"tag1"},
				},
			}},
		},
		{
			name: "two tables",
			spec: &transformations.KeysProcedureSpec{},
			data: []flux.Table{
				&executetest.Table{
					KeyCols: []string{"tag0", "tag1"},
					ColMeta: []flux.ColMeta{
						{Label: "tag0", Type: flux.TString},
						{Label: "tag1", Type: flux.TString},
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{"tag0-0", "tag1-0", execute.Time(1), 2.0},
					},
				},
				&executetest.Table{
					KeyCols: []string{"tag0", "tag2"},
					ColMeta: []flux.ColMeta{
						{Label: "tag0", Type: flux.TString},
						{Label: "tag2", Type: flux.TString},
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{"tag0-0", "tag2-0", execute.Time(1), 2.0},
					},
				},
			},
			want: []*executetest.Table{
				{
					KeyCols: []string{"tag0", "tag1"},
					ColMeta: []flux.ColMeta{
						{Label: "tag0", Type: flux.TString},
						{Label: "tag1", Type: flux.TString},
						{Label: "_value", Type: flux.TString},
					},
					Data: [][]interface{}{
						{"tag0-0", "tag1-0", "_time"},
						{"tag0-0", "tag1-0", "_value"},
						{"tag0-0", "tag1-0", "tag0"},
						{"tag0-0", "tag1-0", "tag1"},
					},
				},
				{
					KeyCols: []string{"tag0", "tag2"},
					ColMeta: []flux.ColMeta{
						{Label: "tag0", Type: flux.TString},
						{Label: "tag2", Type: flux.TString},
						{Label: "_value", Type: flux.TString},
					},
					Data: [][]interface{}{
						{"tag0-0", "tag2-0", "_time"},
						{"tag0-0", "tag2-0", "_value"},
						{"tag0-0", "tag2-0", "tag0"},
						{"tag0-0", "tag2-0", "tag2"},
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
					return transformations.NewKeysTransformation(d, c, tc.spec)
				},
			)
		})
	}
}
