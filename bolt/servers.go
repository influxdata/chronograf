package bolt

import (
	"context"

	"github.com/boltdb/bolt"
	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/bolt/internal"
)

// Ensure ServersStore implements chronograf.ServersStore.
var _ chronograf.ServersStore = &ServersStore{}

var ServersBucket = []byte("Servers")

type ServersStore struct {
	client *Client
	key    string
}

// All returns all known servers
func (s *ServersStore) All(ctx context.Context) ([]chronograf.Server, error) {
	var srcs []chronograf.Server
	if err := s.client.db.View(func(tx *bolt.Tx) error {
		if err := tx.Bucket(ServersBucket).ForEach(func(k, v []byte) error {
			var src chronograf.Server
			if err := internal.UnmarshalServer(v, &src, s.key); err != nil {
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

// Add creates a new Server in the ServerStore.
func (s *ServersStore) Add(ctx context.Context, src chronograf.Server) (chronograf.Server, error) {
	if err := s.client.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket(ServersBucket)
		seq, err := b.NextSequence()
		if err != nil {
			return err
		}
		src.ID = int(seq)

		if v, err := internal.MarshalServer(src, s.key); err != nil {
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

// Delete removes the Server from the ServersStore
func (s *ServersStore) Delete(ctx context.Context, src chronograf.Server) error {
	if err := s.client.db.Update(func(tx *bolt.Tx) error {
		if err := tx.Bucket(ServersBucket).Delete(itob(src.ID)); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return err
	}

	return nil
}

// Get returns a Server if the id exists.
func (s *ServersStore) Get(ctx context.Context, id int) (chronograf.Server, error) {
	var src chronograf.Server
	if err := s.client.db.View(func(tx *bolt.Tx) error {
		if v := tx.Bucket(ServersBucket).Get(itob(id)); v == nil {
			return chronograf.ErrServerNotFound
		} else if err := internal.UnmarshalServer(v, &src, s.key); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return chronograf.Server{}, err
	}

	return src, nil
}

// Update a Server
func (s *ServersStore) Update(ctx context.Context, src chronograf.Server) error {
	if err := s.client.db.Update(func(tx *bolt.Tx) error {
		// Get an existing server with the same ID.
		b := tx.Bucket(ServersBucket)
		if v := b.Get(itob(src.ID)); v == nil {
			return chronograf.ErrServerNotFound
		}

		if v, err := internal.MarshalServer(src, s.key); err != nil {
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
