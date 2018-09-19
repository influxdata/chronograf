// Copyright 2018 The Xorm Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package builder

import (
	"fmt"
	"io/ioutil"
	"os"
	"testing"

	"github.com/go-xorm/sqlfiddle"
	"github.com/stretchr/testify/assert"
)

const placeholderConverterSQL = "SELECT a, b FROM table_a WHERE b_id=(SELECT id FROM table_b WHERE b=?) AND id=? AND c=? AND d=? AND e=? AND f=?"
const placeholderConvertedSQL = "SELECT a, b FROM table_a WHERE b_id=(SELECT id FROM table_b WHERE b=$1) AND id=$2 AND c=$3 AND d=$4 AND e=$5 AND f=$6"
const placeholderBoundSQL = "SELECT a, b FROM table_a WHERE b_id=(SELECT id FROM table_b WHERE b=1) AND id=2.1 AND c='3' AND d=4 AND e='5' AND f=true"

func TestPlaceholderConverter(t *testing.T) {
	newSQL, err := ConvertPlaceholder(placeholderConverterSQL, "$")
	assert.NoError(t, err)
	assert.EqualValues(t, placeholderConvertedSQL, newSQL)
}

func BenchmarkPlaceholderConverter(b *testing.B) {
	for i := 0; i < b.N; i++ {
		ConvertPlaceholder(placeholderConverterSQL, "$")
	}
}

func TestBoundSQLConverter(t *testing.T) {
	newSQL, err := ConvertToBoundSQL(placeholderConverterSQL, []interface{}{1, 2.1, "3", uint(4), "5", true})
	assert.NoError(t, err)
	assert.EqualValues(t, placeholderBoundSQL, newSQL)

	newSQL, err = ConvertToBoundSQL(placeholderConverterSQL, []interface{}{1, 2.1, "3", 4, "5"})
	assert.Error(t, err)
	assert.EqualValues(t, ErrNeedMoreArguments, err)

	newSQL, err = ToBoundSQL(Select("id").From("table").Where(In("a", 1, 2)))
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT id FROM table WHERE a IN (1,2)", newSQL)

	newSQL, err = ToBoundSQL(Eq{"a": 1})
	assert.NoError(t, err)
	assert.EqualValues(t, "a=1", newSQL)

	newSQL, err = ToBoundSQL(1)
	assert.Error(t, err)
	assert.EqualValues(t, ErrNotSupportType, err)
}

func TestSQL(t *testing.T) {
	newSQL, args, err := ToSQL(In("a", 1, 2))
	assert.NoError(t, err)
	assert.EqualValues(t, "a IN (?,?)", newSQL)
	assert.EqualValues(t, []interface{}{1, 2}, args)

	newSQL, args, err = ToSQL(Select("id").From("table").Where(In("a", 1, 2)))
	assert.NoError(t, err)
	assert.EqualValues(t, "SELECT id FROM table WHERE a IN (?,?)", newSQL)
	assert.EqualValues(t, []interface{}{1, 2}, args)

	newSQL, args, err = ToSQL(1)
	assert.Error(t, err)
	assert.EqualValues(t, ErrNotSupportType, err)
}

type fiddler struct {
	sessionCode string
	dbType      int
	f           *sqlfiddle.Fiddle
}

func readPreparationSQLFromFile(path string) (string, error) {
	file, err := os.Open(path)
	defer file.Close()
	if err != nil {
		return "", err
	}

	data, err := ioutil.ReadAll(file)
	if err != nil {
		return "", err
	}

	return string(data), nil
}

func newFiddler(fiddleServerAddr, dbDialect, preparationSQL string) (*fiddler, error) {
	var dbType int
	switch dbDialect {
	case MYSQL:
		dbType = sqlfiddle.Mysql5_6
	case MSSQL:
		dbType = sqlfiddle.MSSQL2017
	case POSTGRES:
		dbType = sqlfiddle.PostgreSQL96
	case ORACLE:
		dbType = sqlfiddle.Oracle11gR2
	case SQLITE:
		dbType = sqlfiddle.SQLite_WebSQL
	default:
		return nil, ErrNotSupportDialectType
	}

	f := sqlfiddle.NewFiddle(fiddleServerAddr)
	response, err := f.CreateSchema(dbType, preparationSQL)
	if err != nil {
		return nil, err
	}

	return &fiddler{sessionCode: response.Code, f: f, dbType: dbType}, nil
}

func (f *fiddler) executableCheck(obj interface{}) error {
	var sql string
	var err error
	switch obj.(type) {
	case *Builder:
		sql, err = obj.(*Builder).ToBoundSQL()
		if err != nil {
			return err
		}
	case string:
		sql = obj.(string)
	}

	_, err = f.f.RunSQL(f.dbType, f.sessionCode, sql)
	if err != nil {
		return err
	}

	return nil
}

func TestReadPreparationSQLFromFile(t *testing.T) {
	sqlFromFile, err := readPreparationSQLFromFile("testdata/mysql_fiddle_data.sql")
	assert.NoError(t, err)
	fmt.Println(sqlFromFile)
}

func TestNewFiddler(t *testing.T) {
	sqlFromFile, err := readPreparationSQLFromFile("testdata/mysql_fiddle_data.sql")
	assert.NoError(t, err)
	f, err := newFiddler("", MYSQL, sqlFromFile)
	assert.NoError(t, err)
	assert.NotEmpty(t, f.sessionCode)
}

func TestExecutableCheck(t *testing.T) {
	sqlFromFile, err := readPreparationSQLFromFile("testdata/mysql_fiddle_data.sql")
	assert.NoError(t, err)
	f, err := newFiddler("", MYSQL, sqlFromFile)
	assert.NoError(t, err)
	assert.NotEmpty(t, f.sessionCode)

	assert.NoError(t, f.executableCheck("SELECT * FROM table1"))

	err = f.executableCheck("SELECT * FROM table3")
	assert.Error(t, err)
}
