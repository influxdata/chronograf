// Package etcd provides a means to store chronograf related data in an etcd cluster.
package etcd

import (
	"context"

	"github.com/influxdata/chronograf"
	platform "github.com/influxdata/chronograf/v2"
)

var _ chronograf.KVClient = (*Client)(nil)

// Client is a client for the etcd data store.
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
