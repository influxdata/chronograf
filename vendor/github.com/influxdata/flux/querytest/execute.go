package querytest

import (
	"context"
	"io"
	"math"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/control"
	"github.com/influxdata/flux/control/controltest"
)

type Querier struct {
	C *controltest.Controller
}

func (q *Querier) Query(ctx context.Context, w io.Writer, c flux.Compiler, d flux.Dialect) (int64, error) {
	query, err := q.C.Query(ctx, c)
	if err != nil {
		return 0, err
	}
	results := flux.NewResultIteratorFromQuery(query)
	defer results.Release()

	encoder := d.Encoder()
	return encoder.Encode(w, results)
}

func NewQuerier() *Querier {
	config := control.Config{
		ConcurrencyQuota: 1,
		MemoryBytesQuota: math.MaxInt64,
	}

	// Because this is for use in test, ensure that consumers properly clean up queries.
	c := controltest.New(control.New(config))

	return &Querier{
		C: c,
	}
}
