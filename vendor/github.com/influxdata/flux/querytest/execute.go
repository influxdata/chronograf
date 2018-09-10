package querytest

import (
	"math"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/control"
	"github.com/influxdata/flux/functions"
	"github.com/influxdata/platform"
)

var (
	staticResultID platform.ID
)

func init() {
	staticResultID.DecodeFromString("1")
}

func GetProxyQueryServiceBridge() flux.ProxyQueryServiceBridge {
	config := control.Config{
		ConcurrencyQuota: 1,
		MemoryBytesQuota: math.MaxInt64,
	}

	c := control.New(config)

	return flux.ProxyQueryServiceBridge{
		QueryService: flux.QueryServiceBridge{
			AsyncQueryService: c,
		},
	}
}

func ReplaceFromSpec(q *flux.Spec, csvSrc string) {
	for _, op := range q.Operations {
		if op.Spec.Kind() == functions.FromKind {
			op.Spec = &functions.FromCSVOpSpec{
				File: csvSrc,
			}
		}
	}
}
