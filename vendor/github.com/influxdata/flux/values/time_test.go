package values_test

import (
	"testing"
	"time"

	"github.com/influxdata/flux/values"
)

func TestTime_Round(t *testing.T) {
	for _, tt := range []struct {
		ts   values.Time
		d    values.Duration
		want values.Time
	}{
		{
			ts:   values.Time(time.Second + 500*time.Millisecond),
			d:    values.Duration(time.Second),
			want: values.Time(2 * time.Second),
		},
		{
			ts:   values.Time(time.Second + 501*time.Millisecond),
			d:    values.Duration(time.Second),
			want: values.Time(2 * time.Second),
		},
		{
			ts:   values.Time(time.Second + 499*time.Millisecond),
			d:    values.Duration(time.Second),
			want: values.Time(time.Second),
		},
		{
			ts:   values.Time(time.Second + 0*time.Millisecond),
			d:    values.Duration(time.Second),
			want: values.Time(time.Second),
		},
	} {
		t.Run(tt.ts.String(), func(t *testing.T) {
			if want, got := tt.want, tt.ts.Round(tt.d); want != got {
				t.Fatalf("unexpected time -want/+got\n\t- %s\n\t%s", want, got)
			}
		})
	}
}

func TestTime_Truncate(t *testing.T) {
	for _, tt := range []struct {
		ts   values.Time
		d    values.Duration
		want values.Time
	}{
		{
			ts:   values.Time(time.Second + 500*time.Millisecond),
			d:    values.Duration(time.Second),
			want: values.Time(time.Second),
		},
		{
			ts:   values.Time(time.Second + 501*time.Millisecond),
			d:    values.Duration(time.Second),
			want: values.Time(time.Second),
		},
		{
			ts:   values.Time(time.Second + 499*time.Millisecond),
			d:    values.Duration(time.Second),
			want: values.Time(time.Second),
		},
		{
			ts:   values.Time(time.Second + 0*time.Millisecond),
			d:    values.Duration(time.Second),
			want: values.Time(time.Second),
		},
		{
			ts:   values.Time(time.Second + 999*time.Millisecond),
			d:    values.Duration(time.Second),
			want: values.Time(time.Second),
		},
	} {
		t.Run(tt.ts.String(), func(t *testing.T) {
			if want, got := tt.want, tt.ts.Truncate(tt.d); want != got {
				t.Fatalf("unexpected time -want/+got\n\t- %s\n\t%s", want, got)
			}
		})
	}
}
