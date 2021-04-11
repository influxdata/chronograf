package main

import (
	"context"
	"fmt"
	"os"

	"github.com/hws522/chronograf"
	"github.com/hws522/chronograf/server"
	flags "github.com/jessevdk/go-flags"
)

// Build flags
var (
	version = "1.8.0"
	commit  = ""
)

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
		fmt.Printf("Chronograf %s (git: %s)\n", version, commit)
		os.Exit(0)
	}

	srv.Serve(context.Background())
}
