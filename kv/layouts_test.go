package kv_test

import (
	"context"
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/chronograf"
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
			client, err := NewTestClient()
			if err != nil {
				t.Fatal(err)
			}
			defer client.Close()

			s := client.LayoutsStore()
			ctx := context.Background()

			for _, layout := range tt.fields.layouts {
				s.Add(ctx, layout)
			}

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

func TestLayoutStore_Add(t *testing.T) {
	type args struct {
		layout chronograf.Layout
	}
	type wants struct {
		layout chronograf.Layout
		err    error
	}
	tests := []struct {
		name  string
		args  args
		wants wants
	}{
		{
			name: "simple",
			args: args{
				layout: chronograf.Layout{
					Application: "test",
					Measurement: "test",
				},
			},
			wants: wants{
				layout: chronograf.Layout{
					Application: "test",
					Measurement: "test",
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client, err := NewTestClient()
			if err != nil {
				t.Fatal(err)
			}
			defer client.Close()

			s := client.LayoutsStore()
			ctx := context.Background()

			l, err := s.Add(ctx, tt.args.layout)

			if (err != nil) != (tt.wants.err != nil) {
				t.Errorf("LayoutsStore.Add() error = %v, want error %v", err, tt.wants.err)
				return
			}

			got, err := s.Get(ctx, l.ID)
			if err != nil {
				t.Fatalf("failed to get layout: %v", err)
				return
			}
			if diff := cmp.Diff(got.Application, tt.wants.layout.Application); diff != "" {
				t.Errorf("LayoutStore.Add():\n-got/+want\ndiff %s", diff)
				return
			}
		})
	}
}

func TestLayoutStore_Delete(t *testing.T) {
	type fields struct {
		layouts []chronograf.Layout
	}
	type wants struct {
		err error
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
			client, err := NewTestClient()
			if err != nil {
				t.Fatal(err)
			}
			defer client.Close()

			s := client.LayoutsStore()
			ctx := context.Background()

			var l chronograf.Layout
			for _, layout := range tt.fields.layouts {
				l, _ = s.Add(ctx, layout)
			}

			err = s.Delete(ctx, l)
			if (err != nil) != (tt.wants.err != nil) {
				err = s.Delete(ctx, l)
				if (err != nil) != (tt.wants.err != nil) {
					t.Errorf("LayoutsStore.Delete() error = %v, want error %v", err, tt.wants.err)
					return
				}
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
						Application: "test",
						Measurement: "test",
					},
					{
						Application: "test2",
						Measurement: "test2",
					},
				},
			},
			wants: wants{
				layout: chronograf.Layout{
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
			client, err := NewTestClient()
			if err != nil {
				t.Fatal(err)
			}
			defer client.Close()

			s := client.LayoutsStore()
			ctx := context.Background()

			var l chronograf.Layout
			for _, layout := range tt.fields.layouts {
				l, _ = s.Add(ctx, layout)
			}

			if tt.wants.err != nil {
				s.Delete(ctx, l)
			}

			got, err := s.Get(ctx, l.ID)
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

func TestLayoutStore_Update(t *testing.T) {
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
						Application: "test",
						Measurement: "test",
					},
					{
						Application: "test2",
						Measurement: "test2",
					},
				},
			},
			wants: wants{
				layout: chronograf.Layout{
					Application: "test3",
					Measurement: "test3",
				},
				err: nil,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client, err := NewTestClient()
			if err != nil {
				t.Fatal(err)
			}
			defer client.Close()

			s := client.LayoutsStore()
			ctx := context.Background()

			var l chronograf.Layout
			for _, layout := range tt.fields.layouts {
				l, _ = s.Add(ctx, layout)
			}

			l.Application = "test3"
			l.Measurement = "test3"

			err = s.Update(ctx, l)
			if (err != nil) != (tt.wants.err != nil) {
				t.Errorf("LayoutsStore.Update() error = %v, want error %v", err, tt.wants.err)
				return
			}
			if diff := cmp.Diff(l.Application, tt.wants.layout.Application); diff != "" {
				t.Errorf("LayoutStore.Update():\n-got/+want\ndiff %s", diff)
				return
			}
		})
	}
}
