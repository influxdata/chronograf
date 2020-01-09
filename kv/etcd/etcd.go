// Package etcd provides a means to store chronograf related data in an etcd cluster.
package etcd

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/coreos/etcd/clientv3"
	conc "github.com/coreos/etcd/clientv3/concurrency"
	"github.com/influxdata/chronograf"
	platform "github.com/influxdata/chronograf/v2"
	"github.com/sony/gobreaker"
)

var _ chronograf.KVClient = (*Client)(nil)

// Client is a client for the etcd data store.
//
// todo: unexport this struct, merge with other one.
type Client struct {
	buildStore              chronograf.BuildStore
	sourcesStore            chronograf.SourcesStore
	serversStore            chronograf.ServersStore
	layoutsStore            chronograf.LayoutsStore
	dashboardsStore         chronograf.DashboardsStore
	usersStore              chronograf.UsersStore
	organizationsStore      chronograf.OrganizationsStore
	configStore             chronograf.ConfigStore
	mappingsStore           chronograf.MappingsStore
	organizationConfigStore chronograf.OrganizationConfigStore
}

// NewClient initializes all stores
func NewClient(ctx context.Context, path string, logger chronograf.Logger) (*Client, error) {
	return &Client{}, nil
}

// BuildStore returns a BuildStore that uses the bolt client.
func (c *Client) BuildStore() chronograf.BuildStore {
	return c.buildStore
}

// SourcesStore returns a SourcesStore that uses the bolt client.
func (c *Client) SourcesStore() chronograf.SourcesStore {
	return c.sourcesStore
}

// ServersStore returns a ServersStore that uses the bolt client.
func (c *Client) ServersStore() chronograf.ServersStore {
	return c.serversStore
}

// LayoutsStore returns a LayoutsStore that uses the bolt client.
func (c *Client) LayoutsStore() chronograf.LayoutsStore {
	return c.layoutsStore
}

// DashboardsStore returns a DashboardsStore that uses the bolt client.
func (c *Client) DashboardsStore() chronograf.DashboardsStore {
	return c.dashboardsStore
}

// UsersStore returns a UsersStore that uses the bolt client.
func (c *Client) UsersStore() chronograf.UsersStore {
	return c.usersStore
}

// OrganizationsStore returns a OrganizationsStore that uses the bolt client.
func (c *Client) OrganizationsStore() chronograf.OrganizationsStore {
	return c.organizationsStore
}

// ConfigStore returns a ConfigStore that uses the bolt client.
func (c *Client) ConfigStore() chronograf.ConfigStore {
	return c.configStore
}

// MappingsStore returns a MappingsStore that uses the bolt client.
func (c *Client) MappingsStore() chronograf.MappingsStore {
	return c.mappingsStore
}

// OrganizationConfigStore returns a OrganizationConfigStore that uses the bolt client.
func (c *Client) OrganizationConfigStore() chronograf.OrganizationConfigStore {
	return c.organizationConfigStore
}

// FindCellByID returns a single cell by ID.
func (c *Client) FindCellByID(ctx context.Context, id platform.ID) (*platform.Cell, error) {
	return nil, nil
}

// FindCells returns a list of cells that match filter and the total count of matching cells.
// Additional options provide pagination & sorting.
func (c *Client) FindCells(ctx context.Context, filter platform.CellFilter) ([]*platform.Cell, int, error) {
	return nil, 0, nil
}

// CreateCell creates a new cell and sets b.ID with the new identifier.
func (c *Client) CreateCell(ctx context.Context, b *platform.Cell) error {
	return nil
}

// UpdateCell updates a single cell with changeset.
// Returns the new cell state after update.
func (c *Client) UpdateCell(ctx context.Context, id platform.ID, upd platform.CellUpdate) (*platform.Cell, error) {
	return nil, nil
}

// DeleteCell removes a cell by ID.
func (c *Client) DeleteCell(ctx context.Context, id platform.ID) error {
	return nil
}

// FindDashboardByID returns a single dashboard by ID.
func (c *Client) FindDashboardByID(ctx context.Context, id platform.ID) (*platform.Dashboard, error) {
	return nil, nil
}

// FindDashboards returns a list of dashboards that match filter and the total count of matching dashboards.
// Additional options provide pagination & sorting.
func (c *Client) FindDashboards(ctx context.Context, filter platform.DashboardFilter) ([]*platform.Dashboard, int, error) {
	return nil, 0, nil
}

// CreateDashboard creates a new dashboard and sets b.ID with the new identifier.
func (c *Client) CreateDashboard(ctx context.Context, b *platform.Dashboard) error {
	return nil
}

// UpdateDashboard updates a single dashboard with changeset.
// Returns the new dashboard state after update.
func (c *Client) UpdateDashboard(ctx context.Context, id platform.ID, upd platform.DashboardUpdate) (*platform.Dashboard, error) {
	return nil, nil
}

// DeleteDashboard removes a dashboard by ID.
func (c *Client) DeleteDashboard(ctx context.Context, id platform.ID) error {
	return nil
}

const (
	// OpPrefix is op prefix for etcd.
	OpPrefix = "etcd/"

	// DefaultDialTimeout is the default dial timeout for the etc client.
	DefaultDialTimeout = 5 * time.Second

	// DefaultRequestTimeout is the default request timeout for the etc client.
	DefaultRequestTimeout = 5 * time.Second

	// DefaultCacheTimeout is the default timeout for a health check when waiting for a response from the cache.
	DefaultCacheTimeout = 2 * time.Second
)

// Config is used to configure etcd *clientv3.Clients.
type Config struct {
	Hosts          []string
	DialTimeout    time.Duration
	RequestTimeout time.Duration
}

func newEtcdClient(c Config, l chronograf.Logger) *client {
	if c.RequestTimeout == 0 {
		c.RequestTimeout = DefaultRequestTimeout
	}

	if c.DialTimeout == 0 {
		c.DialTimeout = DefaultDialTimeout
	}

	return &client{
		config: c,
		logger: l,
		breaker: gobreaker.NewCircuitBreaker(gobreaker.Settings{
			Name:    "etcd",
			Timeout: time.Minute,
			ReadyToTrip: func(counts gobreaker.Counts) bool {
				return counts.ConsecutiveFailures > 5
			},
		}),
	}
}

// client wraps the etcd client with circuit breaker
type client struct {
	config Config

	breaker *gobreaker.CircuitBreaker
	logger  chronograf.Logger
	client  *clientv3.Client
}

// Open opens the connection to the etcd server. If client.client is non nil
// open is a no-op.
func (c *client) Open() error {
	if c.client != nil {
		return nil
	}

	conn, err := connect(c.config.Hosts, WithDialTimeout(c.config.DialTimeout))
	if err != nil {
		return err
	}
	c.client = conn

	return nil
}

func connect(hosts []string, options ...ConnectionOption) (*clientv3.Client, error) {
	config := clientv3.Config{
		Endpoints:   hosts,
		DialTimeout: DefaultDialTimeout,
	}

	for _, option := range options {
		option(&config)
	}

	return clientv3.New(config)
}

// ConnectionOption provides optional configuration changes for the etcd client.
type ConnectionOption func(*clientv3.Config) error

// WithDialTimeout sets a dial timeout on the etcd client upon connection.
var WithDialTimeout = func(d time.Duration) ConnectionOption {
	return func(c *clientv3.Config) error {
		if d < 0 {
			return fmt.Errorf("invalid etcd dial timeout: %d", d)
		}

		c.DialTimeout = d
		return nil
	}
}

// Apply execute the operations defined by the callback transactionally.
//
// Operations, intended as a set of reads and writes provided by the callback STM parameter, will occur atomically.
// It ensurs the consistency of the data on which it operates.
// Finaly, it forwards the errors returned from the callback.
func (c *client) Apply(ctx context.Context, callback func(stm conc.STM) error) (err error) {
	_, err = conc.NewSTM(c.client, func(cstm conc.STM) error {
		return c.recoverCallback(callback, cstm)
	}, conc.WithAbortContext(ctx))
	return err
}

func (c *client) recoverCallback(callback func(stm conc.STM) error, cstm conc.STM) (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = errors.New("unknown internal transaction error")
			c.logger.Error("panic while in STM")
		}
	}()
	err = callback(cstm)
	return err
}

func (c *client) Get(ctx context.Context, key string, opts ...clientv3.OpOption) (*clientv3.GetResponse, error) {
	resp, err := c.breaker.Execute(func() (interface{}, error) {
		ctx, cancel := context.WithTimeout(ctx, c.config.RequestTimeout)
		defer cancel()
		return c.client.Get(ctx, key, opts...)
	})
	return resp.(*clientv3.GetResponse), err
}

func (c *client) Put(ctx context.Context, key, val string, opts ...clientv3.OpOption) (*clientv3.PutResponse, error) {
	resp, err := c.breaker.Execute(func() (interface{}, error) {
		ctx, cancel := context.WithTimeout(ctx, c.config.RequestTimeout)
		defer cancel()
		return c.client.Put(ctx, key, val, opts...)
	})
	return resp.(*clientv3.PutResponse), err
}

func (c *client) Delete(ctx context.Context, key string, opts ...clientv3.OpOption) (*clientv3.DeleteResponse, error) {
	resp, err := c.breaker.Execute(func() (interface{}, error) {
		ctx, cancel := context.WithTimeout(ctx, c.config.RequestTimeout)
		defer cancel()
		return c.client.Delete(ctx, key, opts...)
	})
	return resp.(*clientv3.DeleteResponse), err
}

func (c *client) Watch(ctx context.Context, key string, opts ...clientv3.OpOption) (ch clientv3.WatchChan) {
	return c.client.Watch(ctx, key, opts...)
}

func (c *client) Grant(ctx context.Context, ttl int64) (*clientv3.LeaseGrantResponse, error) {
	resp, err := c.breaker.Execute(func() (interface{}, error) {
		ctx, cancel := context.WithTimeout(ctx, c.config.RequestTimeout)
		defer cancel()
		return c.client.Grant(ctx, ttl)
	})
	return resp.(*clientv3.LeaseGrantResponse), err
}

func (c *client) Revoke(ctx context.Context, lease clientv3.LeaseID) (*clientv3.LeaseRevokeResponse, error) {
	resp, err := c.breaker.Execute(func() (interface{}, error) {
		ctx, cancel := context.WithTimeout(ctx, c.config.RequestTimeout)
		defer cancel()
		return c.client.Revoke(ctx, lease)
	})
	return resp.(*clientv3.LeaseRevokeResponse), err
}

// KeepAliveOnce sets the new expiration time for a lease to its original length.
func (c *client) KeepAliveOnce(ctx context.Context, lease clientv3.LeaseID) (*clientv3.LeaseKeepAliveResponse, error) {
	resp, err := c.breaker.Execute(func() (interface{}, error) {
		ctx, cancel := context.WithTimeout(ctx, c.config.RequestTimeout)
		defer cancel()
		return c.client.KeepAliveOnce(ctx, lease)
	})
	return resp.(*clientv3.LeaseKeepAliveResponse), err
}

func (c *client) Close() error {
	// etcd client _always_ returns an error, we won't
	c.client.Close()
	return nil
}

// func (c *client) Txn(ctx context.Context) clientv3.Txn {
// 	txn := &txnBreaker{
// 		client: c,
// 		ctx:    ctx,
// 	}
// 	return txn
// }

// // txnBreaker implements clientv3.Txn while using a circuit breaker
// type txnBreaker struct {
// 	client *client
// 	ctx    context.Context

// 	ifs   []clientv3.Cmp
// 	thens []clientv3.Op
// 	elses []clientv3.Op
// }

// func (t *txnBreaker) If(cs ...clientv3.Cmp) clientv3.Txn {
// 	t.ifs = cs
// 	return t
// }

// func (t *txnBreaker) Then(ops ...clientv3.Op) clientv3.Txn {
// 	t.thens = ops
// 	return t
// }

// func (t *txnBreaker) Else(ops ...clientv3.Op) clientv3.Txn {
// 	t.elses = ops
// 	return t
// }

// func (t *txnBreaker) Commit() (*clientv3.TxnResponse, error) {
// 	resp, err := t.client.breaker.Execute(func() (interface{}, error) {
// 		ctx, cancel := context.WithTimeout(t.ctx, t.client.config.RequestTimeout)
// 		defer cancel()
// 		txn := t.client.client.Txn(ctx)
// 		resp, err := txn.
// 			If(t.ifs...).
// 			Then(t.thens...).
// 			Else(t.elses...).
// 			Commit()
// 		return resp, err
// 	})
// 	return resp, err
// }
