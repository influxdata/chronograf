package options

import (
	"github.com/influxdata/flux"
	"github.com/influxdata/flux/functions"
)

func init() {
	flux.RegisterBuiltInOption("now", functions.SystemTime())
}
