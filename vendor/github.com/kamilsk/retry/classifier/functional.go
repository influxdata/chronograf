package classifier

import "net"

// The FunctionalClassifier type is an adapter to allow the use of
// ordinary functions as Classifier. If f is a function
// with the appropriate signature, HandlerFunc(f) is a
// Classifier that calls f.
type FunctionalClassifier func(err error) Action

// Classify implements the Classifier interface.
func (f FunctionalClassifier) Classify(err error) Action {
	return f(err)
}

var (
	// NetworkErrorClassifier classifies network errors.
	// If the error is nil, it returns Succeed;
	// if the error is net.Error, it returns Retry when
	// timeout occurred or error is temporary
	// or returns Fail;
	// otherwise, it returns Unknown.
	NetworkErrorClassifier FunctionalClassifier = func(err error) Action {
		if err == nil {
			return Succeed
		}

		if err, ok := err.(net.Error); ok {
			if err.Timeout() || err.Temporary() {
				return Retry
			}
			return Fail
		}

		return Unknown
	}
)
