package etcd

/*
import (
	"context"

	"github.com/coreos/etcd/clientv3"
	conc "github.com/coreos/etcd/clientv3/concurrency"
	"github.com/influxdata/chronograf/kv"
	"go.uber.org/zap"
)

// KVStore is a key value store backed by etcd.
type KVStore struct {
	client *client
}

// NewKVStore creates an instance of a KVStore.
func NewKVStore(c Config, l chronograf.Logger) *KVStore {
	return &KVStore{
		client: newEtcdClient(c, l),
	}
}

// Open opens the backing etcd client.
func (s *KVStore) Open() error {
	return s.client.Open()
}

// Close closes the backing etcd client.
func (s *KVStore) Close() error {
	return s.client.Close()
}

// View opens up a view transaction against the database. This operation
// likely does not need to be an STM.
func (s *KVStore) View(ctx context.Context, fn func(kv.Tx) error) error {
	return s.client.Apply(ctx, func(m conc.STM) error {
		return fn(&Tx{
			m:        m,
			ctx:      ctx,
			client:   s.client,
			writable: false,
		})
	})
}

// Update opens up a mutable transaction against the database. Get range
// is not supported with etcd STMs. This might be an issue, we should consider
// if this functionality works for us.
func (s *KVStore) Update(ctx context.Context, fn func(kv.Tx) error) error {
	return s.client.Apply(ctx, func(m conc.STM) error {
		return fn(&Tx{
			m:        m,
			ctx:      ctx,
			client:   s.client,
			writable: true,
		})
	})
}

func (c *client) Apply(ctx context.Context, callback func(stm conc.STM) error) error {
	_, err := conc.NewSTM(c.client, func(stm conc.STM) error {
		return c.recoverCallback(callback, stm)
	}, conc.WithAbortContext(ctx))
	return err
}

func (c *client) recoverCallback(callback func(stm conc.STM) (error, stm conc.STM)) (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = errors.New("unknown internal transaction error")
			c.logger.Error("panic while in STM")
		}
	}()
	err = callback(stm)
	return err
}

// // Check checks to ensure we can connect to etcd and etcd is healthy
// func (s *KVStore) Check(ctx context.Context) check.Response {
// 	resp := check.Response{Name: "ETCD KVStore", Status: check.StatusPass}

// 	eps := s.client.client.Endpoints()
// 	if len(eps) == 0 {
// 		resp.Status = check.StatusFail
// 		resp.Message = "no endpoints found"
// 		return resp
// 	}

// 	r, err := http.Get(eps[0] + "/health")
// 	if err != nil {
// 		resp.Status = check.StatusFail
// 		resp.Message = fmt.Sprintf("request error: %s", err)
// 		return resp
// 	}
// 	defer r.Body.Close()

// 	if r.StatusCode/100 != 2 {
// 		resp.Status = check.StatusFail
// 		resp.Message = fmt.Sprintf("invalid response code: %d", r.StatusCode)
// 		return resp
// 	}

// 	return resp
// }

// Tx is a etcd transaction.
type Tx struct {
	m        conc.STM
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

// Bucket is a key value bucket.
type Bucket struct {
	tx     *Tx
	prefix []byte
}

// Get gets the value at the provided key.
func (b *Bucket) Get(key []byte) ([]byte, error) {
	v := b.tx.m.Get(b.encodeKey(key))
	if len(v) == 0 {
		return nil, kv.ErrKeyNotFound
	}
	return []byte(v), nil
}

// Put puts the provided key and value in the store.
func (b *Bucket) Put(key []byte, value []byte) error {
	if b.tx.writable {
		b.tx.m.Put(b.encodeKey(key), string(value))
		return nil
	}

	return kv.ErrTxNotWritable
}

// Delete removes the key from the database.
func (b *Bucket) Delete(key []byte) error {
	if b.tx.writable {
		b.tx.m.Del(b.encodeKey(key))
		return nil
	}

	return kv.ErrTxNotWritable
}

func (b *Bucket) encodeKey(key []byte) string {
	k := append([]byte{}, b.prefix...)
	k = append(k, '/')
	k = append(k, key...)
	return string(k)
}
*/
