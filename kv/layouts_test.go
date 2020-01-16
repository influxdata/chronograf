package kv_test

import (
	"context"
	"errors"
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/mocks"
	"github.com/stretchr/testify/require"
)

func TestLayoutStore_All(t *testing.T) {
	type fields struct {
		layouts []chronograf.Layout
	}
	type wants struct {
		layouts []chronograf.Layout
		err     error
	}
	tests := []struct {
		name   string
		fields fields
		wants  wants
	}{
		{
			name: "simple",
			fields: fields{
				layouts: []chronograf.Layout{
					{
						Application: "test",
						Measurement: "test",
					},
				},
			},
			wants: wants{
				layouts: []chronograf.Layout{
					{
						Application: "test",
						Measurement: "test",
					},
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := mocksLayout(&tt.fields.layouts)
			ctx := context.Background()

			got, err := s.All(ctx)
			if (err != nil) != (tt.wants.err != nil) {
				t.Errorf("LayoutsStore.All() error = %v, want error %v", err, tt.wants.err)
				return
			}

			require.Equal(t, 1, len(got))

			if diff := cmp.Diff(got[0].Application, tt.wants.layouts[0].Application); diff != "" {
				t.Errorf("LayoutStore.All():\n-got/+want\ndiff %s", diff)
				return
			}
		})
	}
}

func TestLayoutStore_Get(t *testing.T) {
	type fields struct {
		layouts []chronograf.Layout
	}
	type wants struct {
		layout chronograf.Layout
		err    error
	}
	tests := []struct {
		name   string
		fields fields
		wants  wants
	}{
		{
			name: "simple",
			fields: fields{
				layouts: []chronograf.Layout{
					{
						ID:          "A",
						Application: "test",
						Measurement: "test",
					},
					{
						ID:          "B",
						Application: "test2",
						Measurement: "test2",
					},
				},
			},
			wants: wants{
				layout: chronograf.Layout{
					ID:          "B",
					Application: "test2",
					Measurement: "test2",
				},
				err: nil,
			},
		},
		{
			name: "layout not found",
			fields: fields{
				layouts: []chronograf.Layout{
					{
						Application: "test",
						Measurement: "test",
					},
				},
			},
			wants: wants{
				err: chronograf.ErrLayoutNotFound,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := mocksLayout(&tt.fields.layouts)
			ctx := context.Background()

			id := tt.fields.layouts[len(tt.fields.layouts)-1].ID
			if tt.wants.err != nil {
				tt.fields.layouts = tt.fields.layouts[:len(tt.fields.layouts)-1]
			}

			got, err := s.Get(ctx, id)
			if (err != nil) != (tt.wants.err != nil) {
				t.Errorf("LayoutsStore.Get() error = %v, want error %v", err, tt.wants.err)
				return
			}

			if diff := cmp.Diff(got.Application, tt.wants.layout.Application); diff != "" {
				t.Errorf("LayoutStore.Get():\n-got/+want\ndiff %s", diff)
				return
			}
		})
	}
}

func mocksLayout(layouts *[]chronograf.Layout) mocks.LayoutsStore {
	return mocks.LayoutsStore{
		AllF: func(ctx context.Context) ([]chronograf.Layout, error) {
			return *layouts, nil
		},
		GetF: func(ctx context.Context, id string) (chronograf.Layout, error) {
			for _, l := range *layouts {
				if l.ID == id {
					return l, nil
				}
			}
			return chronograf.Layout{}, errors.New("no layout found")
		},
	}
}
