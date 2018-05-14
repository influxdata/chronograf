package main

import (
	"flag"
	"fmt"
	"log"
	"math"
	"os"
	"runtime"

	"github.com/influxdata/ifql"
	"github.com/influxdata/ifql/functions"
	"github.com/influxdata/ifql/functions/storage"
	"github.com/influxdata/ifql/functions/storage/pb"
	"github.com/influxdata/ifql/id"
	"github.com/influxdata/ifql/query/execute"
	"github.com/influxdata/ifql/repl"
)

var verbose = flag.Bool("v", false, "print verbose output")

var hosts = make(hostList, 0)

func init() {
	flag.Var(&hosts, "host", "An InfluxDB host to connect to. Can be provided multiple times.")
}

type hostList []string

func (l *hostList) String() string {
	return "<host>..."
}

func (l *hostList) Set(s string) error {
	*l = append(*l, s)
	return nil
}

var defaultStorageHosts = []string{"localhost:8082"}

var (
	orgID id.ID
)

func init() {
	orgID.DecodeFromString("bbbb")
}

func usage() {
	fmt.Println("Usage: ifql [OPTIONS] [query]")
	fmt.Println()
	fmt.Println("Runs queries using the IFQL engine.")
	fmt.Println()
	fmt.Println("If no query is provided an interactive REPL will be run.")
	fmt.Println()
	fmt.Println("The query argument is either a literal query, - indicating to read from stdin,")
	fmt.Println("or a path to a file prefixed with an '@'.")
	fmt.Println()
	fmt.Println("Options:")

	flag.PrintDefaults()
}

func main() {
	flag.Usage = usage
	flag.Parse()

	if len(hosts) == 0 {
		hosts = defaultStorageHosts
	}

	config := ifql.Config{
		Dependencies:     make(execute.Dependencies),
		ConcurrencyQuota: runtime.NumCPU() * 2,
		MemoryBytesQuota: math.MaxInt64,
		Verbose:          *verbose,
	}

	if err := injectDeps(config.Dependencies, hosts); err != nil {
		log.Fatal(err)
	}

	c, err := ifql.NewController(config)
	if err != nil {
		log.Fatal(err)
	}
	replCmd := repl.New(c, orgID)

	args := flag.Args()
	switch len(args) {
	case 0:
		replCmd.Run()
	case 1:
		q, err := repl.LoadQuery(args[0])
		if err != nil {
			log.Fatal(err)
		}
		err = replCmd.Input(q)
		if err != nil {
			fmt.Println(err)
		}
	default:
		flag.Usage()
		os.Exit(1)
	}
}
func injectDeps(deps execute.Dependencies, hosts []string) error {
	sr, err := pb.NewReader(storage.NewStaticLookup(hosts))
	if err != nil {
		return err
	}

	return functions.InjectFromDependencies(deps, storage.Dependencies{
		Reader: sr,
	})
}
