package strategy_test

import (
	"math"
	"testing"
	"time"

	"github.com/kamilsk/retry/strategy"
)

// timeMarginOfError represents the acceptable amount of time that may pass for
// a time-based (sleep) unit before considering invalid.
const timeMarginOfError = time.Millisecond

func TestInfinite(t *testing.T) {
	policy := strategy.Infinite()

	if !policy(0, nil) {
		t.Error("strategy expected to return true")
	}

	if !policy(math.MaxUint32, nil) {
		t.Error("strategy expected to return true")
	}
}

func TestLimit(t *testing.T) {
	const attemptLimit = 3

	policy := strategy.Limit(attemptLimit)

	if !policy(0, nil) {
		t.Error("strategy expected to return true")
	}

	if !policy(1, nil) {
		t.Error("strategy expected to return true")
	}

	if !policy(2, nil) {
		t.Error("strategy expected to return true")
	}

	if policy(3, nil) {
		t.Error("strategy expected to return false")
	}
}

func TestDelay(t *testing.T) {
	const delayDuration = time.Duration(10 * timeMarginOfError)

	policy := strategy.Delay(delayDuration)

	if now := time.Now(); !policy(0, nil) || delayDuration > time.Since(now) {
		t.Errorf("strategy expected to return true in %s", time.Duration(delayDuration))
	}

	if now := time.Now(); !policy(5, nil) || (delayDuration/10) < time.Since(now) {
		t.Error("strategy expected to return true in ~0 time")
	}
}

func TestWait(t *testing.T) {
	policy := strategy.Wait()

	if now := time.Now(); !policy(0, nil) || timeMarginOfError < time.Since(now) {
		t.Error("strategy expected to return true in ~0 time")
	}

	if now := time.Now(); !policy(999, nil) || timeMarginOfError < time.Since(now) {
		t.Error("strategy expected to return true in ~0 time")
	}
}

func TestWaitWithDuration(t *testing.T) {
	const waitDuration = time.Duration(10 * timeMarginOfError)

	policy := strategy.Wait(waitDuration)

	if now := time.Now(); !policy(0, nil) || timeMarginOfError < time.Since(now) {
		t.Error("strategy expected to return true in ~0 time")
	}

	if now := time.Now(); !policy(1, nil) || waitDuration > time.Since(now) {
		t.Errorf("strategy expected to return true in %s", time.Duration(waitDuration))
	}
}

func TestWaitWithMultipleDurations(t *testing.T) {
	waitDurations := []time.Duration{
		time.Duration(10 * timeMarginOfError),
		time.Duration(20 * timeMarginOfError),
		time.Duration(30 * timeMarginOfError),
		time.Duration(40 * timeMarginOfError),
	}

	policy := strategy.Wait(waitDurations...)

	if now := time.Now(); !policy(0, nil) || timeMarginOfError < time.Since(now) {
		t.Error("strategy expected to return true in ~0 time")
	}

	if now := time.Now(); !policy(1, nil) || waitDurations[0] > time.Since(now) {
		t.Errorf("strategy expected to return true in %s", time.Duration(waitDurations[0]))
	}

	if now := time.Now(); !policy(3, nil) || waitDurations[2] > time.Since(now) {
		t.Errorf("strategy expected to return true in %s", waitDurations[2])
	}

	if now := time.Now(); !policy(999, nil) || waitDurations[len(waitDurations)-1] > time.Since(now) {
		t.Errorf("strategy expected to return true in %s", waitDurations[len(waitDurations)-1])
	}
}

func TestBackoff(t *testing.T) {
	const backoffDuration = time.Duration(10 * timeMarginOfError)
	const algorithmDurationBase = timeMarginOfError

	algorithm := func(attempt uint) time.Duration {
		return backoffDuration - (algorithmDurationBase * time.Duration(attempt))
	}

	policy := strategy.Backoff(algorithm)

	if now := time.Now(); !policy(0, nil) || timeMarginOfError < time.Since(now) {
		t.Error("strategy expected to return true in ~0 time")
	}

	for i := uint(1); i < 10; i++ {
		expectedResult := algorithm(i)

		if now := time.Now(); !policy(i, nil) || expectedResult > time.Since(now) {
			t.Errorf("strategy expected to return true in %s", expectedResult)
		}
	}
}

func TestBackoffWithJitter(t *testing.T) {
	const backoffDuration = time.Duration(10 * timeMarginOfError)
	const algorithmDurationBase = timeMarginOfError

	algorithm := func(attempt uint) time.Duration {
		return backoffDuration - (algorithmDurationBase * time.Duration(attempt))
	}

	transformation := func(duration time.Duration) time.Duration {
		return duration - time.Duration(10*timeMarginOfError)
	}

	policy := strategy.BackoffWithJitter(algorithm, transformation)

	if now := time.Now(); !policy(0, nil) || timeMarginOfError < time.Since(now) {
		t.Error("strategy expected to return true in ~0 time")
	}

	for i := uint(1); i < 10; i++ {
		expectedResult := transformation(algorithm(i))

		if now := time.Now(); !policy(i, nil) || expectedResult > time.Since(now) {
			t.Errorf("strategy expected to return true in %s", expectedResult)
		}
	}
}
