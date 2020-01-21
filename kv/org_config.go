package kv

import (
	"context"
	"fmt"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/kv/internal"
)

// Ensure organizationConfigStore implements chronograf.OrganizationConfigStore.
var _ chronograf.OrganizationConfigStore = &organizationConfigStore{}

// organizationConfigStore uses a kv to store and retrieve organization configurations.
type organizationConfigStore struct {
	client *Service
}

func (s *organizationConfigStore) get(ctx context.Context, tx Tx, orgID string, c *chronograf.OrganizationConfig) error {
	v, err := tx.Bucket(organizationConfigBucket).Get([]byte(orgID))
	if len(v) == 0 || err != nil {
		return chronograf.ErrOrganizationConfigNotFound
	}
	return internal.UnmarshalOrganizationConfig(v, c)
}

// FindOrCreate gets an OrganizationConfig from the store or creates one if none exists for this organization
func (s *organizationConfigStore) FindOrCreate(ctx context.Context, orgID string) (*chronograf.OrganizationConfig, error) {
	var c chronograf.OrganizationConfig
	err := s.client.kv.Update(ctx, func(tx Tx) error {
		err := s.get(ctx, tx, orgID, &c)
		if err == chronograf.ErrOrganizationConfigNotFound {
			c = newOrganizationConfig(orgID)
			return s.put(ctx, tx, &c)
		}
		return err
	})

	if err != nil {
		return nil, err
	}
	return &c, nil
}

// Put replaces the OrganizationConfig in the store
func (s *organizationConfigStore) Put(ctx context.Context, c *chronograf.OrganizationConfig) error {
	return s.client.kv.Update(ctx, func(tx Tx) error {
		return s.put(ctx, tx, c)
	})
}

func (s *organizationConfigStore) put(ctx context.Context, tx Tx, c *chronograf.OrganizationConfig) error {
	if c == nil {
		return fmt.Errorf("config provided was nil")
	}
	if v, err := internal.MarshalOrganizationConfig(c); err != nil {
		return err
	} else if err := tx.Bucket(organizationConfigBucket).Put([]byte(c.OrganizationID), v); err != nil {
		return err
	}
	return nil
}

func newOrganizationConfig(orgID string) chronograf.OrganizationConfig {
	return chronograf.OrganizationConfig{
		OrganizationID: orgID,
		LogViewer: chronograf.LogViewerConfig{
			Columns: []chronograf.LogViewerColumn{
				{
					Name:     "time",
					Position: 0,
					Encodings: []chronograf.ColumnEncoding{
						{
							Type:  "visibility",
							Value: "hidden",
						},
					},
				},
				{
					Name:     "severity",
					Position: 1,
					Encodings: []chronograf.ColumnEncoding{

						{
							Type:  "visibility",
							Value: "visible",
						},
						{
							Type:  "label",
							Value: "icon",
						},
						{
							Type:  "label",
							Value: "text",
						},
						{
							Type:  "color",
							Name:  "emerg",
							Value: "ruby",
						},
						{
							Type:  "color",
							Name:  "alert",
							Value: "fire",
						},
						{
							Type:  "color",
							Name:  "crit",
							Value: "curacao",
						},
						{
							Type:  "color",
							Name:  "err",
							Value: "tiger",
						},
						{
							Type:  "color",
							Name:  "warning",
							Value: "pineapple",
						},
						{
							Type:  "color",
							Name:  "notice",
							Value: "rainforest",
						},
						{
							Type:  "color",
							Name:  "info",
							Value: "star",
						},
						{
							Type:  "color",
							Name:  "debug",
							Value: "wolf",
						},
					},
				},
				{
					Name:     "timestamp",
					Position: 2,
					Encodings: []chronograf.ColumnEncoding{

						{
							Type:  "visibility",
							Value: "visible",
						},
					},
				},
				{
					Name:     "message",
					Position: 3,
					Encodings: []chronograf.ColumnEncoding{

						{
							Type:  "visibility",
							Value: "visible",
						},
					},
				},
				{
					Name:     "facility",
					Position: 4,
					Encodings: []chronograf.ColumnEncoding{

						{
							Type:  "visibility",
							Value: "visible",
						},
					},
				},
				{
					Name:     "procid",
					Position: 5,
					Encodings: []chronograf.ColumnEncoding{

						{
							Type:  "visibility",
							Value: "visible",
						},
						{
							Type:  "displayName",
							Value: "Proc ID",
						},
					},
				},
				{
					Name:     "appname",
					Position: 6,
					Encodings: []chronograf.ColumnEncoding{
						{
							Type:  "visibility",
							Value: "visible",
						},
						{
							Type:  "displayName",
							Value: "Application",
						},
					},
				},
				{
					Name:     "hostname",
					Position: 7,
					Encodings: []chronograf.ColumnEncoding{
						{
							Type:  "visibility",
							Value: "visible",
						},
					},
				},
				{
					Name:     "host",
					Position: 8,
					Encodings: []chronograf.ColumnEncoding{
						{
							Type:  "visibility",
							Value: "visible",
						},
					},
				},
			},
		},
	}
}
