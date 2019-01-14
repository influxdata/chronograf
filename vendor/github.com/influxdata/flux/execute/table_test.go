package execute_test

import (
	"fmt"
	"testing"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/execute/executetest"
)

func TestTablesEqual(t *testing.T) {

	testCases := []struct {
		skip    bool
		name    string
		data0   *executetest.Table // data from parent 0
		data1   *executetest.Table // data from parent 1
		want    bool
		wantErr bool
	}{
		{
			name: "simple equality",

			data0: &executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), 1.0},
					{execute.Time(2), 2.0},
					{execute.Time(3), 3.0},
				},
			},
			data1: &executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), 1.0},
					{execute.Time(2), 2.0},
					{execute.Time(3), 3.0},
				},
			},
			want: true,
		},
		{
			name: "left empty",
			data0: &executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{},
			},
			data1: &executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), 1.0},
					{execute.Time(2), 2.0},
					{execute.Time(3), 3.0},
				},
			},
			want: false,
		},
		{
			name: "right empty",
			data0: &executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), 1.0},
					{execute.Time(2), 2.0},
					{execute.Time(3), 3.0},
				},
			},
			data1: &executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{},
			},
			want: false,
		},
		{
			name: "left short",
			data0: &executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), 1.0},
					{execute.Time(2), 2.0},
				},
			},
			data1: &executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), 1.0},
					{execute.Time(2), 2.0},
					{execute.Time(3), 3.0},
				},
			},
			want: false,
		},
		{
			name: "right short",
			data0: &executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), 1.0},
					{execute.Time(2), 2.0},
					{execute.Time(3), 3.0},
				},
			},
			data1: &executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), 1.0},
					{execute.Time(2), 2.0},
				},
			},
			want: false,
		},
	}
	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			if tc.skip {
				t.Skip()
			}

			// this is used to normalize tables
			tc.data0.Key()
			tc.data1.Key()

			equal, err := execute.TablesEqual(tc.data0, tc.data1, executetest.UnlimitedAllocator)

			if tc.wantErr {
				if err == nil {
					t.Fatal(fmt.Errorf("case %s expected an error, got none", tc.name))
				} else {
					return
				}
			} else if err != nil {
				t.Errorf("unexpected error: %v", err)
			} else if want, got := tc.want, equal; want != got {
				if tc.want {
					t.Errorf("%s: expected equal tables, got false", tc.name)
				} else {
					t.Errorf("%s: expected unequal tables, got true", tc.name)
				}
			}
		})
	}
}
