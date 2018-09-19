// Copyright 2018 The Xorm Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package builder

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestBuilder_Union(t *testing.T) {
	sql, args, err := Select("*").From("t1").Where(Eq{"status": "1"}).
		Union("all", Select("*").From("t2").Where(Eq{"status": "2"})).
		Union("distinct", Select("*").From("t2").Where(Eq{"status": "3"})).
		Union("", Select("*").From("t2").Where(Eq{"status": "3"})).
		ToSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "(SELECT * FROM t1 WHERE status=?) UNION ALL (SELECT * FROM t2 WHERE status=?) UNION DISTINCT (SELECT * FROM t2 WHERE status=?) UNION  (SELECT * FROM t2 WHERE status=?)", sql)
	assert.EqualValues(t, []interface{}{"1", "2", "3", "3"}, args)

	// will raise error
	sql, args, err = Select("*").From("table1").Where(Eq{"a": "1"}).
		Union("all", Select("*").From("table2").Where(Eq{"a": "2"})).
		Where(Eq{"a": 2}).Limit(5, 10).
		ToSQL()
	assert.Error(t, err)
	assert.EqualValues(t, ErrNotUnexpectedUnionConditions, err)

	// will raise error
	sql, args, err = Delete(Eq{"a": 1}).From("t1").
		Union("all", Select("*").From("t2").Where(Eq{"status": "2"})).ToSQL()
	assert.Error(t, err)
	assert.EqualValues(t, ErrUnsupportedUnionMembers, err)

	// will be overwrote by SELECT op
	sql, args, err = Select("*").From("t1").Where(Eq{"status": "1"}).
		Union("all", Select("*").From("t2").Where(Eq{"status": "2"})).
		Select("*").From("t2").Where(Eq{"status": "3"}).ToSQL()
	assert.NoError(t, err)
	fmt.Println(sql, args)

	// will be overwrote by DELETE op
	sql, args, err = Select("*").From("t1").Where(Eq{"status": "1"}).
		Union("all", Select("*").From("t2").Where(Eq{"status": "2"})).
		Delete(Eq{"status": "1"}).From("t2").ToSQL()
	assert.NoError(t, err)
	fmt.Println(sql, args)

	// will be overwrote by INSERT op
	sql, args, err = Select("*").From("t1").Where(Eq{"status": "1"}).
		Union("all", Select("*").From("t2").Where(Eq{"status": "2"})).
		Insert(Eq{"status": "1"}).From("t2").ToSQL()
	assert.NoError(t, err)
	fmt.Println(sql, args)
}
