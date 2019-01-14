package main

import (
	"flag"
	"fmt"
	"io"
	"regexp"
	"runtime"
	"time"

	"github.com/kamilsk/retry/backoff"
	"github.com/kamilsk/retry/jitter"
	"github.com/kamilsk/retry/strategy"
	"github.com/pkg/errors"
)

// Metadata holds meta information.
type Metadata struct {
	BinName                       string
	Commit, BuildDate, Version    string
	Compiler, Platform, GoVersion string
}

// Command holds command configuration.
type Command struct {
	Timeout    time.Duration
	Debug      bool
	Notify     bool
	Args       []string
	Strategies []strategy.Strategy
}

var (
	re = regexp.MustCompile(`^(\w+)(?::((?:[\w\.]+,?)+))?$`)

	compliance map[string]struct {
		cursor  interface{}
		usage   string
		handler func(*flag.Flag) (strategy.Strategy, error)
	}
	algorithms map[string]func(args string) (backoff.Algorithm, error)
	transforms map[string]func(args string) (jitter.Transformation, error)
	usage      func(output io.Writer, metadata Metadata) func()
)

func parse(output io.Writer, binary string, arguments ...string) (Command, error) {
	cmd := Command{}

	cl := flag.NewFlagSet(binary, flag.ContinueOnError)
	cl.SetOutput(output)
	cl.Usage = usage(output, Metadata{
		BinName: binary,
		Commit:  commit, BuildDate: date, Version: version,
		Compiler: runtime.Compiler, Platform: runtime.GOOS + "/" + runtime.GOARCH, GoVersion: runtime.Version(),
	})
	for name, cfg := range compliance {
		switch cursor := cfg.cursor.(type) {
		case *string:
			cl.StringVar(cursor, name, "", cfg.usage)
		case *bool:
			cl.BoolVar(cursor, name, false, cfg.usage)
		default:
			return cmd, fmt.Errorf("init: an unsupported cursor type %T", cursor)
		}
	}
	cl.DurationVar(&cmd.Timeout, "timeout", time.Minute, "Timeout for task execution")
	cl.BoolVar(&cmd.Debug, "debug", false, "show error stack trace")
	cl.BoolVar(&cmd.Notify, "notify", false, "show notification at the end (not implemented yet)")

	if err := cl.Parse(arguments); err != nil {
		if err == flag.ErrHelp {
			return cmd, err
		}
		return cmd, errors.Wrap(err, "parse")
	}

	{
		var err error
		if cmd.Strategies, err = handle(func() []*flag.Flag {
			flags := make([]*flag.Flag, 0, cl.NFlag())
			cl.Visit(func(f *flag.Flag) {
				flags = append(flags, f)
			})
			return flags
		}()); err != nil {
			return cmd, errors.Wrap(err, "parse")
		}
	}

	if cmd.Args = cl.Args(); len(cmd.Args) == 0 {
		return cmd, errors.New("please provide a command to retry")
	}

	return cmd, nil
}

func handle(flags []*flag.Flag) ([]strategy.Strategy, error) {
	strategies := make([]strategy.Strategy, 0, len(flags))

	for _, f := range flags {
		if c, ok := compliance[f.Name]; ok {
			s, err := c.handler(f)
			if err != nil {
				return nil, errors.Wrap(err, "handle")
			}
			strategies = append(strategies, s)
		}
	}

	return strategies, nil
}

func parseAlgorithm(args string) (backoff.Algorithm, error) {
	m := re.FindStringSubmatch(args)
	if len(m) < 2 {
		return nil, errors.Errorf("parse algorithm: invalid argument %s", args)
	}
	algorithm, ok := algorithms[m[1]]
	if !ok {
		return nil, errors.Errorf("parse algorithm: unknown algorithm %s", m[1])
	}
	args = ""
	if len(m) == 3 {
		args = m[2]
	}
	return algorithm(args)
}

func parseTransform(args string) (jitter.Transformation, error) {
	m := re.FindStringSubmatch(args)
	if len(m) < 2 {
		return nil, errors.Errorf("parse transformation: invalid argument %s", args)
	}
	transformation, ok := transforms[m[1]]
	if !ok {
		return nil, errors.Errorf("parse transformation: unknown transformation %s", m[1])
	}
	args = ""
	if len(m) == 3 {
		args = m[2]
	}
	return transformation(args)
}
