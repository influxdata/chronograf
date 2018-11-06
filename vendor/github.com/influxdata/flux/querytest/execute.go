package querytest

import (
	"context"
	"io"
	"math"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/control"
	"github.com/influxdata/flux/functions/inputs"
)

type Querier struct {
	c *control.Controller
}

func (q *Querier) Query(ctx context.Context, w io.Writer, c flux.Compiler, d flux.Dialect) (int64, error) {
	query, err := q.c.Query(ctx, c)
	if err != nil {
		return 0, err
	}
	results := flux.NewResultIteratorFromQuery(query)
	defer results.Cancel()

	encoder := d.Encoder()
	return encoder.Encode(w, results)
}

func NewQuerier() *Querier {
	config := control.Config{
		ConcurrencyQuota: 1,
		MemoryBytesQuota: math.MaxInt64,
	}

	c := control.New(config)

	return &Querier{
		c: c,
	}
}

func ReplaceFromSpec(q *flux.Spec, csvSrc string) {
	for _, op := range q.Operations {
		if op.Spec.Kind() == inputs.FromKind {
			op.Spec = &inputs.FromCSVOpSpec{
				File: csvSrc,
			}
		}
	}
}

func ReplaceFromWithFromInfluxJSONSpec(q *flux.Spec, jsonSrc string) {
	for _, op := range q.Operations {
		if op.Spec.Kind() == inputs.FromKind {
			op.Spec = &inputs.FromInfluxJSONOpSpec{
				File: jsonSrc,
			}
		}
	}
}
