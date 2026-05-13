package kv_test

import (
	"bytes"
	"context"
	"errors"
	"io/ioutil"
	"os"
	"testing"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/kv"
	"github.com/influxdata/chronograf/kv/bolt"
	"github.com/influxdata/chronograf/mocks"
)

// NewTestClient creates new *bolt.Client with a set time and temp path.
func NewTestClient() (*kv.Service, error) {
	f, err := ioutil.TempFile("", "chronograf-bolt-")
	if err != nil {
		return nil, errors.New("unable to open temporary boltdb file")
	}
	if err := f.Close(); err != nil {
		return nil, err
	}

	return NewTestClientAtPath(f.Name())
}

// NewTestClientAtPath creates new *bolt.Client using the provided boltdb path.
func NewTestClientAtPath(path string) (*kv.Service, error) {
	build := chronograf.BuildInfo{
		Version: "version",
		Commit:  "commit",
	}

	ctx := context.TODO()
	b, err := bolt.NewClient(ctx,
		bolt.WithPath(path),
		bolt.WithBuildInfo(build),
	)
	if err != nil {
		return nil, err
	}

	return kv.NewService(ctx, b, kv.WithLogger(mocks.NewLogger()))
}

func TestInitializeSecretDEK(t *testing.T) {
	ctx := context.TODO()
	keyA := bytes.Repeat([]byte{0x11}, 32)
	keyB := bytes.Repeat([]byte{0x22}, 32)

	t.Run("Round Trip With Persisted Wrapped DEK", func(t *testing.T) {
		f, err := ioutil.TempFile("", "chronograf-bolt-")
		if err != nil {
			t.Fatal(err)
		}
		path := f.Name()
		if err := f.Close(); err != nil {
			t.Fatal(err)
		}
		defer os.Remove(path)

		svc, err := NewTestClientAtPath(path)
		if err != nil {
			t.Fatal(err)
		}
		if err := svc.InitializeSecretDEK(ctx, keyA); err != nil {
			t.Fatal(err)
		}
		src, err := svc.SourcesStore().Add(ctx, chronograf.Source{
			Name:     "src",
			Type:     "influx",
			Password: "p@ssw0rd",
			URL:      "http://localhost:8086",
		})
		if err != nil {
			t.Fatal(err)
		}
		if err := svc.Close(); err != nil {
			t.Fatal(err)
		}

		svc, err = NewTestClientAtPath(path)
		if err != nil {
			t.Fatal(err)
		}
		defer svc.Close()
		if err := svc.InitializeSecretDEK(ctx, keyA); err != nil {
			t.Fatal(err)
		}
		got, err := svc.SourcesStore().Get(ctx, src.ID)
		if err != nil {
			t.Fatal(err)
		}
		if got.Password != "p@ssw0rd" {
			t.Fatalf("unexpected password after restart: got %q", got.Password)
		}
	})

	t.Run("Wrapped DEK Requires Master Key", func(t *testing.T) {
		f, err := ioutil.TempFile("", "chronograf-bolt-")
		if err != nil {
			t.Fatal(err)
		}
		path := f.Name()
		if err := f.Close(); err != nil {
			t.Fatal(err)
		}
		defer os.Remove(path)

		svc, err := NewTestClientAtPath(path)
		if err != nil {
			t.Fatal(err)
		}
		if err := svc.InitializeSecretDEK(ctx, keyA); err != nil {
			t.Fatal(err)
		}
		if err := svc.Close(); err != nil {
			t.Fatal(err)
		}

		svc, err = NewTestClientAtPath(path)
		if err != nil {
			t.Fatal(err)
		}
		defer svc.Close()
		if err := svc.InitializeSecretDEK(ctx, nil); err == nil {
			t.Fatal("expected error when wrapped DEK exists and master key is missing")
		}
	})

	t.Run("Wrong Master Key Is Rejected", func(t *testing.T) {
		f, err := ioutil.TempFile("", "chronograf-bolt-")
		if err != nil {
			t.Fatal(err)
		}
		path := f.Name()
		if err := f.Close(); err != nil {
			t.Fatal(err)
		}
		defer os.Remove(path)

		svc, err := NewTestClientAtPath(path)
		if err != nil {
			t.Fatal(err)
		}
		if err := svc.InitializeSecretDEK(ctx, keyA); err != nil {
			t.Fatal(err)
		}
		if err := svc.Close(); err != nil {
			t.Fatal(err)
		}

		svc, err = NewTestClientAtPath(path)
		if err != nil {
			t.Fatal(err)
		}
		defer svc.Close()
		if err := svc.InitializeSecretDEK(ctx, keyB); err == nil {
			t.Fatal("expected error when master key does not match wrapped DEK")
		}
	})
}
