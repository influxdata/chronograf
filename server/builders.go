package server

import (
	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/canned"
	"github.com/influxdata/chronograf/layouts"
	"github.com/influxdata/chronograf/memdb"
)

// LayoutBuilder is responsible for building Layouts
type LayoutBuilder interface {
	Build(chronograf.LayoutStore) (*layouts.MultiLayoutStore, error)
}

// MultiLayoutBuilder implements LayoutBuilder and will return a MultiLayoutStore
type MultiLayoutBuilder struct {
	Logger     chronograf.Logger
	UUID       chronograf.ID
	CannedPath string
}

// Build will construct a MultiLayoutStore of canned and db-backed personalized
// layouts
func (builder *MultiLayoutBuilder) Build(db chronograf.LayoutStore) (*layouts.MultiLayoutStore, error) {
	// These apps are those handled from a directory
	apps := canned.NewApps(builder.CannedPath, builder.UUID, builder.Logger)
	// These apps are statically compiled into chronograf
	binApps := &canned.BinLayoutStore{
		Logger: builder.Logger,
	}
	// Acts as a front-end to both the bolt layouts, filesystem layouts and binary statically compiled layouts.
	// The idea here is that these stores form a hierarchy in which each is tried sequentially until
	// the operation has success.  So, the database is preferred over filesystem over binary data.
	layouts := &layouts.MultiLayoutStore{
		Stores: []chronograf.LayoutStore{
			db,
			apps,
			binApps,
		},
	}

	return layouts, nil
}

// SourcesBuilder builds a MultiSourceStore
type SourcesBuilder interface {
	Build(chronograf.SourcesStore) (*memdb.MultiSourcesStore, error)
}

// MultiSourceBuilder implements SourcesBuilder
type MultiSourceBuilder struct {
	InfluxDB         string
	InfluxDBUsername string
	InfluxDBPassword string

	Kapacitor         string
	KapacitorUsername string
	KapacitorPassword string
}

// Build will return a MultiSourceStore
func (fs *MultiSourceBuilder) Build(db chronograf.SourcesStore) (*memdb.MultiSourcesStore, error) {
	stores := []chronograf.SourcesStore{db}

	if fs.InfluxDB != "" {
		influxStore := &memdb.SourcesStore{
			Source: &chronograf.Source{
				ID:       0,
				Name:     fs.InfluxDB,
				Type:     chronograf.InfluxDB,
				Username: fs.InfluxDBUsername,
				Password: fs.InfluxDBPassword,
				URL:      fs.InfluxDB,
				Default:  true,
			}}
		stores = append([]chronograf.SourcesStore{influxStore}, stores...)
	}
	sources := &memdb.MultiSourcesStore{
		Stores: stores,
	}

	return sources, nil
}

// KapacitorBuilder builds a KapacitorStore
type KapacitorBuilder interface {
	Build(chronograf.ServersStore) (*memdb.MultiKapacitorStore, error)
}

// MultiKapacitorBuilder implements KapacitorBuilder
type MultiKapacitorBuilder struct {
	Kapacitor         string
	KapacitorUsername string
	KapacitorPassword string
}

// Build will return a MultiKapacitorStore
func (builder *MultiKapacitorBuilder) Build(db chronograf.ServersStore) (*memdb.MultiKapacitorStore, error) {
	stores := []chronograf.ServersStore{db}
	if builder.Kapacitor != "" {
		memStore := &memdb.KapacitorStore{
			Kapacitor: &chronograf.Server{
				ID:       0,
				SrcID:    0,
				Name:     builder.Kapacitor,
				URL:      builder.Kapacitor,
				Username: builder.KapacitorUsername,
				Password: builder.KapacitorPassword,
			},
		}
		stores = append([]chronograf.ServersStore{memStore}, stores...)
	}
	kapacitors := &memdb.MultiKapacitorStore{
		Stores: stores,
	}
	return kapacitors, nil
}
