package kv

import (
	"context"
	"encoding/binary"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/id"
	"github.com/influxdata/chronograf/mocks"
)

var _ chronograf.KVClient = (*Service)(nil)

var (
	cellBucket               = []byte("cellsv2")
	configBucket             = []byte("ConfigV1")
	dashboardsBucket         = []byte("Dashoard") // keep spelling for backwards compat
	mappingsBucket           = []byte("MappingsV1")
	organizationConfigBucket = []byte("OrganizationConfigV1")
	organizationsBucket      = []byte("OrganizationsV1")
	serversBucket            = []byte("Servers")
	sourcesBucket            = []byte("Sources")
	usersBucket              = []byte("UsersV2")
)

// Store is an interface for a generic key value store. It is modeled after
// the boltdb database struct.
type Store interface {
	// View opens up a transaction that will not write to any data. Implementing interfaces
	// should take care to ensure that all view transactions do not mutate any data.
	View(context.Context, func(Tx) error) error
	// Update opens up a transaction that will mutate data.
	Update(context.Context, func(Tx) error) error
	// Close closes the connection to the db.
	Close() error
}

// Tx is a transaction in the store.
type Tx interface {
	// Bucket creates and returns bucket, b.
	Bucket(b []byte) Bucket
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
	// NextSequence returns a unique id for the bucket.
	NextSequence() (uint64, error)
	// ForEach executes a function for each key/value pair in a bucket.
	// If the provided function returns an error then the iteration is stopped and
	// the error is returned to the caller. The provided function must not modify
	// the bucket; this will result in undefined behavior.
	ForEach(fn func(k, v []byte) error) error
}

// Service is the struct that chronograf services are implemented on.
type Service struct {
	kv  Store
	log chronograf.Logger
}

// Option to change behavior of Open()
type Option func(s *Service) error

// WithLogger allows setting the logger on the kv service.
func WithLogger(logger chronograf.Logger) Option {
	return func(s *Service) error {
		s.log = logger
		return nil
	}
}

// NewService returns an instance of a Service.
func NewService(ctx context.Context, kv Store, opts ...Option) (*Service, error) {
	s := &Service{
		log: mocks.NewLogger(),
		kv:  kv,
	}

	for i := range opts {
		if err := opts[i](s); err != nil {
			return nil, err
		}
	}

	if err := s.kv.Update(ctx, func(tx Tx) error {
		return s.initialize(ctx, tx)
	}); err != nil {
		return nil, err
	}

	return s, s.OrganizationsStore().CreateDefault(ctx)
}

// Close closes the service's kv store.
func (s *Service) Close() error {
	return s.kv.Close()
}

func (s *Service) initialize(ctx context.Context, tx Tx) error {
	buckets := [][]byte{
		cellBucket,
		configBucket,
		dashboardsBucket,
		mappingsBucket,
		organizationConfigBucket,
		organizationsBucket,
		serversBucket,
		sourcesBucket,
		usersBucket,
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

// ConfigStore returns a chronograf.ConfigStore.
func (s *Service) ConfigStore() chronograf.ConfigStore {
	return &configStore{client: s}
}

// DashboardsStore returns a chronograf.DashboardsStore.
func (s *Service) DashboardsStore() chronograf.DashboardsStore {
	return &dashboardsStore{client: s, IDs: &id.UUID{}}
}

// MappingsStore returns a chronograf.MappingsStore.
func (s *Service) MappingsStore() chronograf.MappingsStore {
	return &mappingsStore{client: s}
}

// OrganizationConfigStore returns a chronograf.OrganizationConfigStore.
func (s *Service) OrganizationConfigStore() chronograf.OrganizationConfigStore {
	return &organizationConfigStore{client: s}
}

// OrganizationsStore returns a chronograf.OrganizationsStore.
func (s *Service) OrganizationsStore() chronograf.OrganizationsStore {
	return &organizationsStore{client: s}
}

// ServersStore returns a chronograf.ServersStore.
func (s *Service) ServersStore() chronograf.ServersStore {
	return &serversStore{client: s}
}

// SourcesStore returns a chronograf.SourcesStore.
func (s *Service) SourcesStore() chronograf.SourcesStore {
	return &sourcesStore{client: s}
}

// UsersStore returns a chronograf.UsersStore.
func (s *Service) UsersStore() chronograf.UsersStore {
	return &usersStore{client: s}
}
