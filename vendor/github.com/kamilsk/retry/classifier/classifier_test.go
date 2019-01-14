package classifier_test

import (
	"errors"
	"testing"

	"github.com/kamilsk/retry/classifier"
)

func TestDefaultClassifier_Classify(t *testing.T) {
	defaultClassifier := classifier.DefaultClassifier{}

	if defaultClassifier.Classify(nil) != classifier.Succeed {
		t.Error("succeed is expected")
	}

	if defaultClassifier.Classify(errors.New("error")) != classifier.Retry {
		t.Error("retry is expected")
	}
}
