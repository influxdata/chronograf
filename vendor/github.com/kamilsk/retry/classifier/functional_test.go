package classifier_test

import (
	"encoding/json"
	"errors"
	"net"
	"testing"

	"github.com/kamilsk/retry/classifier"
)

func TestFunctionalClassifier_Classify(t *testing.T) {
	var (
		errClassified       = &json.SyntaxError{}
		errNotClassified    = errors.New("is unknown error")
		jsonErrorClassifier = classifier.FunctionalClassifier(func(err error) classifier.Action {
			if err == nil {
				return classifier.Succeed
			}

			if _, is := err.(*json.SyntaxError); is {
				return classifier.Retry
			}

			return classifier.Unknown
		})
	)

	if jsonErrorClassifier.Classify(nil) != classifier.Succeed {
		t.Error("succeed is expected")
	}

	if jsonErrorClassifier.Classify(errClassified) != classifier.Retry {
		t.Error("retry is expected")
	}

	if jsonErrorClassifier.Classify(errNotClassified) != classifier.Unknown {
		t.Error("unknown is expected")
	}
}

func TestFunctionalClassifier_NetworkErrorClassifier_Classify(t *testing.T) {
	var (
		errNetworkTimeout = &net.DNSError{IsTimeout: true}
		errNetworkOther   = &net.DNSError{}
		errOther          = errors.New("is not network error")
	)

	if classifier.NetworkErrorClassifier.Classify(nil) != classifier.Succeed {
		t.Error("succeed is expected")
	}

	if classifier.NetworkErrorClassifier.Classify(errNetworkTimeout) != classifier.Retry {
		t.Error("retry is expected")
	}

	if classifier.NetworkErrorClassifier.Classify(errNetworkOther) != classifier.Fail {
		t.Error("fail is expected")
	}

	if classifier.NetworkErrorClassifier.Classify(errOther) != classifier.Unknown {
		t.Error("unknown is expected")
	}
}
