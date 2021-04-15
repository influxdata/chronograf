package mocks

import (
	"context"

	"github.com/influxdata/chronograf"
)

var _ chronograf.LayoutsStore = &LayoutsStore{}

type LayoutsStore struct {
	AllF func(ctx context.Context) ([]chronograf.Layout, error)
	GetF func(ctx context.Context, id string) (chronograf.Layout, error)
}

func (s *LayoutsStore) All(ctx context.Context) ([]chronograf.Layout, error) {
	return s.AllF(ctx)
}

func (s *LayoutsStore) Get(ctx context.Context, id string) (chronograf.Layout, error) {
	return s.GetF(ctx, id)
}
