package classifier_test

import (
	"errors"
	"testing"

	"github.com/kamilsk/retry/classifier"
)

func TestBlacklistClassifier_Classify(t *testing.T) {
	var (
		errInBlacklist    = errors.New("is in blacklist")
		errNotInBlacklist = errors.New("is not in blacklist")
	)
	list := classifier.BlacklistClassifier([]error{errInBlacklist})

	if list.Classify(nil) != classifier.Succeed {
		t.Error("succeed is expected")
	}

	if list.Classify(errNotInBlacklist) != classifier.Retry {
		t.Error("retry is expected")
	}

	if list.Classify(errInBlacklist) != classifier.Fail {
		t.Error("fail is expected")
	}
}
