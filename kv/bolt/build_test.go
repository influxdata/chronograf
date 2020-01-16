package bolt

import (
	"context"
	"errors"
	"io/ioutil"
	"os"
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/chronograf"
)

// TestClient wraps *bolt.Client.
type TestClient struct {
	Client *client
	path   string
}

// NewTestClient creates new *bolt.Client with a set time and temp path.
func NewTestClient() (*TestClient, error) {
	f, err := ioutil.TempFile("", "chronograf-bolt-")
	if err != nil {
		return nil, errors.New("unable to open temporary boltdb file")
	}
	f.Close()

	ctx := context.TODO()
	b, err := NewClient(ctx,
		WithPath(f.Name()),
	)
	if err != nil {
		return nil, err
	}

	return &TestClient{
		Client: b,
		path:   f.Name(),
	}, nil
}

func (c *TestClient) Close() error {
	defer os.Remove(c.path)
	return c.Client.Close()
}

func TestBuildStore_Get(t *testing.T) {
	type wants struct {
		build chronograf.BuildInfo
		err   error
	}
	tests := []struct {
		name  string
		wants wants
	}{
		{
			name: "When the build info is missing",
			wants: wants{
				build: chronograf.BuildInfo{
					Version: "1.8.0",
					Commit:  "",
				},
			},
		},
	}
	for _, tt := range tests {
		client, err := NewTestClient()
		if err != nil {
			t.Fatal(err)
		}
		defer client.Close()

		b := client.Client.buildStore
		got, err := b.Get(context.Background())
		if (tt.wants.err != nil) != (err != nil) {
			t.Errorf("%q. BuildStore.Get() error = %v, wantErr %v", tt.name, err, tt.wants.err)
			continue
		}
		if diff := cmp.Diff(got, tt.wants.build); diff != "" {
			t.Errorf("%q. BuildStore.Get():\n-got/+want\ndiff %s", tt.name, diff)
		}
	}
}

func TestBuildStore_Update(t *testing.T) {
	type wants struct {
		build chronograf.BuildInfo
		err   error
	}
	tests := []struct {
		name  string
		wants wants
	}{
		{
			name: "When the build info is missing",
			wants: wants{
				build: chronograf.BuildInfo{
					Version: "custom",
					Commit:  "commit",
				},
			},
		},
	}
	for _, tt := range tests {
		client, err := NewTestClient()
		if err != nil {
			t.Fatal(err)
		}
		defer client.Close()

		b := client.Client.buildStore
		err = b.Update(context.Background(), tt.wants.build)
		if (tt.wants.err != nil) != (err != nil) {
			t.Errorf("%q. BuildStore.Update() error = %v, wantErr %v", tt.name, err, tt.wants.err)
			continue
		}

		got, err := b.Get(context.Background())
		if (tt.wants.err != nil) != (err != nil) {
			t.Errorf("%q. BuildStore.Get() error = %v, wantErr %v", tt.name, err, tt.wants.err)
			continue
		}

		if diff := cmp.Diff(got, tt.wants.build); diff != "" {
			t.Errorf("%q. BuildStore.Get():\n-got/+want\ndiff %s", tt.name, diff)
		}
	}
}
