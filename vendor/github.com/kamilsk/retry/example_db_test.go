// +build go1.8

package retry_test

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"errors"
	"fmt"
	"time"

	"github.com/kamilsk/retry"
	"github.com/kamilsk/retry/strategy"
)

type drv struct {
	conn *conn
}

func (d *drv) Open(name string) (driver.Conn, error) {
	return d.conn, nil
}

type conn struct {
	counter int
	ping    chan error
}

func (c *conn) Prepare(string) (driver.Stmt, error) { return nil, nil }

func (c *conn) Close() error { return nil }

func (c *conn) Begin() (driver.Tx, error) { return nil, nil }

func (c *conn) Ping(context.Context) error {
	c.counter++
	return <-c.ping
}

// This example shows how to use retry to restore database connection by `database/sql/driver.Pinger`.
func Example_dbConnectionRestore() {
	const total = 10

	d := &drv{conn: &conn{ping: make(chan error, total)}}
	for i := 0; i < cap(d.conn.ping); i++ {
		d.conn.ping <- nil
	}
	sql.Register("stub", d)

	MustOpen := func() *sql.DB {
		db, err := sql.Open("stub", "stub://test")
		if err != nil {
			panic(err)
		}
		return db
	}

	shutdown := make(chan struct{})
	go func(db *sql.DB, ctx context.Context, shutdown chan<- struct{}, frequency time.Duration,
		strategies ...strategy.Strategy) {

		defer func() {
			if r := recover(); r != nil {
				shutdown <- struct{}{}
			}
		}()

		ping := func(uint) error {
			return db.Ping()
		}

		for {
			if err := retry.Retry(ctx.Done(), ping, strategies...); err != nil {
				panic(err)
			}
			time.Sleep(frequency)
		}
	}(MustOpen(), context.Background(), shutdown, time.Millisecond, strategy.Limit(1))

	d.conn.ping <- errors.New("done")
	<-shutdown

	fmt.Printf("number of ping calls: %d", d.conn.counter)
	// Output: number of ping calls: 11
}
