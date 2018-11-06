package functions

// GroupMode represents the method for grouping data
type GroupMode int

const (
	// GroupModeDefault will use the default grouping of GroupModeAll.
	GroupModeDefault GroupMode = 0
	// GroupModeNone merges all series into a single group.
	GroupModeNone GroupMode = 1 << iota
	// GroupModeAll produces a separate table for each series.
	GroupModeAll
	// GroupModeBy produces a table for each unique value of the specified GroupKeys.
	GroupModeBy
	// GroupModeExcept produces a table for the unique values of all keys, except those specified by GroupKeys.
	GroupModeExcept
)
