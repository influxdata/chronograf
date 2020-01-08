package bolt_test

import (
	"context"
	"errors"
	"io/ioutil"
	"os"
	"time"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/kv/bolt"
	"github.com/influxdata/chronograf/mocks"
)

// TestNow is a set time for testing.
var TestNow = time.Date(2000, time.January, 1, 0, 0, 0, 0, time.UTC)

// TestClient wraps *bolt.Client.
type TestClient struct {
	*bolt.Client
	path string
}

// NewTestClient creates new *bolt.Client with a set time and temp path.
func NewTestClient() (*TestClient, error) {
	f, err := ioutil.TempFile("", "chronograf-bolt-")
	if err != nil {
		return nil, errors.New("unable to open temporary boltdb file")
	}
	f.Close()

	c := &TestClient{
		Client: bolt.NewClient(f.Name(), mocks.NewLogger()),
		path:   f.Name(),
	}
	c.Now = func() time.Time { return TestNow }

	build := chronograf.BuildInfo{
		Version: "version",
		Commit:  "commit",
	}

	c.Open(context.TODO(), build)

	return c, nil
}

func (c *TestClient) Close() error {
	defer os.Remove(c.path)
	return c.Client.Close()
}
