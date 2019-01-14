// +build go1.7

package retry_test

import (
	"context"
	"testing"
	"time"

	"github.com/kamilsk/retry"
)

func TestWithContext(t *testing.T) {
	tests := []struct {
		name     string
		deadline func() <-chan struct{}
		expected time.Duration
	}{
		{"normal case", func() <-chan struct{} {
			ch := make(chan struct{})
			go func() { time.AfterFunc(10*time.Millisecond, func() { close(ch) }) }()
			return ch
		}, 10 * time.Millisecond},
		{"nil channel", func() <-chan struct{} { return nil }, 0},
	}
	for _, test := range tests {
		tc := test
		t.Run(test.name, func(t *testing.T) {

			start := time.Now()
			<-retry.WithContext(context.TODO(), tc.deadline()).Done()
			end := time.Now()

			if !end.After(start.Add(tc.expected)) {
				t.Errorf("an unexpected deadline")
			}
		})
	}
}
