// Package etcd provides a means to store chronograf related data in an etcd cluster.
package etcd

import (
	"context"
	"fmt"
	"time"

	"github.com/coreos/etcd/clientv3"
	"github.com/influxdata/chronograf"
	platform "github.com/influxdata/chronograf/v2"
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

	etcd *clientv3.Client
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
	}
}

// client wraps the etcd client with circuit breaker
type client struct {
	config Config
	logger chronograf.Logger
	client *clientv3.Client
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
