package server

import (
	"context"
	"fmt"
	"strings"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/enterprise"
	"github.com/influxdata/chronograf/influx"
)

// Service handles REST calls to the persistence
type Service struct {
	SourcesStore     chronograf.SourcesStore
	ServersStore     chronograf.ServersStore
	LayoutStore      chronograf.LayoutStore
	UsersStore       chronograf.UsersStore
	DashboardsStore  chronograf.DashboardsStore
	TimeSeriesClient TimeSeriesClient
	Logger           chronograf.Logger
	UseAuth          bool
	Databases        chronograf.Databases
}

// TimeSeriesClient returns the correct client for a time series database.
type TimeSeriesClient interface {
	New(chronograf.Source, chronograf.Logger) (chronograf.TimeSeries, error)
}

// ErrorMessage is the error response format for all service errors
type ErrorMessage struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// TimeSeries returns a new client connected to a time series database
func (s *Service) TimeSeries(src chronograf.Source) (chronograf.TimeSeries, error) {
	return s.TimeSeriesClient.New(src, s.Logger)
}

// InfluxClient returns a new client to connect to OSS or Enterprise
type InfluxClient struct{}

// New creates a client to connect to OSS or enterprise
func (c *InfluxClient) New(src chronograf.Source, logger chronograf.Logger) (chronograf.TimeSeries, error) {
	client := &influx.Client{
		Logger: logger,
	}
	if err := client.Connect(context.TODO(), &src); err != nil {
		return nil, err
	}
	if src.Type == chronograf.InfluxEnterprise && len(src.MetaURL) != 0 {
		for i, j := 0, 1; j < len(src.MetaURL); j++ {
			prev := src.MetaURL[i]
			next := src.MetaURL[j]
			prevTLS := strings.Contains(prev, "https")
			nextTLS := strings.Contains(next, "https")
			if prevTLS != nextTLS {
				return nil, fmt.Errorf("mismatched use of https for meta: %q and %q found", prev, next)
			}
			i = j
		}

		// This is safe since we have at least one element of meta url
		tls := strings.Contains(src.MetaURL[0], "https")
		return enterprise.NewClientWithTimeSeries(logger, src.MetaURL, src.Username, src.Password, tls, client)
	}
	return client, nil
}
