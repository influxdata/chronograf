package backoff_test

import (
	"math"
	"testing"
	"time"

	"github.com/kamilsk/retry/backoff"
)

func TestIncremental(t *testing.T) {
	const duration = time.Millisecond
	const increment = time.Nanosecond

	algorithm := backoff.Incremental(duration, increment)

	for i := uint(0); i < 10; i++ {
		result := algorithm(i)
		expected := duration + (increment * time.Duration(i))

		if result != expected {
			t.Errorf("algorithm expected to return a %s duration, but received %s instead", expected, result)
		}
	}
}

func TestLinear(t *testing.T) {
	const duration = time.Millisecond

	algorithm := backoff.Linear(duration)

	for i := uint(0); i < 10; i++ {
		result := algorithm(i)
		expected := duration * time.Duration(i)

		if result != expected {
			t.Errorf("algorithm expected to return a %s duration, but received %s instead", expected, result)
		}
	}
}

func TestExponential(t *testing.T) {
	const duration = time.Second
	const base = 3

	algorithm := backoff.Exponential(duration, base)

	for i := uint(0); i < 10; i++ {
		result := algorithm(i)
		expected := duration * time.Duration(math.Pow(base, float64(i)))

		if result != expected {
			t.Errorf("algorithm expected to return a %s duration, but received %s instead", expected, result)
		}
	}
}

func TestBinaryExponential(t *testing.T) {
	const duration = time.Second

	algorithm := backoff.BinaryExponential(duration)

	for i := uint(0); i < 10; i++ {
		result := algorithm(i)
		expected := duration * time.Duration(math.Pow(2, float64(i)))

		if result != expected {
			t.Errorf("algorithm expected to return a %s duration, but received %s instead", expected, result)
		}
	}
}

func TestFibonacci(t *testing.T) {
	const duration = time.Millisecond
	sequence := []uint{0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233}

	algorithm := backoff.Fibonacci(duration)

	for i := uint(0); i < 10; i++ {
		result := algorithm(i)
		expected := duration * time.Duration(sequence[i])

		if result != expected {
			t.Errorf("algorithm expected to return a %s duration, but received %s instead", expected, result)
		}
	}
}
