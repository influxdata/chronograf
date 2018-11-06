package flux

import "time"

// Query represents an active query.
type Query interface {
	// Spec returns the spec used to execute this query.
	// Spec must not be modified.
	Spec() *Spec

	// Ready returns a channel that will deliver the query results.
	// Its possible that the channel is closed before any results arrive,
	// in which case the query should be inspected for an error using Err().
	Ready() <-chan map[string]Result

	// Done must always be called to free resources.
	Done()

	// Cancel will stop the query execution.
	// Done must still be called to free resources.
	// It is safe to call Cancel multiple times.
	Cancel()

	// Err reports any error the query may have encountered.
	Err() error

	Statisticser
}

// Statisticser reports statisitcs about query processing.
type Statisticser interface {
	// Statistics reports the statisitcs for the query.
	// The statisitcs are not complete until the query is finished.
	Statistics() Statistics
}

// Statistics is a collection of statisitcs about the processing of a query.
type Statistics struct {
	// TotalDuration is the total amount of time in nanoseconds spent.
	TotalDuration time.Duration `json:"total_duration"`
	// CompileDuration is the amount of time in nanoseconds spent compiling the query.
	CompileDuration time.Duration `json:"compile_duration"`
	// QueueDuration is the amount of time in nanoseconds spent queueing.
	QueueDuration time.Duration `json:"queue_duration"`
	// PlanDuration is the amount of time in nanoseconds spent in plannig the query.
	PlanDuration time.Duration `json:"plan_duration"`
	// RequeueDuration is the amount of time in nanoseconds spent requeueing.
	RequeueDuration time.Duration `json:"requeue_duration"`
	// ExecuteDuration is the amount of time in nanoseconds spent in executing the query.
	ExecuteDuration time.Duration `json:"execute_duration"`

	// Concurrency is the number of goroutines allocated to process the query
	Concurrency int `json:"concurrency"`
	// MaxAllocated is the maximum number of bytes the query allocated.
	MaxAllocated int64 `json:"max_allocated"`
}
