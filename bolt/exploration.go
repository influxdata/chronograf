package bolt

import (
	"github.com/boltdb/bolt"
	"github.com/influxdata/mrfusion"
	"github.com/influxdata/mrfusion/bolt/internal"
	"golang.org/x/net/context"
)

// Ensure ExplorationStore implements mrfusion.ExplorationStore.
var _ mrfusion.ExplorationStore = &ExplorationStore{}

var ExplorationBucket = []byte("Explorations")

type ExplorationStore struct {
	client *Client
}

// Search the ExplorationStore for all explorations owned by userID.
func (s *ExplorationStore) Query(ctx context.Context, uid mrfusion.UserID) ([]*mrfusion.Exploration, error) {
	var explorations []*mrfusion.Exploration
	if err := s.client.db.View(func(tx *bolt.Tx) error {
		if err := tx.Bucket(ExplorationBucket).ForEach(func(k, v []byte) error {
			var e mrfusion.Exploration
			if err := internal.UnmarshalExploration(v, &e); err != nil {
				return err
			} else if e.UserID != uid {
				return nil
			}
			explorations = append(explorations, &e)
			return nil
		}); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return nil, err
	}

	return explorations, nil
}

// Create a new Exploration in the ExplorationStore.
func (s *ExplorationStore) Add(ctx context.Context, e *mrfusion.Exploration) (*mrfusion.Exploration, error) {
	if err := s.client.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket(ExplorationBucket)
		seq, err := b.NextSequence()
		if err != nil {
			return err
		}
		e.ID = mrfusion.ExplorationID(seq)
		e.CreatedAt = s.client.Now()

		if v, err := internal.MarshalExploration(e); err != nil {
			return err
		} else if err := b.Put(itob(int(e.ID)), v); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return nil, err
	}

	return e, nil
}

// Delete the exploration from the ExplorationStore
func (s *ExplorationStore) Delete(ctx context.Context, e *mrfusion.Exploration) error {
	if err := s.client.db.Update(func(tx *bolt.Tx) error {
		if err := tx.Bucket(ExplorationBucket).Delete(itob(int(e.ID))); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return err
	}

	return nil
}

// Retrieve an exploration for an id exists.
func (s *ExplorationStore) Get(ctx context.Context, id mrfusion.ExplorationID) (*mrfusion.Exploration, error) {
	var e mrfusion.Exploration
	if err := s.client.db.View(func(tx *bolt.Tx) error {
		if v := tx.Bucket(ExplorationBucket).Get(itob(int(id))); v == nil {
			return mrfusion.ErrExplorationNotFound
		} else if err := internal.UnmarshalExploration(v, &e); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return nil, err
	}

	return &e, nil
}

// Update an exploration; will also update the `UpdatedAt` time.
func (s *ExplorationStore) Update(ctx context.Context, e *mrfusion.Exploration) error {
	if err := s.client.db.Update(func(tx *bolt.Tx) error {
		// Retreive an existing exploration with the same exploration ID.
		var ee mrfusion.Exploration
		b := tx.Bucket(ExplorationBucket)
		if v := b.Get(itob(int(e.ID))); v == nil {
			return mrfusion.ErrExplorationNotFound
		} else if err := internal.UnmarshalExploration(v, &ee); err != nil {
			return err
		}

		ee.Name = e.Name
		ee.UserID = e.UserID
		ee.Data = e.Data
		ee.UpdatedAt = s.client.Now()

		if v, err := internal.MarshalExploration(&ee); err != nil {
			return err
		} else if err := b.Put(itob(int(ee.ID)), v); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return err
	}

	return nil
}
