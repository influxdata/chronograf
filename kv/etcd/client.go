package etcd

import (
	"bytes"
	"context"
	"errors"
	"sort"
	"time"

	"github.com/coreos/etcd/clientv3"
	"github.com/coreos/etcd/clientv3/concurrency"
	"github.com/coreos/etcd/mvcc/mvccpb"
	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/kv"
	"github.com/influxdata/chronograf/mocks"
)

const (
	// DefaultDialTimeout is the default dial timeout for the etc client.
	DefaultDialTimeout = 5 * time.Second
	// DefaultRequestTimeout is the default request timeout for the etc client.
	DefaultRequestTimeout = 5 * time.Second
	// DefaultCacheTimeout is the default timeout for a health check when waiting for a response from the cache.
	DefaultCacheTimeout = 2 * time.Second
)

var _ kv.Store = (*client)(nil)

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
			Endpoints:   []string{"localhost:2379"},
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

// Context returns the context from the transaction.
func (t *Tx) Context() context.Context {
	return t.ctx
}

// WithContext sets the provided context on transaction.
func (t *Tx) WithContext(ctx context.Context) {
	t.ctx = ctx
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

// Cursor retrieves all keys from the bucket and creates a static cursor from them.
func (b *Bucket) Cursor() (kv.Cursor, error) {
	ps, err := b.getAll(string(b.prefix))
	if err != nil {
		return nil, err
	}
	// This creates a cursor from a static set of items
	return NewStaticCursor(ps), nil
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
//
// todo: create thing that returns a universally unique uint64.
func (b *Bucket) NextSequence() (uint64, error) {
	return 0, nil
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

// ForwardCursor retrieves all keys from the bucket and creates a static cursor from them.
func (b *Bucket) ForwardCursor(seek []byte) (kv.ForwardCursor, error) {
	ctx := context.Background()

	kvs, err := fetch(ctx, b.tx.client, string(b.prefix), seek)
	if err != nil {
		return nil, err
	}

	cursor := &ForwardCursor{
		kvs:    kvs,
		prefix: append(b.prefix, '/'),
	}

	return cursor, nil
}

// ForwardCursor is a directional cursor.
// It has a single Next method for iteration which goes over a range response from etcd.
type ForwardCursor struct {
	kvs    []*mvccpb.KeyValue
	prefix []byte

	n      int
	closed bool
}

// Next returns the next key/value pair in the cursor.
func (f *ForwardCursor) Next() ([]byte, []byte) {
	if f.closed || f.n >= len(f.kvs) {
		return nil, nil
	}

	kv := f.kvs[f.n]

	f.n++

	return bytes.TrimPrefix(kv.Key, f.prefix), kv.Value
}

// Err returns nil as no errors can occur during iteration.
func (f *ForwardCursor) Err() error {
	return nil
}

// Close marks the cursor as closed if it hasn't already been closed.
func (f *ForwardCursor) Close() error {
	if f.closed {
		return nil
	}

	f.closed = true

	return nil
}

func fetch(ctx context.Context, client *client, prefix string, seek []byte) ([]*mvccpb.KeyValue, error) {
	var (
		rnge     = clientv3.WithFromKey()
		sort     = clientv3.SortAscend
		startKey = prefix + "/" + string(seek)
	)

	r, err := client.db.Get(ctx, startKey,
		clientv3.WithSort(clientv3.SortByKey, sort),
		rnge,
	)
	if err != nil {
		return nil, err
	}

	return r.Kvs, nil
}

// staticCursor implements the Cursor interface for a slice of
// static key value pairs.
type staticCursor struct {
	idx   int
	pairs []Pair
}

// NewStaticCursor returns an instance of a StaticCursor. It
// destructively sorts the provided pairs to be in key ascending order.
func NewStaticCursor(pairs []Pair) kv.Cursor {
	sort.Slice(pairs, func(i, j int) bool {
		return bytes.Compare(pairs[i].Key, pairs[j].Key) < 0
	})
	return &staticCursor{
		pairs: pairs,
	}
}

// Seek searches the slice for the first key with the provided prefix.
func (c *staticCursor) Seek(prefix []byte) ([]byte, []byte) {
	// TODO: do binary search for prefix since pairs are ordered.
	for i, pair := range c.pairs {
		if bytes.HasPrefix(pair.Key, prefix) {
			c.idx = i
			return pair.Key, pair.Value
		}
	}

	return nil, nil
}

func (c *staticCursor) getValueAtIndex(delta int) ([]byte, []byte) {
	idx := c.idx + delta
	if idx < 0 {
		return nil, nil
	}

	if idx >= len(c.pairs) {
		return nil, nil
	}

	c.idx = idx

	pair := c.pairs[c.idx]

	return pair.Key, pair.Value
}

// First retrieves the first element in the cursor.
func (c *staticCursor) First() ([]byte, []byte) {
	return c.getValueAtIndex(-c.idx)
}

// Last retrieves the last element in the cursor.
func (c *staticCursor) Last() ([]byte, []byte) {
	return c.getValueAtIndex(len(c.pairs) - 1 - c.idx)
}

// Next retrieves the next entry in the cursor.
func (c *staticCursor) Next() ([]byte, []byte) {
	return c.getValueAtIndex(1)
}

// Prev retrieves the previous entry in the cursor.
func (c *staticCursor) Prev() ([]byte, []byte) {
	return c.getValueAtIndex(-1)
}
