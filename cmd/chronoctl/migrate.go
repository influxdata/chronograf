package main

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"os"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/kv"
	"github.com/influxdata/chronograf/kv/bolt"
	"github.com/influxdata/chronograf/kv/etcd"
)

func init() {
	parser.AddCommand("migrate",
		"Migrate db (beta)",
		"The migrate command (beta) will copy one db to another",
		&migrateCommand{})
}

type migrateCommand struct {
	From string `short:"f" long:"from" description:"Full path to boltDB file or etcd (e.g. 'bolt:///path/to/chronograf-v1.db' or 'etcd://user:pass@localhost:2379" default:"chronograf-v1.db"`
	To   string `short:"t" long:"to" description:"Full path to boltDB file or etcd (e.g. 'bolt:///path/to/chronograf-v1.db' or 'etcd://user:pass@localhost:2379" default:"etcd://localhost:2379"`
}

func (m *migrateCommand) Execute(args []string) error {
	fmt.Printf("Performing non-idempotent db migration from %q to %q...\n", m.From, m.To)
	if m.From == m.To {
		errExit(errors.New("Cannot migrate to original source"))
	}

	ctx := context.TODO()

	datas, err := getData(ctx, m.From)
	errExit(err)

	errExit(saveData(ctx, m.To, datas))

	fmt.Println("Migration successful!")
	return nil
}

func openService(ctx context.Context, s string) (*kv.Service, error) {
	u, err := url.Parse(s)
	if err != nil {
		return nil, err
	}

	var db kv.Store

	switch u.Scheme {
	case "bolt", "boltdb", "":
		if u.Host != "" {
			return nil, errors.New("ambiguous uri")
		}

		db, err = bolt.NewClient(ctx,
			bolt.WithPath(u.Path),
		)
		if err != nil {
			return nil, fmt.Errorf("unable to create bolt client: %s", err)
		}
	case "etcd":
		pw, _ := u.User.Password()
		db, err = etcd.NewClient(ctx,
			etcd.WithEndpoints([]string{u.Host}),
			etcd.WithLogin(u.User.Username(), pw),
		)
		if err != nil {
			return nil, fmt.Errorf("unable to create etcd client: %s", err)
		}
	default:
		return nil, fmt.Errorf("invalid uri scheme '%s'", u.Scheme)
	}

	return kv.NewService(ctx, db)
}

func getData(ctx context.Context, fromURI string) (*datas, error) {
	from, err := openService(ctx, fromURI)
	if err != nil {
		return nil, err
	}
	defer from.Close()

	cfg, err := from.ConfigStore().Get(ctx)
	if err != nil {
		return nil, err
	}

	dashboards, err := from.DashboardsStore().All(ctx)
	if err != nil {
		return nil, err
	}

	mappings, err := from.MappingsStore().All(ctx)
	if err != nil {
		return nil, err
	}

	orgCfgs, err := from.OrganizationConfigStore().All(ctx)
	if err != nil {
		return nil, err
	}

	orgs, err := from.OrganizationsStore().All(ctx)
	if err != nil {
		return nil, err
	}

	servers, err := from.ServersStore().All(ctx)
	if err != nil {
		return nil, err
	}

	srcs, err := from.SourcesStore().All(ctx)
	if err != nil {
		return nil, err
	}

	users, err := from.UsersStore().All(ctx)
	if err != nil {
		return nil, err
	}

	return &datas{
		config:        *cfg,
		dashboards:    dashboards,
		mappings:      mappings,
		orgConfigs:    orgCfgs,
		organizations: orgs,
		servers:       servers,
		sources:       srcs,
		users:         users,
	}, nil
}

func saveData(ctx context.Context, t string, datas *datas) error {
	to, err := openService(ctx, t)
	if err != nil {
		return fmt.Errorf("failed to open service '%s': %s", t, err)
	}
	defer to.Close()

	err = to.ConfigStore().Update(ctx, &datas.config)
	if err != nil {
		return err
	}

	for _, org := range datas.organizations {
		_, err = to.OrganizationsStore().Add(ctx, &org)
		if err != nil {
			if err == chronograf.ErrOrganizationAlreadyExists {
				err = to.OrganizationsStore().Update(ctx, &org)
				if err == nil {
					continue
				}
			}
			return fmt.Errorf("failed to add to OrganizationsStore: %s", err)
		}
	}
	fmt.Printf("  Saved %d organizations.\n", len(datas.organizations))

	for _, orgCfg := range datas.orgConfigs {
		err = to.OrganizationConfigStore().Put(ctx, &orgCfg)
		if err != nil {
			return fmt.Errorf("failed to add to OrganizationConfigStore: %s", err)
		}
	}
	fmt.Printf("  Saved %d organization configs.\n", len(datas.orgConfigs))

	for _, dash := range datas.dashboards {
		_, err = to.DashboardsStore().Add(ctx, dash)
		if err != nil {
			return fmt.Errorf("failed to add to DashboardsStore: %s", err)
		}
	}
	fmt.Printf("  Saved %d dashboards.\n", len(datas.dashboards))

	for _, mapping := range datas.mappings {
		_, err = to.MappingsStore().Add(ctx, &mapping)
		if err != nil {
			return fmt.Errorf("failed to add to MappingsStore: %s", err)
		}
	}
	fmt.Printf("  Saved %d mappings.\n", len(datas.mappings))

	for _, server := range datas.servers {
		_, err = to.ServersStore().Add(ctx, server)
		if err != nil {
			return fmt.Errorf("failed to add to ServersStore: %s", err)
		}
	}
	fmt.Printf("  Saved %d servers.\n", len(datas.servers))

	for _, source := range datas.sources {
		_, err = to.SourcesStore().Add(ctx, source)
		if err != nil {
			return fmt.Errorf("failed to add to SourcesStore: %s", err)
		}
	}
	fmt.Printf("  Saved %d sources.\n", len(datas.sources))

	return nil
}

type datas struct {
	config        chronograf.Config
	dashboards    []chronograf.Dashboard
	mappings      []chronograf.Mapping
	orgConfigs    []chronograf.OrganizationConfig
	organizations []chronograf.Organization
	servers       []chronograf.Server
	sources       []chronograf.Source
	users         []chronograf.User
}

func errExit(err error) {
	if err == nil {
		return
	}
	fmt.Println(err.Error())
	os.Exit(1)
}
