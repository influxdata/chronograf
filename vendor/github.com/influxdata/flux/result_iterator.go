package flux

import "sort"

// ResultIterator allows iterating through all results
// Cancel must be called to free resources.
// ResultIterators may implement Statisticser.
type ResultIterator interface {
	// More indicates if there are more results.
	More() bool

	// Next returns the next result.
	// If More is false, Next panics.
	Next() Result

	// Cancel discards the remaining results.
	// Cancel must always be called to free resources.
	// It is safe to call Cancel multiple times.
	Cancel()

	// Err reports the first error encountered.
	// Err will not report anything unless More has returned false,
	// or the query has been cancelled.
	Err() error
}

// QueryResultIterator implements a ResultIterator while consuming a Query
type QueryResultIterator struct {
	query   Query
	cancel  chan struct{}
	ready   bool
	results *MapResultIterator
}

func NewResultIteratorFromQuery(q Query) *QueryResultIterator {
	return &QueryResultIterator{
		query:  q,
		cancel: make(chan struct{}),
	}
}

func (r *QueryResultIterator) More() bool {
	if !r.ready {
		select {
		case <-r.cancel:
			goto DONE
		case results, ok := <-r.query.Ready():
			if !ok {
				goto DONE
			}
			r.ready = true
			r.results = NewMapResultIterator(results)
		}
	}
	if r.results.More() {
		return true
	}

DONE:
	r.query.Done()
	return false
}

func (r *QueryResultIterator) Next() Result {
	return r.results.Next()
}

func (r *QueryResultIterator) Cancel() {
	select {
	case <-r.cancel:
	default:
		close(r.cancel)
	}
	r.query.Cancel()
}

func (r *QueryResultIterator) Err() error {
	return r.query.Err()
}

func (r *QueryResultIterator) Statistics() Statistics {
	return r.query.Statistics()
}

type MapResultIterator struct {
	results map[string]Result
	order   []string
}

func NewMapResultIterator(results map[string]Result) *MapResultIterator {
	order := make([]string, 0, len(results))
	for k := range results {
		order = append(order, k)
	}
	sort.Strings(order)
	return &MapResultIterator{
		results: results,
		order:   order,
	}
}

func (r *MapResultIterator) More() bool {
	return len(r.order) > 0
}

func (r *MapResultIterator) Next() Result {
	next := r.order[0]
	r.order = r.order[1:]
	return r.results[next]
}

func (r *MapResultIterator) Cancel() {

}

func (r *MapResultIterator) Err() error {
	return nil
}

type SliceResultIterator struct {
	results []Result
}

func NewSliceResultIterator(results []Result) *SliceResultIterator {
	return &SliceResultIterator{
		results: results,
	}
}

func (r *SliceResultIterator) More() bool {
	return len(r.results) > 0
}

func (r *SliceResultIterator) Next() Result {
	next := r.results[0]
	r.results = r.results[1:]
	return next
}

func (r *SliceResultIterator) Cancel() {
	r.results = nil
}

func (r *SliceResultIterator) Err() error {
	return nil
}
