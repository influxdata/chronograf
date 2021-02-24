package etcd

import (
	"context"
	"fmt"
	"io/ioutil"
	"net/url"
	"os"
	"testing"
	"time"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/kv"
	"github.com/influxdata/chronograf/mocks"
	"github.com/stretchr/testify/require"
	"go.etcd.io/etcd/clientv3"
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

func Test_WithURL(t *testing.T) {
	parse := func(val string) *url.URL {
		url, err := url.Parse(val)
		if err != nil {
			require.NoError(t, err)
		}
		return url
	}

	var tests = []struct {
		url    *url.URL
		config clientv3.Config
		err    string
	}{
		{
			url: parse("etcd://u:p@127.0.0.1:2379"),
			config: clientv3.Config{
				Endpoints: []string{"127.0.0.1:2379"},
				Username:  "u",
				Password:  "p",
			},
		},
		{
			url: parse("etcds://u:p@127.0.0.1:2379"),
			config: clientv3.Config{
				Endpoints: []string{"https://127.0.0.1:2379"},
				Username:  "u",
				Password:  "p",
			},
		},
		{
			url: parse("etcd://u:p@127.0.0.1:2379?ca=a&ca=b"),
			err: "query parameter 'ca' can appear at most once",
		},
		{
			url: parse("etcd://u:p@127.0.0.1:2379?cert=a&key=b&ca=c"),
			err: "no such file or directory",
		},
		{
			url: parse("etcd://a:b@1.2.3.4:5555?ca=test.crt&key=test.key&cert=test.crt"),
			config: clientv3.Config{
				Endpoints: []string{"1.2.3.4:5555"},
				Username:  "a",
				Password:  "b",
			},
		},
	}

	for _, test := range tests {
		t.Run(test.url.String(), func(t *testing.T) {
			c := &client{}
			err := WithURL(test.url)(c)
			if test.err == "" {
				require.NoError(t, err)
				tlsConfig := c.config.TLS
				c.config.TLS = nil
				require.Equal(t, c.config, test.config)
				if test.url.Query().Get("ca") != "" {
					require.NotNil(t, tlsConfig.RootCAs)
				}
				if test.url.Query().Get("cert") != "" {
					require.Equal(t, len(tlsConfig.Certificates), 1)
				}
			} else {
				require.NotNil(t, err)
				// Contains is used, because nested exceptions can evolve with go versions
				require.Contains(t, fmt.Sprintf("%v", err), test.err)
			}
		})
	}
}
