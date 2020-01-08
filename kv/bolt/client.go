package bolt

import (
	"context"
	"fmt"
	"io"
	"os"
	"path"
	"time"

	"github.com/boltdb/bolt"
	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/id"
)

const (
	// ErrUnableToOpen means we had an issue establishing a connection (or creating the database)
	ErrUnableToOpen = "Unable to open boltdb; is there a chronograf already running?  %v"
	// ErrUnableToBackup means we couldn't copy the db file into ./backup
	ErrUnableToBackup = "Unable to backup your database prior to migrations:  %v"
	// ErrUnableToInitialize means we couldn't create missing Buckets (maybe a timeout)
	ErrUnableToInitialize = "Unable to boot boltdb:  %v"
	// ErrUnableToMigrate means we had an issue changing the db schema
	ErrUnableToMigrate = "Unable to migrate boltdb:  %v"
)

var _ chronograf.KVClient = (*Client)(nil)

// Client is a client for the boltDB data store.
type Client struct {
	path   string
	db     *bolt.DB
	logger chronograf.Logger
	isNew  bool
	Now    func() time.Time

	buildStore              *BuildStore
	sourcesStore            *SourcesStore
	serversStore            *ServersStore
	layoutsStore            *LayoutsStore
	dashboardsStore         *DashboardsStore
	usersStore              *UsersStore
	organizationsStore      *OrganizationsStore
	configStore             *ConfigStore
	mappingsStore           *MappingsStore
	organizationConfigStore *OrganizationConfigStore
}

// NewClient initializes all stores
func NewClient(path string, logger chronograf.Logger) *Client {
	c := &Client{
		logger: logger,
		path:   path,
		Now:    time.Now,
	}

	c.buildStore = &BuildStore{client: c}
	c.sourcesStore = &SourcesStore{client: c}
	c.serversStore = &ServersStore{client: c}
	c.layoutsStore = &LayoutsStore{client: c, IDs: &id.UUID{}}
	c.dashboardsStore = &DashboardsStore{client: c, IDs: &id.UUID{}}
	c.usersStore = &UsersStore{client: c}
	c.organizationsStore = &OrganizationsStore{client: c}
	c.configStore = &ConfigStore{client: c}
	c.mappingsStore = &MappingsStore{client: c}
	c.organizationConfigStore = &OrganizationConfigStore{client: c}

	return c
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

// Option to change behavior of Open()
type Option interface {
	Backup() bool
}

// Backup tells Open to perform a backup prior to initialization
type Backup struct{}

// Backup returns true
func (b Backup) Backup() bool {
	return true
}

// Open / create boltDB file.
func (c *Client) Open(ctx context.Context, build chronograf.BuildInfo, opts ...Option) error {
	if _, err := os.Stat(c.path); os.IsNotExist(err) {
		c.isNew = true
	} else if err != nil {
		return err
	}

	// Open database file.
	db, err := bolt.Open(c.path, 0600, &bolt.Options{Timeout: 1 * time.Second})
	if err != nil {
		return fmt.Errorf(ErrUnableToOpen, err)
	}
	c.db = db

	for _, opt := range opts {
		if opt.Backup() {
			if err = c.backup(ctx, build); err != nil {
				return fmt.Errorf(ErrUnableToBackup, err)
			}
		}
	}

	if err = c.initialize(ctx); err != nil {
		return fmt.Errorf(ErrUnableToInitialize, err)
	}
	if err = c.migrate(ctx, build); err != nil {
		return fmt.Errorf(ErrUnableToMigrate, err)
	}

	return nil
}

// initialize creates Buckets that are missing
func (c *Client) initialize(ctx context.Context) error {
	if err := c.db.Update(func(tx *bolt.Tx) error {
		// Always create SchemaVersions bucket.
		if _, err := tx.CreateBucketIfNotExists(SchemaVersionBucket); err != nil {
			return err
		}
		// Always create Organizations bucket.
		if _, err := tx.CreateBucketIfNotExists(OrganizationsBucket); err != nil {
			return err
		}
		// Always create Sources bucket.
		if _, err := tx.CreateBucketIfNotExists(SourcesBucket); err != nil {
			return err
		}
		// Always create Servers bucket.
		if _, err := tx.CreateBucketIfNotExists(ServersBucket); err != nil {
			return err
		}
		// Always create Layouts bucket.
		if _, err := tx.CreateBucketIfNotExists(LayoutsBucket); err != nil {
			return err
		}
		// Always create Dashboards bucket.
		if _, err := tx.CreateBucketIfNotExists(DashboardsBucket); err != nil {
			return err
		}
		// Always create Users bucket.
		if _, err := tx.CreateBucketIfNotExists(UsersBucket); err != nil {
			return err
		}
		// Always create Config bucket.
		if _, err := tx.CreateBucketIfNotExists(ConfigBucket); err != nil {
			return err
		}
		// Always create Build bucket.
		if _, err := tx.CreateBucketIfNotExists(BuildBucket); err != nil {
			return err
		}
		// Always create Mapping bucket.
		if _, err := tx.CreateBucketIfNotExists(MappingsBucket); err != nil {
			return err
		}
		// Always create OrganizationConfig bucket.
		if _, err := tx.CreateBucketIfNotExists(OrganizationConfigBucket); err != nil {
			return err
		}
		// Always create Cells bucket.
		if err := c.initializeCells(ctx, tx); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return err
	}

	return nil
}

// migrate moves data from an old schema to a new schema in each Store
func (c *Client) migrate(ctx context.Context, build chronograf.BuildInfo) error {
	if c.db != nil {
		// Runtime migrations
		if err := c.organizationsStore.Migrate(ctx); err != nil {
			return err
		}
		if err := c.sourcesStore.Migrate(ctx); err != nil {
			return err
		}
		if err := c.serversStore.Migrate(ctx); err != nil {
			return err
		}
		if err := c.layoutsStore.Migrate(ctx); err != nil {
			return err
		}
		if err := c.dashboardsStore.Migrate(ctx); err != nil {
			return err
		}
		if err := c.configStore.Migrate(ctx); err != nil {
			return err
		}
		if err := c.buildStore.Migrate(ctx, build); err != nil {
			return err
		}
		if err := c.mappingsStore.Migrate(ctx); err != nil {
			return err
		}
		if err := c.organizationConfigStore.Migrate(ctx); err != nil {
			return err
		}

		MigrateAll(c)
	}
	return nil
}

// Close the connection to the bolt database
func (c *Client) Close() error {
	if c.db != nil {
		return c.db.Close()
	}
	return nil
}

// copy creates a copy of the database in toFile
func (c *Client) copy(ctx context.Context, version string) error {
	backupDir := path.Join(path.Dir(c.path), "backup")
	if _, err := os.Stat(backupDir); os.IsNotExist(err) {
		if err = os.Mkdir(backupDir, 0700); err != nil {
			return err
		}
	} else if err != nil {
		return err
	}

	fromFile, err := os.Open(c.path)
	if err != nil {
		return err
	}
	defer fromFile.Close()

	toName := fmt.Sprintf("%s.%s", path.Base(c.path), version)
	toPath := path.Join(backupDir, toName)
	toFile, err := os.OpenFile(toPath, os.O_RDWR|os.O_CREATE, 0600)
	if err != nil {
		return err
	}
	defer toFile.Close()

	_, err = io.Copy(toFile, fromFile)
	if err != nil {
		return err
	}

	c.logger.Info("Successfully created ", toPath)

	return nil
}

// backup makes a copy of the database to the backup/ directory, if necessary:
// - If this is a fresh install, don't create a backup and store the current version
// - If we are on the same version, don't create a backup
// - If the version has changed, create a backup and store the current version
func (c *Client) backup(ctx context.Context, build chronograf.BuildInfo) error {
	lastBuild, err := c.buildStore.Get(ctx)
	if err != nil {
		return err
	}
	if lastBuild.Version == build.Version {
		return nil
	}
	if c.isNew {
		return nil
	}

	// The database was pre-existing, and the version has changed
	// and so create a backup

	c.logger.Info("Moving from version ", lastBuild.Version)
	c.logger.Info("Moving to version ", build.Version)

	return c.copy(ctx, lastBuild.Version)
}

func bucket(b []byte, org string) []byte {
	return []byte(path.Join(string(b), org))
}
