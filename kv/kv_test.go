package kv_test

import (
	"context"
	"errors"
	"io/ioutil"
	"time"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/kv"
	"github.com/influxdata/chronograf/kv/bolt"
)

// TestNow is a set time for testing.
var TestNow = time.Date(2000, time.January, 1, 0, 0, 0, 0, time.UTC)

// NewTestClient creates new *bolt.Client with a set time and temp path.
func NewTestClient() (*kv.Service, error) {
	f, err := ioutil.TempFile("", "chronograf-bolt-")
	if err != nil {
		return nil, errors.New("unable to open temporary boltdb file")
	}
	f.Close()

	build := chronograf.BuildInfo{
		Version: "version",
		Commit:  "commit",
	}

	ctx := context.TODO()
	b, err := bolt.NewClient(ctx,
		bolt.WithPath(f.Name()),
		bolt.WithNow(func() time.Time { return TestNow }),
		bolt.WithBuildInfo(build),
	)
	if err != nil {
		return nil, err
	}

	return kv.NewService(ctx, b)
}
