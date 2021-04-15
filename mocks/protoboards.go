package mocks

import (
	"context"

	"github.com/influxdata/chronograf"
)

var _ chronograf.ProtoboardsStore = &ProtoboardsStore{}

type ProtoboardsStore struct {
	AllF func(ctx context.Context) ([]chronograf.Protoboard, error)
	GetF func(ctx context.Context, id string) (chronograf.Protoboard, error)
}

func (s *ProtoboardsStore) All(ctx context.Context) ([]chronograf.Protoboard, error) {
	return s.AllF(ctx)
}

func (s *ProtoboardsStore) Get(ctx context.Context, id string) (chronograf.Protoboard, error) {
	return s.GetF(ctx, id)
}
