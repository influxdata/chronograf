package transformations

import (
	"github.com/influxdata/flux"
)

func init() {
	flux.RegisterBuiltIn("top-bottom", topBottomBuiltIn)
	// TODO(nathanielc): Provide an implementation of top/bottom transformation that can use a more efficient sort based on the limit.
	// This transformation should be used when ever the planner sees a sort |> limit pair of procedures.
}

var topBottomBuiltIn = `
// _sortLimit is a helper function, which sorts and limits a table.
_sortLimit = (n, desc, columns=["_value"], tables=<-) =>
    tables
        |> sort(columns:columns, desc:desc)
        |> limit(n:n)

// top sorts a table by columns and keeps only the top n records.
top = (n, columns=["_value"], tables=<-) =>
    tables
        |> _sortLimit(n:n, columns:columns, desc:true)

// top sorts a table by columns and keeps only the bottom n records.
bottom = (n, columns=["_value"], tables=<-) =>
    tables
        |> _sortLimit(n:n, columns:columns, desc:false)

// _highestOrLowest is a helper function, which reduces all groups into a single group by specific tags and a reducer function,
// then it selects the highest or lowest records based on the columns and the _sortLimit function.
// The default reducer assumes no reducing needs to be performed.
_highestOrLowest = (n, _sortLimit, reducer, columns=["_value"], by=[], tables=<-) =>
    tables
        |> group(by:by)
        |> reducer()
        |> group(none:true)
        |> _sortLimit(n:n, columns:columns)

// highestMax returns the top N records from all groups using the maximum of each group.
highestMax = (n, columns=["_value"], by=[], tables=<-) =>
    tables
        |> _highestOrLowest(
                n:n,
                columns:columns,
                by:by,
                // TODO(nathanielc): Once max/min support selecting based on multiple columns change this to pass all columns.
                reducer: (tables=<-) => tables |> max(column:columns[0]),
                _sortLimit: top,
            )

// highestAverage returns the top N records from all groups using the average of each group.
highestAverage = (n, columns=["_value"], by=[], tables=<-) =>
    tables
        |> _highestOrLowest(
                n:n,
                columns:columns,
                by:by,
                reducer: (tables=<-) => tables |> mean(columns:[columns[0]]),
                _sortLimit: top,
            )

// highestCurrent returns the top N records from all groups using the last value of each group.
highestCurrent = (n, columns=["_value"], by=[], tables=<-) =>
    tables
        |> _highestOrLowest(
                n:n,
                columns:columns,
                by:by,
                reducer: (tables=<-) => tables |> mean(columns:columns),
                _sortLimit: top,
            )

// lowestMin returns the bottom N records from all groups using the minimum of each group.
lowestMin = (n, columns=["_value"], by=[], tables=<-) =>
    tables
        |> _highestOrLowest(
                n:n,
                columns:columns,
                by:by,
                // TODO(nathanielc): Once max/min support selecting based on multiple columns change this to pass all columns.
                reducer: (tables=<-) => tables |> min(column:columns[0]),
                _sortLimit: bottom,
            )

// lowestAverage returns the bottom N records from all groups using the average of each group.
lowestAverage = (n, columns=["_value"], by=[], tables=<-) =>
    tables
        |> _highestOrLowest(
                n:n,
                columns:columns,
                by:by,
                reducer: (tables=<-) => tables |> mean(columns:columns),
                _sortLimit: bottom,
            )

// lowestCurrent returns the bottom N records from all groups using the last value of each group.
lowestCurrent = (n, columns=["_value"], by=[], tables=<-) =>
    tables
        |> _highestOrLowest(
                n:n,
                columns:columns,
                by:by,
                reducer: (tables=<-) => tables |> last(column:columns[0]),
                _sortLimit: bottom,
            )
`
