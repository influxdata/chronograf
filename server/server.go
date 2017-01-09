package server

import (
	"math/rand"
	"net"
	"net/http"
	"runtime"
	"strconv"
	"time"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/bolt"
	"github.com/influxdata/chronograf/canned"
	"github.com/influxdata/chronograf/influx"
	"github.com/influxdata/chronograf/layouts"
	clog "github.com/influxdata/chronograf/log"
	"github.com/influxdata/chronograf/uuid"
	client "github.com/influxdata/usage-client/v1"
	"github.com/tylerb/graceful"
)

var startTime time.Time

func init() {
	startTime = time.Now().UTC()
}

// Server for the chronograf API
type Server struct {
	Host string `long:"host" description:"the IP to listen on" default:"0.0.0.0" env:"HOST"`
	Port int    `long:"port" description:"the port to listen on for insecure connections, defaults to a random value" default:"8888" env:"PORT"`

	/* TODO: add in support for TLS
	TLSHost           string         `long:"tls-host" description:"the IP to listen on for tls, when not specified it's the same as --host" env:"TLS_HOST"`
	TLSPort           int            `long:"tls-port" description:"the port to listen on for secure connections, defaults to a random value" env:"TLS_PORT"`
	TLSCertificate    flags.Filename `long:"tls-certificate" description:"the certificate to use for secure connections" env:"TLS_CERTIFICATE"`
	TLSCertificateKey flags.Filename `long:"tls-key" description:"the private key to use for secure conections" env:"TLS_PRIVATE_KEY"`
	*/

	Develop            bool     `short:"d" long:"develop" description:"Run server in develop mode."`
	BoltPath           string   `short:"b" long:"bolt-path" description:"Full path to boltDB file (/var/lib/chronograf/chronograf-v1.db)" env:"BOLT_PATH" default:"chronograf-v1.db"`
	CannedPath         string   `short:"c" long:"canned-path" description:"Path to directory of pre-canned application layouts (/usr/share/chronograf/canned)" env:"CANNED_PATH" default:"canned"`
	TokenSecret        string   `short:"t" long:"token-secret" description:"Secret to sign tokens" env:"TOKEN_SECRET"`
	GithubClientID     string   `short:"i" long:"github-client-id" description:"Github Client ID for OAuth 2 support" env:"GH_CLIENT_ID"`
	GithubClientSecret string   `short:"s" long:"github-client-secret" description:"Github Client Secret for OAuth 2 support" env:"GH_CLIENT_SECRET"`
	GithubOrgs         []string `short:"o" long:"github-organization" description:"Github organization user is required to have active membership" env:"GH_ORGS" env-delim:","`
	ReportingDisabled  bool     `short:"r" long:"reporting-disabled" description:"Disable reporting of usage stats (os,arch,version,cluster_id,uptime) once every 24hr" env:"REPORTING_DISABLED"`
	LogLevel           string   `short:"l" long:"log-level" value-name:"choice" choice:"debug" choice:"info" choice:"warn" choice:"error" choice:"fatal" choice:"panic" default:"info" description:"Set the logging level" env:"LOG_LEVEL"`
	ShowVersion        bool     `short:"v" long:"version" description:"Show Chronograf version info"`
	BuildInfo          BuildInfo
	Listener           net.Listener
	handler            http.Handler
}

// BuildInfo is sent to the usage client to track versions and commits
type BuildInfo struct {
	Version string
	Commit  string
}

func (s *Server) useAuth() bool {
	return s.TokenSecret != "" && s.GithubClientID != "" && s.GithubClientSecret != ""
}

// Serve starts and runs the chronograf server
func (s *Server) Serve() error {
	logger := clog.New(clog.ParseLevel(s.LogLevel))
	service := openService(s.BoltPath, s.CannedPath, logger, s.useAuth())
	s.handler = NewMux(MuxOpts{
		Develop:            s.Develop,
		TokenSecret:        s.TokenSecret,
		GithubClientID:     s.GithubClientID,
		GithubClientSecret: s.GithubClientSecret,
		GithubOrgs:         s.GithubOrgs,
		Logger:             logger,
		UseAuth:            s.useAuth(),
	}, service)

	var err error
	s.Listener, err = net.Listen("tcp", net.JoinHostPort(s.Host, strconv.Itoa(s.Port)))
	if err != nil {
		logger.
			WithField("component", "server").
			Error(err)
		return err
	}

	httpServer := &graceful.Server{Server: new(http.Server)}
	httpServer.SetKeepAlivesEnabled(true)
	httpServer.TCPKeepAlive = 5 * time.Second
	httpServer.Handler = s.handler

	if !s.ReportingDisabled {
		go reportUsageStats(s.BuildInfo, logger)
	}

	logger.
		WithField("component", "server").
		Info("Serving chronograf at http://", s.Listener.Addr())

	if err := httpServer.Serve(s.Listener); err != nil {
		logger.
			WithField("component", "server").
			Error(err)
		return err
	}

	logger.
		WithField("component", "server").
		Info("Stopped serving chronograf at http://", s.Listener.Addr())

	return nil
}

func openService(boltPath, cannedPath string, logger chronograf.Logger, useAuth bool) Service {
	db := bolt.NewClient()
	db.Path = boltPath
	if err := db.Open(); err != nil {
		logger.
			WithField("component", "boltstore").
			Fatal("Unable to open boltdb; is there a chronograf already running?  ", err)
	}

	// These apps are those handled from a directory
	apps := canned.NewApps(cannedPath, &uuid.V4{}, logger)
	// These apps are statically compiled into chronograf
	binApps := &canned.BinLayoutStore{
		Logger: logger,
	}

	// Acts as a front-end to both the bolt layouts, filesystem layouts and binary statically compiled layouts.
	// The idea here is that these stores form a hierarchy in which each is tried sequentially until
	// the operation has success.  So, the database is preferred over filesystem over binary data.
	layouts := &layouts.MultiLayoutStore{
		Stores: []chronograf.LayoutStore{
			db.LayoutStore,
			apps,
			binApps,
		},
	}

	return Service{
		ExplorationStore: db.ExplorationStore,
		SourcesStore:     db.SourcesStore,
		ServersStore:     db.ServersStore,
		UsersStore:       db.UsersStore,
		TimeSeries: &influx.Client{
			Logger: logger,
		},
		LayoutStore:     layouts,
		DashboardsStore: db.DashboardsStore,
		AlertRulesStore: db.AlertsStore,
		Logger:          logger,
		UseAuth:         useAuth,
	}
}

// reportUsageStats starts periodic server reporting.
func reportUsageStats(bi BuildInfo, logger chronograf.Logger) {
	rand.Seed(time.Now().UTC().UnixNano())
	serverID := strconv.FormatUint(uint64(rand.Int63()), 10)
	reporter := client.New("")
	u := &client.Usage{
		Product: "chronograf-ng",
		Data: []client.UsageData{
			{
				Values: client.Values{
					"os":         runtime.GOOS,
					"arch":       runtime.GOARCH,
					"version":    bi.Version,
					"cluster_id": serverID,
					"uptime":     time.Since(startTime).Seconds(),
				},
			},
		},
	}
	l := logger.WithField("component", "usage").
		WithField("reporting_addr", reporter.URL).
		WithField("freq", "24h").
		WithField("stats", "os,arch,version,cluster_id,uptime")
	l.Info("Reporting usage stats")
	_, _ = reporter.Save(u)

	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()
	for {
		<-ticker.C
		l.Debug("Reporting usage stats")
		go reporter.Save(u)
	}
}
