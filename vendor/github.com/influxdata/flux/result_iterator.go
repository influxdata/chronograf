package flux

import (
	"sort"
)

// ResultIterator allows iterating through all results synchronously.
// A ResultIterator is not thread-safe and all of the methods are expected to be
// called within the same goroutine. A ResultIterator may implement Statisticser.
type ResultIterator interface {
	// More indicates if there are more results.
	More() bool

	// Next returns the next result.
	// If More is false, Next panics.
	Next() Result

	// Release discards the remaining results and frees the currently used resources.
	// It must always be called to free resources. It can be called even if there are
	// more results. It is safe to call Release multiple times.
	Release()

	// Err reports the first error encountered.
	// Err will not report anything unless More has returned false,
	// or the query has been cancelled.
	Err() error

	// Statistics returns any statistics computed by the resultset.
	Statistics() Statistics
}

// queryResultIterator implements a ResultIterator while consuming a Query
type queryResultIterator struct {
	query    Query
	released bool
	results  ResultIterator
}

func NewResultIteratorFromQuery(q Query) ResultIterator {
	return &queryResultIterator{
		query: q,
	}
}

func (r *queryResultIterator) More() bool {
	if r.released {
		return false
	}

	if r.results == nil {
		results, ok := <-r.query.Ready()
		if !ok {
			return false
		}
		r.results = NewMapResultIterator(results)
	}
	return r.results.More()
}

func (r *queryResultIterator) Next() Result {
	return r.results.Next()
}

func (r *queryResultIterator) Release() {
	r.query.Done()
	r.released = true
	if r.results != nil {
		r.results.Release()
	}
}

func (r *queryResultIterator) Err() error {
	return r.query.Err()
}

func (r *queryResultIterator) Statistics() Statistics {
	stats := r.query.Statistics()
	if r.results != nil {
		stats = stats.Add(r.results.Statistics())
	}
	return stats
}

type mapResultIterator struct {
	results map[string]Result
	order   []string
}

func NewMapResultIterator(results map[string]Result) ResultIterator {
	order := make([]string, 0, len(results))
	for k := range results {
		order = append(order, k)
	}
	sort.Strings(order)
	return &mapResultIterator{
		results: results,
		order:   order,
	}
}

func (r *mapResultIterator) More() bool {
	return len(r.order) > 0
}

func (r *mapResultIterator) Next() Result {
	next := r.order[0]
	r.order = r.order[1:]
	return r.results[next]
}

func (r *mapResultIterator) Release() {
	r.results = nil
	r.order = nil
}

func (r *mapResultIterator) Err() error {
	return nil
}

func (r *mapResultIterator) Statistics() Statistics {
	var stats Statistics
	for _, result := range r.results {
		stats = stats.Add(result.Statistics())
	}
	return stats
}

type sliceResultIterator struct {
	i       int
	results []Result
}

func NewSliceResultIterator(results []Result) ResultIterator {
	return &sliceResultIterator{
		results: results,
	}
}

func (r *sliceResultIterator) More() bool {
	return r.i < len(r.results)
}

func (r *sliceResultIterator) Next() Result {
	next := r.results[r.i]
	r.i++
	return next
}

func (r *sliceResultIterator) Release() {
	r.results, r.i = nil, 0
}

func (r *sliceResultIterator) Err() error {
	return nil
}

func (r *sliceResultIterator) Statistics() Statistics {
	var stats Statistics
	for _, result := range r.results {
		stats = stats.Add(result.Statistics())
	}
	return stats
}
