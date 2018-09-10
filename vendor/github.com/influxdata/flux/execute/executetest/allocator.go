package executetest

import (
	"math"

	"github.com/influxdata/flux/execute"
)

var UnlimitedAllocator = &execute.Allocator{
	Limit: math.MaxInt64,
}
