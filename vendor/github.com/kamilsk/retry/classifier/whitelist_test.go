package classifier_test

import (
	"errors"
	"testing"

	"github.com/kamilsk/retry/classifier"
)

func TestWhitelistClassifier_Classify(t *testing.T) {
	var (
		errInWhitelist    = errors.New("is in blacklist")
		errNotInWhitelist = errors.New("is not in blacklist")
	)
	list := classifier.WhitelistClassifier([]error{errInWhitelist})

	if list.Classify(nil) != classifier.Succeed {
		t.Error("succeed is expected")
	}

	if list.Classify(errNotInWhitelist) != classifier.Fail {
		t.Error("fail is expected")
	}

	if list.Classify(errInWhitelist) != classifier.Retry {
		t.Error("retry is expected")
	}
}
