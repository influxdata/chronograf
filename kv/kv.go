package kv

import (
	"context"
	"encoding/binary"

	"github.com/influxdata/chronograf"
	// "github.com/influxdata/chronograf/kv/bolt"
	// "github.com/influxdata/chronograf/kv/etcd"
)

var (
	cellBucket               = []byte("cellsv2")
	configBucket             = []byte("ConfigV1")
	dashboardsBucket         = []byte("Dashoard") // keep spelling for backwards compat
	layoutsBucket            = []byte("Layout")
	mappingsBucket           = []byte("MappingsV1")
	organizationConfigBucket = []byte("OrganizationConfigV1")
	organizationsBucket      = []byte("OrganizationsV1")
	serversBucket            = []byte("Servers")
)

// Store is an interface for a generic key value store. It is modeled after
// the boltdb database struct.
type Store interface {
	// View opens up a transaction that will not write to any data. Implementing interfaces
	// should take care to ensure that all view transactions do not mutate any data.
	View(context.Context, func(Tx) error) error
	// Update opens up a transaction that will mutate data.
	Update(context.Context, func(Tx) error) error
}

// Tx is a transaction in the store.
type Tx interface {
	// Bucket creates and returns bucket, b.
	Bucket(b []byte) Bucket
	// Context returns the context associated with this Tx.
	Context() context.Context
	// WithContext associates a context with this Tx.
	WithContext(ctx context.Context)
	// CreateBucketIfNotExists creates a new bucket if it doesn't already exist.
	// Returns an error if the bucket name is blank, or if the bucket name is too long.
	// The bucket instance is only valid for the lifetime of the transaction.
	CreateBucketIfNotExists(b []byte) (Bucket, error)
}

// Bucket is the abstraction used to perform get/put/delete/get-many operations
// in a key value store.
type Bucket interface {
	// Get returns a key within this bucket. Errors if key does not exist.
	Get(key []byte) ([]byte, error)
	// Put should error if the transaction it was called in is not writable.
	Put(key, value []byte) error
	// Delete should error if the transaction it was called in is not writable.
	Delete(key []byte) error
	// Cursor returns a cursor at the beginning of this bucket optionally
	// using the provided hints to improve performance.
	Cursor( /* hints ...CursorHint */ ) (Cursor, error)
	// ForwardCursor returns a forward cursor from the seek position provided.
	// Other options can be supplied to provide direction and hints.
	ForwardCursor(seek []byte /* , opts ...CursorOption */) (ForwardCursor, error)
	// NextSequence returns a unique id for the bucket.
	NextSequence() (uint64, error)
	// ForEach executes a function for each key/value pair in a bucket.
	// If the provided function returns an error then the iteration is stopped and
	// the error is returned to the caller. The provided function must not modify
	// the bucket; this will result in undefined behavior.
	ForEach(fn func(k, v []byte) error) error
}

// Cursor is an abstraction for iterating/ranging through data. A concrete implementation
// of a cursor can be found in cursor.go.
type Cursor interface {
	// Seek moves the cursor forward until reaching prefix in the key name.
	Seek(prefix []byte) (k []byte, v []byte)
	// First moves the cursor to the first key in the bucket.
	First() (k []byte, v []byte)
	// Last moves the cursor to the last key in the bucket.
	Last() (k []byte, v []byte)
	// Next moves the cursor to the next key in the bucket.
	Next() (k []byte, v []byte)
	// Prev moves the cursor to the prev key in the bucket.
	Prev() (k []byte, v []byte)
}

// ForwardCursor is an abstraction for interacting/ranging through data in one direction.
type ForwardCursor interface {
	// Next moves the cursor to the next key in the bucket.
	Next() (k, v []byte)
	// Err returns non-nil if an error occurred during cursor iteration.
	// This should always be checked after Next returns a nil key/value.
	Err() error
	// Close is reponsible for freeing any resources created by the cursor.
	Close() error
}

// Service is the struct that chronograf services are implemented on.
type Service struct {
	kv  Store
	log chronograf.Logger
}

// NewService returns an instance of a Service.
func NewService(log chronograf.Logger, kv Store) *Service {
	return &Service{
		log: log,
		kv:  kv,
	}
}

func (s *Service) initialize(ctx context.Context, tx Tx) error {
	buckets := [][]byte{
		cellBucket,
		configBucket,
		dashboardsBucket,
		layoutsBucket,
		mappingsBucket,
		organizationConfigBucket,
		organizationsBucket,
		serversBucket,
	}

	for i := range buckets {
		if _, err := tx.CreateBucketIfNotExists(buckets[i]); err != nil {
			return err
		}
	}

	return nil
}

// itob returns an 8-byte big endian representation of v.
func itob(v int) []byte {
	b := make([]byte, 8)
	binary.BigEndian.PutUint64(b, uint64(v))
	return b
}

// u64tob returns an 8-byte big endian representation of v.
func u64tob(v uint64) []byte {
	b := make([]byte, 8)
	binary.BigEndian.PutUint64(b, v)
	return b
}

func (s *Service) DashboardsStore() chronograf.DashboardsStore {
	return &dashboardsStore{client: s}
}

func (s *Service) LayoutsStore() chronograf.LayoutsStore {
	return &layoutsStore{client: s}
}

func (s *Service) MappingsStore() chronograf.MappingsStore {
	return &mappingsStore{client: s}
}

func (s *Service) OrganizationConfigStore() chronograf.OrganizationConfigStore {
	return &organizationConfigStore{client: s}
}

func (s *Service) OrganizationsStore() chronograf.OrganizationsStore {
	return &organizationsStore{client: s}
}

func (s *Service) ServersStore() chronograf.ServersStore {
	return &serversStore{client: s}
}
