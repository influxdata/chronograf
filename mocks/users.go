package mocks

import (
	"context"

	"github.com/influxdata/chronograf"
)

var _ chronograf.UsersStore = &UsersStore{}

// UsersStore mock allows all functions to be set for testing
type UsersStore struct {
	AllF    func(context.Context) ([]chronograf.User, error)
	AddF    func(context.Context, *chronograf.User) (*chronograf.User, error)
	DeleteF func(ctx context.Context, ID string) error
	GetF    func(ctx context.Context, ID string) (*chronograf.User, error)
	UpdateF func(context.Context, *chronograf.User) error
}

// All lists all users from the UsersStore
func (s *UsersStore) All(ctx context.Context) ([]chronograf.User, error) {
	return s.AllF(ctx)
}

// Add a new User in the UsersStore
func (s *UsersStore) Add(ctx context.Context, u *chronograf.User) (*chronograf.User, error) {
	return s.AddF(ctx, u)
}

// Delete the User from the UsersStore
func (s *UsersStore) Delete(ctx context.Context, ID string) error {
	return s.DeleteF(ctx, ID)
}

// Get retrieves a user if ID exists.
func (s *UsersStore) Get(ctx context.Context, ID string) (*chronograf.User, error) {
	return s.GetF(ctx, ID)
}

// Update the user's permissions or roles
func (s *UsersStore) Update(ctx context.Context, u *chronograf.User) error {
	return s.UpdateF(ctx, u)
}
