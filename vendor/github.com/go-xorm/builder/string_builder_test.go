// Copyright 2018 The Xorm Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package builder

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestStringBuilderWriteByte(t *testing.T) {
	var b StringBuilder
	err := b.WriteByte('c')
	assert.NoError(t, err)
	assert.EqualValues(t, "c", b.String())

	b.Reset()

	var content = "123456"
	for _, c := range content {
		_, err = b.WriteRune(c)
		assert.NoError(t, err)
	}
	assert.EqualValues(t, 6, b.Len())
	assert.EqualValues(t, content, b.String())

	for i := 0; i < 100; i++ {
		for _, c := range content {
			_, err = b.WriteRune(c)
			assert.NoError(t, err)
		}
	}

	b.Grow(600)

	for i := 0; i < 100; i++ {
		for _, c := range content {
			_, err = b.WriteRune(c)
			assert.NoError(t, err)
		}
	}
}
