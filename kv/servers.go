package kv

import (
	"context"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/kv/internal"
)

// Ensure serversStore implements chronograf.ServersStore.
var _ chronograf.ServersStore = &serversStore{}

// serversStore is the implementation to store servers in a store.
// Used store servers that are associated in some way with a source
type serversStore struct {
	client *Service
}

// All returns all known servers
func (s *serversStore) All(ctx context.Context) ([]chronograf.Server, error) {
	var srcs []chronograf.Server
	if err := s.client.kv.View(ctx, func(tx Tx) error {
		var err error
		srcs, err = allServers(ctx, tx)
		if err != nil {
			return err
		}
		return nil
	}); err != nil {
		return nil, err
	}

	return srcs, nil
}

func allServers(ctx context.Context, tx Tx) ([]chronograf.Server, error) {
	var srcs []chronograf.Server
	if err := tx.Bucket(serversBucket).ForEach(func(k, v []byte) error {
		var src chronograf.Server
		if err := internal.UnmarshalServer(v, &src); err != nil {
			return err
		}
		srcs = append(srcs, src)
		return nil
	}); err != nil {
		return srcs, err
	}
	return srcs, nil
}

// Add creates a new Server in the ServerStore.
func (s *serversStore) Add(ctx context.Context, src chronograf.Server) (chronograf.Server, error) {
	if err := s.client.kv.Update(ctx, func(tx Tx) error {
		b := tx.Bucket(serversBucket)
		seq, err := b.NextSequence()
		if err != nil {
			return err
		}
		src.ID = int(seq)

		if v, err := internal.MarshalServer(src); err != nil {
			return err
		} else if err := b.Put(itob(src.ID), v); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return chronograf.Server{}, err
	}

	return src, nil
}

// Delete removes the Server from the serversStore
func (s *serversStore) Delete(ctx context.Context, src chronograf.Server) error {
	if err := s.client.kv.Update(ctx, func(tx Tx) error {
		if err := tx.Bucket(serversBucket).Delete(itob(src.ID)); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return err
	}

	return nil
}

// Get returns a Server if the id exists.
func (s *serversStore) Get(ctx context.Context, id int) (chronograf.Server, error) {
	var src chronograf.Server
	if err := s.client.kv.View(ctx, func(tx Tx) error {
		if v, err := tx.Bucket(serversBucket).Get(itob(id)); v == nil || err != nil {
			return chronograf.ErrServerNotFound
		} else if err := internal.UnmarshalServer(v, &src); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return chronograf.Server{}, err
	}

	return src, nil
}

// Update a Server
func (s *serversStore) Update(ctx context.Context, src chronograf.Server) error {
	if err := s.client.kv.Update(ctx, func(tx Tx) error {
		// Get an existing server with the same ID.
		b := tx.Bucket(serversBucket)
		if v, err := b.Get(itob(src.ID)); v == nil || err != nil {
			return chronograf.ErrServerNotFound
		}

		if v, err := internal.MarshalServer(src); err != nil {
			return err
		} else if err := b.Put(itob(src.ID), v); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return err
	}

	return nil
}
