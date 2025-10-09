package server

import (
	"fmt"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/canned"
	"github.com/influxdata/chronograf/filestore"
	"github.com/influxdata/chronograf/memdb"
	"github.com/influxdata/chronograf/multistore"
	"github.com/influxdata/chronograf/protoboards"
)

// LayoutBuilder is responsible for building Layouts
type LayoutBuilder interface {
	Build() (*multistore.Layouts, error)
}

// MultiLayoutBuilder implements LayoutBuilder and will return a Layouts
type MultiLayoutBuilder struct {
	Logger     chronograf.Logger
	UUID       chronograf.ID
	CannedPath string
}

// Build will construct a Layouts of canned personalized layouts.
func (builder *MultiLayoutBuilder) Build() (*multistore.Layouts, error) {
	// These apps are those handled from a directory
	apps := filestore.NewApps(builder.CannedPath, builder.UUID, builder.Logger)
	// These apps are statically compiled into chronograf
	binApps := &canned.BinLayoutsStore{
		Logger: builder.Logger,
	}
	// Acts as a front-end to both the bolt layouts, filesystem layouts and binary statically compiled layouts.
	// The idea here is that these stores form a hierarchy in which each is tried sequentially until
	// the operation has success.  So, the database is preferred over filesystem over binary data.
	layouts := &multistore.Layouts{
		Stores: []chronograf.LayoutsStore{
			apps,
			binApps,
		},
	}

	return layouts, nil
}

// ProtoboardsBuilder is responsible for building Protoboards
type ProtoboardsBuilder interface {
	Build() (*multistore.Protoboards, error)
}

// MultiProtoboardsBuilder implements LayoutBuilder and will return a Layouts
type MultiProtoboardsBuilder struct {
	Logger          chronograf.Logger
	UUID            chronograf.ID
	ProtoboardsPath string
}

// Build will construct a Layouts of canned and db-backed personalized
// layouts
func (builder *MultiProtoboardsBuilder) Build() (*multistore.Protoboards, error) {
	// These apps are those handled from a directory
	filesystemPBs := filestore.NewProtoboards(builder.ProtoboardsPath, builder.UUID, builder.Logger)
	// These apps are statically compiled into chronograf
	binPBs := &protoboards.BinProtoboardsStore{
		Logger: builder.Logger,
	}
	// Acts as a front-end to both the bolt layouts, filesystem layouts and binary statically compiled layouts.
	// The idea here is that these stores form a hierarchy in which each is tried sequentially until
	// the operation has success.  So, the database is preferred over filesystem over binary data.
	protoboards := &multistore.Protoboards{
		Stores: []chronograf.ProtoboardsStore{
			filesystemPBs,
			binPBs,
		},
	}

	return protoboards, nil
}

// DashboardBuilder is responsible for building dashboards
type DashboardBuilder interface {
	Build(chronograf.DashboardsStore) (*multistore.DashboardsStore, error)
}

// MultiDashboardBuilder builds a DashboardsStore backed by bolt and the filesystem
type MultiDashboardBuilder struct {
	Logger chronograf.Logger
	ID     chronograf.ID
	Path   string
}

// Build will construct a Dashboard store of filesystem and db-backed dashboards
func (builder *MultiDashboardBuilder) Build(db chronograf.DashboardsStore) (*multistore.DashboardsStore, error) {
	// These dashboards are those handled from a directory
	files := filestore.NewDashboards(builder.Path, builder.Logger)
	// Acts as a front-end to both the bolt dashboard and filesystem dashboards.
	// The idea here is that these stores form a hierarchy in which each is tried sequentially until
	// the operation has success.  So, the database is preferred over filesystem
	dashboards := &multistore.DashboardsStore{
		Stores: []chronograf.DashboardsStore{
			db,
			files,
		},
	}

	return dashboards, nil
}

// SourcesBuilder builds a MultiSourceStore
type SourcesBuilder interface {
	Build(chronograf.SourcesStore, string) (*multistore.SourcesStore, error)
}

// MultiSourceBuilder implements SourcesBuilder
type MultiSourceBuilder struct {
	InfluxDBType      string
	InfluxDBURL       string
	InfluxDBUsername  string
	InfluxDBPassword  string
	InfluxDBOrg       string
	InfluxDBToken     string
	InfluxDBMgmtToken string
	InfluxDBClusterID string
	InfluxDBAccountID string
	TagsCSVPath       string
	DefaultDB         string

	Logger chronograf.Logger
	ID     chronograf.ID
	Path   string
}

// Build will return a MultiSourceStore
func (fs *MultiSourceBuilder) Build(db chronograf.SourcesStore, defaultOrgID string) (*multistore.SourcesStore, error) {
	// These dashboards are those handled from a directory
	files := filestore.NewSources(fs.Path, fs.ID, fs.Logger)

	stores := []chronograf.SourcesStore{db, files}

	if fs.InfluxDBURL != "" {
		var influxdbType, username, password string
		var clusterID, accountID, mgmtToken, dbToken, tagsCSVPath, defaultDB string
		if fs.InfluxDBType == chronograf.InfluxDBv3Core || fs.InfluxDBType == chronograf.InfluxDBv3Enterprise {
			// InfluxDB 3 Core, InfluxDB 3 Enterprise
			influxdbType = fs.InfluxDBType
			dbToken = fs.InfluxDBToken
		} else if fs.InfluxDBType == chronograf.InfluxDBv3Clustered {
			// InfluxDB Clustered
			influxdbType = fs.InfluxDBType
			mgmtToken = fs.InfluxDBMgmtToken
			dbToken = fs.InfluxDBToken
		} else if fs.InfluxDBType == chronograf.InfluxDBv3CloudDedicated {
			// InfluxDB Cloud Dedicated
			influxdbType = fs.InfluxDBType
			clusterID = fs.InfluxDBClusterID
			accountID = fs.InfluxDBAccountID
			mgmtToken = fs.InfluxDBMgmtToken
			dbToken = fs.InfluxDBToken
			tagsCSVPath = fs.TagsCSVPath
			defaultDB = fs.DefaultDB
		} else if fs.InfluxDBOrg == "" || fs.InfluxDBToken == "" {
			// v1 InfluxDB
			username = fs.InfluxDBUsername
			password = fs.InfluxDBPassword
			influxdbType = chronograf.InfluxDBv1
		} else {
			// v2 InfluxDB
			username = fs.InfluxDBOrg
			password = fs.InfluxDBToken
			influxdbType = chronograf.InfluxDBv2
		}

		source := chronograf.Source{
			ID:              0,
			Name:            fs.InfluxDBURL,
			Type:            influxdbType,
			Username:        username,
			Password:        password,
			ClusterID:       clusterID,
			AccountID:       accountID,
			ManagementToken: mgmtToken,
			DatabaseToken:   dbToken,
			TagsCSVPath:     tagsCSVPath,
			URL:             fs.InfluxDBURL,
			DefaultDB:       defaultDB,
			Default:         true,
			Version:         "unknown", // a real version is re-fetched at runtime; use "unknown" version as a fallback, empty version would imply OSS 2.x
		}

		if err := ValidSourceRequest(&source, defaultOrgID); err == nil {
			influxStore := &memdb.SourcesStore{Source: &source}
			stores = append([]chronograf.SourcesStore{influxStore}, stores...)
		} else {
			// Log the error and ignore
			fs.Logger.Error(fmt.Sprintf("Invalid %s source: %s", influxdbType, err))
		}
	}
	sources := &multistore.SourcesStore{
		Stores: stores,
	}

	return sources, nil
}

// KapacitorBuilder builds a KapacitorStore
type KapacitorBuilder interface {
	Build(chronograf.ServersStore) (*multistore.KapacitorStore, error)
}

// MultiKapacitorBuilder implements KapacitorBuilder
type MultiKapacitorBuilder struct {
	KapacitorURL      string
	KapacitorUsername string
	KapacitorPassword string

	Logger chronograf.Logger
	ID     chronograf.ID
	Path   string
}

// Build will return a multistore facade KapacitorStore over memdb and bolt
func (builder *MultiKapacitorBuilder) Build(db chronograf.ServersStore) (*multistore.KapacitorStore, error) {
	// These dashboards are those handled from a directory
	files := filestore.NewKapacitors(builder.Path, builder.ID, builder.Logger)

	stores := []chronograf.ServersStore{db, files}

	if builder.KapacitorURL != "" {
		memStore := &memdb.KapacitorStore{
			Kapacitor: &chronograf.Server{
				ID:       0,
				SrcID:    0,
				Name:     builder.KapacitorURL,
				URL:      builder.KapacitorURL,
				Username: builder.KapacitorUsername,
				Password: builder.KapacitorPassword,
			},
		}
		stores = append([]chronograf.ServersStore{memStore}, stores...)
	}
	kapacitors := &multistore.KapacitorStore{
		Stores: stores,
	}
	return kapacitors, nil
}

// OrganizationBuilder is responsible for building dashboards
type OrganizationBuilder interface {
	Build(chronograf.OrganizationsStore) (*multistore.OrganizationsStore, error)
}

// MultiOrganizationBuilder builds a OrganizationsStore backed by bolt and the filesystem
type MultiOrganizationBuilder struct {
	Logger chronograf.Logger
	Path   string
}

// Build will construct a Organization store of filesystem and db-backed dashboards
func (builder *MultiOrganizationBuilder) Build(db chronograf.OrganizationsStore) (*multistore.OrganizationsStore, error) {
	// These organization are those handled from a directory
	files := filestore.NewOrganizations(builder.Path, builder.Logger)
	// Acts as a front-end to both the bolt org and filesystem orgs.
	// The idea here is that these stores form a hierarchy in which each is tried sequentially until
	// the operation has success.  So, the database is preferred over filesystem
	orgs := &multistore.OrganizationsStore{
		Stores: []chronograf.OrganizationsStore{
			db,
			files,
		},
	}

	return orgs, nil
}
