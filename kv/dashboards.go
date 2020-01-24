package kv

import (
	"context"
	"strconv"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/kv/internal"
)

// Ensure dashboardsStore implements chronograf.DashboardsStore.
var _ chronograf.DashboardsStore = &dashboardsStore{}

// dashboardsStore is the bolt implementation of storing dashboards
type dashboardsStore struct {
	client *Service
	IDs    chronograf.ID
}

// All returns all known dashboards
func (d *dashboardsStore) All(ctx context.Context) ([]chronograf.Dashboard, error) {
	var srcs []chronograf.Dashboard
	if err := d.client.kv.View(ctx, func(tx Tx) error {
		if err := tx.Bucket(dashboardsBucket).ForEach(func(k, v []byte) error {
			var src chronograf.Dashboard
			if err := internal.UnmarshalDashboard(v, &src); err != nil {
				return err
			}
			srcs = append(srcs, src)
			return nil
		}); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return nil, err
	}

	return srcs, nil
}

// Add creates a new Dashboard in the dashboardsStore
func (d *dashboardsStore) Add(ctx context.Context, src chronograf.Dashboard) (chronograf.Dashboard, error) {
	if err := d.client.kv.Update(ctx, func(tx Tx) error {
		b := tx.Bucket(dashboardsBucket)
		id, err := b.NextSequence()
		if err != nil {
			return err
		}

		src.ID = chronograf.DashboardID(id)
		strID := strconv.FormatUint(id, 10)
		for i, cell := range src.Cells {
			cid, err := d.IDs.Generate()
			if err != nil {
				return err
			}
			cell.ID = cid
			src.Cells[i] = cell
		}
		v, err := internal.MarshalDashboard(src)
		if err != nil {
			return err
		}
		return b.Put([]byte(strID), v)
	}); err != nil {
		return chronograf.Dashboard{}, err
	}

	return src, nil
}

// Get returns a Dashboard if the id exists.
func (d *dashboardsStore) Get(ctx context.Context, id chronograf.DashboardID) (chronograf.Dashboard, error) {
	var src chronograf.Dashboard
	if err := d.client.kv.View(ctx, func(tx Tx) error {
		strID := strconv.Itoa(int(id))
		if v, err := tx.Bucket(dashboardsBucket).Get([]byte(strID)); v == nil || err != nil {
			return chronograf.ErrDashboardNotFound
		} else if err := internal.UnmarshalDashboard(v, &src); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return chronograf.Dashboard{}, err
	}

	return src, nil
}

// Delete the dashboard from dashboardsStore
func (d *dashboardsStore) Delete(ctx context.Context, dash chronograf.Dashboard) error {
	return d.client.kv.Update(ctx, func(tx Tx) error {
		return tx.Bucket(dashboardsBucket).Delete([]byte(strconv.Itoa(int(dash.ID))))
	})
}

// Update the dashboard in dashboardsStore
func (d *dashboardsStore) Update(ctx context.Context, dash chronograf.Dashboard) error {
	if err := d.client.kv.Update(ctx, func(tx Tx) error {
		// Get an existing dashboard with the same ID.
		b := tx.Bucket(dashboardsBucket)
		strID := strconv.Itoa(int(dash.ID))
		if v, err := b.Get([]byte(strID)); v == nil || err != nil {
			return chronograf.ErrDashboardNotFound
		}

		for i, cell := range dash.Cells {
			if cell.ID != "" {
				continue
			}
			cid, err := d.IDs.Generate()
			if err != nil {
				return err
			}
			cell.ID = cid
			dash.Cells[i] = cell
		}
		if v, err := internal.MarshalDashboard(dash); err != nil {
			return err
		} else if err := b.Put([]byte(strID), v); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return err
	}

	return nil
}
