// Copyright (c) 2017 OctoLab. All rights reserved.
// Use of this source code is governed by the MIT license
// that can be found in the LICENSE file.

// Package classifier provides a way to classify an occurred error.
package classifier // import "github.com/kamilsk/retry/classifier"

// Copyright © 2014 Evan Huus (eapache)

// Action is the type returned by a Classifier
// to indicate how the Retrier should proceed.
type Action int

const (
	// Succeed indicates the Retrier should
	// treat this value as a success.
	Succeed Action = iota
	// Fail indicates the Retrier should
	// treat this value as a hard failure and not retry.
	Fail
	// Retry indicates the Retrier should
	// treat this value as a soft failure and retry.
	Retry
	// Unknown indicates the Retrier should
	// apply another Classifier to make a decision.
	Unknown
)

// Classifier is the interface implemented by anything that
// can classify Errors for a Retrier.
type Classifier interface {
	Classify(error) Action
}

// DefaultClassifier classifies errors in the simplest way possible.
// If the error is nil, it returns Succeed, otherwise it returns Retry.
type DefaultClassifier struct{}

// Classify implements the Classifier interface.
func (c DefaultClassifier) Classify(err error) Action {
	if err == nil {
		return Succeed
	}

	return Retry
}
