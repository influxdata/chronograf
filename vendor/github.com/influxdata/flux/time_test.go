package flux_test

import (
	"math"
	"testing"
	"time"

	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/flux"
)

func TestTime_MarshalText(t *testing.T) {
	for _, tt := range []struct {
		ts   flux.Time
		want string
	}{
		{
			ts: flux.Time{
				IsRelative: true,
			},
			want: "now",
		},
		{
			ts: flux.Time{
				Relative:   -time.Minute,
				IsRelative: true,
			},
			want: "-1m0s",
		},
		{
			ts: flux.Time{
				Relative:   time.Minute,
				IsRelative: true,
			},
			want: "1m0s",
		},
		{
			ts: flux.Time{
				Absolute: time.Unix(0, 0).UTC(),
			},
			want: "1970-01-01T00:00:00Z",
		},
		{
			ts: flux.Time{
				// Minimum time in influxql.
				Absolute: time.Unix(0, math.MinInt64+2).UTC(),
			},
			want: "1677-09-21T00:12:43.145224194Z",
		},
		{
			ts: flux.Time{
				// Maximum time in influxql.
				Absolute: time.Unix(0, math.MaxInt64-1).UTC(),
			},
			want: "2262-04-11T23:47:16.854775806Z",
		},
	} {
		t.Run(tt.want, func(t *testing.T) {
			data, err := tt.ts.MarshalText()
			if err != nil {
				t.Fatalf("unexpected error: %s", err)
			}

			if want, got := tt.want, string(data); want != got {
				t.Fatalf("unexpected text -want/+got\n\t- %s\n\t+ %s", want, got)
			}
		})
	}
}

func TestTime_UnmarshalText(t *testing.T) {
	for _, tt := range []struct {
		s    string
		want flux.Time
	}{
		{
			s: "now",
			want: flux.Time{
				IsRelative: true,
			},
		},
		{
			s: "-1m0s",
			want: flux.Time{
				Relative:   -time.Minute,
				IsRelative: true,
			},
		},
		{
			s: "1m0s",
			want: flux.Time{
				Relative:   time.Minute,
				IsRelative: true,
			},
		},
		{
			s: "1970-01-01T00:00:00Z",
			want: flux.Time{
				Absolute: time.Unix(0, 0).UTC(),
			},
		},
		{
			s: "1677-09-21T00:12:43.145224194Z",
			want: flux.Time{
				// Minimum time in influxql.
				Absolute: time.Unix(0, math.MinInt64+2).UTC(),
			},
		},
		{
			s: "2262-04-11T23:47:16.854775806Z",
			want: flux.Time{
				// Maximum time in influxql.
				Absolute: time.Unix(0, math.MaxInt64-1).UTC(),
			},
		},
	} {
		t.Run(tt.s, func(t *testing.T) {
			var ts flux.Time
			if err := ts.UnmarshalText([]byte(tt.s)); err != nil {
				t.Fatalf("unexpected error: %s", err)
			}

			if want, got := tt.want, ts; !cmp.Equal(want, got) {
				t.Fatalf("unexpected text -want/+got\n%s", cmp.Diff(want, got))
			}
		})
	}
}
