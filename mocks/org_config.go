package mocks

import (
	"context"

	"github.com/hws522/chronograf"
)

var _ chronograf.OrganizationConfigStore = &OrganizationConfigStore{}

type OrganizationConfigStore struct {
	AllF          func(ctx context.Context) ([]chronograf.OrganizationConfig, error)
	FindOrCreateF func(ctx context.Context, id string) (*chronograf.OrganizationConfig, error)
	PutF          func(ctx context.Context, c *chronograf.OrganizationConfig) error
}

func (s *OrganizationConfigStore) All(ctx context.Context) ([]chronograf.OrganizationConfig, error) {
	return s.AllF(ctx)
}

func (s *OrganizationConfigStore) FindOrCreate(ctx context.Context, id string) (*chronograf.OrganizationConfig, error) {
	return s.FindOrCreateF(ctx, id)
}

func (s *OrganizationConfigStore) Put(ctx context.Context, c *chronograf.OrganizationConfig) error {
	return s.PutF(ctx, c)
}
