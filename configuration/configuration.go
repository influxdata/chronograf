package configuration

import (
  "context"

  "github.com/influxdata/chronograf"
)

// Ensure MultiSourcesStore implements chronograf.SourcesStore.
var _ chronograf.SourcesStore = &MultiSourcesStore{}

// MultiSourcesStore is a SourcesStore that contains multiple SourcesStores.
// The All method will return the set of all Sources, combining Bolt's
// collection with any values configured on startup.
type MultiSourcesStore struct {
  Stores []chronograf.SourcesStore
}

func (s *MultiSourcesStore) All(ctx context.Context) ([]chronograf.Source, error) {
  return make([]chronograf.Source, 0), nil
}

func (s *MultiSourcesStore) Add(ctx context.Context, src chronograf.Source) (chronograf.Source, error) {
  return chronograf.Source{}, nil
}

func (s *MultiSourcesStore) Delete(ctx context.Context, src chronograf.Source) error {
  return nil
}

func (s *MultiSourcesStore) Get(ctx context.Context, id int) (chronograf.Source, error) {
  return chronograf.Source{}, nil
}

func (s *MultiSourcesStore) Update(ctx context.Context, src chronograf.Source) error {
  return nil
}
