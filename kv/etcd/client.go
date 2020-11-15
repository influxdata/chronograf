package etcd

import (
	"bytes"
	"context"
	"crypto/tls"
	"errors"
	"math/rand"
	"time"

	"github.com/coreos/etcd/clientv3"
	"github.com/coreos/etcd/clientv3/concurrency"
	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/kv"
	"github.com/influxdata/chronograf/mocks"
	"github.com/influxdata/chronograf/snowflake"
)

const (
	// DefaultDialTimeout is the default dial timeout for the etc client.
	DefaultDialTimeout = 5 * time.Second
	// DefaultRequestTimeout is the default request timeout for the etc client.
	DefaultRequestTimeout = 5 * time.Second
	// DefaultCacheTimeout is the default timeout for a health check when waiting for a response from the cache.
	DefaultCacheTimeout = 2 * time.Second
	// DefaultEndpoint is the default etcd endpoint.
	DefaultEndpoint = "localhost:2379"
)

var (
	_ kv.Store  = (*client)(nil)
	_ kv.Tx     = (*Tx)(nil)
	_ kv.Bucket = (*Bucket)(nil)

	generator *snowflake.Generator
)

func init() {
	generator = snowflake.New(rand.Intn(1023))
}

// client is a client for the boltDB data store.
type client struct {
	db             *clientv3.Client
	config         clientv3.Config
	logger         chronograf.Logger
	requestTimeout time.Duration
}

// NewClient creates an etcd client implementing the kv.Store interface.
func NewClient(ctx context.Context, opts ...Option) (*client, error) {
	c := &client{
		logger: mocks.NewLogger(),
		config: clientv3.Config{
			Endpoints:   []string{DefaultEndpoint},
			DialTimeout: DefaultDialTimeout,
		},
		requestTimeout: DefaultRequestTimeout,
	}

	for i := range opts {
		if err := opts[i](c); err != nil {
			return nil, err
		}
	}

	e, err := clientv3.New(c.config)
	if err != nil {
		return nil, err
	}

	c.db = e

	return c, nil
}

// Option to change behavior of Open()
type Option func(c *client) error

// WithEndpoints allows for setting the etcd hosts.
func WithEndpoints(h []string) Option {
	return func(c *client) error {
		if len(h) == 0 {
			return nil
		}
		c.config.Endpoints = h
		return nil
	}
}

// WithDialTimeout allows for setting the etcd dial timeout.
func WithDialTimeout(d time.Duration) Option {
	return func(c *client) error {
		if d < 0 {
			return nil
		}
		c.config.DialTimeout = d
		return nil
	}
}

// WithRequestTimeout allows for setting the etcd request timeout.
func WithRequestTimeout(d time.Duration) Option {
	return func(c *client) error {
		if d < 0 {
			return nil
		}
		c.requestTimeout = d
		return nil
	}
}

// WithLogger allows for setting this chronograf's logger.
func WithLogger(logger chronograf.Logger) Option {
	return func(c *client) error {
		if logger == nil {
			return nil
		}
		c.logger = logger
		return nil
	}
}

// WithLogin allows for setting the username and password to connect to the etcd cluster.
func WithLogin(u, p string) Option {
	return func(c *client) error {
		c.config.Username = u
		c.config.Password = p
		return nil
	}
}

// WithTLS allows set TLS config.
func WithTLS(tlsConfig *tls.Config) Option {
	return func(c *client) error {
		if tlsConfig != nil {
			c.config.TLS = tlsConfig
		}
		return nil
	}
}

// Close closes the backing etcd client.
func (c *client) Close() error {
	return c.db.Close()
}

// View opens up a view transaction against the database. This operation
// likely does not need to be an STM.
func (c *client) View(ctx context.Context, fn func(kv.Tx) error) error {
	ctx, cancel := context.WithTimeout(ctx, c.requestTimeout)
	defer cancel()

	return c.Apply(ctx, func(m concurrency.STM) error {
		return fn(&Tx{
			m:        m,
			ctx:      ctx,
			client:   c,
			writable: false,
		})
	})
}

// Update opens up a mutable transaction against the database. Get range
// is not supported with etcd STMs. This might be an issue, we should consider
// if this functionality works for us.
func (c *client) Update(ctx context.Context, fn func(kv.Tx) error) error {
	ctx, cancel := context.WithTimeout(ctx, c.requestTimeout)
	defer cancel()

	return c.Apply(ctx, func(m concurrency.STM) error {
		return fn(&Tx{
			m:        m,
			ctx:      ctx,
			client:   c,
			writable: true,
		})
	})
}

func (c *client) Apply(ctx context.Context, callback func(stm concurrency.STM) error) error {
	_, err := concurrency.NewSTM(c.db, func(stm concurrency.STM) error {
		return c.recoverCallback(callback, stm)
	}, concurrency.WithAbortContext(ctx))
	return err
}

func (c *client) recoverCallback(callback func(stm concurrency.STM) error, stm concurrency.STM) (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = errors.New("unknown internal transaction error")
			c.logger.Error("panic while in STM")
		}
	}()
	err = callback(stm)
	return err
}

// Tx is a etcd transaction.
type Tx struct {
	m        concurrency.STM
	client   *client
	ctx      context.Context
	writable bool
}

// Bucket creates a bucket struct with the provided bucket.
func (t *Tx) Bucket(b []byte) kv.Bucket {
	return &Bucket{
		tx:     t,
		prefix: b,
	}
}

// CreateBucketIfNotExists creates a bucket with the provided byte slice.
func (t *Tx) CreateBucketIfNotExists(b []byte) (kv.Bucket, error) {
	return &Bucket{
		tx:     t,
		prefix: b,
	}, nil
}

// Bucket is a key value bucket.
type Bucket struct {
	tx     *Tx
	prefix []byte
}

var (
	// ErrKeyNotFound is the error returned when the key requested is not found.
	ErrKeyNotFound = errors.New("key not found")
	// ErrTxNotWritable is the error returned when an mutable operation is called during
	// a non-writable transaction.
	ErrTxNotWritable = errors.New("transaction is not writable")
)

// Get gets the value at the provided key.
func (b *Bucket) Get(key []byte) ([]byte, error) {
	v := b.tx.m.Get(b.encodeKey(key))
	if len(v) == 0 {
		return nil, ErrKeyNotFound
	}
	return []byte(v), nil
}

// Put puts the provided key and value in the store.
func (b *Bucket) Put(key []byte, value []byte) error {
	if b.tx.writable {
		b.tx.m.Put(b.encodeKey(key), string(value))
		return nil
	}

	return ErrTxNotWritable
}

// Delete removes the key from the database.
func (b *Bucket) Delete(key []byte) error {
	if b.tx.writable {
		b.tx.m.Del(b.encodeKey(key))
		return nil
	}

	return ErrTxNotWritable
}

func (b *Bucket) encodeKey(key []byte) string {
	k := append([]byte{}, b.prefix...)
	k = append(k, '/')
	k = append(k, key...)
	return string(k)
}

// Pair is a struct for key value pairs.
type Pair struct {
	Key   []byte
	Value []byte
}

// ForEach loops over all bucket entries and applies fn to them.
func (b *Bucket) ForEach(fn func(k, v []byte) error) error {
	pairs, err := b.getAll(string(b.prefix))
	if err != nil {
		return err
	}

	for i := range pairs {
		err = fn(pairs[i].Key, pairs[i].Value)
		if err != nil {
			return err
		}
	}

	return nil
}

// NextSequence generates a universally unique uint64.
func (b *Bucket) NextSequence() (uint64, error) {
	return generator.Next(), nil
}

func (b *Bucket) getAll(prefix string) ([]Pair, error) {
	var startKey = prefix + "/"

	kvOpts := []clientv3.OpOption{
		clientv3.WithSort(clientv3.SortByKey, clientv3.SortAscend),
		clientv3.WithPrefix(),
	}

	r, err := b.tx.client.db.Get(context.TODO(), startKey, kvOpts...)
	if err != nil {
		return nil, err
	}

	prefixBytes := []byte(startKey)

	ps := []Pair{}
	for _, k := range r.Kvs {
		key := bytes.TrimPrefix(k.Key, prefixBytes)
		ps = append(ps, Pair{Key: key, Value: k.Value})
	}

	return ps, nil
}
