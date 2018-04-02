package execute_test

import (
	"sort"
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"
	"github.com/influxdata/ifql/functions"
	"github.com/influxdata/ifql/query/execute"
	"github.com/influxdata/ifql/query/execute/executetest"
)

func TestRowSelector_Process(t *testing.T) {
	// All test cases use a simple MinSelector
	testCases := []struct {
		name       string
		bounds     execute.Bounds
		colLabel   string
		useRowTime bool
		data       []*executetest.Block
		want       func(b execute.Bounds) []*executetest.Block
	}{
		{
			name: "single",
			bounds: execute.Bounds{
				Start: 0,
				Stop:  100,
			},
			data: []*executetest.Block{{
				Bnds: execute.Bounds{
					Start: 0,
					Stop:  100,
				},
				ColMeta: []execute.ColMeta{
					{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
					{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
				},
				Data: [][]interface{}{
					{execute.Time(0), 0.0},
					{execute.Time(10), 1.0},
					{execute.Time(20), 2.0},
					{execute.Time(30), 3.0},
					{execute.Time(40), 4.0},
					{execute.Time(50), 5.0},
					{execute.Time(60), 6.0},
					{execute.Time(70), 7.0},
					{execute.Time(80), 8.0},
					{execute.Time(90), 9.0},
				},
			}},
			want: func(b execute.Bounds) []*executetest.Block {
				return []*executetest.Block{{
					Bnds: b,
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
					},
					Data: [][]interface{}{
						{execute.Time(100), 0.0},
					},
				}}
			},
		},
		{
			name:       "single useRowTime",
			useRowTime: true,
			bounds: execute.Bounds{
				Start: 0,
				Stop:  100,
			},
			data: []*executetest.Block{{
				Bnds: execute.Bounds{
					Start: 0,
					Stop:  100,
				},
				ColMeta: []execute.ColMeta{
					{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
					{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
				},
				Data: [][]interface{}{
					{execute.Time(0), 0.0},
					{execute.Time(10), 1.0},
					{execute.Time(20), 2.0},
					{execute.Time(30), 3.0},
					{execute.Time(40), 4.0},
					{execute.Time(50), 5.0},
					{execute.Time(60), 6.0},
					{execute.Time(70), 7.0},
					{execute.Time(80), 8.0},
					{execute.Time(90), 9.0},
				},
			}},
			want: func(b execute.Bounds) []*executetest.Block {
				return []*executetest.Block{{
					Bnds: b,
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
					},
					Data: [][]interface{}{
						{execute.Time(0), 0.0},
					},
				}}
			},
		},
		{
			name:     "single custom column",
			colLabel: "x",
			bounds: execute.Bounds{
				Start: 0,
				Stop:  100,
			},
			data: []*executetest.Block{{
				Bnds: execute.Bounds{
					Start: 0,
					Stop:  100,
				},
				ColMeta: []execute.ColMeta{
					{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
					{Label: "x", Type: execute.TFloat, Kind: execute.ValueColKind},
				},
				Data: [][]interface{}{
					{execute.Time(0), 0.0},
					{execute.Time(10), 1.0},
					{execute.Time(20), 2.0},
					{execute.Time(30), 3.0},
					{execute.Time(40), 4.0},
					{execute.Time(50), 5.0},
					{execute.Time(60), 6.0},
					{execute.Time(70), 7.0},
					{execute.Time(80), 8.0},
					{execute.Time(90), 9.0},
				},
			}},
			want: func(b execute.Bounds) []*executetest.Block {
				return []*executetest.Block{{
					Bnds: b,
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "x", Type: execute.TFloat, Kind: execute.ValueColKind},
					},
					Data: [][]interface{}{
						{execute.Time(100), 0.0},
					},
				}}
			},
		},
		{
			name: "multiple blocks",
			bounds: execute.Bounds{
				Start: 0,
				Stop:  200,
			},
			data: []*executetest.Block{
				{
					Bnds: execute.Bounds{
						Start: 0,
						Stop:  100,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
					},
					Data: [][]interface{}{
						{execute.Time(0), 0.0},
						{execute.Time(10), 1.0},
						{execute.Time(20), 2.0},
						{execute.Time(30), 3.0},
						{execute.Time(40), 4.0},
						{execute.Time(50), 5.0},
						{execute.Time(60), 6.0},
						{execute.Time(70), 7.0},
						{execute.Time(80), 8.0},
						{execute.Time(90), 9.0},
					},
				},
				{
					Bnds: execute.Bounds{
						Start: 100,
						Stop:  200,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
					},
					Data: [][]interface{}{
						{execute.Time(100), 10.0},
						{execute.Time(110), 11.0},
						{execute.Time(120), 12.0},
						{execute.Time(130), 13.0},
						{execute.Time(140), 14.0},
						{execute.Time(150), 15.0},
						{execute.Time(160), 16.0},
						{execute.Time(170), 17.0},
						{execute.Time(180), 18.0},
						{execute.Time(190), 19.0},
					},
				},
			},
			want: func(b execute.Bounds) []*executetest.Block {
				return []*executetest.Block{{
					Bnds: b,
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
					},
					Data: [][]interface{}{
						{execute.Time(100), 0.0},
						{execute.Time(200), 10.0},
					},
				}}
			},
		},
		{
			name:       "multiple blocks with tags and useRowTime",
			useRowTime: true,
			bounds: execute.Bounds{
				Start: 0,
				Stop:  200,
			},
			data: []*executetest.Block{
				{
					Bnds: execute.Bounds{
						Start: 0,
						Stop:  100,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
						{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: false},
					},
					Data: [][]interface{}{
						{execute.Time(0), 4.0, "a", "x"},
						{execute.Time(10), 3.0, "a", "y"},
						{execute.Time(20), 6.0, "a", "x"},
						{execute.Time(30), 3.0, "a", "y"},
						{execute.Time(40), 1.0, "a", "x"},
						{execute.Time(50), 4.0, "a", "y"},
						{execute.Time(60), 7.0, "a", "x"},
						{execute.Time(70), 7.0, "a", "y"},
						{execute.Time(80), 2.0, "a", "x"},
						{execute.Time(90), 7.0, "a", "y"},
					},
				},
				{
					Bnds: execute.Bounds{
						Start: 0,
						Stop:  100,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
						{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: false},
					},
					Data: [][]interface{}{
						{execute.Time(0), 3.3, "b", "x"},
						{execute.Time(10), 5.3, "b", "y"},
						{execute.Time(20), 2.3, "b", "x"},
						{execute.Time(30), 7.3, "b", "y"},
						{execute.Time(40), 4.3, "b", "x"},
						{execute.Time(50), 6.3, "b", "y"},
						{execute.Time(60), 6.3, "b", "x"},
						{execute.Time(70), 5.3, "b", "y"},
						{execute.Time(80), 8.3, "b", "x"},
						{execute.Time(90), 1.3, "b", "y"},
					},
				},
				{
					Bnds: execute.Bounds{
						Start: 100,
						Stop:  200,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
						{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: false},
					},
					Data: [][]interface{}{
						{execute.Time(100), 14.0, "a", "y"},
						{execute.Time(110), 13.0, "a", "x"},
						{execute.Time(120), 17.0, "a", "y"},
						{execute.Time(130), 13.0, "a", "x"},
						{execute.Time(140), 14.0, "a", "y"},
						{execute.Time(150), 14.0, "a", "x"},
						{execute.Time(160), 11.0, "a", "y"},
						{execute.Time(170), 15.0, "a", "x"},
						{execute.Time(180), 12.0, "a", "y"},
						{execute.Time(190), 14.0, "a", "x"},
					},
				},
				{
					Bnds: execute.Bounds{
						Start: 100,
						Stop:  200,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
						{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: false},
					},
					Data: [][]interface{}{
						{execute.Time(100), 12.3, "b", "y"},
						{execute.Time(110), 11.3, "b", "x"},
						{execute.Time(120), 14.3, "b", "y"},
						{execute.Time(130), 15.3, "b", "x"},
						{execute.Time(140), 14.3, "b", "y"},
						{execute.Time(150), 13.3, "b", "x"},
						{execute.Time(160), 16.3, "b", "y"},
						{execute.Time(170), 13.3, "b", "x"},
						{execute.Time(180), 12.3, "b", "y"},
						{execute.Time(190), 17.3, "b", "x"},
					},
				},
			},
			want: func(b execute.Bounds) []*executetest.Block {
				return []*executetest.Block{
					{
						Bnds: b,
						ColMeta: []execute.ColMeta{
							{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
							{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
							{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
							{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: false},
						},
						Data: [][]interface{}{
							{execute.Time(40), 1.0, "a", "x"},
							{execute.Time(160), 11.0, "a", "y"},
						},
					},
					{
						Bnds: b,
						ColMeta: []execute.ColMeta{
							{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
							{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
							{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
							{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: false},
						},
						Data: [][]interface{}{
							{execute.Time(90), 1.3, "b", "y"},
							{execute.Time(110), 11.3, "b", "x"},
						},
					},
				}
			},
		},
	}
	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			d := executetest.NewDataset(executetest.RandomDatasetID())
			c := execute.NewBlockBuilderCache(executetest.UnlimitedAllocator)
			c.SetTriggerSpec(execute.DefaultTriggerSpec)

			selector := execute.NewRowSelectorTransformation(d, c, tc.bounds, new(functions.MinSelector), tc.colLabel, tc.useRowTime)

			parentID := executetest.RandomDatasetID()
			for _, b := range tc.data {
				if err := selector.Process(parentID, b); err != nil {
					t.Fatal(err)
				}
			}

			want := tc.want(tc.bounds)
			got := executetest.BlocksFromCache(c)

			sort.Sort(executetest.SortedBlocks(got))
			sort.Sort(executetest.SortedBlocks(want))

			if !cmp.Equal(want, got, cmpopts.EquateNaNs()) {
				t.Errorf("unexpected blocks -want/+got\n%s", cmp.Diff(want, got))
			}
		})
	}
}

func TestIndexSelector_Process(t *testing.T) {
	// All test cases use a simple FirstSelector
	testCases := []struct {
		name       string
		bounds     execute.Bounds
		useRowTime bool
		data       []*executetest.Block
		want       func(b execute.Bounds) []*executetest.Block
	}{
		{
			name: "single",
			bounds: execute.Bounds{
				Start: 0,
				Stop:  100,
			},
			data: []*executetest.Block{{
				Bnds: execute.Bounds{
					Start: 0,
					Stop:  100,
				},
				ColMeta: []execute.ColMeta{
					{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
					{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
				},
				Data: [][]interface{}{
					{execute.Time(0), 0.0},
					{execute.Time(10), 1.0},
					{execute.Time(20), 2.0},
					{execute.Time(30), 3.0},
					{execute.Time(40), 4.0},
					{execute.Time(50), 5.0},
					{execute.Time(60), 6.0},
					{execute.Time(70), 7.0},
					{execute.Time(80), 8.0},
					{execute.Time(90), 9.0},
				},
			}},
			want: func(b execute.Bounds) []*executetest.Block {
				return []*executetest.Block{{
					Bnds: b,
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
					},
					Data: [][]interface{}{
						{execute.Time(100), 0.0},
					},
				}}
			},
		},
		{
			name:       "single useRowTime",
			useRowTime: true,
			bounds: execute.Bounds{
				Start: 0,
				Stop:  100,
			},
			data: []*executetest.Block{{
				Bnds: execute.Bounds{
					Start: 0,
					Stop:  100,
				},
				ColMeta: []execute.ColMeta{
					{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
					{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
				},
				Data: [][]interface{}{
					{execute.Time(0), 0.0},
					{execute.Time(10), 1.0},
					{execute.Time(20), 2.0},
					{execute.Time(30), 3.0},
					{execute.Time(40), 4.0},
					{execute.Time(50), 5.0},
					{execute.Time(60), 6.0},
					{execute.Time(70), 7.0},
					{execute.Time(80), 8.0},
					{execute.Time(90), 9.0},
				},
			}},
			want: func(b execute.Bounds) []*executetest.Block {
				return []*executetest.Block{{
					Bnds: b,
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
					},
					Data: [][]interface{}{
						{execute.Time(0), 0.0},
					},
				}}
			},
		},
		{
			name: "multiple blocks",
			bounds: execute.Bounds{
				Start: 0,
				Stop:  200,
			},
			data: []*executetest.Block{
				{
					Bnds: execute.Bounds{
						Start: 0,
						Stop:  100,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
					},
					Data: [][]interface{}{
						{execute.Time(0), 0.0},
						{execute.Time(10), 1.0},
						{execute.Time(20), 2.0},
						{execute.Time(30), 3.0},
						{execute.Time(40), 4.0},
						{execute.Time(50), 5.0},
						{execute.Time(60), 6.0},
						{execute.Time(70), 7.0},
						{execute.Time(80), 8.0},
						{execute.Time(90), 9.0},
					},
				},
				{
					Bnds: execute.Bounds{
						Start: 100,
						Stop:  200,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
					},
					Data: [][]interface{}{
						{execute.Time(100), 10.0},
						{execute.Time(110), 11.0},
						{execute.Time(120), 12.0},
						{execute.Time(130), 13.0},
						{execute.Time(140), 14.0},
						{execute.Time(150), 15.0},
						{execute.Time(160), 16.0},
						{execute.Time(170), 17.0},
						{execute.Time(180), 18.0},
						{execute.Time(190), 19.0},
					},
				},
			},
			want: func(b execute.Bounds) []*executetest.Block {
				return []*executetest.Block{{
					Bnds: b,
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
					},
					Data: [][]interface{}{
						{execute.Time(100), 0.0},
						{execute.Time(200), 10.0},
					},
				}}
			},
		},
		{
			name:       "multiple blocks with tags and useRowTime",
			useRowTime: true,
			bounds: execute.Bounds{
				Start: 0,
				Stop:  200,
			},
			data: []*executetest.Block{
				{
					Bnds: execute.Bounds{
						Start: 0,
						Stop:  100,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
						{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: false},
					},
					Data: [][]interface{}{
						{execute.Time(0), 4.0, "a", "x"},
						{execute.Time(10), 3.0, "a", "y"},
						{execute.Time(20), 6.0, "a", "x"},
						{execute.Time(30), 3.0, "a", "y"},
						{execute.Time(40), 1.0, "a", "x"},
						{execute.Time(50), 4.0, "a", "y"},
						{execute.Time(60), 7.0, "a", "x"},
						{execute.Time(70), 7.0, "a", "y"},
						{execute.Time(80), 2.0, "a", "x"},
						{execute.Time(90), 7.0, "a", "y"},
					},
				},
				{
					Bnds: execute.Bounds{
						Start: 0,
						Stop:  100,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
						{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: false},
					},
					Data: [][]interface{}{
						{execute.Time(0), 3.3, "b", "x"},
						{execute.Time(10), 5.3, "b", "y"},
						{execute.Time(20), 2.3, "b", "x"},
						{execute.Time(30), 7.3, "b", "y"},
						{execute.Time(40), 4.3, "b", "x"},
						{execute.Time(50), 6.3, "b", "y"},
						{execute.Time(60), 6.3, "b", "x"},
						{execute.Time(70), 5.3, "b", "y"},
						{execute.Time(80), 8.3, "b", "x"},
						{execute.Time(90), 1.3, "b", "y"},
					},
				},
				{
					Bnds: execute.Bounds{
						Start: 100,
						Stop:  200,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
						{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: false},
					},
					Data: [][]interface{}{
						{execute.Time(100), 14.0, "a", "y"},
						{execute.Time(110), 13.0, "a", "x"},
						{execute.Time(120), 17.0, "a", "y"},
						{execute.Time(130), 13.0, "a", "x"},
						{execute.Time(140), 14.0, "a", "y"},
						{execute.Time(150), 14.0, "a", "x"},
						{execute.Time(160), 11.0, "a", "y"},
						{execute.Time(170), 15.0, "a", "x"},
						{execute.Time(180), 12.0, "a", "y"},
						{execute.Time(190), 14.0, "a", "x"},
					},
				},
				{
					Bnds: execute.Bounds{
						Start: 100,
						Stop:  200,
					},
					ColMeta: []execute.ColMeta{
						{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
						{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
						{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
						{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: false},
					},
					Data: [][]interface{}{
						{execute.Time(100), 12.3, "b", "y"},
						{execute.Time(110), 11.3, "b", "x"},
						{execute.Time(120), 14.3, "b", "y"},
						{execute.Time(130), 15.3, "b", "x"},
						{execute.Time(140), 14.3, "b", "y"},
						{execute.Time(150), 13.3, "b", "x"},
						{execute.Time(160), 16.3, "b", "y"},
						{execute.Time(170), 13.3, "b", "x"},
						{execute.Time(180), 12.3, "b", "y"},
						{execute.Time(190), 17.3, "b", "x"},
					},
				},
			},
			want: func(b execute.Bounds) []*executetest.Block {
				return []*executetest.Block{
					{
						Bnds: b,
						ColMeta: []execute.ColMeta{
							{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
							{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
							{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
							{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: false},
						},
						Data: [][]interface{}{
							{execute.Time(0), 4.0, "a", "x"},
							{execute.Time(100), 14.0, "a", "y"},
						},
					},
					{
						Bnds: b,
						ColMeta: []execute.ColMeta{
							{Label: "_time", Type: execute.TTime, Kind: execute.TimeColKind},
							{Label: "_value", Type: execute.TFloat, Kind: execute.ValueColKind},
							{Label: "t1", Type: execute.TString, Kind: execute.TagColKind, Common: true},
							{Label: "t2", Type: execute.TString, Kind: execute.TagColKind, Common: false},
						},
						Data: [][]interface{}{
							{execute.Time(0), 3.3, "b", "x"},
							{execute.Time(100), 12.3, "b", "y"},
						},
					},
				}
			},
		},
	}
	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			d := executetest.NewDataset(executetest.RandomDatasetID())
			c := execute.NewBlockBuilderCache(executetest.UnlimitedAllocator)
			c.SetTriggerSpec(execute.DefaultTriggerSpec)

			selector := execute.NewIndexSelectorTransformation(d, c, tc.bounds, new(functions.FirstSelector), "_value", tc.useRowTime)

			parentID := executetest.RandomDatasetID()
			for _, b := range tc.data {
				if err := selector.Process(parentID, b); err != nil {
					t.Fatal(err)
				}
			}

			want := tc.want(tc.bounds)
			got := executetest.BlocksFromCache(c)

			sort.Sort(executetest.SortedBlocks(got))
			sort.Sort(executetest.SortedBlocks(want))

			if !cmp.Equal(want, got, cmpopts.EquateNaNs()) {
				t.Errorf("unexpected blocks -want/+got\n%s", cmp.Diff(want, got))
			}
		})
	}
}
