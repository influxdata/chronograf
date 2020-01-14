package bolt

import (
	"context"
	"fmt"
	"io"
	"os"
	"path"
	"time"

	"github.com/boltdb/bolt"
	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/kv"
	"github.com/influxdata/chronograf/mocks"
)

const (
	// ErrUnableToOpen means we had an issue establishing a connection (or creating the database)
	ErrUnableToOpen = "Unable to open boltdb; is there a chronograf already running?  %v"
	// ErrUnableToBackup means we couldn't copy the db file into ./backup
	ErrUnableToBackup = "Unable to backup your database prior to migrations:  %v"
	// ErrUnableToInitialize means we couldn't create missing Buckets (maybe a timeout)
	ErrUnableToInitialize = "Unable to boot boltdb:  %v"
	// ErrUnableToUpdate means we had an issue changing the db schema
	ErrUnableToUpdate = "Unable to store new version in boltdb:  %v"
)

var (
	// Ensure client implements kv.Store interface.
	_ kv.Store = (*client)(nil)
	// Default boltdb path (from server/server.go).
	defaultBoltPath = "chronograf-v1.db"
)

// client is a client for the boltDB data store.
type client struct {
	buildInfo  chronograf.BuildInfo
	buildStore *buildStore
	db         *bolt.DB
	isNew      bool
	logger     chronograf.Logger
	now        func() time.Time
	path       string
}

// NewClient initializes bolt client implementing the kv.Store interface.
func NewClient(ctx context.Context, opts ...Option) (*client, error) {
	c := &client{
		buildInfo: defaultBuildInfo,
		path:      defaultBoltPath,
		logger:    mocks.NewLogger(),
		now:       time.Now,
	}

	for i := range opts {
		if err := opts[i](c); err != nil {
			return nil, err
		}
	}

	c.buildStore = &buildStore{client: c}

	return c, c.open(ctx)
}

// Option to change behavior of Open()
type Option func(c *client) error

// WithBuildInfo allows for setting this chronograf's build info.
func WithBuildInfo(bi chronograf.BuildInfo) Option {
	return func(c *client) error {
		c.buildInfo = bi
		return nil
	}
}

// WithLogger allows for setting this chronograf's logger.
func WithLogger(logger chronograf.Logger) Option {
	return func(c *client) error {
		c.logger = logger
		return nil
	}
}

// WithPath sets the path to the boltdb.
func WithPath(path string) Option {
	return func(c *client) error {
		c.path = path
		return nil
	}
}

// WithNow sets the function to use for the current time.
func WithNow(fn func() time.Time) Option {
	return func(c *client) error {
		c.now = fn
		return nil
	}
}

// Open opens or creates the boltDB file.
func (c *client) open(ctx context.Context) error {
	if _, err := os.Stat(c.path); os.IsNotExist(err) {
		c.isNew = true
	} else if err != nil {
		return err
	}

	// Open database file.
	db, err := bolt.Open(c.path, 0600, &bolt.Options{Timeout: 1 * time.Second})
	if err != nil {
		return fmt.Errorf(ErrUnableToOpen, err)
	}
	c.db = db

	if err = c.initialize(ctx); err != nil {
		return fmt.Errorf(ErrUnableToInitialize, err)
	}

	if !c.isNew {
		if lastBuild, err := c.buildStore.Get(ctx); err == nil && lastBuild.Version != c.buildInfo.Version {
			if err = c.backup(ctx, lastBuild, c.buildInfo); err != nil {
				return fmt.Errorf(ErrUnableToBackup, err)
			}

			if err = c.buildStore.Update(ctx, c.buildInfo); err != nil {
				return fmt.Errorf(ErrUnableToUpdate, err)
			}
		}
	}

	return nil
}

// View opens up a view transaction against the store.
func (c *client) View(ctx context.Context, fn func(tx kv.Tx) error) error {
	return c.db.View(func(tx *bolt.Tx) error {
		return fn(&Tx{
			tx:  tx,
			ctx: ctx,
		})
	})
}

// Update opens up an update transaction against the store.
func (c *client) Update(ctx context.Context, fn func(tx kv.Tx) error) error {
	return c.db.Update(func(tx *bolt.Tx) error {
		return fn(&Tx{
			tx:  tx,
			ctx: ctx,
		})
	})
}

// Tx is a light wrapper around a boltdb transaction. It implements kv.Tx.
type Tx struct {
	tx  *bolt.Tx
	ctx context.Context
}

// Context returns the context for the transaction.
func (tx *Tx) Context() context.Context {
	return tx.ctx
}

// WithContext sets the context for the transaction.
func (tx *Tx) WithContext(ctx context.Context) {
	tx.ctx = ctx
}

// CreateBucketIfNotExists creates a bucket with the provided byte slice.
func (tx *Tx) CreateBucketIfNotExists(b []byte) (kv.Bucket, error) {
	bkt, err := tx.tx.CreateBucketIfNotExists(b)
	if err != nil {
		return nil, err
	}
	return &Bucket{
		bucket: bkt,
	}, nil
}

// Bucket retrieves the bucket named b.
func (tx *Tx) Bucket(b []byte) kv.Bucket {
	return &Bucket{
		bucket: tx.tx.Bucket(b),
	}
}

// Bucket implements kv.Bucket.
type Bucket struct {
	bucket *bolt.Bucket
}

// Get retrieves the value at the provided key.
func (b *Bucket) Get(key []byte) ([]byte, error) {
	return b.bucket.Get(key), nil
}

// Put sets the value at the provided key.
func (b *Bucket) Put(key []byte, value []byte) error {
	return b.bucket.Put(key, value)
}

// Delete removes the provided key.
func (b *Bucket) Delete(key []byte) error {
	return b.bucket.Delete(key)
}

// NextSequence calls NextSequence on the bolt bucket.
func (b *Bucket) NextSequence() (uint64, error) {
	return b.bucket.NextSequence()
}

// ForwardCursor retrieves a cursor for iterating through the entries
// in the key value store in a given direction (ascending / descending).
func (b *Bucket) ForwardCursor(seek []byte) (kv.ForwardCursor, error) {
	var (
		cursor     = b.bucket.Cursor()
		key, value = cursor.Seek(seek)
	)

	return &Cursor{
		cursor: cursor,
		key:    key,
		value:  value,
	}, nil
}

// Cursor retrieves a cursor for iterating through the entries
// in the key value store.
func (b *Bucket) Cursor() (kv.Cursor, error) {
	return &Cursor{
		cursor: b.bucket.Cursor(),
	}, nil
}

// ForEach executes a function for each key/value pair in a bucket.
// If the provided function returns an error then the iteration is stopped and
// the error is returned to the caller. The provided function must not modify
// the bucket; this will result in undefined behavior.
func (b *Bucket) ForEach(fn func(k, v []byte) error) error {
	return b.bucket.ForEach(fn)
}

// Cursor is a struct for iterating through the entries
// in the key value store.
type Cursor struct {
	cursor *bolt.Cursor

	// previously seeked key/value
	key, value []byte

	closed bool
}

// Close sets the closed to closed
func (c *Cursor) Close() error {
	c.closed = true

	return nil
}

// Seek seeks for the first key that matches the prefix provided.
func (c *Cursor) Seek(prefix []byte) ([]byte, []byte) {
	if c.closed {
		return nil, nil
	}

	k, v := c.cursor.Seek(prefix)
	if len(k) == 0 && len(v) == 0 {
		return nil, nil
	}
	return k, v
}

// First retrieves the first key value pair in the bucket.
func (c *Cursor) First() ([]byte, []byte) {
	if c.closed {
		return nil, nil
	}

	k, v := c.cursor.First()
	if len(k) == 0 && len(v) == 0 {
		return nil, nil
	}
	return k, v
}

// Last retrieves the last key value pair in the bucket.
func (c *Cursor) Last() ([]byte, []byte) {
	if c.closed {
		return nil, nil
	}

	k, v := c.cursor.Last()
	if len(k) == 0 && len(v) == 0 {
		return nil, nil
	}
	return k, v
}

// Next retrieves the next key in the bucket.
func (c *Cursor) Next() (k []byte, v []byte) {
	if c.closed {
		return nil, nil
	}
	// get and unset previously seeked values if they exist
	k, v, c.key, c.value = c.key, c.value, nil, nil
	if len(k) > 0 && len(v) > 0 {
		return
	}

	k, v = c.cursor.Next()
	if len(k) == 0 && len(v) == 0 {
		return nil, nil
	}
	return k, v
}

// Prev retrieves the previous key in the bucket.
func (c *Cursor) Prev() (k []byte, v []byte) {
	if c.closed {
		return nil, nil
	}
	// get and unset previously seeked values if they exist
	k, v, c.key, c.value = c.key, c.value, nil, nil
	if len(k) > 0 && len(v) > 0 {
		return
	}

	k, v = c.cursor.Prev()
	if len(k) == 0 && len(v) == 0 {
		return nil, nil
	}
	return k, v
}

// Err always returns nil as nothing can go wrong™ during iteration
func (c *Cursor) Err() error {
	return nil
}

// initialize creates Buckets that are missing
func (c *client) initialize(ctx context.Context) error {
	if err := c.db.Update(func(tx *bolt.Tx) error {
		// Always create Build bucket.
		if _, err := tx.CreateBucketIfNotExists(buildBucket); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return err
	}

	return nil
}

// Close the connection to the bolt database
func (c *client) Close() error {
	if c.db != nil {
		return c.db.Close()
	}
	return nil
}

// backup makes a copy of the database to the backup/ directory, if necessary:
// - If this is a fresh install, don't create a backup and store the current version
// - If we are on the same version, don't create a backup
// - If the version has changed, create a backup and store the current version
func (c *client) backup(ctx context.Context, lastBuild, build chronograf.BuildInfo) error {
	// The database was pre-existing, and the version has changed
	// and so create a backup
	c.logger.Info("Moving from version ", lastBuild.Version)
	c.logger.Info("Moving to version ", build.Version)

	return c.copy(ctx, lastBuild.Version)
}

// copy creates a copy of the database in toFile
func (c *client) copy(ctx context.Context, version string) error {
	backupDir := path.Join(path.Dir(c.path), "backup")
	if _, err := os.Stat(backupDir); os.IsNotExist(err) {
		if err = os.Mkdir(backupDir, 0700); err != nil {
			return err
		}
	} else if err != nil {
		return err
	}

	fromFile, err := os.Open(c.path)
	if err != nil {
		return err
	}
	defer fromFile.Close()

	toName := fmt.Sprintf("%s.%s", path.Base(c.path), version)
	toPath := path.Join(backupDir, toName)
	toFile, err := os.OpenFile(toPath, os.O_RDWR|os.O_CREATE, 0600)
	if err != nil {
		return err
	}
	defer toFile.Close()

	_, err = io.Copy(toFile, fromFile)
	if err != nil {
		return err
	}

	c.logger.Info("Successfully created ", toPath)

	return nil
}
