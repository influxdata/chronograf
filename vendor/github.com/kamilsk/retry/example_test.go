package retry_test

import (
	"errors"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"net/http/httptest"
	"os"
	"time"

	"github.com/kamilsk/retry"
	"github.com/kamilsk/retry/backoff"
	"github.com/kamilsk/retry/jitter"
	"github.com/kamilsk/retry/strategy"
)

func Example() {
	_ = retry.Retry(nil, func(attempt uint) error {
		return nil // Do something that may or may not cause an error
	})
}

func Example_fileOpen() {
	const logFilePath = "/var/log/myapp.log"

	var logFile *os.File

	err := retry.Retry(nil, func(attempt uint) error {
		var err error

		logFile, err = os.Open(logFilePath)

		return err
	})

	if nil != err {
		log.Fatalf("Unable to open file %q with error %q", logFilePath, err)
	}

	_ = logFile.Chdir() // Do something with the file
}

func Example_httpGetWithStrategies() {
	var response *http.Response
	ts := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		rw.WriteHeader(http.StatusOK)
	}))

	action := func(attempt uint) error {
		var err error

		response, err = http.Get(ts.URL)

		if nil == err && nil != response && response.StatusCode > 200 {
			err = fmt.Errorf("failed to fetch (attempt #%d) with status code: %d", attempt, response.StatusCode)
		}

		return err
	}

	err := retry.Retry(nil, action, strategy.Limit(5), strategy.Backoff(backoff.Fibonacci(10*time.Millisecond)))
	if nil != err {
		log.Fatalf("Failed to fetch repository with error %q", err)
	}
}

func Example_withBackoffJitter() {
	action := func(attempt uint) error {
		return errors.New("something happened")
	}

	seed := time.Now().UnixNano()
	random := rand.New(rand.NewSource(seed))

	_ = retry.Retry(
		nil,
		action,
		strategy.Limit(5),
		strategy.BackoffWithJitter(
			backoff.BinaryExponential(10*time.Millisecond),
			jitter.Deviation(random, 0.5),
		),
	)
}
