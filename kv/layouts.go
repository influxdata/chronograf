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
