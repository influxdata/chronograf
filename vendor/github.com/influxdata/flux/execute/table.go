package execute

import (
	"fmt"
	"sort"
	"sync/atomic"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/semantic"
	"github.com/influxdata/flux/values"
)

const (
	DefaultStartColLabel = "_start"
	DefaultStopColLabel  = "_stop"
	DefaultTimeColLabel  = "_time"
	DefaultValueColLabel = "_value"
)

func GroupKeyForRowOn(i int, cr flux.ColReader, on map[string]bool) flux.GroupKey {
	cols := make([]flux.ColMeta, 0, len(on))
	vs := make([]values.Value, 0, len(on))
	for j, c := range cr.Cols() {
		if !on[c.Label] {
			continue
		}
		cols = append(cols, c)
		switch c.Type {
		case flux.TBool:
			vs = append(vs, values.NewBoolValue(cr.Bools(j)[i]))
		case flux.TInt:
			vs = append(vs, values.NewIntValue(cr.Ints(j)[i]))
		case flux.TUInt:
			vs = append(vs, values.NewUIntValue(cr.UInts(j)[i]))
		case flux.TFloat:
			vs = append(vs, values.NewFloatValue(cr.Floats(j)[i]))
		case flux.TString:
			vs = append(vs, values.NewStringValue(cr.Strings(j)[i]))
		case flux.TTime:
			vs = append(vs, values.NewTimeValue(cr.Times(j)[i]))
		}
	}
	return NewGroupKey(cols, vs)
}

// OneTimeTable is a Table that permits reading data only once.
// Specifically the ValueIterator may only be consumed once from any of the columns.
type OneTimeTable interface {
	flux.Table
	onetime()
}

// CacheOneTimeTable returns a table that can be read multiple times.
// If the table is not a OneTimeTable it is returned directly.
// Otherwise its contents are read into a new table.
func CacheOneTimeTable(t flux.Table, a *Allocator) flux.Table {
	_, ok := t.(OneTimeTable)
	if !ok {
		return t
	}
	return CopyTable(t, a)
}

// CopyTable returns a copy of the table and is OneTimeTable safe.
func CopyTable(t flux.Table, a *Allocator) flux.Table {
	builder := NewColListTableBuilder(t.Key(), a)

	cols := t.Cols()
	colMap := make([]int, len(cols))
	for j, c := range cols {
		colMap[j] = j
		builder.AddCol(c)
	}

	AppendMappedTable(t, builder, colMap)
	// ColListTableBuilders do not error
	nb, _ := builder.Table()
	return nb
}

// AddTableCols adds the columns of b onto builder.
func AddTableCols(t flux.Table, builder TableBuilder) {
	cols := t.Cols()
	for _, c := range cols {
		builder.AddCol(c)
	}
}

func AddTableKeyCols(key flux.GroupKey, builder TableBuilder) {
	for _, c := range key.Cols() {
		builder.AddCol(c)
	}
}

// AddNewCols adds the columns of b onto builder that did not already exist.
// Returns the mapping of builder cols to table cols.
func AddNewCols(t flux.Table, builder TableBuilder) []int {
	cols := t.Cols()
	existing := builder.Cols()
	colMap := make([]int, len(existing))
	for j, c := range cols {
		found := false
		for ej, ec := range existing {
			if c.Label == ec.Label {
				colMap[ej] = j
				found = true
				break
			}
		}
		if !found {
			builder.AddCol(c)
			colMap = append(colMap, j)
		}
	}
	return colMap
}

// AppendMappedTable appends data from table t onto builder.
// The colMap is a map of builder column index to table column index.
func AppendMappedTable(t flux.Table, builder TableBuilder, colMap []int) {
	if len(t.Cols()) == 0 {
		return
	}

	t.Do(func(cr flux.ColReader) error {
		AppendMappedCols(cr, builder, colMap)
		return nil
	})
}

// AppendTable appends data from table t onto builder.
// This function assumes builder and t have the same column schema.
func AppendTable(t flux.Table, builder TableBuilder) {
	if len(t.Cols()) == 0 {
		return
	}

	t.Do(func(cr flux.ColReader) error {
		AppendCols(cr, builder)
		return nil
	})
}

// AppendMappedCols appends all columns from cr onto builder.
// The colMap is a map of builder column index to cr column index.
func AppendMappedCols(cr flux.ColReader, builder TableBuilder, colMap []int) {
	for j := range builder.Cols() {
		AppendCol(j, colMap[j], cr, builder)
	}
}

// AppendCols appends all columns from cr onto builder.
// This function assumes that builder and cr have the same column schema.
func AppendCols(cr flux.ColReader, builder TableBuilder) {
	for j := range builder.Cols() {
		AppendCol(j, j, cr, builder)
	}
}

// AppendCol append a column from cr onto builder
// The indexes bj and cj are builder and col reader indexes respectively.
func AppendCol(bj, cj int, cr flux.ColReader, builder TableBuilder) {
	c := cr.Cols()[cj]
	switch c.Type {
	case flux.TBool:
		builder.AppendBools(bj, cr.Bools(cj))
	case flux.TInt:
		builder.AppendInts(bj, cr.Ints(cj))
	case flux.TUInt:
		builder.AppendUInts(bj, cr.UInts(cj))
	case flux.TFloat:
		builder.AppendFloats(bj, cr.Floats(cj))
	case flux.TString:
		builder.AppendStrings(bj, cr.Strings(cj))
	case flux.TTime:
		builder.AppendTimes(bj, cr.Times(cj))
	default:
		PanicUnknownType(c.Type)
	}
}

// AppendRecord appends the record from cr onto builder assuming matching columns.
func AppendRecord(i int, cr flux.ColReader, builder TableBuilder) {
	for j, c := range builder.Cols() {
		switch c.Type {
		case flux.TBool:
			builder.AppendBool(j, cr.Bools(j)[i])
		case flux.TInt:
			builder.AppendInt(j, cr.Ints(j)[i])
		case flux.TUInt:
			builder.AppendUInt(j, cr.UInts(j)[i])
		case flux.TFloat:
			builder.AppendFloat(j, cr.Floats(j)[i])
		case flux.TString:
			builder.AppendString(j, cr.Strings(j)[i])
		case flux.TTime:
			builder.AppendTime(j, cr.Times(j)[i])
		default:
			PanicUnknownType(c.Type)
		}
	}
}

// AppendMappedRecord appends the records from cr onto builder, using colMap as a map of builder index to cr index.
func AppendMappedRecord(i int, cr flux.ColReader, builder TableBuilder, colMap []int) {
	for j, c := range builder.Cols() {
		switch c.Type {
		case flux.TBool:
			builder.AppendBool(j, cr.Bools(colMap[j])[i])
		case flux.TInt:
			builder.AppendInt(j, cr.Ints(colMap[j])[i])
		case flux.TUInt:
			builder.AppendUInt(j, cr.UInts(colMap[j])[i])
		case flux.TFloat:
			builder.AppendFloat(j, cr.Floats(colMap[j])[i])
		case flux.TString:
			builder.AppendString(j, cr.Strings(colMap[j])[i])
		case flux.TTime:
			builder.AppendTime(j, cr.Times(colMap[j])[i])
		default:
			PanicUnknownType(c.Type)
		}
	}
}

// ColMap writes a mapping of builder index to column reader index into colMap.
// When colMap does not have enough capacity a new colMap is allocated.
// The colMap is always returned
func ColMap(colMap []int, builder TableBuilder, cr flux.ColReader) []int {
	l := len(builder.Cols())
	if cap(colMap) < l {
		colMap = make([]int, len(builder.Cols()))
	} else {
		colMap = colMap[:l]
	}
	cols := cr.Cols()
	for j, c := range builder.Cols() {
		colMap[j] = ColIdx(c.Label, cols)
	}
	return colMap
}

// AppendRecordForCols appends the only the columns provided from cr onto builder.
func AppendRecordForCols(i int, cr flux.ColReader, builder TableBuilder, cols []flux.ColMeta) {
	for j, c := range cols {
		switch c.Type {
		case flux.TBool:
			builder.AppendBool(j, cr.Bools(j)[i])
		case flux.TInt:
			builder.AppendInt(j, cr.Ints(j)[i])
		case flux.TUInt:
			builder.AppendUInt(j, cr.UInts(j)[i])
		case flux.TFloat:
			builder.AppendFloat(j, cr.Floats(j)[i])
		case flux.TString:
			builder.AppendString(j, cr.Strings(j)[i])
		case flux.TTime:
			builder.AppendTime(j, cr.Times(j)[i])
		default:
			PanicUnknownType(c.Type)
		}
	}
}

func AppendKeyValues(key flux.GroupKey, builder TableBuilder) {
	for j, c := range key.Cols() {
		idx := ColIdx(c.Label, builder.Cols())
		switch c.Type {
		case flux.TBool:
			builder.AppendBool(idx, key.ValueBool(j))
		case flux.TInt:
			builder.AppendInt(idx, key.ValueInt(j))
		case flux.TUInt:
			builder.AppendUInt(idx, key.ValueUInt(j))
		case flux.TFloat:
			builder.AppendFloat(idx, key.ValueFloat(j))
		case flux.TString:
			builder.AppendString(idx, key.ValueString(j))
		case flux.TTime:
			builder.AppendTime(idx, key.ValueTime(j))
		default:
			PanicUnknownType(c.Type)
		}
	}
}

func ContainsStr(strs []string, str string) bool {
	for _, s := range strs {
		if str == s {
			return true
		}
	}
	return false
}

func ColIdx(label string, cols []flux.ColMeta) int {
	for j, c := range cols {
		if c.Label == label {
			return j
		}
	}
	return -1
}
func HasCol(label string, cols []flux.ColMeta) bool {
	return ColIdx(label, cols) >= 0
}

// TableBuilder builds tables that can be used multiple times
type TableBuilder interface {
	Key() flux.GroupKey

	NRows() int
	NCols() int
	Cols() []flux.ColMeta

	// AddCol increases the size of the table by one column.
	// The index of the column is returned.
	AddCol(flux.ColMeta) int

	// Set sets the value at the specified coordinates
	// The rows and columns must exist before calling set, otherwise Set panics.
	SetBool(i, j int, value bool)
	SetInt(i, j int, value int64)
	SetUInt(i, j int, value uint64)
	SetFloat(i, j int, value float64)
	SetString(i, j int, value string)
	SetTime(i, j int, value Time)
	SetValue(i, j int, value values.Value)

	// Append will add a single value to the end of a column.  Will set the number of
	// rows in the table to the size of the new column. It's the caller's job to make sure
	// that the expected number of rows in each column is equal.
	AppendBool(j int, value bool)
	AppendInt(j int, value int64)
	AppendUInt(j int, value uint64)
	AppendFloat(j int, value float64)
	AppendString(j int, value string)
	AppendTime(j int, value Time)
	AppendValue(j int, value values.Value)

	// AppendBools and similar functions will append multiple values to column j.  As above,
	// it will set the numer of rows in the table to the size of the new column.  It's the
	// caller's job to make sure that the expected number of rows in each column is equal.
	AppendBools(j int, values []bool)
	AppendInts(j int, values []int64)
	AppendUInts(j int, values []uint64)
	AppendFloats(j int, values []float64)
	AppendStrings(j int, values []string)
	AppendTimes(j int, values []Time)
	// TODO(adam): determine if there's a useful API for AppendValues
	// AppendValues(j int, values []values.Value)

	// GrowBools and similar functions will extend column j by n zero-values for the respective type.
	// If the column has enough capacity, no reallocation is necessary.  If the capacity is insufficient,
	// a new slice is allocated with 1.5*newCapacity.  As with the Append functions, it is the
	// caller's job to make sure that the expected number of rows in each column is equal.
	GrowBools(j, n int)
	GrowInts(j, n int)
	GrowUInts(j, n int)
	GrowFloats(j, n int)
	GrowStrings(j, n int)
	GrowTimes(j, n int)

	// Sort the rows of the by the values of the columns in the order listed.
	Sort(cols []string, desc bool)

	// Clear removes all rows, while preserving the column meta data.
	ClearData()

	// Table returns the table that has been built.
	// Further modifications of the builder will not effect the returned table.
	Table() (flux.Table, error)
}

type ColListTableBuilder struct {
	table *ColListTable
	alloc *Allocator
}

func NewColListTableBuilder(key flux.GroupKey, a *Allocator) *ColListTableBuilder {
	return &ColListTableBuilder{
		table: &ColListTable{key: key},
		alloc: a,
	}
}

func (b ColListTableBuilder) Key() flux.GroupKey {
	return b.table.Key()
}

func (b ColListTableBuilder) NRows() int {
	return b.table.nrows
}
func (b ColListTableBuilder) NCols() int {
	return len(b.table.cols)
}
func (b ColListTableBuilder) Cols() []flux.ColMeta {
	return b.table.colMeta
}

func (b ColListTableBuilder) AddCol(c flux.ColMeta) int {
	var col column
	switch c.Type {
	case flux.TBool:
		col = &boolColumn{
			ColMeta: c,
			alloc:   b.alloc,
		}
	case flux.TInt:
		col = &intColumn{
			ColMeta: c,
			alloc:   b.alloc,
		}
	case flux.TUInt:
		col = &uintColumn{
			ColMeta: c,
			alloc:   b.alloc,
		}
	case flux.TFloat:
		col = &floatColumn{
			ColMeta: c,
			alloc:   b.alloc,
		}
	case flux.TString:
		col = &stringColumn{
			ColMeta: c,
			alloc:   b.alloc,
		}
	case flux.TTime:
		col = &timeColumn{
			ColMeta: c,
			alloc:   b.alloc,
		}
	default:
		PanicUnknownType(c.Type)
	}
	b.table.colMeta = append(b.table.colMeta, c)
	b.table.cols = append(b.table.cols, col)
	return len(b.table.cols) - 1
}

func (b ColListTableBuilder) SetBool(i int, j int, value bool) {
	b.checkColType(j, flux.TBool)
	b.table.cols[j].(*boolColumn).data[i] = value
}
func (b ColListTableBuilder) AppendBool(j int, value bool) {
	b.checkColType(j, flux.TBool)
	col := b.table.cols[j].(*boolColumn)
	col.data = b.alloc.AppendBools(col.data, value)
	b.table.nrows = len(col.data)
}
func (b ColListTableBuilder) AppendBools(j int, values []bool) {
	b.checkColType(j, flux.TBool)
	col := b.table.cols[j].(*boolColumn)
	col.data = b.alloc.AppendBools(col.data, values...)
	b.table.nrows = len(col.data)
}
func (b ColListTableBuilder) GrowBools(j, n int) {
	b.checkColType(j, flux.TBool)
	col := b.table.cols[j].(*boolColumn)
	col.data = b.alloc.GrowBools(col.data, n)
	b.table.nrows = len(col.data)
}

func (b ColListTableBuilder) SetInt(i int, j int, value int64) {
	b.checkColType(j, flux.TInt)
	b.table.cols[j].(*intColumn).data[i] = value
}
func (b ColListTableBuilder) AppendInt(j int, value int64) {
	b.checkColType(j, flux.TInt)
	col := b.table.cols[j].(*intColumn)
	col.data = b.alloc.AppendInts(col.data, value)
	b.table.nrows = len(col.data)
}
func (b ColListTableBuilder) AppendInts(j int, values []int64) {
	b.checkColType(j, flux.TInt)
	col := b.table.cols[j].(*intColumn)
	col.data = b.alloc.AppendInts(col.data, values...)
	b.table.nrows = len(col.data)
}
func (b ColListTableBuilder) GrowInts(j, n int) {
	b.checkColType(j, flux.TInt)
	col := b.table.cols[j].(*intColumn)
	col.data = b.alloc.GrowInts(col.data, n)
	b.table.nrows = len(col.data)
}

func (b ColListTableBuilder) SetUInt(i int, j int, value uint64) {
	b.checkColType(j, flux.TUInt)
	b.table.cols[j].(*uintColumn).data[i] = value
}
func (b ColListTableBuilder) AppendUInt(j int, value uint64) {
	b.checkColType(j, flux.TUInt)
	col := b.table.cols[j].(*uintColumn)
	col.data = b.alloc.AppendUInts(col.data, value)
	b.table.nrows = len(col.data)
}
func (b ColListTableBuilder) AppendUInts(j int, values []uint64) {
	b.checkColType(j, flux.TUInt)
	col := b.table.cols[j].(*uintColumn)
	col.data = b.alloc.AppendUInts(col.data, values...)
	b.table.nrows = len(col.data)
}
func (b ColListTableBuilder) GrowUInts(j, n int) {
	b.checkColType(j, flux.TUInt)
	col := b.table.cols[j].(*uintColumn)
	col.data = b.alloc.GrowUInts(col.data, n)
	b.table.nrows = len(col.data)
}

func (b ColListTableBuilder) SetFloat(i int, j int, value float64) {
	b.checkColType(j, flux.TFloat)
	b.table.cols[j].(*floatColumn).data[i] = value
}
func (b ColListTableBuilder) AppendFloat(j int, value float64) {
	b.checkColType(j, flux.TFloat)
	col := b.table.cols[j].(*floatColumn)
	col.data = b.alloc.AppendFloats(col.data, value)
	b.table.nrows = len(col.data)
}
func (b ColListTableBuilder) AppendFloats(j int, values []float64) {
	b.checkColType(j, flux.TFloat)
	col := b.table.cols[j].(*floatColumn)
	col.data = b.alloc.AppendFloats(col.data, values...)
	b.table.nrows = len(col.data)
}
func (b ColListTableBuilder) GrowFloats(j, n int) {
	b.checkColType(j, flux.TFloat)
	col := b.table.cols[j].(*floatColumn)
	col.data = b.alloc.GrowFloats(col.data, n)
	b.table.nrows = len(col.data)
}

func (b ColListTableBuilder) SetString(i int, j int, value string) {
	b.checkColType(j, flux.TString)
	b.table.cols[j].(*stringColumn).data[i] = value
}
func (b ColListTableBuilder) AppendString(j int, value string) {
	meta := b.table.cols[j].Meta()
	CheckColType(meta, flux.TString)
	col := b.table.cols[j].(*stringColumn)
	col.data = b.alloc.AppendStrings(col.data, value)
	b.table.nrows = len(col.data)
}
func (b ColListTableBuilder) AppendStrings(j int, values []string) {
	b.checkColType(j, flux.TString)
	col := b.table.cols[j].(*stringColumn)
	col.data = b.alloc.AppendStrings(col.data, values...)
	b.table.nrows = len(col.data)
}
func (b ColListTableBuilder) GrowStrings(j, n int) {
	b.checkColType(j, flux.TString)
	col := b.table.cols[j].(*stringColumn)
	col.data = b.alloc.GrowStrings(col.data, n)
	b.table.nrows = len(col.data)
}

func (b ColListTableBuilder) SetTime(i int, j int, value Time) {
	b.checkColType(j, flux.TTime)
	b.table.cols[j].(*timeColumn).data[i] = value
}
func (b ColListTableBuilder) AppendTime(j int, value Time) {
	b.checkColType(j, flux.TTime)
	col := b.table.cols[j].(*timeColumn)
	col.data = b.alloc.AppendTimes(col.data, value)
	b.table.nrows = len(col.data)
}
func (b ColListTableBuilder) AppendTimes(j int, values []Time) {
	b.checkColType(j, flux.TTime)
	col := b.table.cols[j].(*timeColumn)
	col.data = b.alloc.AppendTimes(col.data, values...)
	b.table.nrows = len(col.data)
}
func (b ColListTableBuilder) GrowTimes(j, n int) {
	b.checkColType(j, flux.TTime)
	col := b.table.cols[j].(*timeColumn)
	col.data = b.alloc.GrowTimes(col.data, n)
	b.table.nrows = len(col.data)
}

func (b ColListTableBuilder) SetValue(i, j int, v values.Value) {
	switch v.Type() {
	case semantic.Bool:
		b.SetBool(i, j, v.Bool())
	case semantic.Int:
		b.SetInt(i, j, v.Int())
	case semantic.UInt:
		b.SetUInt(i, j, v.UInt())
	case semantic.Float:
		b.SetFloat(i, j, v.Float())
	case semantic.String:
		b.SetString(i, j, v.Str())
	case semantic.Time:
		b.SetTime(i, j, v.Time())
	default:
		panic(fmt.Errorf("unexpected value type %v", v.Type()))
	}
}

func (b ColListTableBuilder) AppendValue(j int, v values.Value) {
	switch v.Type() {
	case semantic.Bool:
		b.AppendBool(j, v.Bool())
	case semantic.Int:
		b.AppendInt(j, v.Int())
	case semantic.UInt:
		b.AppendUInt(j, v.UInt())
	case semantic.Float:
		b.AppendFloat(j, v.Float())
	case semantic.String:
		b.AppendString(j, v.Str())
	case semantic.Time:
		b.AppendTime(j, v.Time())
	default:
		panic(fmt.Errorf("unexpected value type %v", v.Type()))
	}
}

func (b ColListTableBuilder) checkColType(j int, typ flux.DataType) {
	CheckColType(b.table.colMeta[j], typ)
}

func CheckColType(col flux.ColMeta, typ flux.DataType) {
	if col.Type != typ {
		panic(fmt.Errorf("column %s is not of type %v", col.Label, typ))
	}
}

func PanicUnknownType(typ flux.DataType) {
	panic(fmt.Errorf("unknown type %v", typ))
}

func (b ColListTableBuilder) Table() (flux.Table, error) {
	// Create copy in mutable state
	return b.table.Copy(), nil
}

// RawTable returns the underlying table being constructed.
// The table returned will be modified by future calls to any TableBuilder methods.
func (b ColListTableBuilder) RawTable() *ColListTable {
	// Create copy in mutable state
	return b.table
}

func (b ColListTableBuilder) ClearData() {
	for _, c := range b.table.cols {
		c.Clear()
	}
	b.table.nrows = 0
}

func (b ColListTableBuilder) Sort(cols []string, desc bool) {
	colIdxs := make([]int, len(cols))
	for i, label := range cols {
		for j, c := range b.table.colMeta {
			if c.Label == label {
				colIdxs[i] = j
				break
			}
		}
	}
	s := colListTableSorter{cols: colIdxs, desc: desc, b: b.table}
	sort.Sort(s)
}

// ColListTable implements Table using list of columns.
// All data for the table is stored in RAM.
// As a result At* methods are provided directly on the table for easy access.
type ColListTable struct {
	key     flux.GroupKey
	colMeta []flux.ColMeta
	cols    []column
	nrows   int

	refCount int32
}

func (t *ColListTable) RefCount(n int) {
	c := atomic.AddInt32(&t.refCount, int32(n))
	if c == 0 {
		for _, c := range t.cols {
			c.Clear()
		}
	}
}

func (t *ColListTable) Key() flux.GroupKey {
	return t.key
}
func (t *ColListTable) Cols() []flux.ColMeta {
	return t.colMeta
}
func (t *ColListTable) Empty() bool {
	return t.nrows == 0
}
func (t *ColListTable) NRows() int {
	return t.nrows
}

func (t *ColListTable) Len() int {
	return t.nrows
}

func (t *ColListTable) Do(f func(flux.ColReader) error) error {
	return f(t)
}

func (t *ColListTable) Bools(j int) []bool {
	CheckColType(t.colMeta[j], flux.TBool)
	return t.cols[j].(*boolColumn).data
}
func (t *ColListTable) Ints(j int) []int64 {
	CheckColType(t.colMeta[j], flux.TInt)
	return t.cols[j].(*intColumn).data
}
func (t *ColListTable) UInts(j int) []uint64 {
	CheckColType(t.colMeta[j], flux.TUInt)
	return t.cols[j].(*uintColumn).data
}
func (t *ColListTable) Floats(j int) []float64 {
	CheckColType(t.colMeta[j], flux.TFloat)
	return t.cols[j].(*floatColumn).data
}
func (t *ColListTable) Strings(j int) []string {
	meta := t.colMeta[j]
	CheckColType(meta, flux.TString)
	return t.cols[j].(*stringColumn).data
}
func (t *ColListTable) Times(j int) []Time {
	CheckColType(t.colMeta[j], flux.TTime)
	return t.cols[j].(*timeColumn).data
}

func (t *ColListTable) Copy() *ColListTable {
	cpy := new(ColListTable)
	cpy.key = t.key
	cpy.nrows = t.nrows

	cpy.colMeta = make([]flux.ColMeta, len(t.colMeta))
	copy(cpy.colMeta, t.colMeta)

	cpy.cols = make([]column, len(t.cols))
	for i, c := range t.cols {
		cpy.cols[i] = c.Copy()
	}

	return cpy
}

// GetRow takes a row index and returns the record located at that index in the cache
func (t *ColListTable) GetRow(row int) values.Object {
	record := values.NewObject()
	var val values.Value
	for j, col := range t.colMeta {
		switch col.Type {
		case flux.TBool:
			val = values.NewBoolValue(t.cols[j].(*boolColumn).data[row])
		case flux.TInt:
			val = values.NewIntValue(t.cols[j].(*intColumn).data[row])
		case flux.TUInt:
			val = values.NewUIntValue(t.cols[j].(*uintColumn).data[row])
		case flux.TFloat:
			val = values.NewFloatValue(t.cols[j].(*floatColumn).data[row])
		case flux.TString:
			val = values.NewStringValue(t.cols[j].(*stringColumn).data[row])
		case flux.TTime:
			val = values.NewTimeValue(t.cols[j].(*timeColumn).data[row])
		}
		record.Set(col.Label, val)
	}
	return record
}

type colListTableSorter struct {
	cols []int
	desc bool
	b    *ColListTable
}

func (c colListTableSorter) Len() int {
	return c.b.nrows
}

func (c colListTableSorter) Less(x int, y int) (less bool) {
	for _, j := range c.cols {
		if !c.b.cols[j].Equal(x, y) {
			less = c.b.cols[j].Less(x, y)
			break
		}
	}
	if c.desc {
		less = !less
	}
	return
}

func (c colListTableSorter) Swap(x int, y int) {
	for _, col := range c.b.cols {
		col.Swap(x, y)
	}
}

type column interface {
	Meta() flux.ColMeta
	Clear()
	Copy() column
	Equal(i, j int) bool
	Less(i, j int) bool
	Swap(i, j int)
}

type boolColumn struct {
	flux.ColMeta
	data  []bool
	alloc *Allocator
}

func (c *boolColumn) Meta() flux.ColMeta {
	return c.ColMeta
}

func (c *boolColumn) Clear() {
	c.alloc.Free(len(c.data), boolSize)
	c.data = c.data[0:0]
}
func (c *boolColumn) Copy() column {
	cpy := &boolColumn{
		ColMeta: c.ColMeta,
		alloc:   c.alloc,
	}
	l := len(c.data)
	cpy.data = c.alloc.Bools(l, l)
	copy(cpy.data, c.data)
	return cpy
}
func (c *boolColumn) Equal(i, j int) bool {
	return c.data[i] == c.data[j]
}
func (c *boolColumn) Less(i, j int) bool {
	if c.data[i] == c.data[j] {
		return false
	}
	return c.data[i]
}
func (c *boolColumn) Swap(i, j int) {
	c.data[i], c.data[j] = c.data[j], c.data[i]
}

type intColumn struct {
	flux.ColMeta
	data  []int64
	alloc *Allocator
}

func (c *intColumn) Meta() flux.ColMeta {
	return c.ColMeta
}

func (c *intColumn) Clear() {
	c.alloc.Free(len(c.data), int64Size)
	c.data = c.data[0:0]
}
func (c *intColumn) Copy() column {
	cpy := &intColumn{
		ColMeta: c.ColMeta,
		alloc:   c.alloc,
	}
	l := len(c.data)
	cpy.data = c.alloc.Ints(l, l)
	copy(cpy.data, c.data)
	return cpy
}
func (c *intColumn) Equal(i, j int) bool {
	return c.data[i] == c.data[j]
}
func (c *intColumn) Less(i, j int) bool {
	return c.data[i] < c.data[j]
}
func (c *intColumn) Swap(i, j int) {
	c.data[i], c.data[j] = c.data[j], c.data[i]
}

type uintColumn struct {
	flux.ColMeta
	data  []uint64
	alloc *Allocator
}

func (c *uintColumn) Meta() flux.ColMeta {
	return c.ColMeta
}

func (c *uintColumn) Clear() {
	c.alloc.Free(len(c.data), uint64Size)
	c.data = c.data[0:0]
}
func (c *uintColumn) Copy() column {
	cpy := &uintColumn{
		ColMeta: c.ColMeta,
		alloc:   c.alloc,
	}
	l := len(c.data)
	cpy.data = c.alloc.UInts(l, l)
	copy(cpy.data, c.data)
	return cpy
}
func (c *uintColumn) Equal(i, j int) bool {
	return c.data[i] == c.data[j]
}
func (c *uintColumn) Less(i, j int) bool {
	return c.data[i] < c.data[j]
}
func (c *uintColumn) Swap(i, j int) {
	c.data[i], c.data[j] = c.data[j], c.data[i]
}

type floatColumn struct {
	flux.ColMeta
	data  []float64
	alloc *Allocator
}

func (c *floatColumn) Meta() flux.ColMeta {
	return c.ColMeta
}

func (c *floatColumn) Clear() {
	c.alloc.Free(len(c.data), float64Size)
	c.data = c.data[0:0]
}
func (c *floatColumn) Copy() column {
	cpy := &floatColumn{
		ColMeta: c.ColMeta,
		alloc:   c.alloc,
	}
	l := len(c.data)
	cpy.data = c.alloc.Floats(l, l)
	copy(cpy.data, c.data)
	return cpy
}
func (c *floatColumn) Equal(i, j int) bool {
	return c.data[i] == c.data[j]
}
func (c *floatColumn) Less(i, j int) bool {
	return c.data[i] < c.data[j]
}
func (c *floatColumn) Swap(i, j int) {
	c.data[i], c.data[j] = c.data[j], c.data[i]
}

type stringColumn struct {
	flux.ColMeta
	data  []string
	alloc *Allocator
}

func (c *stringColumn) Meta() flux.ColMeta {
	return c.ColMeta
}

func (c *stringColumn) Clear() {
	c.alloc.Free(len(c.data), stringSize)
	c.data = c.data[0:0]
}
func (c *stringColumn) Copy() column {
	cpy := &stringColumn{
		ColMeta: c.ColMeta,
		alloc:   c.alloc,
	}

	l := len(c.data)
	cpy.data = c.alloc.Strings(l, l)
	copy(cpy.data, c.data)
	return cpy
}
func (c *stringColumn) Equal(i, j int) bool {
	return c.data[i] == c.data[j]
}
func (c *stringColumn) Less(i, j int) bool {
	return c.data[i] < c.data[j]
}
func (c *stringColumn) Swap(i, j int) {
	c.data[i], c.data[j] = c.data[j], c.data[i]
}

type timeColumn struct {
	flux.ColMeta
	data  []Time
	alloc *Allocator
}

func (c *timeColumn) Meta() flux.ColMeta {
	return c.ColMeta
}

func (c *timeColumn) Clear() {
	c.alloc.Free(len(c.data), timeSize)
	c.data = c.data[0:0]
}
func (c *timeColumn) Copy() column {
	cpy := &timeColumn{
		ColMeta: c.ColMeta,
		alloc:   c.alloc,
	}
	l := len(c.data)
	cpy.data = c.alloc.Times(l, l)
	copy(cpy.data, c.data)
	return cpy
}
func (c *timeColumn) Equal(i, j int) bool {
	return c.data[i] == c.data[j]
}
func (c *timeColumn) Less(i, j int) bool {
	return c.data[i] < c.data[j]
}
func (c *timeColumn) Swap(i, j int) {
	c.data[i], c.data[j] = c.data[j], c.data[i]
}

type TableBuilderCache interface {
	// TableBuilder returns an existing or new TableBuilder for the given meta data.
	// The boolean return value indicates if TableBuilder is new.
	TableBuilder(key flux.GroupKey) (TableBuilder, bool)
	ForEachBuilder(f func(flux.GroupKey, TableBuilder))
}

type tableBuilderCache struct {
	tables *GroupLookup
	alloc  *Allocator

	triggerSpec flux.TriggerSpec
}

func NewTableBuilderCache(a *Allocator) *tableBuilderCache {
	return &tableBuilderCache{
		tables: NewGroupLookup(),
		alloc:  a,
	}
}

type tableState struct {
	builder TableBuilder
	trigger Trigger
}

func (d *tableBuilderCache) SetTriggerSpec(ts flux.TriggerSpec) {
	d.triggerSpec = ts
}

func (d *tableBuilderCache) Table(key flux.GroupKey) (flux.Table, error) {
	b, ok := d.lookupState(key)
	if !ok {
		return nil, fmt.Errorf("table not found with key %v", key)
	}
	return b.builder.Table()
}

func (d *tableBuilderCache) lookupState(key flux.GroupKey) (tableState, bool) {
	v, ok := d.tables.Lookup(key)
	if !ok {
		return tableState{}, false
	}
	return v.(tableState), true
}

// TableBuilder will return the builder for the specified table.
// If no builder exists, one will be created.
func (d *tableBuilderCache) TableBuilder(key flux.GroupKey) (TableBuilder, bool) {
	b, ok := d.lookupState(key)
	if !ok {
		builder := NewColListTableBuilder(key, d.alloc)
		t := NewTriggerFromSpec(d.triggerSpec)
		b = tableState{
			builder: builder,
			trigger: t,
		}
		d.tables.Set(key, b)
	}
	return b.builder, !ok
}

func (d *tableBuilderCache) ForEachBuilder(f func(flux.GroupKey, TableBuilder)) {
	d.tables.Range(func(key flux.GroupKey, value interface{}) {
		f(key, value.(tableState).builder)
	})
}

func (d *tableBuilderCache) DiscardTable(key flux.GroupKey) {
	b, ok := d.lookupState(key)
	if ok {
		b.builder.ClearData()
	}
}

func (d *tableBuilderCache) ExpireTable(key flux.GroupKey) {
	b, ok := d.tables.Delete(key)
	if ok {
		b.(tableState).builder.ClearData()
	}
}

func (d *tableBuilderCache) ForEach(f func(flux.GroupKey)) {
	d.tables.Range(func(key flux.GroupKey, value interface{}) {
		f(key)
	})
}

func (d *tableBuilderCache) ForEachWithContext(f func(flux.GroupKey, Trigger, TableContext)) {
	d.tables.Range(func(key flux.GroupKey, value interface{}) {
		b := value.(tableState)
		f(key, b.trigger, TableContext{
			Key:   key,
			Count: b.builder.NRows(),
		})
	})
}
