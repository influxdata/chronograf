package options

import (
	"github.com/influxdata/flux"
	"github.com/influxdata/flux/functions/transformations"
)

func init() {
	flux.RegisterBuiltInOption("now", transformations.SystemTime())
}
