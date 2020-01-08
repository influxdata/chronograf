package kv

import (
	"context"
	"net/url"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/kv/bolt"
	"github.com/influxdata/chronograf/kv/etcd"
)

func NewClient(ctx context.Context, path string, logger chronograf.Logger, buildInfo chronograf.BuildInfo) (chronograf.KVClient, error) {
	u, err := url.Parse(path)
	if err != nil {
		return nil, err
	}

	if u.Scheme == "etcd" {
		return etcd.NewClient(ctx, path, logger)
	}

	return newBolt(ctx, path, logger, buildInfo)
}

func newBolt(ctx context.Context, boltPath string, logger chronograf.Logger, buildInfo chronograf.BuildInfo) (chronograf.KVClient, error) {
	db := bolt.NewClient(boltPath, logger)

	return db, db.Open(ctx, buildInfo)
}
