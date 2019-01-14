package classifier

// Copyright © 2014 Evan Huus (eapache)

// WhitelistClassifier classifies errors based on a whitelist.
// If the error is nil, it returns Succeed;
// if the error is in the whitelist, it returns Retry;
// otherwise, it returns Fail.
type WhitelistClassifier []error

// Classify implements the Classifier interface.
func (list WhitelistClassifier) Classify(err error) Action {
	if err == nil {
		return Succeed
	}

	for _, pass := range list {
		if err == pass {
			return Retry
		}
	}

	return Fail
}
