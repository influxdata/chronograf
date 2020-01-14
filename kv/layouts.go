package kv

import (
	"context"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/kv/internal"
)

// Ensure layoutsStore implements chronograf.LayoutsStore.
var _ chronograf.LayoutsStore = &layoutsStore{}

// layoutsStore is the implementation to store layouts.
type layoutsStore struct {
	client *Service
	IDs    chronograf.ID
}

// All returns all known layouts
func (s *layoutsStore) All(ctx context.Context) ([]chronograf.Layout, error) {
	var srcs []chronograf.Layout
	if err := s.client.kv.View(ctx, func(tx Tx) error {
		if err := tx.Bucket(layoutsBucket).ForEach(func(k, v []byte) error {
			var src chronograf.Layout
			if err := internal.UnmarshalLayout(v, &src); err != nil {
				return err
			}
			srcs = append(srcs, src)
			return nil
		}); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return nil, err
	}

	return srcs, nil

}

// Add creates a new Layout in the layoutsStore.
func (s *layoutsStore) Add(ctx context.Context, src chronograf.Layout) (chronograf.Layout, error) {
	if err := s.client.kv.Update(ctx, func(tx Tx) error {
		b := tx.Bucket(layoutsBucket)
		id, err := s.IDs.Generate()
		if err != nil {
			return err
		}

		src.ID = id
		if v, err := internal.MarshalLayout(src); err != nil {
			return err
		} else if err := b.Put([]byte(src.ID), v); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return chronograf.Layout{}, err
	}

	return src, nil
}

// Delete removes the Layout from the layoutsStore
func (s *layoutsStore) Delete(ctx context.Context, src chronograf.Layout) error {
	_, err := s.Get(ctx, src.ID)
	if err != nil {
		return err
	}
	if err := s.client.kv.Update(ctx, func(tx Tx) error {
		if err := tx.Bucket(layoutsBucket).Delete([]byte(src.ID)); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return err
	}

	return nil
}

// Get returns a Layout if the id exists.
func (s *layoutsStore) Get(ctx context.Context, id string) (chronograf.Layout, error) {
	var src chronograf.Layout
	if err := s.client.kv.View(ctx, func(tx Tx) error {
		if v, err := tx.Bucket(layoutsBucket).Get([]byte(id)); v == nil || err != nil {
			return chronograf.ErrLayoutNotFound
		} else if err := internal.UnmarshalLayout(v, &src); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return chronograf.Layout{}, err
	}

	return src, nil
}

// Update a Layout
func (s *layoutsStore) Update(ctx context.Context, src chronograf.Layout) error {
	if err := s.client.kv.Update(ctx, func(tx Tx) error {
		// Get an existing layout with the same ID.
		b := tx.Bucket(layoutsBucket)
		if v, err := b.Get([]byte(src.ID)); v == nil || err != nil {
			return chronograf.ErrLayoutNotFound
		}

		if v, err := internal.MarshalLayout(src); err != nil {
			return err
		} else if err := b.Put([]byte(src.ID), v); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return err
	}

	return nil
}
