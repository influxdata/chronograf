package retry_test

import (
	"errors"
	"testing"
	"time"

	"github.com/kamilsk/retry/strategy"

	. "github.com/kamilsk/retry"
)

func TestRetry(t *testing.T) {
	action := func(attempt uint) error {
		return nil
	}

	err := Retry(nil, action)

	if nil != err {
		t.Error("expected a nil error")
	}

	if _, is := IsRecovered(err); is {
		t.Error("recovered error is not expected")
	}

	if IsTimeout(err) {
		t.Error("timeout error is not expected")
	}
}

func TestRetry_PanickedAction(t *testing.T) {
	action := func(attempt uint) error {
		panic("catch me if you can")
	}

	err := Retry(nil, action, strategy.Infinite())

	if nil == err {
		t.Error("expected an error")
	}

	if expected, obtained := "unhandled action's panic", err.Error(); expected != obtained {
		t.Errorf("an unexpected error. expected: %s; obtained: %v", expected, err)
	}

	if r, is := IsRecovered(err); !is || r.(string) != "catch me if you can" {
		t.Errorf("expected recovered error; obtained: %v", r)
	}
}

func TestRetry_RetriesUntilNoErrorReturned(t *testing.T) {
	const errorUntilAttemptNumber = 5

	var attemptsMade uint

	action := func(attempt uint) error {
		attemptsMade = attempt

		if errorUntilAttemptNumber == attempt {
			return nil
		}

		return errors.New("error")
	}

	err := Retry(nil, action, strategy.Infinite())

	if nil != err {
		t.Error("expected a nil error")
	}

	if errorUntilAttemptNumber != attemptsMade {
		t.Errorf(
			"expected %d attempts to be made, but %d were made instead",
			errorUntilAttemptNumber, attemptsMade)
	}
}

func TestRetry_RetriesWithAlreadyDoneContext(t *testing.T) {
	deadline, expected := WithTimeout(0), "operation timeout"

	if err := Retry(deadline, func(uint) error { return nil }, strategy.Infinite()); !IsTimeout(err) {
		t.Errorf("an unexpected error. expected: %s; obtained: %v", expected, err)
	}
}

func TestRetry_RetriesWithDeadline(t *testing.T) {
	deadline, expected := WithTimeout(100*time.Millisecond), "operation timeout"

	action := func(uint) error {
		time.Sleep(110 * time.Millisecond)
		return nil
	}

	if err := Retry(deadline, action, strategy.Infinite()); !IsTimeout(err) {
		t.Errorf("an unexpected error. expected: %s; obtained: %v", expected, err)
	}
}
