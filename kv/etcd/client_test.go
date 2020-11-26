package etcd

import (
	"context"
	"io/ioutil"
	"os"
	"testing"
	"time"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/kv"
	"github.com/influxdata/chronograf/mocks"
	"github.com/stretchr/testify/require"
	"go.etcd.io/etcd/embed"
)

func TestNewClient(t *testing.T) {
	_, err := NewClient(context.TODO(),
		WithEndpoints([]string{"localhost:2"}),
		WithDialTimeout(time.Second*5),
		WithRequestTimeout(time.Second*5),
		WithLogger(mocks.NewLogger()),
		WithLogin("user", "pass"),
	)
	require.Error(t, err)
}

func NewService(t *testing.T) (chronograf.KVClient, func()) {
	dir, err := ioutil.TempDir("", "etcd.test")
	require.NoError(t, err)

	cfg := embed.NewConfig()
	cfg.Dir = dir

	e, err := embed.StartEtcd(cfg)
	require.NoError(t, err)
	select {
	case <-e.Server.ReadyNotify():
		break
	case <-time.After(20 * time.Second):
		t.Fatal("etcd took too long to start")
	}

	endpoints := []string{}
	for i := range cfg.LPUrls {
		endpoints = append(endpoints, cfg.LPUrls[i].String())
	}

	c, err := NewClient(context.TODO(), WithEndpoints(endpoints))
	require.NoError(t, err)

	s, err := kv.NewService(context.TODO(), c)
	require.NoError(t, err)

	return s, func() {
		e.Close()
		os.RemoveAll(cfg.Dir)
		c.Close()
	}
}

func TestEtcd(t *testing.T) {
	s, closeFn := NewService(t)
	defer closeFn()

	ctx := context.TODO()

	src, err := s.SourcesStore().Add(ctx, chronograf.Source{
		Name: "test",
		URL:  "localhost:8086",
	})
	require.NoError(t, err)
	require.Equal(t, "test", src.Name)

	srcs, err := s.SourcesStore().All(ctx)
	require.NoError(t, err)
	require.Equal(t, 1, len(srcs))
	require.Equal(t, "test", srcs[0].Name)

	require.NoError(t, s.SourcesStore().Delete(ctx, src))
}
