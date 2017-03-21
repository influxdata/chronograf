package server

import (
	"context"
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
	AlertRulesStore  chronograf.AlertRulesStore
	UsersStore       chronograf.UsersStore
	DashboardsStore  chronograf.DashboardsStore
	TimeSeriesClient TimeSeriesClient
	Logger           chronograf.Logger
	UseAuth          bool
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
	if src.Type == chronograf.InfluxEnterprise && src.MetaURL != "" {
		dataNode := &influx.Client{
			Logger: logger,
		}
		if err := dataNode.Connect(context.TODO(), &src); err != nil {
			return nil, err
		}

		tls := strings.Contains(src.MetaURL, "https")
		return enterprise.NewClientWithTimeSeries(logger, src.MetaURL, src.Username, src.Password, tls, dataNode)
	}
	return &influx.Client{
		Logger: logger,
	}, nil
}
