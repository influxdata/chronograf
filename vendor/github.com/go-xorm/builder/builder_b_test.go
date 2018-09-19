// Copyright 2018 The Xorm Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package builder

import (
	"fmt"
	"math/rand"
	"testing"
)

type randGenConf struct {
	allowCond     bool
	allowJoin     bool
	allowLimit    bool
	allowUnion    bool
	allowHaving   bool
	allowGroupBy  bool
	allowOrderBy  bool
	allowSubQuery bool
}

var expectedValues = []interface{}{
	"dangerous", "fun", "degree", "hospital", "horseshoe", "summit", "parallel", "height", "recommend", "invite",
	0, 1, 2, 3, 4, 5, 6, 7, 8, 9}

var queryFields = []string{"f1", "f2", "f2", "f4", "f5", "f6", "f7", "f8", "f9"}

func BenchmarkSelect_Simple(b *testing.B) {
	rgc := randGenConf{allowCond: true}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		randQuery("", &rgc).ToSQL()
	}
}

func BenchmarkSelect_SubQuery(b *testing.B) {
	rgc := randGenConf{allowSubQuery: true, allowCond: true, allowGroupBy: true, allowHaving: true, allowOrderBy: true}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		randQuery("", &rgc).ToSQL()
	}
}

func BenchmarkSelect_SelectConditional4Oracle(b *testing.B) {
	rgc := randGenConf{allowLimit: true, allowCond: true, allowGroupBy: true, allowHaving: true, allowOrderBy: true}
	for i := 0; i < b.N; i++ {
		randQuery(ORACLE, &rgc).ToSQL()
	}
}

func BenchmarkSelect_SelectConditional4Mssql(b *testing.B) {
	rgc := randGenConf{allowLimit: true, allowCond: true, allowGroupBy: true, allowHaving: true, allowOrderBy: true}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		randQuery(MSSQL, &rgc).ToSQL()
	}
}

func BenchmarkSelect_SelectConditional4MysqlLike(b *testing.B) {
	rgc := randGenConf{allowLimit: true, allowCond: true, allowGroupBy: true, allowHaving: true, allowOrderBy: true}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		randQuery(MYSQL, &rgc).ToSQL()
	}
}

func BenchmarkSelect_SelectConditional4Mixed(b *testing.B) {
	rgc := randGenConf{allowLimit: true, allowCond: true, allowGroupBy: true, allowHaving: true, allowOrderBy: true}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		randQuery(randDialect(), &rgc).ToSQL()
	}
}

func BenchmarkSelect_SelectComplex4Oracle(b *testing.B) {
	rgc := randGenConf{
		allowLimit: true, allowCond: true,
		allowGroupBy: true, allowHaving: true,
		allowOrderBy: true, allowSubQuery: true,
	}
	for i := 0; i < b.N; i++ {
		randQuery(ORACLE, &rgc).ToSQL()
	}
}

func BenchmarkSelect_SelectComplex4Mssql(b *testing.B) {
	rgc := randGenConf{
		allowLimit: true, allowCond: true,
		allowGroupBy: true, allowHaving: true,
		allowOrderBy: true, allowSubQuery: true,
	}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		randQuery(MSSQL, &rgc).ToSQL()
	}
}

func BenchmarkSelect_SelectComplex4MysqlLike(b *testing.B) {
	rgc := randGenConf{
		allowLimit: true, allowCond: true,
		allowGroupBy: true, allowHaving: true,
		allowOrderBy: true, allowSubQuery: true,
	}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		randQuery(MYSQL, &rgc).ToSQL()
	}
}

func BenchmarkSelect_SelectComplex4MysqlMixed(b *testing.B) {
	rgc := randGenConf{
		allowLimit: true, allowCond: true,
		allowGroupBy: true, allowHaving: true,
		allowOrderBy: true, allowSubQuery: true,
	}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		randQuery(randDialect(), &rgc).ToSQL()
	}
}

func BenchmarkInsert(b *testing.B) {
	rgc := randGenConf{allowCond: true}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		randInsertByCondition(&rgc).ToSQL()
	}
}

func BenchmarkUpdate(b *testing.B) {
	rgc := randGenConf{allowCond: true}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		randUpdateByCondition(&rgc).ToSQL()
	}
}

// randQuery Generate a basic query for benchmark test. But be careful it's not a executable SQL in real db.
func randQuery(dialect string, rgc *randGenConf) *Builder {
	b := randSelectByCondition(dialect, rgc)
	isUnionized := rgc.allowUnion && rand.Intn(1000) >= 500
	if isUnionized {
		r := rand.Intn(3) + 1
		for i := r; i < r; i++ {
			b = b.Union("all", randSelectByCondition(dialect, rgc))
		}
	}

	if isUnionized && rgc.allowLimit && rand.Intn(1000) >= 500 {
		b = randLimit(Dialect(dialect).Select().From(b, "t"))
	}

	return b
}

func randInsertByCondition(rgc *randGenConf) *Builder {
	fields := randSelects()

	times := rand.Intn(10) + 1

	eqs := Eq{}
	for i := 0; i < times; i++ {
		eqs[fields[rand.Intn(len(fields))]] = "expected"
	}

	b := Insert(eqs).From("table1")

	if rgc.allowCond && rand.Intn(1000) >= 500 {
		b = b.Where(randCond(b.selects, 3))
	}

	return b
}

func randUpdateByCondition(rgc *randGenConf) *Builder {
	fields := randSelects()

	times := rand.Intn(10) + 1

	eqs := Eq{}
	for i := 0; i < times; i++ {
		eqs[fields[rand.Intn(len(fields))]] = randVal()
	}

	b := Update(eqs).From("table1")

	if rgc.allowCond && rand.Intn(1000) >= 500 {
		b = b.Where(randCond(b.selects, 3))
	}

	return b
}

func randSelectByCondition(dialect string, rgc *randGenConf) *Builder {
	var b *Builder
	if rgc.allowSubQuery {
		cpRgc := *rgc
		cpRgc.allowSubQuery = false
		b = Dialect(dialect).Select(randSelects()...).From(randQuery(dialect, &cpRgc), randTableName(0))
	} else {
		b = Dialect(dialect).Select(randSelects()...).From(randTableName(0))
	}
	if rgc.allowJoin {
		b = randJoin(b, 3)
	}
	if rgc.allowCond && rand.Intn(1000) >= 500 {
		b = b.Where(randCond(b.selects, 3))
	}
	if rgc.allowLimit && rand.Intn(1000) >= 500 {
		b = randLimit(b)
	}
	if rgc.allowOrderBy && rand.Intn(1000) >= 500 {
		b = randOrderBy(b)
	}
	if rgc.allowHaving && rand.Intn(1000) >= 500 {
		b = randHaving(b)
	}
	if rgc.allowGroupBy && rand.Intn(1000) >= 500 {
		b = randGroupBy(b)
	}

	return b
}

func randDialect() string {
	dialects := []string{MYSQL, ORACLE, MSSQL, SQLITE, POSTGRES}

	return dialects[rand.Intn(len(dialects))]
}

func randSelects() []string {
	if rand.Intn(1000) > 900 {
		return []string{"*"}
	}

	rdx := rand.Intn(len(queryFields) / 2)
	return queryFields[rdx:]
}

func randTableName(offset int) string {
	return fmt.Sprintf("table%v", rand.Intn(10)+offset)
}

func randJoin(b *Builder, lessThan int) *Builder {
	if lessThan <= 0 {
		return b
	}

	times := rand.Intn(lessThan)

	for i := 0; i < times; i++ {
		tableName := randTableName(i * 10)
		b = b.Join("", tableName, fmt.Sprintf("%v.id = %v.id", b.TableName(), tableName))
	}

	return b
}

func randCond(selects []string, lessThan int) Cond {
	if len(selects) <= 0 {
		return nil
	}

	cond := NewCond()

	times := rand.Intn(lessThan)
	for i := 0; i < times; i++ {
		cond = cond.And(Eq{selects[rand.Intn(len(selects))]: randVal()})
	}

	return cond
}

func randLimit(b *Builder) *Builder {
	r := rand.Intn(1000) + 1
	if r > 500 {
		return b.Limit(r, 1000)
	} else {
		return b.Limit(r)
	}
}

func randOrderBy(b *Builder) *Builder {
	return b.OrderBy(fmt.Sprintf("%v ASC", b.selects[rand.Intn(len(b.selects))]))
}

func randHaving(b *Builder) *Builder {
	return b.OrderBy(fmt.Sprintf("%v = %v", b.selects[rand.Intn(len(b.selects))], randVal()))
}

func randGroupBy(b *Builder) *Builder {
	return b.GroupBy(fmt.Sprintf("%v = %v", b.selects[rand.Intn(len(b.selects))], randVal()))
}

func randVal() interface{} {
	return expectedValues[rand.Intn(len(expectedValues))]
}
