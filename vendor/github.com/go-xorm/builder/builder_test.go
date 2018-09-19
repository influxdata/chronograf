// Copyright 2016 The Xorm Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package builder

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

type MyInt int

func TestBuilderCond(t *testing.T) {
	var cases = []struct {
		cond Cond
		sql  string
		args []interface{}
	}{
		{
			Eq{"a": 1}.And(Like{"b", "c"}).Or(Eq{"a": 2}.And(Like{"b", "g"})),
			"(a=? AND b LIKE ?) OR (a=? AND b LIKE ?)",
			[]interface{}{1, "%c%", 2, "%g%"},
		},
		{
			Eq{"a": 1}.Or(Like{"b", "c"}).And(Eq{"a": 2}.Or(Like{"b", "g"})),
			"(a=? OR b LIKE ?) AND (a=? OR b LIKE ?)",
			[]interface{}{1, "%c%", 2, "%g%"},
		},
		{
			Eq{"d": []string{"e", "f"}},
			"d IN (?,?)",
			[]interface{}{"e", "f"},
		},
		{
			Eq{"e": Select("id").From("f").Where(Eq{"g": 1})},
			"e=(SELECT id FROM f WHERE g=?)",
			[]interface{}{1},
		},
		{
			Eq{"e": Expr("SELECT id FROM f WHERE g=?", 1)},
			"e=(SELECT id FROM f WHERE g=?)",
			[]interface{}{1},
		},
		{
			Like{"a", "%1"}.And(Like{"b", "%2"}),
			"a LIKE ? AND b LIKE ?",
			[]interface{}{"%1", "%2"},
		},
		{
			Like{"a", "%1"}.Or(Like{"b", "%2"}),
			"a LIKE ? OR b LIKE ?",
			[]interface{}{"%1", "%2"},
		},
		{
			Neq{"d": "e"}.Or(Neq{"f": "g"}),
			"d<>? OR f<>?",
			[]interface{}{"e", "g"},
		},
		{
			Neq{"d": []string{"e", "f"}},
			"d NOT IN (?,?)",
			[]interface{}{"e", "f"},
		},
		{
			Neq{"e": Select("id").From("f").Where(Eq{"g": 1})},
			"e<>(SELECT id FROM f WHERE g=?)",
			[]interface{}{1},
		},
		{
			Neq{"e": Expr("SELECT id FROM f WHERE g=?", 1)},
			"e<>(SELECT id FROM f WHERE g=?)",
			[]interface{}{1},
		},
		{
			Lt{"d": 3},
			"d<?",
			[]interface{}{3},
		},
		{
			Lt{"d": 3}.And(Lt{"e": 4}),
			"d<? AND e<?",
			[]interface{}{3, 4},
		},
		{
			Lt{"d": 3}.Or(Lt{"e": 4}),
			"d<? OR e<?",
			[]interface{}{3, 4},
		},
		{
			Lt{"e": Select("id").From("f").Where(Eq{"g": 1})},
			"e<(SELECT id FROM f WHERE g=?)",
			[]interface{}{1},
		},
		{
			Lt{"e": Expr("SELECT id FROM f WHERE g=?", 1)},
			"e<(SELECT id FROM f WHERE g=?)",
			[]interface{}{1},
		},
		{
			Lte{"d": 3},
			"d<=?",
			[]interface{}{3},
		},
		{
			Lte{"d": 3}.And(Lte{"e": 4}),
			"d<=? AND e<=?",
			[]interface{}{3, 4},
		},
		{
			Lte{"d": 3}.Or(Lte{"e": 4}),
			"d<=? OR e<=?",
			[]interface{}{3, 4},
		},
		{
			Lte{"e": Select("id").From("f").Where(Eq{"g": 1})},
			"e<=(SELECT id FROM f WHERE g=?)",
			[]interface{}{1},
		},
		{
			Lte{"e": Expr("SELECT id FROM f WHERE g=?", 1)},
			"e<=(SELECT id FROM f WHERE g=?)",
			[]interface{}{1},
		},
		{
			Gt{"d": 3},
			"d>?",
			[]interface{}{3},
		},
		{
			Gt{"d": 3}.And(Gt{"e": 4}),
			"d>? AND e>?",
			[]interface{}{3, 4},
		},
		{
			Gt{"d": 3}.Or(Gt{"e": 4}),
			"d>? OR e>?",
			[]interface{}{3, 4},
		},
		{
			Gt{"e": Select("id").From("f").Where(Eq{"g": 1})},
			"e>(SELECT id FROM f WHERE g=?)",
			[]interface{}{1},
		},
		{
			Gt{"e": Expr("SELECT id FROM f WHERE g=?", 1)},
			"e>(SELECT id FROM f WHERE g=?)",
			[]interface{}{1},
		},
		{
			Gte{"d": 3},
			"d>=?",
			[]interface{}{3},
		},
		{
			Gte{"d": 3}.And(Gte{"e": 4}),
			"d>=? AND e>=?",
			[]interface{}{3, 4},
		},
		{
			Gte{"d": 3}.Or(Gte{"e": 4}),
			"d>=? OR e>=?",
			[]interface{}{3, 4},
		},
		{
			Gte{"e": Select("id").From("f").Where(Eq{"g": 1})},
			"e>=(SELECT id FROM f WHERE g=?)",
			[]interface{}{1},
		},
		{
			Gte{"e": Expr("SELECT id FROM f WHERE g=?", 1)},
			"e>=(SELECT id FROM f WHERE g=?)",
			[]interface{}{1},
		},
		{
			Between{"d", 0, 2},
			"d BETWEEN ? AND ?",
			[]interface{}{0, 2},
		},
		{
			Between{"d", 0, Expr("CAST('2003-01-01' AS DATE)")},
			"d BETWEEN ? AND CAST('2003-01-01' AS DATE)",
			[]interface{}{0},
		},
		{
			Between{"d", Expr("CAST('2003-01-01' AS DATE)"), 2},
			"d BETWEEN CAST('2003-01-01' AS DATE) AND ?",
			[]interface{}{2},
		},
		{
			Between{"d", Expr("CAST('2003-01-01' AS DATE)"), Expr("CAST('2003-01-01' AS DATE)")},
			"d BETWEEN CAST('2003-01-01' AS DATE) AND CAST('2003-01-01' AS DATE)",
			[]interface{}{},
		},
		{
			Between{"d", 0, 2}.And(Between{"e", 3, 4}),
			"d BETWEEN ? AND ? AND e BETWEEN ? AND ?",
			[]interface{}{0, 2, 3, 4},
		},
		{
			Between{"d", 0, 2}.Or(Between{"e", 3, 4}),
			"d BETWEEN ? AND ? OR e BETWEEN ? AND ?",
			[]interface{}{0, 2, 3, 4},
		},
		{
			Expr("a < ?", 1),
			"a < ?",
			[]interface{}{1},
		},
		{
			Expr("a < ?", 1).And(Eq{"b": 2}),
			"(a < ?) AND b=?",
			[]interface{}{1, 2},
		},
		{
			Expr("a < ?", 1).Or(Neq{"b": 2}),
			"(a < ?) OR b<>?",
			[]interface{}{1, 2},
		},
		{
			IsNull{"d"},
			"d IS NULL",
			[]interface{}{},
		},
		{
			IsNull{"d"}.And(IsNull{"e"}),
			"d IS NULL AND e IS NULL",
			[]interface{}{},
		},
		{
			IsNull{"d"}.Or(IsNull{"e"}),
			"d IS NULL OR e IS NULL",
			[]interface{}{},
		},
		{
			NotNull{"d"},
			"d IS NOT NULL",
			[]interface{}{},
		},
		{
			NotNull{"d"}.And(NotNull{"e"}),
			"d IS NOT NULL AND e IS NOT NULL",
			[]interface{}{},
		},
		{
			NotNull{"d"}.Or(NotNull{"e"}),
			"d IS NOT NULL OR e IS NOT NULL",
			[]interface{}{},
		},
		{
			NotIn("a", 1, 2).And(NotIn("b", "c", "d")),
			"a NOT IN (?,?) AND b NOT IN (?,?)",
			[]interface{}{1, 2, "c", "d"},
		},
		{
			In("a", 1, 2).Or(In("b", "c", "d")),
			"a IN (?,?) OR b IN (?,?)",
			[]interface{}{1, 2, "c", "d"},
		},
		{
			In("a", []int{1, 2}).Or(In("b", []string{"c", "d"})),
			"a IN (?,?) OR b IN (?,?)",
			[]interface{}{1, 2, "c", "d"},
		},
		{
			In("a", Expr("select id from x where name > ?", "b")),
			"a IN (select id from x where name > ?)",
			[]interface{}{"b"},
		},
		{
			In("a", []MyInt{1, 2}).Or(In("b", []string{"c", "d"})),
			"a IN (?,?) OR b IN (?,?)",
			[]interface{}{MyInt(1), MyInt(2), "c", "d"},
		},
		{
			In("a", []int{}),
			"0=1",
			[]interface{}{},
		},
		{
			In("a", []int{1}),
			"a IN (?)",
			[]interface{}{1},
		},
		{
			In("a", []int8{}),
			"0=1",
			[]interface{}{},
		},
		{
			In("a", []int8{1}),
			"a IN (?)",
			[]interface{}{1},
		},
		{
			In("a", []int16{}),
			"0=1",
			[]interface{}{},
		},
		{
			In("a", []int16{1}),
			"a IN (?)",
			[]interface{}{1},
		},
		{
			In("a", []int32{}),
			"0=1",
			[]interface{}{},
		},
		{
			In("a", []int32{1}),
			"a IN (?)",
			[]interface{}{1},
		},
		{
			In("a", []int64{}),
			"0=1",
			[]interface{}{},
		},
		{
			In("a", []int64{1}),
			"a IN (?)",
			[]interface{}{1},
		},
		{
			In("a", []uint{}),
			"0=1",
			[]interface{}{},
		},
		{
			In("a", []uint{1}),
			"a IN (?)",
			[]interface{}{1},
		},
		{
			In("a", []uint8{}),
			"0=1",
			[]interface{}{},
		},
		{
			In("a", []uint8{1}),
			"a IN (?)",
			[]interface{}{1},
		},
		{
			In("a", []uint16{}),
			"0=1",
			[]interface{}{},
		},
		{
			In("a", []uint16{1}),
			"a IN (?)",
			[]interface{}{1},
		},
		{
			In("a", []uint32{}),
			"0=1",
			[]interface{}{},
		},
		{
			In("a", []uint32{1}),
			"a IN (?)",
			[]interface{}{1},
		},
		{
			In("a", []uint64{}),
			"0=1",
			[]interface{}{},
		},
		{
			In("a", []uint64{1}),
			"a IN (?)",
			[]interface{}{1},
		},
		{
			In("a", []string{}),
			"0=1",
			[]interface{}{},
		},
		{
			In("a", []interface{}{}),
			"0=1",
			[]interface{}{},
		},
		{
			In("a", []MyInt{}),
			"0=1",
			[]interface{}{},
		},
		{
			In("a", []interface{}{1, 2, 3}).And(Eq{"b": "c"}),
			"a IN (?,?,?) AND b=?",
			[]interface{}{1, 2, 3, "c"},
		},
		{
			In("a", Select("id").From("b").Where(Eq{"c": 1})),
			"a IN (SELECT id FROM b WHERE c=?)",
			[]interface{}{1},
		},
		{
			NotIn("a", Expr("select id from x where name > ?", "b")),
			"a NOT IN (select id from x where name > ?)",
			[]interface{}{"b"},
		},
		{
			NotIn("a", []int{}),
			"0=0",
			[]interface{}{},
		},
		{
			NotIn("a", []int{1}),
			"a NOT IN (?)",
			[]interface{}{1},
		},
		{
			NotIn("a", []int8{}),
			"0=0",
			[]interface{}{},
		},
		{
			NotIn("a", []int8{1}),
			"a NOT IN (?)",
			[]interface{}{1},
		},
		{
			NotIn("a", []int16{}),
			"0=0",
			[]interface{}{},
		},
		{
			NotIn("a", []int16{1}),
			"a NOT IN (?)",
			[]interface{}{1},
		},
		{
			NotIn("a", []int32{}),
			"0=0",
			[]interface{}{},
		},
		{
			NotIn("a", []int32{1}),
			"a NOT IN (?)",
			[]interface{}{1},
		},
		{
			NotIn("a", []int64{}),
			"0=0",
			[]interface{}{},
		},
		{
			NotIn("a", []int64{1}),
			"a NOT IN (?)",
			[]interface{}{1},
		},
		{
			NotIn("a", []uint{}),
			"0=0",
			[]interface{}{},
		},
		{
			NotIn("a", []uint{1}),
			"a NOT IN (?)",
			[]interface{}{1},
		},
		{
			NotIn("a", []uint8{}),
			"0=0",
			[]interface{}{},
		},
		{
			NotIn("a", []uint8{1}),
			"a NOT IN (?)",
			[]interface{}{1},
		},
		{
			NotIn("a", []uint16{}),
			"0=0",
			[]interface{}{},
		},
		{
			NotIn("a", []uint16{1}),
			"a NOT IN (?)",
			[]interface{}{1},
		},
		{
			NotIn("a", []uint32{}),
			"0=0",
			[]interface{}{},
		},
		{
			NotIn("a", []uint32{1}),
			"a NOT IN (?)",
			[]interface{}{1},
		},
		{
			NotIn("a", []uint64{}),
			"0=0",
			[]interface{}{},
		},
		{
			NotIn("a", []uint64{1}),
			"a NOT IN (?)",
			[]interface{}{1},
		},
		{
			NotIn("a", []interface{}{}),
			"0=0",
			[]interface{}{},
		},
		{
			NotIn("a", []string{}),
			"0=0",
			[]interface{}{},
		},
		{
			NotIn("a", []MyInt{}),
			"0=0",
			[]interface{}{},
		},
		{
			NotIn("a", []MyInt{1, 2}),
			"a NOT IN (?,?)",
			[]interface{}{1, 2},
		},
		{
			NotIn("a", []interface{}{1, 2, 3}).And(Eq{"b": "c"}),
			"a NOT IN (?,?,?) AND b=?",
			[]interface{}{1, 2, 3, "c"},
		},
		{
			NotIn("a", []interface{}{1, 2, 3}).Or(Eq{"b": "c"}),
			"a NOT IN (?,?,?) OR b=?",
			[]interface{}{1, 2, 3, "c"},
		},
		{
			NotIn("a", Select("id").From("b").Where(Eq{"c": 1})),
			"a NOT IN (SELECT id FROM b WHERE c=?)",
			[]interface{}{1},
		},
		{
			Or(Eq{"a": 1, "b": 2}, Eq{"c": 3, "d": 4}),
			"(a=? AND b=?) OR (c=? AND d=?)",
			[]interface{}{1, 2, 3, 4},
		},
		{
			Not{Eq{"a": 1, "b": 2}},
			"NOT (a=? AND b=?)",
			[]interface{}{1, 2},
		},
		{
			Not{Neq{"a": 1, "b": 2}},
			"NOT (a<>? AND b<>?)",
			[]interface{}{1, 2},
		},
		{
			Not{Eq{"a": 1}.And(Eq{"b": 2})},
			"NOT (a=? AND b=?)",
			[]interface{}{1, 2},
		},
		{
			Not{Neq{"a": 1}.And(Neq{"b": 2})},
			"NOT (a<>? AND b<>?)",
			[]interface{}{1, 2},
		},
		{
			Not{Eq{"a": 1}}.And(Neq{"b": 2}),
			"NOT a=? AND b<>?",
			[]interface{}{1, 2},
		},
		{
			Not{Eq{"a": 1}}.Or(Neq{"b": 2}),
			"NOT a=? OR b<>?",
			[]interface{}{1, 2},
		},
	}

	for _, k := range cases {
		sql, args, err := ToSQL(k.cond)
		assert.NoError(t, err)
		assert.EqualValues(t, k.sql, sql)

		for i := 0; i < 10; i++ {
			sql2, _, err := ToSQL(k.cond)
			assert.NoError(t, err)
			assert.EqualValues(t, sql, sql2)
		}

		assert.EqualValues(t, len(args), len(k.args))

		if len(args) > 0 {
			for i := 0; i < len(args); i++ {
				assert.EqualValues(t, k.args[i], args[i])
			}
		}
	}
}

func TestBuilderInsert(t *testing.T) {
	sql, err := Insert(Eq{"c": 1, "d": 2}).Into("table1").ToBoundSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "INSERT INTO table1 (c,d) Values (1,2)", sql)

	sql, err = Insert(Eq{"c": 1, "d": Expr("SELECT b FROM t WHERE d=? LIMIT 1", 2)}).Into("table1").ToBoundSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "INSERT INTO table1 (c,d) Values (1,(SELECT b FROM t WHERE d=2 LIMIT 1))", sql)

	sql, err = Insert(Eq{"c": 1, "d": 2}).ToBoundSQL()
	assert.Error(t, err)
	assert.EqualValues(t, ErrNoTableName, err)

	sql, err = Insert(Eq{}).Into("table1").ToBoundSQL()
	assert.Error(t, err)
	assert.EqualValues(t, ErrNoColumnToInsert, err)
}

func TestSubquery(t *testing.T) {
	subb := Select("id").From("table_b").Where(Eq{"b": "a"})
	b := Select("a, b").From("table_a").Where(
		Eq{
			"b_id": subb,
			"id":   23,
		},
	)
	sql, args, err := b.ToSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT a, b FROM table_a WHERE b_id=(SELECT id FROM table_b WHERE b=?) AND id=?", sql)
	assert.EqualValues(t, []interface{}{"a", 23}, args)
}

// https://github.com/go-xorm/xorm/issues/820
func TestExprCond(t *testing.T) {
	b := Select("id").From("table1").Where(expr{sql: "a=? OR b=?", args: []interface{}{1, 2}}).Where(Or(Eq{"c": 3}, Eq{"d": 4}))
	sql, args, err := b.ToSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "table1", b.TableName())
	assert.EqualValues(t, "SELECT id FROM table1 WHERE (a=? OR b=?) AND (c=? OR d=?)", sql)
	assert.EqualValues(t, []interface{}{1, 2, 3, 4}, args)
}

func TestBuilder_ToBoundSQL(t *testing.T) {
	newSQL, err := Select("id").From("table").Where(In("a", 1, 2)).ToBoundSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT id FROM table WHERE a IN (1,2)", newSQL)
}

func TestBuilder_From2(t *testing.T) {
	b := Select("id").From("table_b", "tb").Where(Eq{"b": "a"})
	sql, args, err := b.ToSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT id FROM table_b tb WHERE b=?", sql)
	assert.EqualValues(t, []interface{}{"a"}, args)

	b = Select().From("table_b", "tb").Where(Eq{"b": "a"})
	sql, args, err = b.ToSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT * FROM table_b tb WHERE b=?", sql)
	assert.EqualValues(t, []interface{}{"a"}, args)
}

func TestBuilder_And(t *testing.T) {
	b := Select("id").From("table_b", "tb").Where(Eq{"b": "a"}).And(Neq{"c": "d"})
	sql, args, err := b.ToSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT id FROM table_b tb WHERE b=? AND c<>?", sql)
	assert.EqualValues(t, []interface{}{"a", "d"}, args)
}

func TestBuilder_Or(t *testing.T) {
	b := Select("id").From("table_b", "tb").Where(Eq{"b": "a"}).Or(Neq{"c": "d"})
	sql, args, err := b.ToSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT id FROM table_b tb WHERE b=? OR c<>?", sql)
	assert.EqualValues(t, []interface{}{"a", "d"}, args)
}
