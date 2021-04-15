package kv

import (
	"context"
	"strconv"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/kv/internal"
)

// Ensure mappingsStore implements chronograf.MappingsStore.
var _ chronograf.MappingsStore = &mappingsStore{}

// mappingsStore uses bolt to store and retrieve Mappings
type mappingsStore struct {
	client *Service
}

// Add creates a new Mapping in the mappingsStore
func (s *mappingsStore) Add(ctx context.Context, o *chronograf.Mapping) (*chronograf.Mapping, error) {
	err := s.client.kv.Update(ctx, func(tx Tx) error {
		b := tx.Bucket(mappingsBucket)
		seq, err := b.NextSequence()
		if err != nil {
			return err
		}
		o.ID = strconv.FormatUint(seq, 10)

		v, err := internal.MarshalMapping(o)
		if err != nil {
			return err
		}

		return b.Put([]byte(o.ID), v)
	})

	if err != nil {
		return nil, err
	}

	return o, nil
}

// All returns all known organizations
func (s *mappingsStore) All(ctx context.Context) ([]chronograf.Mapping, error) {
	var mappings []chronograf.Mapping
	err := s.each(ctx, func(m *chronograf.Mapping) {
		mappings = append(mappings, *m)
	})

	if err != nil {
		return nil, err
	}

	return mappings, nil
}

// Delete the organization from mappingsStore
func (s *mappingsStore) Delete(ctx context.Context, o *chronograf.Mapping) error {
	_, err := s.get(ctx, o.ID)
	if err != nil {
		return err
	}
	if err := s.client.kv.Update(ctx, func(tx Tx) error {
		return tx.Bucket(mappingsBucket).Delete([]byte(o.ID))
	}); err != nil {
		return err
	}
	return nil
}

func (s *mappingsStore) get(ctx context.Context, id string) (*chronograf.Mapping, error) {
	var o chronograf.Mapping
	err := s.client.kv.View(ctx, func(tx Tx) error {
		v, err := tx.Bucket(mappingsBucket).Get([]byte(id))
		if v == nil || err != nil {
			return chronograf.ErrMappingNotFound
		}
		return internal.UnmarshalMapping(v, &o)
	})

	if err != nil {
		return nil, err
	}

	return &o, nil
}

func (s *mappingsStore) each(ctx context.Context, fn func(*chronograf.Mapping)) error {
	return s.client.kv.View(ctx, func(tx Tx) error {
		return tx.Bucket(mappingsBucket).ForEach(func(k, v []byte) error {
			var m chronograf.Mapping
			if err := internal.UnmarshalMapping(v, &m); err != nil {
				return err
			}
			fn(&m)
			return nil
		})
	})
}

// Get returns a Mapping if the id exists.
func (s *mappingsStore) Get(ctx context.Context, id string) (*chronograf.Mapping, error) {
	return s.get(ctx, id)
}

// Update the organization in mappingsStore
func (s *mappingsStore) Update(ctx context.Context, o *chronograf.Mapping) error {
	return s.client.kv.Update(ctx, func(tx Tx) error {
		if v, err := internal.MarshalMapping(o); err != nil {
			return err
		} else if err := tx.Bucket(mappingsBucket).Put([]byte(o.ID), v); err != nil {
			return err
		}
		return nil
	})
}
