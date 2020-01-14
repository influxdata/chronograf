package bolt_test

import (
	"context"
	"errors"
	"io/ioutil"
	"os"
	"time"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/kv"
	"github.com/influxdata/chronograf/kv/bolt"
	"github.com/influxdata/chronograf/mocks"
)

// TestNow is a set time for testing.
var TestNow = time.Date(2000, time.January, 1, 0, 0, 0, 0, time.UTC)

// TestClient wraps *bolt.Client.
type TestClient struct {
	Client kv.Store
	path   string
}

// NewTestClient creates new *bolt.Client with a set time and temp path.
func NewTestClient() (*TestClient, chronograf.ConfigStore, error) {
	f, err := ioutil.TempFile("", "chronograf-bolt-")
	if err != nil {
		return nil, nil, errors.New("unable to open temporary boltdb file")
	}
	f.Close()

	b := bolt.NewClient(f.Name(), mocks.NewLogger())
	b.Now = func() time.Time { return TestNow }

	c := &TestClient{
		Client: b,
		path:   f.Name(),
	}

	build := chronograf.BuildInfo{
		Version: "version",
		Commit:  "commit",
	}

	err = b.Open(context.TODO(), build)
	if err != nil {
		return nil, nil, err
	}

	return c, b.ConfigStore(), nil
}

func (c *TestClient) Close() error {
	defer os.Remove(c.path)
	return c.Client.Close()
}
