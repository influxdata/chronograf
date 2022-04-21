package main

import (
	"context"
	"fmt"
	"os"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/dist"
	"github.com/influxdata/chronograf/server"
	flags "github.com/jessevdk/go-flags"
)

// Build flags
var (
	version     = ""
	commit      = ""
	fullVersion = ""
)

func init() {
	if version == "" {
		// read version from embedded files
		version = dist.GetVersion()
	}
	fullVersion = version
	if commit != "" {
		fullVersion = fmt.Sprintf("%s (git: %s)", version, commit)
	}
}

func main() {
	srv := server.Server{
		BuildInfo: chronograf.BuildInfo{
			Version: version,
			Commit:  commit,
		},
	}

	parser := flags.NewParser(&srv, flags.Default)
	parser.ShortDescription = `Chronograf`
	parser.LongDescription = `Options for Chronograf`

	if _, err := parser.Parse(); err != nil {
		code := 1
		if fe, ok := err.(*flags.Error); ok {
			if fe.Type == flags.ErrHelp {
				code = 0
			}
		}
		os.Exit(code)
	}

	if srv.ShowVersion {
		fmt.Printf("Chronograf %s\n", fullVersion)
		os.Exit(0)
	}

	srv.Serve(context.Background())
}
