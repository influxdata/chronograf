package bolt

import (
	"context"

	"github.com/boltdb/bolt"
	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/kv/internal"
)

// Ensure buildStore struct implements chronograf.BuildStore interface.
var _ chronograf.BuildStore = &buildStore{}

// buildBucket is the bolt bucket used to store Chronograf build information
var buildBucket = []byte("Build")

// buildKey is the constant key used in the bolt bucket
var buildKey = []byte("build")

// buildStore is a bolt implementation to store Chronograf build information
type buildStore struct {
	client *client
}

// Get retrieves Chronograf build information from the database
func (s *buildStore) Get(ctx context.Context) (chronograf.BuildInfo, error) {
	var build chronograf.BuildInfo
	if err := s.client.db.View(func(tx *bolt.Tx) error {
		var err error
		build, err = getBuildInfo(ctx, tx)
		if err != nil {
			return err
		}
		return nil
	}); err != nil {
		return chronograf.BuildInfo{}, err
	}

	return build, nil
}

// getBuildInfo retrieves the current build, falling back to a default when missing
func getBuildInfo(ctx context.Context, tx *bolt.Tx) (chronograf.BuildInfo, error) {
	var build chronograf.BuildInfo
	defaultBuild := chronograf.BuildInfo{
		Version: "1.8.0",
		Commit:  "",
	}

	if bucket := tx.Bucket(buildBucket); bucket == nil {
		return defaultBuild, nil
	} else if v := bucket.Get(buildKey); v == nil {
		return defaultBuild, nil
	} else if err := internal.UnmarshalBuild(v, &build); err != nil {
		return build, err
	}

	return build, nil
}

// Update overwrites the current Chronograf build information in the database
func (s *buildStore) Update(ctx context.Context, build chronograf.BuildInfo) error {
	if err := s.client.db.Update(func(tx *bolt.Tx) error {
		return updateBuildInfo(ctx, build, tx)
	}); err != nil {
		return err
	}

	return nil
}

func updateBuildInfo(ctx context.Context, build chronograf.BuildInfo, tx *bolt.Tx) error {
	if v, err := internal.MarshalBuild(build); err != nil {
		return err
	} else if err := tx.Bucket(buildBucket).Put(buildKey, v); err != nil {
		return err
	}
	return nil
}
