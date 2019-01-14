package memory

import (
	"errors"
	"fmt"
	"sync/atomic"
)

// Allocator tracks the amount of memory being consumed by a query.
type Allocator struct {
	// Limit is the limit on the amount of memory that this allocator
	// can assign. If this is null, there is no limit.
	Limit *int64

	bytesAllocated int64
	maxAllocated   int64
}

// Allocate will ensure that the requested memory is available and
// record that it is in use.
func (a *Allocator) Allocate(size int) error {
	if size < 0 {
		panic(errors.New("cannot allocate negative memory"))
	} else if size == 0 {
		return nil
	}
	return a.count(size)
}

// Allocated returns the amount of currently allocated memory.
func (a *Allocator) Allocated() int64 {
	return atomic.LoadInt64(&a.bytesAllocated)
}

// MaxAllocated reports the maximum amount of allocated memory at any point in the query.
func (a *Allocator) MaxAllocated() int64 {
	return atomic.LoadInt64(&a.maxAllocated)
}

// Free will reduce the amount of memory used by this Allocator.
// In general, memory should be freed using the Reference returned
// by Allocate. Not all code is capable of using this though so this
// method provides a low-level way of releasing the memory without
// using a Reference.
func (a *Allocator) Free(size int) {
	if size < 0 {
		panic(errors.New("cannot free negative memory"))
	}
	atomic.AddInt64(&a.bytesAllocated, int64(-size))
}

func (a *Allocator) count(size int) error {
	var c int64
	if a.Limit != nil {
		// We need to load the current bytes allocated, add to it, and
		// compare if it is greater than the limit. If it is not, we need
		// to modify the bytes allocated.
		for {
			allocated := atomic.LoadInt64(&a.bytesAllocated)
			if want := allocated + int64(size); want > *a.Limit {
				return LimitExceededError{
					Limit:     *a.Limit,
					Allocated: allocated,
					Wanted:    want - allocated,
				}
			} else if atomic.CompareAndSwapInt64(&a.bytesAllocated, allocated, want) {
				c = want
				break
			}
			// We did not succeed at swapping the bytes allocated so try again.
		}
	} else {
		// Otherwise, add the size directly to the bytes allocated and
		// compare and swap to modify the max allocated.
		c = atomic.AddInt64(&a.bytesAllocated, int64(size))
	}

	// Modify the max allocated if the amount we just allocated is greater.
	for max := atomic.LoadInt64(&a.maxAllocated); c > max; max = atomic.LoadInt64(&a.maxAllocated) {
		if atomic.CompareAndSwapInt64(&a.maxAllocated, max, c) {
			break
		}
	}
	return nil
}

// LimitExceededError is an error when the allocation limit is exceeded.
type LimitExceededError struct {
	Limit     int64
	Allocated int64
	Wanted    int64
}

func (a LimitExceededError) Error() string {
	return fmt.Sprintf("allocation limit reached: limit %d, allocated: %d, wanted: %d", a.Limit, a.Allocated, a.Wanted)
}
