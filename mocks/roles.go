package mocks

import (
	"context"

	"github.com/influxdata/chronograf"
)

var _ chronograf.RolesStore = &RolesStore{}

// RolesStore mock allows all functions to be set for testing
type RolesStore struct {
	AllF    func(context.Context) ([]chronograf.DBRole, error)
	AddF    func(context.Context, *chronograf.DBRole) (*chronograf.DBRole, error)
	DeleteF func(context.Context, *chronograf.DBRole) error
	GetF    func(ctx context.Context, name string) (*chronograf.DBRole, error)
	UpdateF func(context.Context, *chronograf.DBRole) error
}

// All lists all Roles from the RolesStore
func (s *RolesStore) All(ctx context.Context) ([]chronograf.DBRole, error) {
	return s.AllF(ctx)
}

// Add a new Role in the RolesStore
func (s *RolesStore) Add(ctx context.Context, u *chronograf.DBRole) (*chronograf.DBRole, error) {
	return s.AddF(ctx, u)
}

// Delete the Role from the RolesStore
func (s *RolesStore) Delete(ctx context.Context, u *chronograf.DBRole) error {
	return s.DeleteF(ctx, u)
}

// Get retrieves a Role if name exists.
func (s *RolesStore) Get(ctx context.Context, name string) (*chronograf.DBRole, error) {
	return s.GetF(ctx, name)
}

// Update the Role's permissions or users
func (s *RolesStore) Update(ctx context.Context, u *chronograf.DBRole) error {
	return s.UpdateF(ctx, u)
}
