// Copyright 2018 The Xorm Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package builder

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestBuilder_Limit4Mssql(t *testing.T) {
	sqlFromFile, err := readPreparationSQLFromFile("testdata/mssql_fiddle_data.sql")
	assert.NoError(t, err)
	f, err := newFiddler("", MSSQL, sqlFromFile)
	assert.NoError(t, err)
	assert.NotEmpty(t, f.sessionCode)

	// simple -- MsSQL style
	sql, err := Dialect(MSSQL).Select("a", "b", "c").From("table1").
		OrderBy("a ASC").Limit(5).ToBoundSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT a,b,c FROM (SELECT TOP 5 a,b,c,ROW_NUMBER() OVER (ORDER BY (SELECT 1)) AS RN FROM table1 ORDER BY a ASC) at", sql)
	assert.NoError(t, f.executableCheck(sql))

	// simple with where -- MsSQL style
	sql, err = Dialect(MSSQL).Select("a", "b", "c").From("table1").
		Where(Neq{"a": "3"}).OrderBy("a ASC").Limit(5, 10).ToBoundSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT a,b,c FROM (SELECT TOP 15 a,b,c,ROW_NUMBER() OVER (ORDER BY (SELECT 1)) AS RN FROM table1 WHERE a<>'3' ORDER BY a ASC) at WHERE at.RN>10", sql)
	assert.NoError(t, f.executableCheck(sql))

	// union with limit -- MsSQL style
	sql, err = Dialect(MSSQL).Select("a", "b", "c").From(
		Dialect(MSSQL).Select("a", "b", "c").From("table1").Where(Neq{"a": "1"}).
			OrderBy("a ASC").Limit(5, 6).Union("ALL",
			Select("a", "b", "c").From("table1").Where(Neq{"b": "2"}).OrderBy("a DESC").Limit(10)), "at").
		OrderBy("b DESC").Limit(7, 9).ToBoundSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT a,b,c FROM (SELECT TOP 16 a,b,c,ROW_NUMBER() OVER (ORDER BY (SELECT 1)) AS RN FROM ((SELECT a,b,c FROM (SELECT TOP 11 a,b,c,ROW_NUMBER() OVER (ORDER BY (SELECT 1)) AS RN FROM table1 WHERE a<>'1' ORDER BY a ASC) at WHERE at.RN>6) UNION ALL (SELECT a,b,c FROM (SELECT TOP 10 a,b,c,ROW_NUMBER() OVER (ORDER BY (SELECT 1)) AS RN FROM table1 WHERE b<>'2' ORDER BY a DESC) at)) at ORDER BY b DESC) at WHERE at.RN>9", sql)
	assert.NoError(t, f.executableCheck(sql))
}

func TestBuilder_Limit4MysqlLike(t *testing.T) {
	sqlFromFile, err := readPreparationSQLFromFile("testdata/mysql_fiddle_data.sql")
	assert.NoError(t, err)
	f, err := newFiddler("", MYSQL, sqlFromFile)
	assert.NoError(t, err)
	assert.NotEmpty(t, f.sessionCode)

	// simple -- MySQL/SQLite/PostgreSQL style
	sql, err := Dialect(MYSQL).Select("a", "b", "c").From("table1").OrderBy("a ASC").
		Limit(5, 10).ToBoundSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT a,b,c FROM table1 ORDER BY a ASC LIMIT 5 OFFSET 10", sql)
	assert.NoError(t, f.executableCheck(sql))

	// simple -- MySQL/SQLite/PostgreSQL style
	sql, err = Dialect(MYSQL).Select("a", "b", "c").From("table1").
		OrderBy("a ASC").Limit(5).ToBoundSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT a,b,c FROM table1 ORDER BY a ASC LIMIT 5", sql)
	assert.NoError(t, f.executableCheck(sql))

	// simple with where -- MySQL/SQLite/PostgreSQL style
	sql, err = Dialect(MYSQL).Select("a", "b", "c").From("table1").
		Where(Eq{"a": "1", "b": "1"}).OrderBy("a ASC").Limit(5, 10).ToBoundSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT a,b,c FROM table1 WHERE a='1' AND b='1' ORDER BY a ASC LIMIT 5 OFFSET 10", sql)
	assert.NoError(t, f.executableCheck(sql))

	// union -- MySQL/SQLite/PostgreSQL style
	sql, err = Dialect(MYSQL).Select("a", "b", "c").From(
		Dialect(MYSQL).Select("a", "b", "c").From("table1").Where(Eq{"a": "1"}).OrderBy("a ASC").
			Limit(5, 9).Union("ALL",
			Select("a", "b", "c").From("table1").Where(Eq{"a": "2"}).OrderBy("a DESC").Limit(10)), "at").
		Limit(5, 10).ToBoundSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT a,b,c FROM ((SELECT a,b,c FROM table1 WHERE a='1' ORDER BY a ASC LIMIT 5 OFFSET 9) UNION ALL (SELECT a,b,c FROM table1 WHERE a='2' ORDER BY a DESC LIMIT 10)) at LIMIT 5 OFFSET 10", sql)
	assert.NoError(t, f.executableCheck(sql))
}

func TestBuilder_Limit4Oracle(t *testing.T) {
	sqlFromFile, err := readPreparationSQLFromFile("testdata/oracle_fiddle_data.sql")
	assert.NoError(t, err)
	f, err := newFiddler("", ORACLE, sqlFromFile)
	assert.NoError(t, err)
	assert.NotEmpty(t, f.sessionCode)

	// simple -- OracleSQL style
	sql, err := Dialect(ORACLE).Select("a", "b", "c").From("table1").OrderBy("a ASC").
		Limit(5, 10).ToBoundSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT a,b,c FROM (SELECT * FROM (SELECT a,b,c,ROWNUM RN FROM table1 ORDER BY a ASC) at WHERE at.RN<=15) att WHERE att.RN>10", sql)
	assert.NoError(t, f.executableCheck(sql))

	// simple with join -- OracleSQL style
	sql, err = Dialect(ORACLE).Select("a", "b", "c", "d").From("table1 t1").
		InnerJoin("table2 t2", "t1.id = t2.ref_id").OrderBy("a ASC").Limit(5, 10).ToBoundSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT a,b,c,d FROM (SELECT * FROM (SELECT a,b,c,d,ROWNUM RN FROM table1 t1 INNER JOIN table2 t2 ON t1.id = t2.ref_id ORDER BY a ASC) at WHERE at.RN<=15) att WHERE att.RN>10", sql)
	assert.NoError(t, f.executableCheck(sql))

	// simple -- OracleSQL style
	sql, err = Dialect(ORACLE).Select("a", "b", "c").From("table1").
		OrderBy("a ASC").Limit(5).ToBoundSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT a,b,c FROM (SELECT a,b,c,ROWNUM RN FROM table1 ORDER BY a ASC) at WHERE at.RN<=5", sql)
	assert.NoError(t, f.executableCheck(sql))

	// simple with where -- OracleSQL style
	sql, err = Dialect(ORACLE).Select("a", "b", "c").From("table1").Where(Neq{"a": "10", "b": "20"}).
		OrderBy("a ASC").Limit(5, 1).ToBoundSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT a,b,c FROM (SELECT * FROM (SELECT a,b,c,ROWNUM RN FROM table1 WHERE a<>'10' AND b<>'20' ORDER BY a ASC) at WHERE at.RN<=6) att WHERE att.RN>1", sql)
	assert.NoError(t, f.executableCheck(sql))

	// union with limit -- OracleSQL style
	sql, err = Dialect(ORACLE).Select("a", "b", "c").From(
		Dialect(ORACLE).Select("a", "b", "c").From("table1").
			Where(Neq{"a": "0"}).OrderBy("a ASC").Limit(5, 10).Union("ALL",
			Select("a", "b", "c").From("table1").Where(Neq{"b": "48"}).
				OrderBy("a DESC").Limit(10)), "at").
		Limit(3).ToBoundSQL()
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT a,b,c FROM (SELECT a,b,c,ROWNUM RN FROM ((SELECT a,b,c FROM (SELECT * FROM (SELECT a,b,c,ROWNUM RN FROM table1 WHERE a<>'0' ORDER BY a ASC) at WHERE at.RN<=15) att WHERE att.RN>10) UNION ALL (SELECT a,b,c FROM (SELECT a,b,c,ROWNUM RN FROM table1 WHERE b<>'48' ORDER BY a DESC) at WHERE at.RN<=10)) at) at WHERE at.RN<=3", sql)
	assert.NoError(t, f.executableCheck(sql))
}
