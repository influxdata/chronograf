package restapi

import (
	"crypto/tls"
	"fmt"
	"log"
	"math/rand"
	"net"
	"net/http"
	"os"
	"runtime"
	"strconv"
	"sync"
	"time"

	"github.com/go-openapi/swag"
	flags "github.com/jessevdk/go-flags"
	graceful "github.com/tylerb/graceful"

	"github.com/influxdata/chronograf/bolt"
	"github.com/influxdata/chronograf/restapi/operations"

	client "github.com/influxdata/usage-client/v1"
)

const (
	schemeHTTP  = "http"
	schemeHTTPS = "https"
	schemeUnix  = "unix"
)

var defaultSchemes []string

var startTime time.Time

func init() {
	startTime = time.Now().UTC()
	defaultSchemes = []string{
		schemeHTTP,
	}
}

// NewServer creates a new api chronograf server but does not configure it
func NewServer(api *operations.ChronografAPI) *Server {
	s := new(Server)
	s.api = api
	s.serverID = uint64(rand.Int63())
	return s
}

// ConfigureAPI configures the API and handlers. Needs to be called before Serve
func (s *Server) ConfigureAPI() {
	if len(storeFlags.BoltPath) > 0 {
		c := bolt.NewClient()
		c.Path = storeFlags.BoltPath
		if err := c.Open(); err != nil {
			logger.WithField("component", "boltstore").Panic("Unable to open boltdb; is there a mrfusion already running?", err)
			panic(err)
		}
		s.store = c
	}
	if s.api != nil {
		s.handler = configureAPI(s.api, s.store)
	}
}

// ConfigureFlags configures the additional flags defined by the handlers. Needs to be called before the parser.Parse
func (s *Server) ConfigureFlags() {
	if s.api != nil {
		configureFlags(s.api)
	}
}

// Server for the chronograf API
type Server struct {
	EnabledListeners []string `long:"scheme" description:"the listeners to enable, this can be repeated and defaults to the schemes in the swagger spec"`

	SocketPath    flags.Filename `long:"socket-path" description:"the unix socket to listen on" default:"/var/run/chronograf.sock"`
	domainSocketL net.Listener

	Host        string `long:"host" description:"the IP to listen on" default:"localhost" env:"HOST"`
	Port        int    `long:"port" description:"the port to listen on for insecure connections, defaults to a random value" env:"PORT"`
	httpServerL net.Listener

	TLSHost           string         `long:"tls-host" description:"the IP to listen on for tls, when not specified it's the same as --host" env:"TLS_HOST"`
	TLSPort           int            `long:"tls-port" description:"the port to listen on for secure connections, defaults to a random value" env:"TLS_PORT"`
	TLSCertificate    flags.Filename `long:"tls-certificate" description:"the certificate to use for secure connections" env:"TLS_CERTIFICATE"`
	TLSCertificateKey flags.Filename `long:"tls-key" description:"the private key to use for secure conections" env:"TLS_PRIVATE_KEY"`
	httpsServerL      net.Listener

	api          *operations.ChronografAPI
	handler      http.Handler
	hasListeners bool

	reportingDisabled bool `long:"reporting-diabled" description:"disable server reporting and registration" default:false env:"CHRONOGRAF_REPORTING_DISABLED"`
	serverID          uint64
	store             *bolt.Client
}

// Logf logs message either via defined user logger or via system one if no user logger is defined.
func (s *Server) Logf(f string, args ...interface{}) {
	if s.api != nil && s.api.Logger != nil {
		s.api.Logger(f, args...)
	} else {
		log.Printf(f, args...)
	}
}

// Fatalf logs message either via defined user logger or via system one if no user logger is defined.
// Exits with non-zero status after printing
func (s *Server) Fatalf(f string, args ...interface{}) {
	if s.api != nil && s.api.Logger != nil {
		s.api.Logger(f, args...)
		os.Exit(1)
	} else {
		log.Fatalf(f, args...)
	}
}

// SetAPI configures the server with the specified API. Needs to be called before Serve
func (s *Server) SetAPI(api *operations.ChronografAPI) {
	if api == nil {
		s.api = nil
		s.handler = nil
		return
	}

	s.api = api
	s.api.Logger = log.Printf
	s.handler = configureAPI(api, s.store)
}

func (s *Server) hasScheme(scheme string) bool {
	schemes := s.EnabledListeners
	if len(schemes) == 0 {
		schemes = defaultSchemes
	}

	for _, v := range schemes {
		if v == scheme {
			return true
		}
	}
	return false
}

// Serve the api
func (s *Server) Serve() (err error) {
	if !s.hasListeners {
		if err := s.Listen(); err != nil {
			return err
		}
	}

	var wg sync.WaitGroup

	if s.hasScheme(schemeUnix) {
		domainSocket := &graceful.Server{Server: new(http.Server)}
		domainSocket.Handler = s.handler

		wg.Add(1)
		s.Logf("Serving chronograf at unix://%s", s.SocketPath)
		go func(l net.Listener) {
			defer wg.Done()
			if err := domainSocket.Serve(l); err != nil {
				s.Fatalf("%v", err)
			}
			s.Logf("Stopped serving chronograf at unix://%s", s.SocketPath)
		}(s.domainSocketL)
	}

	if s.hasScheme(schemeHTTP) {
		httpServer := &graceful.Server{Server: new(http.Server)}
		httpServer.SetKeepAlivesEnabled(true)
		httpServer.TCPKeepAlive = 3 * time.Minute
		httpServer.Handler = s.handler

		wg.Add(1)
		s.Logf("Serving chronograf at http://%s", s.httpServerL.Addr())
		go func(l net.Listener) {
			defer wg.Done()
			if err := httpServer.Serve(l); err != nil {
				s.Fatalf("%v", err)
			}
			s.Logf("Stopped serving chronograf at http://%s", l.Addr())
		}(s.httpServerL)
	}

	if s.hasScheme(schemeHTTPS) {
		httpsServer := &graceful.Server{Server: new(http.Server)}
		httpsServer.SetKeepAlivesEnabled(true)
		httpsServer.TCPKeepAlive = 3 * time.Minute
		httpsServer.Handler = s.handler

		httpsServer.TLSConfig = new(tls.Config)
		httpsServer.TLSConfig.NextProtos = []string{"http/1.1"}
		// https://www.owasp.org/index.php/Transport_Layer_Protection_Cheat_Sheet#Rule_-_Only_Support_Strong_Protocols
		httpsServer.TLSConfig.MinVersion = tls.VersionTLS12
		httpsServer.TLSConfig.Certificates = make([]tls.Certificate, 1)
		httpsServer.TLSConfig.Certificates[0], err = tls.LoadX509KeyPair(string(s.TLSCertificate), string(s.TLSCertificateKey))

		configureTLS(httpsServer.TLSConfig)

		if err != nil {
			return err
		}

		wg.Add(1)
		s.Logf("Serving chronograf at https://%s", s.httpsServerL.Addr())
		go func(l net.Listener) {
			defer wg.Done()
			if err := httpsServer.Serve(l); err != nil {
				s.Fatalf("%v", err)
			}
			s.Logf("Stopped serving chronograf at https://%s", l.Addr())
		}(tls.NewListener(s.httpsServerL, httpsServer.TLSConfig))
	}

	if !s.reportingDisabled {
		go s.startServerReporting()
	}

	wg.Wait()
	return nil
}

// Listen creates the listeners for the server
func (s *Server) Listen() error {
	if s.hasListeners { // already done this
		return nil
	}

	if s.hasScheme(schemeHTTPS) { // exit early on missing params
		if s.TLSCertificate == "" {
			if s.TLSCertificateKey == "" {
				s.Fatalf("the required flags `--tls-certificate` and `--tls-key` were not specified")
			}
			s.Fatalf("the required flag `--tls-certificate` was not specified")
		}
		if s.TLSCertificateKey == "" {
			s.Fatalf("the required flag `--tls-key` was not specified")
		}

		// Use http host if https host wasn't defined
		if s.TLSHost == "" {
			s.TLSHost = s.Host
		}
	}

	if s.hasScheme(schemeUnix) {
		domSockListener, err := net.Listen("unix", string(s.SocketPath))
		if err != nil {
			return err
		}
		s.domainSocketL = domSockListener
	}

	if s.hasScheme(schemeHTTP) {
		listener, err := net.Listen("tcp", net.JoinHostPort(s.Host, strconv.Itoa(s.Port)))
		if err != nil {
			return err
		}

		h, p, err := swag.SplitHostPort(listener.Addr().String())
		if err != nil {
			return err
		}
		s.Host = h
		s.Port = p
		s.httpServerL = listener
	}

	if s.hasScheme(schemeHTTPS) {
		tlsListener, err := net.Listen("tcp", net.JoinHostPort(s.TLSHost, strconv.Itoa(s.TLSPort)))
		if err != nil {
			return err
		}

		sh, sp, err := swag.SplitHostPort(tlsListener.Addr().String())
		if err != nil {
			return err
		}
		s.TLSHost = sh
		s.TLSPort = sp
		s.httpsServerL = tlsListener
	}

	s.hasListeners = true
	return nil
}

// Shutdown server and clean up resources
func (s *Server) Shutdown() error {
	s.api.ServerShutdown()
	return nil
}

// GetHandler returns a handler useful for testing
func (s *Server) GetHandler() http.Handler {
	return s.handler
}

// SetHandler allows for setting a http handler on this server
func (s *Server) SetHandler(handler http.Handler) {
	s.handler = handler
}

// startServerReporting starts periodic server reporting.
func (s *Server) startServerReporting() {
	s.reportServer()

	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()
	for {
		select {
		// // TODO: Wire up a closing channel when autogen code is removed.
		// case <-s.closing:
		// 	return
		case <-ticker.C:
			s.reportServer()
		}
	}
}

// reportServer reports usage statistics about the system.
func (s *Server) reportServer() {
	// TODO: Add collection for the number of users.
	var numSources, numLayouts, numExplorations, numServers int

	if s.store != nil {
		if n, err := s.store.SourcesStore.All(nil); err != nil {
			s.Logf("Failed to collect sources statistic: %s", err)
			return
		} else {
			numSources = len(n)
		}
		if n, err := s.store.LayoutStore.All(nil); err != nil {
			s.Logf("Failed to collect usage statistics: %s", err)
			return
		} else {
			numLayouts = len(n)
		}
		// TODO: Add the ExplorationStore.All to mrfusion.ExplorationStore interface.
		if n, err := s.store.ExplorationStore.All(nil); err != nil {
			s.Logf("Failed to collect usage statistics: %s", err)
			return
		} else {
			numExplorations = len(n)
		}
		if n, err := s.store.ServersStore.All(nil); err != nil {
			s.Logf("Failed to collect usage statistics: %s", err)
			return
		} else {
			numServers = len(n)
		}
	} else {
		s.Logf("Failed to collect usage statistics: Server not set", nil)
	}

	s.Logf("Reporting stats: Sources: %v, Layouts: %v, Explorations: %v, Servers: %v", numSources, numLayouts, numExplorations, numServers)

	cl := client.New("")
	usage := client.Usage{
		Product: "chronograf",
		Data: []client.UsageData{
			{
				Values: client.Values{
					"os":   runtime.GOOS,
					"arch": runtime.GOARCH,
					// TODO: Fill in version when autogen code is removed.
					// "version":          s.buildInfo.Version,
					"cluster_id":       fmt.Sprintf("%v", s.serverID),
					"num_sources":      numSources,
					"num_layouts":      numLayouts,
					"num_explorations": numExplorations,
					"num_servers":      numServers,
					"uptime":           time.Since(startTime).Seconds(),
				},
			},
		},
	}

	s.Logf("Sending usage statistics to %s", cl.URL)

	go cl.Save(usage)
}
