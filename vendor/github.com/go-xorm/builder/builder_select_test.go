// Copyright 2018 The Xorm Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package builder

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestBuilder_Select(t *testing.T) {
	sql, args, err := Select("c, d").From("table1").ToSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT c, d FROM table1", sql)

	sql, args, err = Select("c, d").From("table1").Where(Eq{"a": 1}).ToSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT c, d FROM table1 WHERE a=?", sql)
	assert.EqualValues(t, []interface{}{1}, args)

	sql, args, err = Select("c, d").From("table1").LeftJoin("table2", Eq{"table1.id": 1}.And(Lt{"table2.id": 3})).
		RightJoin("table3", "table2.id = table3.tid").Where(Eq{"a": 1}).ToSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT c, d FROM table1 LEFT JOIN table2 ON table1.id=? AND table2.id<? RIGHT JOIN table3 ON table2.id = table3.tid WHERE a=?",
		sql)
	assert.EqualValues(t, []interface{}{1, 3, 1}, args)

	sql, args, err = Select("c, d").From("table1").LeftJoin("table2", Eq{"table1.id": 1}.And(Lt{"table2.id": 3})).
		FullJoin("table3", "table2.id = table3.tid").Where(Eq{"a": 1}).ToSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT c, d FROM table1 LEFT JOIN table2 ON table1.id=? AND table2.id<? FULL JOIN table3 ON table2.id = table3.tid WHERE a=?",
		sql)
	assert.EqualValues(t, []interface{}{1, 3, 1}, args)

	sql, args, err = Select("c, d").From("table1").LeftJoin("table2", Eq{"table1.id": 1}.And(Lt{"table2.id": 3})).
		CrossJoin("table3", "table2.id = table3.tid").Where(Eq{"a": 1}).ToSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT c, d FROM table1 LEFT JOIN table2 ON table1.id=? AND table2.id<? CROSS JOIN table3 ON table2.id = table3.tid WHERE a=?",
		sql)
	assert.EqualValues(t, []interface{}{1, 3, 1}, args)

	sql, args, err = Select("c, d").From("table1").LeftJoin("table2", Eq{"table1.id": 1}.And(Lt{"table2.id": 3})).
		InnerJoin("table3", "table2.id = table3.tid").Where(Eq{"a": 1}).ToSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT c, d FROM table1 LEFT JOIN table2 ON table1.id=? AND table2.id<? INNER JOIN table3 ON table2.id = table3.tid WHERE a=?",
		sql)
	assert.EqualValues(t, []interface{}{1, 3, 1}, args)

	_, _, err = Select("c, d").ToSQL()
	assert.Error(t, err)
	assert.EqualValues(t, ErrNoTableName, err)
}

func TestBuilderSelectGroupBy(t *testing.T) {
	sql, args, err := Select("c").From("table1").GroupBy("c").Having("count(c)=1").ToSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT c FROM table1 GROUP BY c HAVING count(c)=1", sql)
	assert.EqualValues(t, 0, len(args))
	fmt.Println(sql, args)
}

func TestBuilderSelectOrderBy(t *testing.T) {
	sql, args, err := Select("c").From("table1").OrderBy("c DESC").ToSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT c FROM table1 ORDER BY c DESC", sql)
	assert.EqualValues(t, 0, len(args))
	fmt.Println(sql, args)
}

func TestBuilder_From(t *testing.T) {
	// simple one
	sql, args, err := Select("c").From("table1").ToSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT c FROM table1", sql)
	assert.EqualValues(t, 0, len(args))

	// from sub with alias
	sql, args, err = Select("sub.id").From(Select("id").From("table1").Where(Eq{"a": 1}),
		"sub").Where(Eq{"b": 1}).ToSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT sub.id FROM (SELECT id FROM table1 WHERE a=?) sub WHERE b=?", sql)
	assert.EqualValues(t, []interface{}{1, 1}, args)

	// from sub without alias and with conditions
	sql, args, err = Select("sub.id").From(Select("id").From("table1").Where(Eq{"a": 1})).Where(Eq{"b": 1}).ToSQL()
	assert.Error(t, err)
	assert.EqualValues(t, ErrUnnamedDerivedTable, err)

	// from sub without alias and conditions
	sql, args, err = Select("sub.id").From(Select("id").From("table1").Where(Eq{"a": 1})).ToSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT sub.id FROM (SELECT id FROM table1 WHERE a=?)", sql)
	assert.EqualValues(t, []interface{}{1}, args)

	// from union with alias
	sql, args, err = Select("sub.id").From(
		Select("id").From("table1").Where(Eq{"a": 1}).Union(
			"all", Select("id").From("table1").Where(Eq{"a": 2})), "sub").Where(Eq{"b": 1}).ToSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT sub.id FROM ((SELECT id FROM table1 WHERE a=?) UNION ALL (SELECT id FROM table1 WHERE a=?)) sub WHERE b=?", sql)
	assert.EqualValues(t, []interface{}{1, 2, 1}, args)

	// from union without alias
	sql, args, err = Select("sub.id").From(
		Select("id").From("table1").Where(Eq{"a": 1}).Union(
			"all", Select("id").From("table1").Where(Eq{"a": 2}))).Where(Eq{"b": 1}).ToSQL()
	assert.Error(t, err)
	assert.EqualValues(t, ErrUnnamedDerivedTable, err)

	// will raise error
	sql, args, err = Select("c").From(Insert(Eq{"a": 1}).From("table1"), "table1").ToSQL()
	assert.Error(t, err)
	assert.EqualValues(t, ErrUnexpectedSubQuery, err)

	// will raise error
	sql, args, err = Select("c").From(Delete(Eq{"a": 1}).From("table1"), "table1").ToSQL()
	assert.Error(t, err)
	assert.EqualValues(t, ErrUnexpectedSubQuery, err)
}
