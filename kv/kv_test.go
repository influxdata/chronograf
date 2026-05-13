package kv_test

import (
	"bytes"
	"context"
	"encoding/binary"
	"errors"
	"io/ioutil"
	"os"
	"testing"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/kv"
	"github.com/influxdata/chronograf/kv/bolt"
	"github.com/influxdata/chronograf/kv/internal"
	"github.com/influxdata/chronograf/mocks"
	boltDB "go.etcd.io/bbolt"
	"google.golang.org/protobuf/proto"
)

var (
	sourcesBucket = []byte("Sources")
	serversBucket = []byte("Servers")
)

func idKey(id int) []byte {
	b := make([]byte, 8)
	binary.BigEndian.PutUint64(b, uint64(id))
	return b
}

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
		internal.SetSecretDEK(nil)

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
		internal.SetSecretDEK(nil)

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
		internal.SetSecretDEK(nil)

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

	t.Run("Encrypted Records Without Wrapped DEK Are Rejected", func(t *testing.T) {
		internal.SetSecretDEK(nil)

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
		if _, err := svc.SourcesStore().Add(ctx, chronograf.Source{
			Name:     "encrypted-source",
			Type:     "influx",
			Password: "pw",
			URL:      "http://localhost:8086",
		}); err != nil {
			t.Fatal(err)
		}
		if err := svc.Close(); err != nil {
			t.Fatal(err)
		}

		db, err := boltDB.Open(path, 0600, nil)
		if err != nil {
			t.Fatal(err)
		}
		if err := db.Update(func(tx *boltDB.Tx) error {
			return tx.Bucket([]byte("ConfigV1")).Delete([]byte("secrets/wrapped-dek/v1"))
		}); err != nil {
			t.Fatal(err)
		}
		if err := db.Close(); err != nil {
			t.Fatal(err)
		}

		svc, err = NewTestClientAtPath(path)
		if err != nil {
			t.Fatal(err)
		}
		defer svc.Close()
		if err := svc.InitializeSecretDEK(ctx, nil); err == nil {
			t.Fatal("expected error when encrypted records exist without wrapped DEK and master key")
		}
	})

	t.Run("Legacy Plaintext Records Are Migrated On Init", func(t *testing.T) {
		internal.SetSecretDEK(nil)

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

		src, err := svc.SourcesStore().Add(ctx, chronograf.Source{
			Name:            "legacy-source",
			Type:            "influx-v3-cloud-dedicated",
			Password:        "pw",
			SharedSecret:    "shared",
			ManagementToken: "mgmt",
			DatabaseToken:   "db",
			URL:             "http://localhost:8086",
		})
		if err != nil {
			t.Fatal(err)
		}

		srv, err := svc.ServersStore().Add(ctx, chronograf.Server{
			Name:     "legacy-server",
			SrcID:    src.ID,
			Password: "kap-pass",
			URL:      "http://localhost:9092",
		})
		if err != nil {
			t.Fatal(err)
		}

		if err := svc.InitializeSecretDEK(ctx, keyA); err != nil {
			t.Fatal(err)
		}
		if err := svc.Close(); err != nil {
			t.Fatal(err)
		}

		db, err := boltDB.Open(path, 0600, &boltDB.Options{ReadOnly: true})
		if err != nil {
			t.Fatal(err)
		}
		defer db.Close()

		if err := db.View(func(tx *boltDB.Tx) error {
			sourceRaw := tx.Bucket(sourcesBucket).Get(idKey(src.ID))
			if sourceRaw == nil {
				t.Fatalf("expected migrated source row")
			}
			var sourcePB internal.Source
			if err := proto.Unmarshal(sourceRaw, &sourcePB); err != nil {
				return err
			}
			if sourcePB.GetPasswordEncoding() != internal.SecretEncoding_ENCRYPTED_V1 ||
				sourcePB.GetSharedSecretEncoding() != internal.SecretEncoding_ENCRYPTED_V1 ||
				sourcePB.GetManagementTokenEncoding() != internal.SecretEncoding_ENCRYPTED_V1 ||
				sourcePB.GetDatabaseTokenEncoding() != internal.SecretEncoding_ENCRYPTED_V1 {
				t.Fatalf("source secret encodings were not migrated")
			}

			serverRaw := tx.Bucket(serversBucket).Get(idKey(srv.ID))
			if serverRaw == nil {
				t.Fatalf("expected migrated server row")
			}
			var serverPB internal.Server
			if err := proto.Unmarshal(serverRaw, &serverPB); err != nil {
				return err
			}
			if serverPB.GetPasswordEncoding() != internal.SecretEncoding_ENCRYPTED_V1 {
				t.Fatalf("server password encoding was not migrated")
			}
			return nil
		}); err != nil {
			t.Fatal(err)
		}
	})
}
