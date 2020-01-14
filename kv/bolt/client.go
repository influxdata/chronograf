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
)

const (
	// ErrUnableToOpen means we had an issue establishing a connection (or creating the database)
	ErrUnableToOpen = "Unable to open boltdb; is there a chronograf already running?  %v"
	// ErrUnableToBackup means we couldn't copy the db file into ./backup
	ErrUnableToBackup = "Unable to backup your database prior to migrations:  %v"
	// ErrUnableToInitialize means we couldn't create missing Buckets (maybe a timeout)
	ErrUnableToInitialize = "Unable to boot boltdb:  %v"
	// ErrUnableToMigrate means we had an issue changing the db schema
	ErrUnableToMigrate = "Unable to migrate boltdb:  %v"
)

// var _ chronograf.KVClient = (*Client)(nil)

// Client is a client for the boltDB data store.
type Client struct {
	path   string
	db     *bolt.DB
	logger chronograf.Logger
	isNew  bool
	Now    func() time.Time

	buildStore   *BuildStore
	sourcesStore *SourcesStore
	usersStore   *UsersStore
	configStore  *ConfigStore
}

// NewClient initializes all stores
func NewClient(path string, logger chronograf.Logger) *Client {
	c := &Client{
		logger: logger,
		path:   path,
		Now:    time.Now,
	}

	c.buildStore = &BuildStore{client: c}
	c.sourcesStore = &SourcesStore{client: c}
	c.usersStore = &UsersStore{client: c}
	c.configStore = &ConfigStore{client: c}

	return c
}

// BuildStore returns a BuildStore that uses the bolt client.
func (c *Client) BuildStore() chronograf.BuildStore {
	return c.buildStore
}

// SourcesStore returns a SourcesStore that uses the bolt client.
func (c *Client) SourcesStore() chronograf.SourcesStore {
	return c.sourcesStore
}

// UsersStore returns a UsersStore that uses the bolt client.
func (c *Client) UsersStore() chronograf.UsersStore {
	return c.usersStore
}

// ConfigStore returns a ConfigStore that uses the bolt client.
func (c *Client) ConfigStore() chronograf.ConfigStore {
	return c.configStore
}

// Option to change behavior of Open()
type Option interface{}

// Open / create boltDB file.
func (c *Client) Open(ctx context.Context, build chronograf.BuildInfo, opts ...Option) error {
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

	// The test to backup was always 'true' so remove it and just run it.
	if err = c.backup(ctx, build); err != nil {
		return fmt.Errorf(ErrUnableToBackup, err)
	}

	if err = c.initialize(ctx); err != nil {
		return fmt.Errorf(ErrUnableToInitialize, err)
	}

	if err = c.migrate(ctx, build); err != nil {
		return fmt.Errorf(ErrUnableToMigrate, err)
	}

	return nil
}

// View opens up a view transaction against the store.
func (c *Client) View(ctx context.Context, fn func(tx kv.Tx) error) error {
	return c.db.View(func(tx *bolt.Tx) error {
		return fn(&Tx{
			tx:  tx,
			ctx: ctx,
		})
	})
}

// Update opens up an update transaction against the store.
func (c *Client) Update(ctx context.Context, fn func(tx kv.Tx) error) error {
	return c.db.Update(func(tx *bolt.Tx) error {
		return fn(&Tx{
			tx:  tx,
			ctx: ctx,
		})
	})
}

// s a light wrapper around a boltdb transaction. It implements kv.Tx.
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
func (c *Client) initialize(ctx context.Context) error {
	if err := c.db.Update(func(tx *bolt.Tx) error {
		// Always create SchemaVersions bucket.
		if _, err := tx.CreateBucketIfNotExists(SchemaVersionBucket); err != nil {
			return err
		}
		// Always create Sources bucket.
		if _, err := tx.CreateBucketIfNotExists(SourcesBucket); err != nil {
			return err
		}
		// Always create Users bucket.
		if _, err := tx.CreateBucketIfNotExists(UsersBucket); err != nil {
			return err
		}
		// Always create Config bucket.
		if _, err := tx.CreateBucketIfNotExists(ConfigBucket); err != nil {
			return err
		}
		// Always create Build bucket.
		if _, err := tx.CreateBucketIfNotExists(BuildBucket); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return err
	}

	return nil
}

// migrate moves data from an old schema to a new schema in each Store
func (c *Client) migrate(ctx context.Context, build chronograf.BuildInfo) error {
	if c.db != nil {
		// Runtime migrations
		// if err := c.sourcesStore.Migrate(ctx); err != nil {
		// 	return err
		// }
		if err := c.configStore.Migrate(ctx); err != nil {
			return err
		}
		if err := c.buildStore.Migrate(ctx, build); err != nil {
			return err
		}
		MigrateAll(c)
	}
	return nil
}

// Close the connection to the bolt database
func (c *Client) Close() error {
	if c.db != nil {
		return c.db.Close()
	}
	return nil
}

// copy creates a copy of the database in toFile
func (c *Client) copy(ctx context.Context, version string) error {
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

// backup makes a copy of the database to the backup/ directory, if necessary:
// - If this is a fresh install, don't create a backup and store the current version
// - If we are on the same version, don't create a backup
// - If the version has changed, create a backup and store the current version
func (c *Client) backup(ctx context.Context, build chronograf.BuildInfo) error {
	lastBuild, err := c.buildStore.Get(ctx)
	if err != nil {
		return err
	}
	if lastBuild.Version == build.Version {
		return nil
	}
	if c.isNew {
		return nil
	}

	// The database was pre-existing, and the version has changed
	// and so create a backup

	c.logger.Info("Moving from version ", lastBuild.Version)
	c.logger.Info("Moving to version ", build.Version)

	return c.copy(ctx, lastBuild.Version)
}
