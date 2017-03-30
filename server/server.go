package server

import (
	"context"
	"crypto/tls"
	"log"
	"math/rand"
	"net"
	"net/http"
	"os"
	"runtime"
	"strconv"
	"time"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/bolt"
	"github.com/influxdata/chronograf/influx"
	clog "github.com/influxdata/chronograf/log"
	"github.com/influxdata/chronograf/oauth2"
	"github.com/influxdata/chronograf/uuid"
	client "github.com/influxdata/usage-client/v1"
	flags "github.com/jessevdk/go-flags"
	"github.com/tylerb/graceful"
)

var (
	startTime time.Time
	basepath  string
)

func init() {
	startTime = time.Now().UTC()
}

// Server for the chronograf API
type Server struct {
	Host string `long:"host" description:"The IP to listen on" default:"0.0.0.0" env:"HOST"`
	Port int    `long:"port" description:"The port to listen on for insecure connections, defaults to a random value" default:"8888" env:"PORT"`

	Cert flags.Filename `long:"cert" description:"Path to PEM encoded public key certificate. " env:"TLS_CERTIFICATE"`
	Key  flags.Filename `long:"key" description:"Path to private key associated with given certificate. " env:"TLS_PRIVATE_KEY"`

	InfluxDBURL      string `long:"influxdb-url" description:"Location of your InfluxDB instance" env:"INFLUXDB_URL"`
	InfluxDBUsername string `long:"influxdb-username" description:"Username for your InfluxDB instance" env:"INFLUXDB_USERNAME"`
	InfluxDBPassword string `long:"influxdb-password" description:"Password for your InfluxDB instance" env:"INFLUXDB_PASSWORD"`

	KapacitorURL      string `long:"kapacitor-url" description:"Location of your Kapacitor instance" env:"KAPACITOR_URL"`
	KapacitorUsername string `long:"kapacitor-username" description:"Username of your Kapacitor instance" env:"KAPACITOR_USERNAME"`
	KapacitorPassword string `long:"kapacitor-password" description:"Password of your Kapacitor instance" env:"KAPACITOR_PASSWORD"`

	Develop     bool   `short:"d" long:"develop" description:"Run server in develop mode."`
	BoltPath    string `short:"b" long:"bolt-path" description:"Full path to boltDB file (/var/lib/chronograf/chronograf-v1.db)" env:"BOLT_PATH" default:"chronograf-v1.db"`
	CannedPath  string `short:"c" long:"canned-path" description:"Path to directory of pre-canned application layouts (/usr/share/chronograf/canned)" env:"CANNED_PATH" default:"canned"`
	TokenSecret string `short:"t" long:"token-secret" description:"Secret to sign tokens" env:"TOKEN_SECRET"`

	GithubClientID     string   `short:"i" long:"github-client-id" description:"Github Client ID for OAuth 2 support" env:"GH_CLIENT_ID"`
	GithubClientSecret string   `short:"s" long:"github-client-secret" description:"Github Client Secret for OAuth 2 support" env:"GH_CLIENT_SECRET"`
	GithubOrgs         []string `short:"o" long:"github-organization" description:"Github organization user is required to have active membership" env:"GH_ORGS" env-delim:","`

	GoogleClientID     string   `long:"google-client-id" description:"Google Client ID for OAuth 2 support" env:"GOOGLE_CLIENT_ID"`
	GoogleClientSecret string   `long:"google-client-secret" description:"Google Client Secret for OAuth 2 support" env:"GOGGLE_CLIENT_SECRET"`
	GoogleDomains      []string `long:"google-domains" description:"Google email domain user is required to have active membership" env:"GOOGLE_DOMAINS" env-delim:","`
	PublicURL          string   `long:"public-url" description:"Full public URL used to access Chronograf from a web browser. Used for Google OAuth2 authentication. (http://localhost:8888)" env:"PUBLIC_URL"`

	HerokuClientID      string   `long:"heroku-client-id" description:"Heroku Client ID for OAuth 2 support" env:"HEROKU_CLIENT_ID"`
	HerokuSecret        string   `long:"heroku-secret" description:"Heroku Secret for OAuth 2 support" env:"HEROKU_SECRET"`
	HerokuOrganizations []string `long:"heroku-organization" description:"Heroku Organization Memberships a user is required to have for access to Chronograf (comma separated)" env:"HEROKU_ORGS" env-delim:","`

	ReportingDisabled bool   `short:"r" long:"reporting-disabled" description:"Disable reporting of usage stats (os,arch,version,cluster_id,uptime) once every 24hr" env:"REPORTING_DISABLED"`
	LogLevel          string `short:"l" long:"log-level" value-name:"choice" choice:"debug" choice:"info" choice:"error" default:"info" description:"Set the logging level" env:"LOG_LEVEL"`
	Basepath          string `short:"p" long:"basepath" description:"A URL path prefix under which all chronograf routes will be mounted" env:"BASE_PATH"`
	ShowVersion       bool   `short:"v" long:"version" description:"Show Chronograf version info"`
	BuildInfo         BuildInfo
	Listener          net.Listener
	handler           http.Handler
}

func provide(p oauth2.Provider, m oauth2.Mux, ok func() bool) func(func(oauth2.Provider, oauth2.Mux)) {
	return func(configure func(oauth2.Provider, oauth2.Mux)) {
		if ok() {
			configure(p, m)
		}
	}
}

// UseGithub validates the CLI parameters to enable github oauth support
func (s *Server) UseGithub() bool {
	return s.TokenSecret != "" && s.GithubClientID != "" && s.GithubClientSecret != ""
}

// UseGoogle validates the CLI parameters to enable google oauth support
func (s *Server) UseGoogle() bool {
	return s.TokenSecret != "" && s.GoogleClientID != "" && s.GoogleClientSecret != "" && s.PublicURL != ""
}

// UseHeroku validates the CLI parameters to enable heroku oauth support
func (s *Server) UseHeroku() bool {
	return s.TokenSecret != "" && s.HerokuClientID != "" && s.HerokuSecret != ""
}

func (s *Server) githubOAuth(logger chronograf.Logger, auth oauth2.Authenticator) (oauth2.Provider, oauth2.Mux, func() bool) {
	gh := oauth2.Github{
		ClientID:     s.GithubClientID,
		ClientSecret: s.GithubClientSecret,
		Orgs:         s.GithubOrgs,
		Logger:       logger,
	}
	ghMux := oauth2.NewCookieMux(&gh, auth, logger)
	return &gh, ghMux, s.UseGithub
}

func (s *Server) googleOAuth(logger chronograf.Logger, auth oauth2.Authenticator) (oauth2.Provider, oauth2.Mux, func() bool) {
	redirectURL := s.PublicURL + s.Basepath + "/oauth/google/callback"
	google := oauth2.Google{
		ClientID:     s.GoogleClientID,
		ClientSecret: s.GoogleClientSecret,
		Domains:      s.GoogleDomains,
		RedirectURL:  redirectURL,
		Logger:       logger,
	}

	goMux := oauth2.NewCookieMux(&google, auth, logger)
	return &google, goMux, s.UseGoogle
}

func (s *Server) herokuOAuth(logger chronograf.Logger, auth oauth2.Authenticator) (oauth2.Provider, oauth2.Mux, func() bool) {
	heroku := oauth2.Heroku{
		ClientID:      s.HerokuClientID,
		ClientSecret:  s.HerokuSecret,
		Organizations: s.HerokuOrganizations,
		Logger:        logger,
	}

	hMux := oauth2.NewCookieMux(&heroku, auth, logger)
	return &heroku, hMux, s.UseHeroku
}

// BuildInfo is sent to the usage client to track versions and commits
type BuildInfo struct {
	Version string
	Commit  string
}

func (s *Server) useAuth() bool {
	gh := s.TokenSecret != "" && s.GithubClientID != "" && s.GithubClientSecret != ""
	google := s.TokenSecret != "" && s.GoogleClientID != "" && s.GoogleClientSecret != "" && s.PublicURL != ""
	heroku := s.TokenSecret != "" && s.HerokuClientID != "" && s.HerokuSecret != ""
	return gh || google || heroku
}

func (s *Server) useTLS() bool {
	return s.Cert != ""
}

// NewListener will an http or https listener depending useTLS()
func (s *Server) NewListener() (net.Listener, error) {
	addr := net.JoinHostPort(s.Host, strconv.Itoa(s.Port))
	if !s.useTLS() {
		listener, err := net.Listen("tcp", addr)
		if err != nil {
			return nil, err
		}
		return listener, nil
	}

	// If no key specified, therefore, we assume it is in the cert
	if s.Key == "" {
		s.Key = s.Cert
	}

	cert, err := tls.LoadX509KeyPair(string(s.Cert), string(s.Key))
	if err != nil {
		return nil, err
	}

	listener, err := tls.Listen("tcp", addr, &tls.Config{
		Certificates: []tls.Certificate{cert},
	})

	if err != nil {
		return nil, err
	}
	return listener, nil
}

// Serve starts and runs the chronograf server
func (s *Server) Serve(ctx context.Context) error {
	logger := clog.New(clog.ParseLevel(s.LogLevel))
	layoutBuilder := &MultiLayoutBuilder{
		Logger:     logger,
		UUID:       &uuid.V4{},
		CannedPath: s.CannedPath,
	}
	sourcesBuilder := &MultiSourceBuilder{
		InfluxDBURL:      s.InfluxDBURL,
		InfluxDBUsername: s.InfluxDBUsername,
		InfluxDBPassword: s.InfluxDBPassword,
	}
	kapacitorBuilder := &MultiKapacitorBuilder{
		KapacitorURL:      s.KapacitorURL,
		KapacitorUsername: s.KapacitorUsername,
		KapacitorPassword: s.KapacitorPassword,
	}
	service := openService(ctx, s.BoltPath, layoutBuilder, sourcesBuilder, kapacitorBuilder, logger, s.useAuth())
	basepath = s.Basepath

	providerFuncs := []func(func(oauth2.Provider, oauth2.Mux)){}

	auth := oauth2.NewJWT(s.TokenSecret)
	providerFuncs = append(providerFuncs, provide(s.githubOAuth(logger, &auth)))
	providerFuncs = append(providerFuncs, provide(s.googleOAuth(logger, &auth)))
	providerFuncs = append(providerFuncs, provide(s.herokuOAuth(logger, &auth)))

	s.handler = NewMux(MuxOpts{
		Develop:       s.Develop,
		TokenSecret:   s.TokenSecret,
		Logger:        logger,
		UseAuth:       s.useAuth(),
		ProviderFuncs: providerFuncs,
	}, service)

	// Add chronograf's version header to all requests
	s.handler = Version(s.BuildInfo.Version, s.handler)

	if s.useTLS() {
		// Add HSTS to instruct all browsers to change from http to https
		s.handler = HSTS(s.handler)
	}

	listener, err := s.NewListener()
	if err != nil {
		logger.
			WithField("component", "server").
			Error(err)
		return err
	}
	s.Listener = listener

	// Using a log writer for http server logging
	w := logger.Writer()
	defer w.Close()
	stdLog := log.New(w, "", 0)

	// TODO: Remove graceful when changing to go 1.8
	httpServer := &graceful.Server{
		Server: &http.Server{
			ErrorLog: stdLog,
			Handler:  s.handler,
		},
		Logger:       stdLog,
		TCPKeepAlive: 5 * time.Second,
	}
	httpServer.SetKeepAlivesEnabled(true)

	if !s.ReportingDisabled {
		go reportUsageStats(s.BuildInfo, logger)
	}
	scheme := "http"
	if s.useTLS() {
		scheme = "https"
	}
	logger.
		WithField("component", "server").
		Info("Serving chronograf at ", scheme, "://", s.Listener.Addr())

	if err := httpServer.Serve(s.Listener); err != nil {
		logger.
			WithField("component", "server").
			Error(err)
		return err
	}

	logger.
		WithField("component", "server").
		Info("Stopped serving chronograf at ", scheme, "://", s.Listener.Addr())

	return nil
}

func openService(ctx context.Context, boltPath string, lBuilder LayoutBuilder, sBuilder SourcesBuilder, kapBuilder KapacitorBuilder, logger chronograf.Logger, useAuth bool) Service {
	db := bolt.NewClient()
	db.Path = boltPath
	if err := db.Open(ctx); err != nil {
		logger.
			WithField("component", "boltstore").
			Error("Unable to open boltdb; is there a chronograf already running?  ", err)
		os.Exit(1)
	}

	layouts, err := lBuilder.Build(db.LayoutStore)
	if err != nil {
		logger.
			WithField("component", "LayoutStore").
			Error("Unable to construct a MultiLayoutStore", err)
		os.Exit(1)
	}

	sources, err := sBuilder.Build(db.SourcesStore)
	if err != nil {
		logger.
			WithField("component", "SourcesStore").
			Error("Unable to construct a MultiSourcesStore", err)
		os.Exit(1)
	}

	kapacitors, err := kapBuilder.Build(db.ServersStore)
	if err != nil {
		logger.
			WithField("component", "KapacitorStore").
			Error("Unable to construct a MultiKapacitorStore", err)
		os.Exit(1)
	}

	return Service{
		TimeSeriesClient: &InfluxClient{},
		SourcesStore:     sources,
		ServersStore:     kapacitors,
		UsersStore:       db.UsersStore,
		LayoutStore:      layouts,
		DashboardsStore:  db.DashboardsStore,
		AlertRulesStore:  db.AlertsStore,
		Logger:           logger,
		UseAuth:          useAuth,
		Databases:        &influx.Client{Logger: logger},
	}
}

// reportUsageStats starts periodic server reporting.
func reportUsageStats(bi BuildInfo, logger chronograf.Logger) {
	rand.Seed(time.Now().UTC().UnixNano())
	serverID := strconv.FormatUint(uint64(rand.Int63()), 10)
	reporter := client.New("")
	values := client.Values{
		"os":         runtime.GOOS,
		"arch":       runtime.GOARCH,
		"version":    bi.Version,
		"cluster_id": serverID,
		"uptime":     time.Since(startTime).Seconds(),
	}
	l := logger.WithField("component", "usage").
		WithField("reporting_addr", reporter.URL).
		WithField("freq", "24h").
		WithField("stats", "os,arch,version,cluster_id,uptime")
	l.Info("Reporting usage stats")
	_, _ = reporter.Save(clientUsage(values))

	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()
	for {
		<-ticker.C
		values["uptime"] = time.Since(startTime).Seconds()
		l.Debug("Reporting usage stats")
		go reporter.Save(clientUsage(values))
	}
}

func clientUsage(values client.Values) *client.Usage {
	return &client.Usage{
		Product: "chronograf-ng",
		Data: []client.UsageData{
			{
				Values: values,
			},
		},
	}
}
