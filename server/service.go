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
	Store                    DataStore
	TimeSeriesClient         TimeSeriesClient
	Logger                   chronograf.Logger
	UseAuth                  bool
	SuperAdminProviderGroups superAdminProviderGroups
	Env                      chronograf.Environment
	Databases                chronograf.Databases
}

type superAdminProviderGroups struct {
	auth0 string
}

// TimeSeriesClient returns the correct client for a time series database.
// todo(glinton): should this be always reconnecting?
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
	if src.Type == chronograf.InfluxEnterprise && src.MetaURL != "" {
		tls := strings.Contains(src.MetaURL, "https")
		insecure := src.InsecureSkipVerify
		return enterprise.NewClientWithTimeSeries(logger, src.MetaURL, influx.DefaultAuthorization(&src), tls, insecure, client)
	}
	return client, nil
}
