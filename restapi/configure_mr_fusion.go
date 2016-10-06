package restapi

import (
	"crypto/tls"
	"fmt"
	"net/http"
	"strings"

	errors "github.com/go-openapi/errors"
	runtime "github.com/go-openapi/runtime"
	middleware "github.com/go-openapi/runtime/middleware"
	"github.com/go-openapi/swag"
	"golang.org/x/net/context"

	"github.com/influxdata/mrfusion"
	"github.com/influxdata/mrfusion/bolt"
	"github.com/influxdata/mrfusion/dist"
	"github.com/influxdata/mrfusion/handlers"
	"github.com/influxdata/mrfusion/influx"
	fusionlog "github.com/influxdata/mrfusion/log"
	"github.com/influxdata/mrfusion/mock"
	op "github.com/influxdata/mrfusion/restapi/operations"
)

// This file is safe to edit. Once it exists it will not be overwritten

//go:generate swagger generate server --target .. --name  --spec ../swagger.yaml --with-context

var logger = fusionlog.New()

var devFlags = struct {
	Develop bool `short:"d" long:"develop" description:"Run server in develop mode."`
}{}

var storeFlags = struct {
	BoltPath string `short:"b" long:"bolt-path" description:"Full path to boltDB file (/Users/somebody/mrfusion.db)" env:"BOLT_PATH" default:"chronograf.db"`
}{}

func configureFlags(api *op.MrFusionAPI) {
	api.CommandLineOptionsGroups = []swag.CommandLineOptionsGroup{
		swag.CommandLineOptionsGroup{
			ShortDescription: "Develop Mode server",
			LongDescription:  "Server will use the ui/build directory directly.",
			Options:          &devFlags,
		},
		swag.CommandLineOptionsGroup{
			ShortDescription: "Default Store Backend",
			LongDescription:  "Specify the path to a BoltDB file",
			Options:          &storeFlags,
		},
	}
}

func assets() mrfusion.Assets {
	if devFlags.Develop {
		return &dist.DebugAssets{
			Dir:     "ui/build",
			Default: "ui/build/index.html",
		}
	}
	return &dist.BindataAssets{
		Prefix:  "ui/build",
		Default: "index.html",
	}
}

func configureAPI(api *op.MrFusionAPI) http.Handler {
	// configure the api here
	api.ServeError = errors.ServeError

	// Set your custom logger if needed. Default one is log.Printf
	// Expected interface func(string, ...interface{})
	//
	// Example:
	api.Logger = func(msg string, args ...interface{}) {
		logger.
			WithField("component", "api").
			Info(fmt.Sprintf(msg, args))
	}

	api.JSONConsumer = runtime.JSONConsumer()

	api.JSONProducer = runtime.JSONProducer()

	mockHandler := mock.NewHandler()

	api.GetHandler = op.GetHandlerFunc(mockHandler.AllRoutes)

	if len(storeFlags.BoltPath) > 0 {
		c := bolt.NewClient()
		c.Path = storeFlags.BoltPath
		if err := c.Open(); err != nil {
			panic(err)
		}
		h := handlers.Store{
			ExplorationStore: c.ExplorationStore,
			SourcesStore:     c.SourcesStore,
		}
		api.DeleteSourcesIDUsersUserIDExplorationsExplorationIDHandler = op.DeleteSourcesIDUsersUserIDExplorationsExplorationIDHandlerFunc(h.DeleteExploration)
		api.GetSourcesIDUsersUserIDExplorationsExplorationIDHandler = op.GetSourcesIDUsersUserIDExplorationsExplorationIDHandlerFunc(h.Exploration)
		api.GetSourcesIDUsersUserIDExplorationsHandler = op.GetSourcesIDUsersUserIDExplorationsHandlerFunc(h.Explorations)
		api.PatchSourcesIDUsersUserIDExplorationsExplorationIDHandler = op.PatchSourcesIDUsersUserIDExplorationsExplorationIDHandlerFunc(h.UpdateExploration)
		api.PostSourcesIDUsersUserIDExplorationsHandler = op.PostSourcesIDUsersUserIDExplorationsHandlerFunc(h.NewExploration)

		api.DeleteSourcesIDHandler = op.DeleteSourcesIDHandlerFunc(h.RemoveSource)
		api.PatchSourcesIDHandler = op.PatchSourcesIDHandlerFunc(h.UpdateSource)

		api.GetSourcesHandler = op.GetSourcesHandlerFunc(h.Sources)
		api.GetSourcesIDHandler = op.GetSourcesIDHandlerFunc(h.SourcesID)
		api.PostSourcesHandler = op.PostSourcesHandlerFunc(h.NewSource)

		ts := influx.Client{}
		p := handlers.InfluxProxy{
			Srcs:       c.SourcesStore,
			TimeSeries: &ts,
		}
		api.PostSourcesIDProxyHandler = op.PostSourcesIDProxyHandlerFunc(p.Proxy)
	} else {
		api.DeleteSourcesIDUsersUserIDExplorationsExplorationIDHandler = op.DeleteSourcesIDUsersUserIDExplorationsExplorationIDHandlerFunc(mockHandler.DeleteExploration)
		api.GetSourcesIDUsersUserIDExplorationsExplorationIDHandler = op.GetSourcesIDUsersUserIDExplorationsExplorationIDHandlerFunc(mockHandler.Exploration)
		api.GetSourcesIDUsersUserIDExplorationsHandler = op.GetSourcesIDUsersUserIDExplorationsHandlerFunc(mockHandler.Explorations)
		api.PatchSourcesIDUsersUserIDExplorationsExplorationIDHandler = op.PatchSourcesIDUsersUserIDExplorationsExplorationIDHandlerFunc(mockHandler.UpdateExploration)
		api.PostSourcesIDUsersUserIDExplorationsHandler = op.PostSourcesIDUsersUserIDExplorationsHandlerFunc(mockHandler.NewExploration)

		api.DeleteSourcesIDHandler = op.DeleteSourcesIDHandlerFunc(mockHandler.RemoveSource)
		api.PatchSourcesIDHandler = op.PatchSourcesIDHandlerFunc(mockHandler.UpdateSource)

		api.GetSourcesHandler = op.GetSourcesHandlerFunc(mockHandler.Sources)
		api.GetSourcesIDHandler = op.GetSourcesIDHandlerFunc(mockHandler.SourcesID)
		api.PostSourcesHandler = op.PostSourcesHandlerFunc(mockHandler.NewSource)
		api.PostSourcesIDProxyHandler = op.PostSourcesIDProxyHandlerFunc(mockHandler.Proxy)
	}

	api.DeleteSourcesIDRolesRoleIDHandler = op.DeleteSourcesIDRolesRoleIDHandlerFunc(func(ctx context.Context, params op.DeleteSourcesIDRolesRoleIDParams) middleware.Responder {
		return middleware.NotImplemented("operation .DeleteSourcesIDRolesRoleID has not yet been implemented")
	})

	api.DeleteSourcesIDUsersUserIDHandler = op.DeleteSourcesIDUsersUserIDHandlerFunc(func(ctx context.Context, params op.DeleteSourcesIDUsersUserIDParams) middleware.Responder {
		return middleware.NotImplemented("operation .DeleteSourcesIDUsersUserID has not yet been implemented")
	})

	api.DeleteDashboardsIDHandler = op.DeleteDashboardsIDHandlerFunc(func(ctx context.Context, params op.DeleteDashboardsIDParams) middleware.Responder {
		return middleware.NotImplemented("operation .DeleteDashboardsID has not yet been implemented")
	})
	api.GetDashboardsHandler = op.GetDashboardsHandlerFunc(func(ctx context.Context, params op.GetDashboardsParams) middleware.Responder {
		return middleware.NotImplemented("operation .GetDashboards has not yet been implemented")
	})
	api.GetDashboardsIDHandler = op.GetDashboardsIDHandlerFunc(func(ctx context.Context, params op.GetDashboardsIDParams) middleware.Responder {
		return middleware.NotImplemented("operation .GetDashboardsID has not yet been implemented")
	})

	api.GetSourcesIDPermissionsHandler = op.GetSourcesIDPermissionsHandlerFunc(func(ctx context.Context, params op.GetSourcesIDPermissionsParams) middleware.Responder {
		return middleware.NotImplemented("operation .GetSourcesIDPermissions has not yet been implemented")
	})
	api.GetSourcesIDRolesHandler = op.GetSourcesIDRolesHandlerFunc(func(ctx context.Context, params op.GetSourcesIDRolesParams) middleware.Responder {
		return middleware.NotImplemented("operation .GetSourcesIDRoles has not yet been implemented")
	})
	api.GetSourcesIDRolesRoleIDHandler = op.GetSourcesIDRolesRoleIDHandlerFunc(func(ctx context.Context, params op.GetSourcesIDRolesRoleIDParams) middleware.Responder {
		return middleware.NotImplemented("operation .GetSourcesIDRolesRoleID has not yet been implemented")
	})

	api.GetSourcesIDUsersHandler = op.GetSourcesIDUsersHandlerFunc(func(ctx context.Context, params op.GetSourcesIDUsersParams) middleware.Responder {
		return middleware.NotImplemented("operation .GetSourcesIDUsers has not yet been implemented")
	})
	api.GetSourcesIDUsersUserIDHandler = op.GetSourcesIDUsersUserIDHandlerFunc(func(ctx context.Context, params op.GetSourcesIDUsersUserIDParams) middleware.Responder {
		return middleware.NotImplemented("operation .GetSourcesIDUsersUserID has not yet been implemented")
	})

	api.PatchSourcesIDRolesRoleIDHandler = op.PatchSourcesIDRolesRoleIDHandlerFunc(func(ctx context.Context, params op.PatchSourcesIDRolesRoleIDParams) middleware.Responder {
		return middleware.NotImplemented("operation .PatchSourcesIDRolesRoleID has not yet been implemented")
	})

	api.PatchSourcesIDUsersUserIDHandler = op.PatchSourcesIDUsersUserIDHandlerFunc(func(ctx context.Context, params op.PatchSourcesIDUsersUserIDParams) middleware.Responder {
		return middleware.NotImplemented("operation .PatchSourcesIDUsersUserID has not yet been implemented")
	})
	api.PostDashboardsHandler = op.PostDashboardsHandlerFunc(func(ctx context.Context, params op.PostDashboardsParams) middleware.Responder {
		return middleware.NotImplemented("operation .PostDashboards has not yet been implemented")
	})

	api.PostSourcesIDRolesHandler = op.PostSourcesIDRolesHandlerFunc(func(ctx context.Context, params op.PostSourcesIDRolesParams) middleware.Responder {
		return middleware.NotImplemented("operation .PostSourcesIDRoles has not yet been implemented")
	})
	api.PostSourcesIDUsersHandler = op.PostSourcesIDUsersHandlerFunc(func(ctx context.Context, params op.PostSourcesIDUsersParams) middleware.Responder {
		return middleware.NotImplemented("operation .PostSourcesIDUsers has not yet been implemented")
	})

	api.PutDashboardsIDHandler = op.PutDashboardsIDHandlerFunc(func(ctx context.Context, params op.PutDashboardsIDParams) middleware.Responder {
		return middleware.NotImplemented("operation .PutDashboardsID has not yet been implemented")
	})

	api.GetSourcesIDMonitoredHandler = op.GetSourcesIDMonitoredHandlerFunc(mockHandler.MonitoredServices)

	api.ServerShutdown = func() {}

	handler := setupGlobalMiddleware(api.Serve(setupMiddlewares))
	return handler
}

// The TLS configuration before HTTPS server starts.
func configureTLS(tlsConfig *tls.Config) {
	// Make all necessary changes to the TLS configuration here.
}

// The middleware configuration is for the handler executors. These do not apply to the swagger.json document.
// The middleware executes after routing but before authentication, binding and validation
func setupMiddlewares(handler http.Handler) http.Handler {
	return handler
}

// The middleware configuration happens before anything, this middleware also applies to serving the swagger.json document.
// So this is a good place to plug in a panic handling middleware, logging and metrics
func setupGlobalMiddleware(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		logger.
			WithField("component", "server").
			WithField("remote_addr", r.RemoteAddr).
			WithField("method", r.Method).
			WithField("url", r.URL).
			Info("Serving request")

		if strings.Contains(r.URL.Path, "/chronograf/v1") {
			handler.ServeHTTP(w, r)
			return
		} else if r.URL.Path == "//" {
			http.Redirect(w, r, "/index.html", http.StatusFound)
		} else {
			assets().Handler().ServeHTTP(w, r)
			return
		}
	})
}
