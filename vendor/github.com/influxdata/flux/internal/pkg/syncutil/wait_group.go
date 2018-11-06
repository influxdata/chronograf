package syncutil

import "sync"

// WaitGroup is a custom sync.WaitGroup that handles functions that return errors.
type WaitGroup struct {
	wg    sync.WaitGroup
	err   error
	errMu sync.Mutex
}

// Do starts a new goroutine and executes the function within that goroutine.
// This will not execute the function if an error has already occurred.
func (wg *WaitGroup) Do(fn func() error) {
	wg.errMu.Lock()
	if wg.err != nil {
		wg.errMu.Unlock()
		return
	}
	wg.errMu.Unlock()

	wg.wg.Add(1)
	go wg.do(fn)
}

func (wg *WaitGroup) do(fn func() error) {
	defer wg.wg.Done()
	if err := fn(); err != nil {
		wg.errMu.Lock()
		if wg.err == nil {
			wg.err = err
		}
		wg.errMu.Unlock()
	}
}

// Wait waits for all of the goroutines started with Do to finish. It returns
// the first error encountered, but will wait for the remaining goroutines to finish.
func (wg *WaitGroup) Wait() error {
	wg.wg.Wait()
	return wg.err
}
