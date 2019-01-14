package retry

import (
	"os"
	"os/signal"
	"reflect"
	"time"
)

// Multiplex combines multiple empty struct channels into one.
// TODO can be leaky, https://github.com/kamilsk/retry/issues/109
func Multiplex(channels ...<-chan struct{}) <-chan struct{} {
	ch := make(chan struct{})
	if len(channels) == 0 {
		close(ch)
		return ch
	}
	go func() {
		cases := make([]reflect.SelectCase, 0, len(channels))
		for _, ch := range channels {
			cases = append(cases, reflect.SelectCase{Dir: reflect.SelectRecv, Chan: reflect.ValueOf(ch)})
		}
		reflect.Select(cases)
		close(ch)
	}()
	return ch
}

// WithDeadline returns empty struct channel above on `time.Timer` channel.
// TODO can be leaky, https://github.com/kamilsk/retry/issues/109
func WithDeadline(deadline time.Time) <-chan struct{} {
	ch := make(chan struct{})
	if time.Now().After(deadline) {
		close(ch)
		return ch
	}
	go func() {
		<-time.After(deadline.Sub(time.Now()))
		close(ch)
	}()
	return ch
}

// WithSignal returns empty struct channel above on `os.Signal` channel.
// TODO can be leaky, https://github.com/kamilsk/retry/issues/109
func WithSignal(s os.Signal) <-chan struct{} {
	ch := make(chan struct{})
	if s == nil {
		close(ch)
		return ch
	}
	go func() {
		c := make(chan os.Signal, 1)
		signal.Notify(c, s)
		<-c
		close(ch)
		signal.Stop(c)
	}()
	return ch
}

// WithTimeout returns empty struct channel above on `time.Timer` channel.
// TODO can be leaky, https://github.com/kamilsk/retry/issues/109
func WithTimeout(timeout time.Duration) <-chan struct{} {
	ch := make(chan struct{})
	if timeout <= 0 {
		close(ch)
		return ch
	}
	return WithDeadline(time.Now().Add(timeout))
}
