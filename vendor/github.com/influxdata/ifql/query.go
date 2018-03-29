/*
Package ifql contains the parser, query engine, query functions
and a basic server and HTTP client for the IFQL query language and
engine.
*/
package ifql

import (

	// Import functions

	"github.com/influxdata/ifql/complete"
	_ "github.com/influxdata/ifql/functions"
	"github.com/influxdata/ifql/query"

	"github.com/influxdata/ifql/query/control"
	"github.com/influxdata/ifql/query/execute"
	"github.com/pkg/errors"
)

func init() {
	query.FinalizeRegistration()
}

type Config struct {
	Hosts []string

	ConcurrencyQuota int
	MemoryBytesQuota int

	Verbose bool
}

// Use type aliases to expose simple API for entire project

// Controller provides a central location to manage all incoming queries.
// The controller is responsible for queueing, planning, and executing queries.
type Controller = control.Controller

// Query represents a single request.
type Query = control.Query

func NewController(conf Config) (*Controller, error) {
	s, err := execute.NewStorageReader(conf.Hosts)
	if err != nil {
		return nil, errors.Wrap(err, "failed to create storage reader")
	}
	c := control.Config{
		ConcurrencyQuota: conf.ConcurrencyQuota,
		MemoryBytesQuota: int64(conf.MemoryBytesQuota),
		ExecutorConfig: execute.Config{
			StorageReader: s,
		},
		Verbose: conf.Verbose,
	}
	return control.New(c), nil
}

// DefaultCompleter create a completer with builtin scope and declarations
func DefaultCompleter() complete.Completer {
	scope, declarations := query.BuiltIns()
	return complete.NewCompleter(scope, declarations)
}
