// todo: is it preferred to keep configStore in bolt so each instance of
// chronograf doesn't overwrite it's config into the bucket/hardcoded id?
package bolt

import (
	"context"
	"fmt"

	"github.com/boltdb/bolt"
	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/kv/internal"
)

// Ensure configStore implements chronograf.ConfigStore.
var _ chronograf.ConfigStore = &configStore{}

// configBucket is used to store chronograf application state
var configBucket = []byte("ConfigV1")

// configID is the boltDB key where the configuration object is stored
var configID = []byte("config/v1")

// configStore uses bolt to store and retrieve global
// application configuration
type configStore struct {
	client *client
}

func (s *configStore) Get(ctx context.Context) (*chronograf.Config, error) {
	var cfg chronograf.Config
	err := s.client.db.View(func(tx *bolt.Tx) error {
		v := tx.Bucket(configBucket).Get(configID)
		if v == nil {
			cfg = chronograf.Config{
				Auth: chronograf.AuthConfig{
					SuperAdminNewUsers: false,
				},
			}
			return nil
		}
		return internal.UnmarshalConfig(v, &cfg)
	})
	return &cfg, err
}

func (s *configStore) Update(ctx context.Context, cfg *chronograf.Config) error {
	if cfg == nil {
		return fmt.Errorf("config provided was nil")
	}
	return s.client.db.Update(func(tx *bolt.Tx) error {
		if v, err := internal.MarshalConfig(cfg); err != nil {
			return err
		} else if err := tx.Bucket(configBucket).Put(configID, v); err != nil {
			return err
		}
		return nil
	})
}
