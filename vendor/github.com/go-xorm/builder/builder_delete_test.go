// Copyright 2018 The Xorm Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package builder

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestBuilderDelete(t *testing.T) {
	sql, args, err := Delete(Eq{"a": 1}).From("table1").ToSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "DELETE FROM table1 WHERE a=?", sql)
	assert.EqualValues(t, []interface{}{1}, args)
}

func TestDeleteNoTable(t *testing.T) {
	_, _, err := Delete(Eq{"b": "0"}).ToSQL()
	assert.Error(t, err)
	assert.EqualValues(t, ErrNoTableName, err)
}
