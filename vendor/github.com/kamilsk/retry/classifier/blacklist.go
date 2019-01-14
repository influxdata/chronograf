package classifier

// Copyright © 2014 Evan Huus (eapache)

// BlacklistClassifier classifies errors based on a blacklist.
// If the error is nil, it returns Succeed;
// if the error is in the blacklist, it returns Fail;
// otherwise, it returns Retry.
type BlacklistClassifier []error

// Classify implements the Classifier interface.
func (list BlacklistClassifier) Classify(err error) Action {
	if err == nil {
		return Succeed
	}

	for _, pass := range list {
		if err == pass {
			return Fail
		}
	}

	return Retry
}
