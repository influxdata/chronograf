package transformations

import (
	"github.com/influxdata/flux"
)

func init() {
	flux.RegisterBuiltIn("helpers", helpersBuiltIn)
}

var helpersBuiltIn = `
// AggregateWindow applies an aggregate function to fixed windows of time.
// The procedure is to window the data, perform an aggregate operation,
// and then undo the windowing to produce an output table for every input table.
aggregateWindow = (every, fn, columns=["_value"], timeSrc="_stop",timeDst="_time", tables=<-) =>
    tables
        |> window(every:every)
        |> fn(columns:columns)
        |> duplicate(column:timeSrc,as:timeDst)
        |> window(every:inf, timeColumn:timeDst)
`
