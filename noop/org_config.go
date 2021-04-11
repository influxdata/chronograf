package noop

import (
	"context"
	"fmt"

	"github.com/hws522/chronograf"
)

// ensure OrganizationConfigStore implements chronograf.OrganizationConfigStore
var _ chronograf.OrganizationConfigStore = &OrganizationConfigStore{}

// OrganizationConfigStore is an empty struct for satisfying an interface and returning errors.
type OrganizationConfigStore struct{}

// All returns an error
func (s *OrganizationConfigStore) All(context.Context) ([]chronograf.OrganizationConfig, error) {
	return nil, chronograf.ErrOrganizationConfigNotFound
}

// FindOrCreate returns an error
func (s *OrganizationConfigStore) FindOrCreate(context.Context, string) (*chronograf.OrganizationConfig, error) {
	return nil, chronograf.ErrOrganizationConfigNotFound
}

// Put returns an error
func (s *OrganizationConfigStore) Put(context.Context, *chronograf.OrganizationConfig) error {
	return fmt.Errorf("cannot replace config")
}
