// Copyright 2018 The Xorm Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package builder

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestBuilderUpdate(t *testing.T) {
	sql, args, err := Update(Eq{"a": 2}).From("table1").Where(Eq{"a": 1}).ToSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "UPDATE table1 SET a=? WHERE a=?", sql)
	assert.EqualValues(t, []interface{}{2, 1}, args)

	sql, args, err = Update(Eq{"a": 2, "b": 1}).From("table1").Where(Eq{"a": 1}).ToSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "UPDATE table1 SET a=?,b=? WHERE a=?", sql)
	assert.EqualValues(t, []interface{}{2, 1, 1}, args)

	sql, args, err = Update(Eq{"a": 2}, Eq{"b": 1}).From("table1").Where(Eq{"a": 1}).ToSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "UPDATE table1 SET a=?,b=? WHERE a=?", sql)
	assert.EqualValues(t, []interface{}{2, 1, 1}, args)

	sql, args, err = Update(Eq{"a": 2, "b": Incr(1)}).From("table2").Where(Eq{"a": 1}).ToSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "UPDATE table2 SET a=?,b=b+? WHERE a=?", sql)
	assert.EqualValues(t, []interface{}{2, 1, 1}, args)

	sql, args, err = Update(Eq{"a": 2, "b": Incr(1), "c": Decr(1), "d": Expr("select count(*) from table2")}).From("table2").Where(Eq{"a": 1}).ToSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "UPDATE table2 SET a=?,b=b+?,c=c-?,d=(select count(*) from table2) WHERE a=?", sql)
	assert.EqualValues(t, []interface{}{2, 1, 1, 1}, args)

	sql, args, err = Update(Eq{"a": 2}).Where(Eq{"a": 1}).ToSQL()
	assert.Error(t, err)
	assert.EqualValues(t, ErrNoTableName, err)

	sql, args, err = Update(Eq{}).From("table1").Where(Eq{"a": 1}).ToSQL()
	assert.Error(t, err)
	assert.EqualValues(t, ErrNoColumnToUpdate, err)

	var builder = Builder{cond: NewCond()}
	sql, args, err = builder.Update(Eq{"a": 2, "b": 1}).From("table1").Where(Eq{"a": 1}).ToSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "UPDATE table1 SET a=?,b=? WHERE a=?", sql)
	assert.EqualValues(t, []interface{}{2, 1, 1}, args)
}
