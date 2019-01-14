// +build go1.7

package retry

import "context"

// WithContext returns Context with cancellation based on empty struct channel.
func WithContext(parent context.Context, deadline <-chan struct{}) context.Context {
	ctx, cancel := context.WithCancel(parent)
	go func() {
		if deadline != nil {
			<-deadline
		}
		cancel()
	}()
	return ctx
}
