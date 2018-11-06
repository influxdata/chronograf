package flux_test

import (
	"testing"
	"time"

	"github.com/influxdata/flux"
)

func TestBounds_HasZero(t *testing.T) {
	tests := []struct {
		name   string
		now    time.Time
		bounds flux.Bounds
		want   bool
	}{
		{
			name: "single zero",
			now:  time.Date(2018, time.August, 14, 11, 0, 0, 0, time.UTC),
			bounds: flux.Bounds{
				Start: flux.Time{
					IsRelative: true,
					Relative:   -1 * time.Hour,
				},
				Stop: flux.Time{},
			},
			want: true,
		},
		{
			name: "both zero",
			now:  time.Date(2018, time.August, 14, 11, 0, 0, 0, time.UTC),
			bounds: flux.Bounds{
				Start: flux.Time{},
				Stop:  flux.Time{},
			},
			want: true,
		},
		{
			name: "both non-zero",
			now:  time.Date(2018, time.August, 14, 11, 0, 0, 0, time.UTC),
			bounds: flux.Bounds{
				Start: flux.Time{
					IsRelative: true,
					Relative:   -1 * time.Hour,
				},
				Stop: flux.Now,
			},
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.bounds.HasZero()
			if got != tt.want {
				t.Errorf("unexpected result for bounds.HasZero(): got %t, want %t", got, tt.want)
			}
		})
	}
}

func TestBounds_IsEmpty(t *testing.T) {
	tests := []struct {
		name   string
		bounds flux.Bounds
		want   bool
	}{
		{
			name: "empty bounds / start == stop",
			bounds: flux.Bounds{
				Start: flux.Now,
				Stop:  flux.Now,
				Now:   time.Date(2018, time.August, 14, 11, 0, 0, 0, time.UTC),
			},
			want: true,
		},
		{
			name: "empty bounds / absolute now == relative now",
			bounds: flux.Bounds{
				Start: flux.Now,
				Stop: flux.Time{
					Absolute: time.Date(2018, time.August, 14, 11, 0, 0, 0, time.UTC),
				},
				Now: time.Date(2018, time.August, 14, 11, 0, 0, 0, time.UTC),
			},
			want: true,
		},
		{
			name: "start > stop",
			bounds: flux.Bounds{
				Start: flux.Time{
					IsRelative: true,
					Relative:   time.Hour,
				},
				Stop: flux.Now,
				Now:  time.Date(2018, time.August, 14, 11, 0, 0, 0, time.UTC),
			},
			want: true,
		},
		{
			name: "start < stop",
			bounds: flux.Bounds{
				Start: flux.Time{
					IsRelative: true,
					Relative:   -1 * time.Hour,
				},
				Stop: flux.Now,
				Now:  time.Date(2018, time.August, 14, 11, 0, 0, 0, time.UTC),
			},
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.bounds.IsEmpty()
			if got != tt.want {
				t.Errorf("unexpected result for bounds.IsEmpty(): got %t, want %t", got, tt.want)
			}
		})
	}
}
