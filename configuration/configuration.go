package configuration

import (
	"context"

	"github.com/influxdata/chronograf"
)

// MultiSourcesStore delegates to the SourcesStores that compose it
type MultiSourcesStore struct {
	Stores []chronograf.SourcesStore
}

// Add does not have any effect
func (store *MultiSourcesStore) Add(ctx context.Context, src chronograf.Source) (chronograf.Source, error) {
	return chronograf.Source{}, nil
}

// All concatenates the Sources of all contained Stores
func (store *MultiSourcesStore) All(ctx context.Context) ([]chronograf.Source, error) {
	return []chronograf.Source{}, nil
}

// Delete does not have any effect
func (store *MultiSourcesStore) Delete(ctx context.Context, src chronograf.Source) error {
	return nil
}

// Get finds the Source by id among all contained Stores
func (store *MultiSourcesStore) Get(ctx context.Context, id int) (chronograf.Source, error) {
	return chronograf.Source{}, nil
}

// Update does not have any effect
func (store *MultiSourcesStore) Update(ctx context.Context, src chronograf.Source) error {
	return nil
}

// SourcesStore implements the chronograf.SourcesStore interface
type SourcesStore struct {
	Source chronograf.Source
}

// Add does not have any effect
func (store *SourcesStore) Add(ctx context.Context, src chronograf.Source) (chronograf.Source, error) {
	return chronograf.Source{}, nil
}

// All will return a slice containing a configured source
func (store *SourcesStore) All(ctx context.Context) ([]chronograf.Source, error) {
	return []chronograf.Source{chronograf.Source{}}, nil
}

// Delete does nothing
func (store *SourcesStore) Delete(ctx context.Context, src chronograf.Source) error {
	return nil
}

// Get returns the configured source
func (store *SourcesStore) Get(ctx context.Context, id int) (chronograf.Source, error) {
	return chronograf.Source{}, nil
}

// Update does nothing
func (store *SourcesStore) Update(ctx context.Context, src chronograf.Source) error {
	return nil
}
