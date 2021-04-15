package kv

import (
	"context"
	"fmt"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/kv/internal"
)

// Ensure configStore implements chronograf.ConfigStore.
var _ chronograf.ConfigStore = &configStore{}

// configID is the boltDB key where the configuration object is stored
var configID = []byte("config/v1")

// configStore uses bolt to store and retrieve global
// application configuration
type configStore struct {
	client *Service
}

func (s *configStore) Get(ctx context.Context) (*chronograf.Config, error) {
	var cfg chronograf.Config
	err := s.client.kv.View(ctx, func(tx Tx) error {
		v, err := tx.Bucket(configBucket).Get(configID)
		if v == nil || err != nil {
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
	return s.client.kv.Update(ctx, func(tx Tx) error {
		if v, err := internal.MarshalConfig(cfg); err != nil {
			return err
		} else if err := tx.Bucket(configBucket).Put(configID, v); err != nil {
			return err
		}
		return nil
	})
}
