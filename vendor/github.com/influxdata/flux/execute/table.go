package execute

import (
	"errors"
	"fmt"
	"sort"
	"sync/atomic"

	"github.com/apache/arrow/go/arrow/array"
	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/flux"
	"github.com/influxdata/flux/arrow"
	"github.com/influxdata/flux/memory"
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
		vs = append(vs, ValueForRow(cr, i, j))
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
func CacheOneTimeTable(t flux.Table, a *memory.Allocator) (flux.Table, error) {
	_, ok := t.(OneTimeTable)
	if !ok {
		return t, nil
	}
	return CopyTable(t, a)
}

// CopyTable returns a copy of the table and is OneTimeTable safe.
func CopyTable(t flux.Table, a *memory.Allocator) (flux.Table, error) {
	builder := NewColListTableBuilder(t.Key(), a)

	cols := t.Cols()
	colMap := make([]int, len(cols))
	for j, c := range cols {
		colMap[j] = j
		if _, err := builder.AddCol(c); err != nil {
			return nil, err
		}
	}

	if err := AppendMappedTable(t, builder, colMap); err != nil {
		return nil, err
	}
	// ColListTableBuilders do not error
	nb, _ := builder.Table()
	return nb, nil
}

// AddTableCols adds the columns of b onto builder.
func AddTableCols(t flux.Table, builder TableBuilder) error {
	cols := t.Cols()
	for _, c := range cols {
		if _, err := builder.AddCol(c); err != nil {
			return err
		}
	}
	return nil
}

func AddTableKeyCols(key flux.GroupKey, builder TableBuilder) error {
	for _, c := range key.Cols() {
		if _, err := builder.AddCol(c); err != nil {
			return err
		}
	}
	return nil
}

// AddNewCols adds the columns of b onto builder that did not already exist.
// Returns the mapping of builder cols to table cols.
func AddNewTableCols(t flux.Table, builder TableBuilder, colMap []int) ([]int, error) {
	cols := t.Cols()
	existing := builder.Cols()
	if l := len(builder.Cols()); cap(colMap) < l {
		colMap = make([]int, len(builder.Cols()))
	} else {
		colMap = colMap[:l]
	}

	for j := range colMap {
		colMap[j] = -1
	}

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
			if _, err := builder.AddCol(c); err != nil {
				return nil, err
			}
			colMap = append(colMap, j)
		}
	}
	return colMap, nil
}

// AppendMappedTable appends data from table t onto builder.
// The colMap is a map of builder column index to table column index.
func AppendMappedTable(t flux.Table, builder TableBuilder, colMap []int) error {
	if len(t.Cols()) == 0 {
		return nil
	}

	if err := t.DoArrow(func(cr flux.ArrowColReader) error {
		return AppendMappedColsArrow(cr, builder, colMap)
	}); err != nil {
		return err
	}

	return builder.LevelColumns()
}

// AppendTable appends data from table t onto builder.
// This function assumes builder and t have the same column schema.
func AppendTable(t flux.Table, builder TableBuilder) error {
	if len(t.Cols()) == 0 {
		return nil
	}

	return t.DoArrow(func(cr flux.ArrowColReader) error {
		return AppendColsArrow(cr, builder)
	})
}

// AppendMappedColsArrow appends all columns from cr onto builder.
// The colMap is a map of builder column index to cr column index.
func AppendMappedColsArrow(cr flux.ArrowColReader, builder TableBuilder, colMap []int) error {
	if len(colMap) != len(builder.Cols()) {
		return errors.New("AppendMappedCols: colMap must have an entry for each table builder column")
	}
	for j := range builder.Cols() {
		if colMap[j] >= 0 {
			if err := AppendColArrow(j, colMap[j], cr, builder); err != nil {
				return err
			}
		}
	}
	return nil
}

// AppendCols appends all columns from cr onto builder.
// This function assumes that builder and cr have the same column schema.
func AppendCols(cr flux.ColReader, builder TableBuilder) error {
	for j := range builder.Cols() {
		if err := AppendCol(j, j, cr, builder); err != nil {
			return err
		}
	}
	return nil
}

// AppendColsArrow appends all columns from cr onto builder.
// This function assumes that builder and cr have the same column schema.
func AppendColsArrow(cr flux.ArrowColReader, builder TableBuilder) error {
	for j := range builder.Cols() {
		if err := AppendColArrow(j, j, cr, builder); err != nil {
			return err
		}
	}
	return nil
}

// AppendCol append a column from cr onto builder
// The indexes bj and cj are builder and col reader indexes respectively.
func AppendCol(bj, cj int, cr flux.ColReader, builder TableBuilder) error {
	if cj < 0 || cj > len(cr.Cols()) {
		return errors.New("AppendCol column reader index out of bounds")
	}
	if bj < 0 || bj > len(builder.Cols()) {
		return errors.New("AppendCol builder index out of bounds")
	}
	c := cr.Cols()[cj]

	switch c.Type {
	case flux.TBool:
		return builder.AppendBools(bj, cr.Bools(cj))
	case flux.TInt:
		return builder.AppendInts(bj, cr.Ints(cj))
	case flux.TUInt:
		return builder.AppendUInts(bj, cr.UInts(cj))
	case flux.TFloat:
		return builder.AppendFloats(bj, cr.Floats(cj))
	case flux.TString:
		return builder.AppendStrings(bj, cr.Strings(cj))
	case flux.TTime:
		return builder.AppendTimes(bj, cr.Times(cj))
	default:
		PanicUnknownType(c.Type)
	}
	return nil
}

// AppendColArrow append a column from cr onto builder
// The indexes bj and cj are builder and col reader indexes respectively.
func AppendColArrow(bj, cj int, cr flux.ArrowColReader, builder TableBuilder) error {
	if cj < 0 || cj > len(cr.Cols()) {
		return errors.New("AppendCol column reader index out of bounds")
	}
	if bj < 0 || bj > len(builder.Cols()) {
		return errors.New("AppendCol builder index out of bounds")
	}
	c := cr.Cols()[cj]

	switch c.Type {
	case flux.TBool:
		vs := cr.Bools(cj)
		for i := 0; i < vs.Len(); i++ {
			if err := builder.AppendBool(bj, vs.Value(i)); err != nil {
				return err
			}
		}
		return nil
	case flux.TInt:
		return builder.AppendInts(bj, cr.Ints(cj).Int64Values())
	case flux.TUInt:
		return builder.AppendUInts(bj, cr.UInts(cj).Uint64Values())
	case flux.TFloat:
		return builder.AppendFloats(bj, cr.Floats(cj).Float64Values())
	case flux.TString:
		vs := cr.Strings(cj)
		for i := 0; i < vs.Len(); i++ {
			if err := builder.AppendString(bj, vs.ValueString(i)); err != nil {
				return err
			}
		}
		return nil
	case flux.TTime:
		vs := cr.Times(cj)
		for i := 0; i < vs.Len(); i++ {
			if err := builder.AppendTime(bj, values.Time(vs.Value(i))); err != nil {
				return err
			}
		}
		return nil
	default:
		PanicUnknownType(c.Type)
	}
	return nil
}

// AppendRecord appends the record from cr onto builder assuming matching columns.
func AppendRecord(i int, cr flux.ColReader, builder TableBuilder) error {
	if !BuilderColsMatchReader(builder, cr) {
		return errors.New("AppendRecord column schema mismatch")
	}
	for j := range builder.Cols() {
		if err := builder.AppendValue(j, ValueForRow(cr, i, j)); err != nil {
			return err
		}
	}
	return nil
}

// AppendRecordArrow appends the record from cr onto builder assuming matching columns.
func AppendRecordArrow(i int, cr flux.ArrowColReader, builder TableBuilder) error {
	if !BuilderColsMatchReaderArrow(builder, cr) {
		return errors.New("AppendRecord column schema mismatch")
	}
	for j := range builder.Cols() {
		if err := builder.AppendValue(j, ValueForRowArrow(cr, i, j)); err != nil {
			return err
		}
	}
	return nil
}

// AppendMappedRecordWithDefaults appends the records from cr onto builder, using colMap as a map of builder index to cr index.
// if an entry in the colMap indicates a mismatched column, a default value is assigned to the builder's column
func AppendMappedRecordWithDefaults(i int, cr flux.ColReader, builder TableBuilder, colMap []int) error {
	if len(colMap) != len(builder.Cols()) {
		return errors.New("AppendMappedRecordWithDefaults: colMap must have an entry for each table builder column")
	}
	// TODO(adam): these zero values should be set to null when we have null support
	for j, c := range builder.Cols() {
		var err error
		switch c.Type {
		case flux.TBool:
			var val bool
			if colMap[j] >= 0 {
				val = cr.Bools(colMap[j])[i]
			}
			err = builder.AppendBool(j, val)
		case flux.TInt:
			var val int64
			if colMap[j] >= 0 {
				val = cr.Ints(colMap[j])[i]
			}
			err = builder.AppendInt(j, val)
		case flux.TUInt:
			var val uint64
			if colMap[j] >= 0 {
				val = cr.UInts(colMap[j])[i]
			}
			err = builder.AppendUInt(j, val)
		case flux.TFloat:
			var val float64
			if colMap[j] >= 0 {
				val = cr.Floats(colMap[j])[i]
			}
			err = builder.AppendFloat(j, val)
		case flux.TString:
			var val string
			if colMap[j] >= 0 {
				val = cr.Strings(colMap[j])[i]
			}
			err = builder.AppendString(j, val)
		case flux.TTime:
			var val Time
			if colMap[j] >= 0 {
				val = cr.Times(colMap[j])[i]
			}
			err = builder.AppendTime(j, val)
		default:
			PanicUnknownType(c.Type)
		}
		if err != nil {
			return err
		}
	}
	return nil
}

// AppendMappedRecordWExplicit appends the records from cr onto builder, using colMap as a map of builder index to cr index.
// if an entry in the colMap indicates a mismatched column, no value is appended.
func AppendMappedRecordExplicit(i int, cr flux.ColReader, builder TableBuilder, colMap []int) error {
	// TODO(adam): these zero values should be set to null when we have null support
	for j, c := range builder.Cols() {
		if colMap[j] < 0 {
			continue
		}
		var err error
		switch c.Type {
		case flux.TBool:
			err = builder.AppendBool(j, cr.Bools(colMap[j])[i])
		case flux.TInt:
			err = builder.AppendInt(j, cr.Ints(colMap[j])[i])
		case flux.TUInt:
			err = builder.AppendUInt(j, cr.UInts(colMap[j])[i])
		case flux.TFloat:
			err = builder.AppendFloat(j, cr.Floats(colMap[j])[i])
		case flux.TString:
			err = builder.AppendString(j, cr.Strings(colMap[j])[i])
		case flux.TTime:
			err = builder.AppendTime(j, cr.Times(colMap[j])[i])
		default:
			PanicUnknownType(c.Type)
		}
		if err != nil {
			return err
		}
	}
	return nil
}

// AppendMappedRecordWExplicitArrow appends the records from cr onto builder, using colMap as a map of builder index to cr index.
// if an entry in the colMap indicates a mismatched column, no value is appended.
func AppendMappedRecordExplicitArrow(i int, cr flux.ArrowColReader, builder TableBuilder, colMap []int) error {
	// TODO(adam): these zero values should be set to null when we have null support
	for j := range builder.Cols() {
		if colMap[j] < 0 {
			continue
		}
		if err := builder.AppendValue(j, ValueForRowArrow(cr, i, j)); err != nil {
			return err
		}
	}
	return nil
}

// BuilderColsMatchReader returns true if builder and cr have identical column sets (order dependent)
func BuilderColsMatchReader(builder TableBuilder, cr flux.ColReader) bool {
	return colsMatch(builder.Cols(), cr.Cols())
}

// BuilderColsMatchReaderArrow returns true if builder and cr have identical column sets (order dependent)
func BuilderColsMatchReaderArrow(builder TableBuilder, cr flux.ArrowColReader) bool {
	return colsMatch(builder.Cols(), cr.Cols())
}

// TablesEqual takes two flux tables and compares them.  Returns false if the tables have different keys, different
// columns, or if the data in any column does not match.  Returns true otherwise.  This function will consume the
// ColumnReader so if you are calling this from the a Process method, you may need to copy the table if you need to
// iterate over the data for other calculations.
func TablesEqual(left, right flux.Table, alloc *memory.Allocator) (bool, error) {
	if colsMatch(left.Key().Cols(), right.Key().Cols()) && colsMatch(left.Cols(), right.Cols()) {
		eq := true
		// rbuffer will buffer out rows from the right table, always holding just enough to do a comparison with the left
		// table's ColReader
		leftBuffer := NewColListTableBuilder(left.Key(), alloc)
		if err := AddTableCols(left, leftBuffer); err != nil {
			return false, err
		}
		if err := AppendTable(left, leftBuffer); err != nil {
			return false, err
		}

		rightBuffer := NewColListTableBuilder(right.Key(), alloc)
		if err := AddTableCols(right, rightBuffer); err != nil {
			return false, err
		}
		if err := AppendTable(right, rightBuffer); err != nil {
			return false, err
		}

		if leftBuffer.NRows() != rightBuffer.NRows() {
			return false, nil
		}

		for j, c := range leftBuffer.Cols() {
			switch c.Type {
			case flux.TBool:
				eq = cmp.Equal(leftBuffer.cols[j].(*boolColumnBuilder).data,
					rightBuffer.cols[j].(*boolColumnBuilder).data)
			case flux.TInt:
				eq = cmp.Equal(leftBuffer.cols[j].(*intColumnBuilder).data,
					rightBuffer.cols[j].(*intColumnBuilder).data)
			case flux.TUInt:
				eq = cmp.Equal(leftBuffer.cols[j].(*uintColumnBuilder).data,
					rightBuffer.cols[j].(*uintColumnBuilder).data)
			case flux.TFloat:
				eq = cmp.Equal(leftBuffer.cols[j].(*floatColumnBuilder).data,
					rightBuffer.cols[j].(*floatColumnBuilder).data)
			case flux.TString:
				eq = cmp.Equal(leftBuffer.cols[j].(*stringColumnBuilder).data,
					rightBuffer.cols[j].(*stringColumnBuilder).data)
			case flux.TTime:
				eq = cmp.Equal(rightBuffer.cols[j].(*timeColumnBuilder).data,
					rightBuffer.cols[j].(*timeColumnBuilder).data)
			default:
				PanicUnknownType(c.Type)
			}
			if !eq {
				return false, nil
			}
		}
		return eq, nil
	}
	return false, nil
}

func colsMatch(left, right []flux.ColMeta) bool {
	if len(left) != len(right) {
		return false
	}
	for j, l := range left {
		if l != right[j] {
			return false
		}
	}
	return true
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

// ColMapArrow writes a mapping of builder index to column reader index into colMap.
// When colMap does not have enough capacity a new colMap is allocated.
// The colMap is always returned
func ColMapArrow(colMap []int, builder TableBuilder, cr flux.ArrowColReader) []int {
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
func AppendRecordForCols(i int, cr flux.ColReader, builder TableBuilder, cols []flux.ColMeta) error {
	if len(cr.Cols()) != len(builder.Cols()) || len(cr.Cols()) != len(cols) {
		return errors.New("appended records must include all columns")
	}
	for j := range cols {
		if err := builder.AppendValue(j, ValueForRow(cr, i, j)); err != nil {
			return err
		}
	}
	return nil
}

func AppendKeyValues(key flux.GroupKey, builder TableBuilder) error {
	for j, c := range key.Cols() {
		idx := ColIdx(c.Label, builder.Cols())
		if idx < 0 {
			return fmt.Errorf("group key column %s not found in output table", c.Label)
		}

		if err := builder.AppendValue(idx, key.Value(j)); err != nil {
			return err
		}
	}
	return nil
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

// ValueForRow retrieves a value from a column reader at the given index.
func ValueForRow(cr flux.ColReader, i, j int) values.Value {
	t := cr.Cols()[j].Type
	switch t {
	case flux.TString:
		return values.NewString(cr.Strings(j)[i])
	case flux.TInt:
		return values.NewInt(cr.Ints(j)[i])
	case flux.TUInt:
		return values.NewUInt(cr.UInts(j)[i])
	case flux.TFloat:
		return values.NewFloat(cr.Floats(j)[i])
	case flux.TBool:
		return values.NewBool(cr.Bools(j)[i])
	case flux.TTime:
		return values.NewTime(cr.Times(j)[i])
	default:
		PanicUnknownType(t)
		return values.InvalidValue
	}
}

// ValueForRowArrow retrieves a value from an arrow column reader at the given index.
func ValueForRowArrow(cr flux.ArrowColReader, i, j int) values.Value {
	t := cr.Cols()[j].Type
	switch t {
	case flux.TString:
		return values.NewString(cr.Strings(j).ValueString(i))
	case flux.TInt:
		return values.NewInt(cr.Ints(j).Value(i))
	case flux.TUInt:
		return values.NewUInt(cr.UInts(j).Value(i))
	case flux.TFloat:
		return values.NewFloat(cr.Floats(j).Value(i))
	case flux.TBool:
		return values.NewBool(cr.Bools(j).Value(i))
	case flux.TTime:
		return values.NewTime(values.Time(cr.Times(j).Value(i)))
	default:
		PanicUnknownType(t)
		return values.InvalidValue
	}
}

// TableBuilder builds tables that can be used multiple times
type TableBuilder interface {
	Key() flux.GroupKey

	NRows() int
	NCols() int
	Cols() []flux.ColMeta

	// AddCol increases the size of the table by one column.
	// The index of the column is returned.
	AddCol(flux.ColMeta) (int, error)

	// Set sets the value at the specified coordinates
	// The rows and columns must exist before calling set, otherwise Set panics.
	SetBool(i, j int, value bool) error
	SetInt(i, j int, value int64) error
	SetUInt(i, j int, value uint64) error
	SetFloat(i, j int, value float64) error
	SetString(i, j int, value string) error
	SetTime(i, j int, value Time) error
	SetValue(i, j int, value values.Value) error

	// Append will add a single value to the end of a column.  Will set the number of
	// rows in the table to the size of the new column. It's the caller's job to make sure
	// that the expected number of rows in each column is equal.
	AppendBool(j int, value bool) error
	AppendInt(j int, value int64) error
	AppendUInt(j int, value uint64) error
	AppendFloat(j int, value float64) error
	AppendString(j int, value string) error
	AppendTime(j int, value Time) error
	AppendValue(j int, value values.Value) error

	// AppendBools and similar functions will append multiple values to column j.  As above,
	// it will set the numer of rows in the table to the size of the new column.  It's the
	// caller's job to make sure that the expected number of rows in each column is equal.
	AppendBools(j int, values []bool) error
	AppendInts(j int, values []int64) error
	AppendUInts(j int, values []uint64) error
	AppendFloats(j int, values []float64) error
	AppendStrings(j int, values []string) error
	AppendTimes(j int, values []Time) error
	// TODO(adam): determine if there's a useful API for AppendValues
	// AppendValues(j int, values []values.Value)

	// GrowBools and similar functions will extend column j by n zero-values for the respective type.
	// If the column has enough capacity, no reallocation is necessary.  If the capacity is insufficient,
	// a new slice is allocated with 1.5*newCapacity.  As with the Append functions, it is the
	// caller's job to make sure that the expected number of rows in each column is equal.
	GrowBools(j, n int) error
	GrowInts(j, n int) error
	GrowUInts(j, n int) error
	GrowFloats(j, n int) error
	GrowStrings(j, n int) error
	GrowTimes(j, n int) error

	// LevelColumns will check for columns that are too short and Grow them
	// so that each column is of uniform size.
	LevelColumns() error

	// Sort the rows of the by the values of the columns in the order listed.
	Sort(cols []string, desc bool)

	// Clear removes all rows, while preserving the column meta data.
	ClearData()

	// Table returns the table that has been built.
	// Further modifications of the builder will not effect the returned table.
	Table() (flux.Table, error)
}

type ColListTableBuilder struct {
	key     flux.GroupKey
	colMeta []flux.ColMeta
	cols    []columnBuilder
	nrows   int
	alloc   *Allocator
}

func NewColListTableBuilder(key flux.GroupKey, a *memory.Allocator) *ColListTableBuilder {
	return &ColListTableBuilder{
		key:   key,
		alloc: &Allocator{Allocator: a},
	}
}

func (b *ColListTableBuilder) Key() flux.GroupKey {
	return b.key
}

func (b *ColListTableBuilder) NRows() int {
	return b.nrows
}
func (b *ColListTableBuilder) Len() int {
	return b.nrows
}
func (b *ColListTableBuilder) NCols() int {
	return len(b.cols)
}
func (b *ColListTableBuilder) Cols() []flux.ColMeta {
	return b.colMeta
}

func (b *ColListTableBuilder) AddCol(c flux.ColMeta) (int, error) {
	if ColIdx(c.Label, b.Cols()) >= 0 {
		return -1, fmt.Errorf("table builder already has column with label %s", c.Label)
	}
	newIdx := len(b.cols)
	var col columnBuilder
	switch c.Type {
	case flux.TBool:
		col = &boolColumnBuilder{
			ColMeta: c,
			alloc:   b.alloc,
		}
		b.colMeta = append(b.colMeta, c)
		b.cols = append(b.cols, col)
		if b.NRows() > 0 {
			if err := b.GrowBools(newIdx, b.NRows()); err != nil {
				return -1, err
			}
		}
	case flux.TInt:
		col = &intColumnBuilder{
			ColMeta: c,
			alloc:   b.alloc,
		}
		b.colMeta = append(b.colMeta, c)
		b.cols = append(b.cols, col)
		if b.NRows() > 0 {
			if err := b.GrowInts(newIdx, b.NRows()); err != nil {
				return -1, err
			}
		}
	case flux.TUInt:
		col = &uintColumnBuilder{
			ColMeta: c,
			alloc:   b.alloc,
		}
		b.colMeta = append(b.colMeta, c)
		b.cols = append(b.cols, col)
		if b.NRows() > 0 {
			if err := b.GrowUInts(newIdx, b.NRows()); err != nil {
				return -1, err
			}
		}
	case flux.TFloat:
		col = &floatColumnBuilder{
			ColMeta: c,
			alloc:   b.alloc,
		}
		b.colMeta = append(b.colMeta, c)
		b.cols = append(b.cols, col)
		if b.NRows() > 0 {
			if err := b.GrowFloats(newIdx, b.NRows()); err != nil {
				return -1, err
			}
		}
	case flux.TString:
		col = &stringColumnBuilder{
			ColMeta: c,
			alloc:   b.alloc,
		}
		b.colMeta = append(b.colMeta, c)
		b.cols = append(b.cols, col)
		if b.NRows() > 0 {
			if err := b.GrowStrings(newIdx, b.NRows()); err != nil {
				return -1, err
			}
		}
	case flux.TTime:
		col = &timeColumnBuilder{
			ColMeta: c,
			alloc:   b.alloc,
		}
		b.colMeta = append(b.colMeta, c)
		b.cols = append(b.cols, col)
		if b.NRows() > 0 {
			if err := b.GrowTimes(newIdx, b.NRows()); err != nil {
				return -1, err
			}
		}
	default:
		PanicUnknownType(c.Type)
	}
	return newIdx, nil
}

func (b *ColListTableBuilder) LevelColumns() error {

	for idx, c := range b.colMeta {
		switch c.Type {
		case flux.TBool:
			toGrow := b.NRows() - b.cols[idx].Len()
			if toGrow > 0 {
				if err := b.GrowBools(idx, toGrow); err != nil {
					return err
				}
			}

			if toGrow < 0 {
				_ = fmt.Errorf("column %s is longer than expected length of table", c.Label)
			}
		case flux.TInt:
			toGrow := b.NRows() - b.cols[idx].Len()
			if toGrow > 0 {
				if err := b.GrowInts(idx, toGrow); err != nil {
					return err
				}
			}

			if toGrow < 0 {
				_ = fmt.Errorf("column %s is longer than expected length of table", c.Label)
			}
		case flux.TUInt:
			toGrow := b.NRows() - b.cols[idx].Len()
			if toGrow > 0 {
				if err := b.GrowUInts(idx, toGrow); err != nil {
					return err
				}
			}

			if toGrow < 0 {
				_ = fmt.Errorf("column %s is longer than expected length of table", c.Label)
			}
		case flux.TFloat:
			toGrow := b.NRows() - b.cols[idx].Len()
			if toGrow > 0 {
				if err := b.GrowFloats(idx, toGrow); err != nil {
					return err
				}
			}

			if toGrow < 0 {
				_ = fmt.Errorf("column %s is longer than expected length of table", c.Label)
			}
		case flux.TString:
			toGrow := b.NRows() - b.cols[idx].Len()
			if toGrow > 0 {
				if err := b.GrowStrings(idx, toGrow); err != nil {
					return err
				}
			}

			if toGrow < 0 {
				_ = fmt.Errorf("column %s is longer than expected length of table", c.Label)
			}
		case flux.TTime:
			toGrow := b.NRows() - b.cols[idx].Len()
			if toGrow > 0 {
				if err := b.GrowTimes(idx, toGrow); err != nil {
					return err
				}
			}

			if toGrow < 0 {
				_ = fmt.Errorf("column %s is longer than expected length of table", c.Label)
			}
		default:
			PanicUnknownType(c.Type)
		}
	}
	return nil
}

func (b *ColListTableBuilder) SetBool(i int, j int, value bool) error {
	if err := b.checkCol(j, flux.TBool); err != nil {
		return err
	}
	b.cols[j].(*boolColumnBuilder).data[i] = value
	return nil
}
func (b *ColListTableBuilder) AppendBool(j int, value bool) error {
	if err := b.checkCol(j, flux.TBool); err != nil {
		return err
	}
	col := b.cols[j].(*boolColumnBuilder)
	col.data = b.alloc.AppendBools(col.data, value)
	b.nrows = len(col.data)
	return nil
}
func (b *ColListTableBuilder) AppendBools(j int, values []bool) error {
	if err := b.checkCol(j, flux.TBool); err != nil {
		return err
	}
	col := b.cols[j].(*boolColumnBuilder)
	col.data = b.alloc.AppendBools(col.data, values...)
	b.nrows = len(col.data)
	return nil
}
func (b *ColListTableBuilder) GrowBools(j, n int) error {
	if err := b.checkCol(j, flux.TBool); err != nil {
		return err
	}
	col := b.cols[j].(*boolColumnBuilder)
	col.data = b.alloc.GrowBools(col.data, n)
	b.nrows = len(col.data)
	return nil
}

func (b *ColListTableBuilder) SetInt(i int, j int, value int64) error {
	if err := b.checkCol(j, flux.TInt); err != nil {
		return err
	}
	b.cols[j].(*intColumnBuilder).data[i] = value
	return nil
}
func (b *ColListTableBuilder) AppendInt(j int, value int64) error {
	if err := b.checkCol(j, flux.TInt); err != nil {
		return err
	}
	col := b.cols[j].(*intColumnBuilder)
	col.data = b.alloc.AppendInts(col.data, value)
	b.nrows = len(col.data)
	return nil
}
func (b *ColListTableBuilder) AppendInts(j int, values []int64) error {
	if err := b.checkCol(j, flux.TInt); err != nil {
		return err
	}
	col := b.cols[j].(*intColumnBuilder)
	col.data = b.alloc.AppendInts(col.data, values...)
	b.nrows = len(col.data)
	return nil
}
func (b *ColListTableBuilder) GrowInts(j, n int) error {
	if err := b.checkCol(j, flux.TInt); err != nil {
		return err
	}
	col := b.cols[j].(*intColumnBuilder)
	col.data = b.alloc.GrowInts(col.data, n)
	b.nrows = len(col.data)
	return nil
}

func (b *ColListTableBuilder) SetUInt(i int, j int, value uint64) error {
	if err := b.checkCol(j, flux.TUInt); err != nil {
		return err
	}
	b.cols[j].(*uintColumnBuilder).data[i] = value
	return nil
}
func (b *ColListTableBuilder) AppendUInt(j int, value uint64) error {
	if err := b.checkCol(j, flux.TUInt); err != nil {
		return err
	}
	col := b.cols[j].(*uintColumnBuilder)
	col.data = b.alloc.AppendUInts(col.data, value)
	b.nrows = len(col.data)
	return nil
}
func (b *ColListTableBuilder) AppendUInts(j int, values []uint64) error {
	if err := b.checkCol(j, flux.TUInt); err != nil {
		return err
	}
	col := b.cols[j].(*uintColumnBuilder)
	col.data = b.alloc.AppendUInts(col.data, values...)
	b.nrows = len(col.data)
	return nil
}
func (b *ColListTableBuilder) GrowUInts(j, n int) error {
	if err := b.checkCol(j, flux.TUInt); err != nil {
		return err
	}
	col := b.cols[j].(*uintColumnBuilder)
	col.data = b.alloc.GrowUInts(col.data, n)
	b.nrows = len(col.data)
	return nil
}

func (b *ColListTableBuilder) SetFloat(i int, j int, value float64) error {
	if err := b.checkCol(j, flux.TFloat); err != nil {
		return err
	}
	b.cols[j].(*floatColumnBuilder).data[i] = value
	return nil
}
func (b *ColListTableBuilder) AppendFloat(j int, value float64) error {
	if err := b.checkCol(j, flux.TFloat); err != nil {
		return err
	}
	col := b.cols[j].(*floatColumnBuilder)
	col.data = b.alloc.AppendFloats(col.data, value)
	b.nrows = len(col.data)
	return nil
}
func (b *ColListTableBuilder) AppendFloats(j int, values []float64) error {
	if err := b.checkCol(j, flux.TFloat); err != nil {
		return err
	}
	col := b.cols[j].(*floatColumnBuilder)
	col.data = b.alloc.AppendFloats(col.data, values...)
	b.nrows = len(col.data)
	return nil
}
func (b *ColListTableBuilder) GrowFloats(j, n int) error {
	if err := b.checkCol(j, flux.TFloat); err != nil {
		return err
	}
	col := b.cols[j].(*floatColumnBuilder)
	col.data = b.alloc.GrowFloats(col.data, n)
	b.nrows = len(col.data)
	return nil
}

func (b *ColListTableBuilder) SetString(i int, j int, value string) error {
	if err := b.checkCol(j, flux.TString); err != nil {
		return err
	}
	b.cols[j].(*stringColumnBuilder).data[i] = value
	return nil
}
func (b *ColListTableBuilder) AppendString(j int, value string) error {
	if err := b.checkCol(j, flux.TString); err != nil {
		return err
	}
	col := b.cols[j].(*stringColumnBuilder)
	col.data = b.alloc.AppendStrings(col.data, value)
	b.nrows = len(col.data)
	return nil
}
func (b *ColListTableBuilder) AppendStrings(j int, values []string) error {
	if err := b.checkCol(j, flux.TString); err != nil {
		return err
	}
	col := b.cols[j].(*stringColumnBuilder)
	col.data = b.alloc.AppendStrings(col.data, values...)
	b.nrows = len(col.data)
	return nil
}
func (b *ColListTableBuilder) GrowStrings(j, n int) error {
	if err := b.checkCol(j, flux.TString); err != nil {
		return err
	}
	col := b.cols[j].(*stringColumnBuilder)
	col.data = b.alloc.GrowStrings(col.data, n)
	b.nrows = len(col.data)
	return nil
}

func (b *ColListTableBuilder) SetTime(i int, j int, value Time) error {
	if err := b.checkCol(j, flux.TTime); err != nil {
		return err
	}
	b.cols[j].(*timeColumnBuilder).data[i] = value
	return nil
}
func (b *ColListTableBuilder) AppendTime(j int, value Time) error {
	if err := b.checkCol(j, flux.TTime); err != nil {
		return err
	}
	col := b.cols[j].(*timeColumnBuilder)
	col.data = b.alloc.AppendTimes(col.data, value)
	b.nrows = len(col.data)
	return nil
}
func (b *ColListTableBuilder) AppendTimes(j int, values []Time) error {
	if err := b.checkCol(j, flux.TTime); err != nil {
		return err
	}
	col := b.cols[j].(*timeColumnBuilder)
	col.data = b.alloc.AppendTimes(col.data, values...)
	b.nrows = len(col.data)
	return nil

}
func (b *ColListTableBuilder) GrowTimes(j, n int) error {
	if err := b.checkCol(j, flux.TTime); err != nil {
		return err
	}
	col := b.cols[j].(*timeColumnBuilder)
	col.data = b.alloc.GrowTimes(col.data, n)
	b.nrows = len(col.data)
	return nil

}

func (b *ColListTableBuilder) SetValue(i, j int, v values.Value) error {
	switch v.Type() {
	case semantic.Bool:
		return b.SetBool(i, j, v.Bool())
	case semantic.Int:
		return b.SetInt(i, j, v.Int())
	case semantic.UInt:
		return b.SetUInt(i, j, v.UInt())
	case semantic.Float:
		return b.SetFloat(i, j, v.Float())
	case semantic.String:
		return b.SetString(i, j, v.Str())
	case semantic.Time:
		return b.SetTime(i, j, v.Time())
	default:
		panic(fmt.Errorf("unexpected value type %v", v.Type()))
	}
}

func (b *ColListTableBuilder) AppendValue(j int, v values.Value) error {
	switch v.Type() {
	case semantic.Bool:
		return b.AppendBool(j, v.Bool())
	case semantic.Int:
		return b.AppendInt(j, v.Int())
	case semantic.UInt:
		return b.AppendUInt(j, v.UInt())
	case semantic.Float:
		return b.AppendFloat(j, v.Float())
	case semantic.String:
		return b.AppendString(j, v.Str())
	case semantic.Time:
		return b.AppendTime(j, v.Time())
	default:
		panic(fmt.Errorf("unexpected value type %v", v.Type()))
	}
}

func (b *ColListTableBuilder) checkCol(j int, typ flux.ColType) error {
	if j < 0 || j > len(b.cols) {
		return fmt.Errorf("column does not exist, index out of bounds: %d", j)
	}
	CheckColType(b.colMeta[j], typ)
	return nil
}

func CheckColType(col flux.ColMeta, typ flux.ColType) {
	if col.Type != typ {
		panic(fmt.Errorf("column %s:%s is not of type %v", col.Label, col.Type, typ))
	}
}

func PanicUnknownType(typ flux.ColType) {
	panic(fmt.Errorf("unknown type %v", typ))
}

func (b *ColListTableBuilder) Bools(j int) []bool {
	CheckColType(b.colMeta[j], flux.TBool)
	return b.cols[j].(*boolColumnBuilder).data
}
func (b *ColListTableBuilder) Ints(j int) []int64 {
	CheckColType(b.colMeta[j], flux.TInt)
	return b.cols[j].(*intColumnBuilder).data
}
func (b *ColListTableBuilder) UInts(j int) []uint64 {
	CheckColType(b.colMeta[j], flux.TUInt)
	return b.cols[j].(*uintColumnBuilder).data
}
func (b *ColListTableBuilder) Floats(j int) []float64 {
	CheckColType(b.colMeta[j], flux.TFloat)
	return b.cols[j].(*floatColumnBuilder).data
}
func (b *ColListTableBuilder) Strings(j int) []string {
	meta := b.colMeta[j]
	CheckColType(meta, flux.TString)
	return b.cols[j].(*stringColumnBuilder).data
}
func (b *ColListTableBuilder) Times(j int) []values.Time {
	CheckColType(b.colMeta[j], flux.TTime)
	return b.cols[j].(*timeColumnBuilder).data
}

// GetRow takes a row index and returns the record located at that index in the cache
func (b *ColListTableBuilder) GetRow(row int) values.Object {
	record := values.NewObject()
	var val values.Value
	for j, col := range b.colMeta {
		switch col.Type {
		case flux.TBool:
			val = values.NewBool(b.cols[j].(*boolColumnBuilder).data[row])
		case flux.TInt:
			val = values.NewInt(b.cols[j].(*intColumnBuilder).data[row])
		case flux.TUInt:
			val = values.NewUInt(b.cols[j].(*uintColumnBuilder).data[row])
		case flux.TFloat:
			val = values.NewFloat(b.cols[j].(*floatColumnBuilder).data[row])
		case flux.TString:
			val = values.NewString(b.cols[j].(*stringColumnBuilder).data[row])
		case flux.TTime:
			val = values.NewTime(b.cols[j].(*timeColumnBuilder).data[row])
		}
		record.Set(col.Label, val)
	}
	return record
}

func (b *ColListTableBuilder) Table() (flux.Table, error) {
	// Create copy in mutable state
	cols := make([]column, len(b.cols))
	for i, cb := range b.cols {
		cols[i] = cb.Copy()
	}
	return &ColListTable{
		key:     b.key,
		colMeta: b.colMeta,
		cols:    cols,
		nrows:   b.nrows,
	}, nil
}

// SliceColumns iterates over each column of b and re-slices them to the range
// [start:stop].
func (b *ColListTableBuilder) SliceColumns(start, stop int) error {
	if start < 0 || start > stop {
		return fmt.Errorf("invalid start/stop parameters: %d/%d", start, stop)
	}

	if stop < start || stop > b.nrows {
		return fmt.Errorf("invalid start/stop parameters: %d/%d", start, stop)
	}

	for i, c := range b.cols {
		switch c.Meta().Type {

		case flux.TBool:
			col := b.cols[i].(*boolColumnBuilder)
			col.data = col.data[start:stop]
		case flux.TInt:
			col := b.cols[i].(*intColumnBuilder)
			col.data = col.data[start:stop]
		case flux.TUInt:
			col := b.cols[i].(*uintColumnBuilder)
			col.data = col.data[start:stop]
		case flux.TFloat:
			col := b.cols[i].(*floatColumnBuilder)
			col.data = col.data[start:stop]
		case flux.TString:
			col := b.cols[i].(*stringColumnBuilder)
			col.data = col.data[start:stop]
		case flux.TTime:
			col := b.cols[i].(*timeColumnBuilder)
			col.data = col.data[start:stop]
		default:
			panic(fmt.Errorf("unexpected column type %v", c.Meta().Type))
		}
		b.nrows = stop - start
	}

	return nil
}

func (b *ColListTableBuilder) ClearData() {
	for _, c := range b.cols {
		c.Clear()
	}
	b.nrows = 0
}

func (b *ColListTableBuilder) Sort(cols []string, desc bool) {
	colIdxs := make([]int, len(cols))
	for i, label := range cols {
		for j, c := range b.colMeta {
			if c.Label == label {
				colIdxs[i] = j
				break
			}
		}
	}
	s := colListTableSorter{cols: colIdxs, desc: desc, b: b}
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
func (t *ColListTable) Statistics() flux.Statistics {
	return flux.Statistics{}
}

func (t *ColListTable) Len() int {
	return t.nrows
}

func (t *ColListTable) Do(f func(flux.ColReader) error) error {
	return t.DoArrow(func(cr flux.ArrowColReader) error {
		return f(arrow.ColReader(cr))
	})
}

func (t *ColListTable) DoArrow(f func(flux.ArrowColReader) error) error {
	return f(t)
}

func (t *ColListTable) Bools(j int) *array.Boolean {
	CheckColType(t.colMeta[j], flux.TBool)
	return t.cols[j].(*boolColumn).data
}
func (t *ColListTable) Ints(j int) *array.Int64 {
	CheckColType(t.colMeta[j], flux.TInt)
	return t.cols[j].(*intColumn).data
}
func (t *ColListTable) UInts(j int) *array.Uint64 {
	CheckColType(t.colMeta[j], flux.TUInt)
	return t.cols[j].(*uintColumn).data
}
func (t *ColListTable) Floats(j int) *array.Float64 {
	CheckColType(t.colMeta[j], flux.TFloat)
	return t.cols[j].(*floatColumn).data
}
func (t *ColListTable) Strings(j int) *array.Binary {
	meta := t.colMeta[j]
	CheckColType(meta, flux.TString)
	return t.cols[j].(*stringColumn).data
}
func (t *ColListTable) Times(j int) *array.Int64 {
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
			val = values.NewBool(t.cols[j].(*boolColumnBuilder).data[row])
		case flux.TInt:
			val = values.NewInt(t.cols[j].(*intColumnBuilder).data[row])
		case flux.TUInt:
			val = values.NewUInt(t.cols[j].(*uintColumnBuilder).data[row])
		case flux.TFloat:
			val = values.NewFloat(t.cols[j].(*floatColumnBuilder).data[row])
		case flux.TString:
			val = values.NewString(t.cols[j].(*stringColumnBuilder).data[row])
		case flux.TTime:
			val = values.NewTime(t.cols[j].(*timeColumnBuilder).data[row])
		}
		record.Set(col.Label, val)
	}
	return record
}

type colListTableSorter struct {
	cols []int
	desc bool
	b    *ColListTableBuilder
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
}

type columnBuilder interface {
	Meta() flux.ColMeta
	Clear()
	Copy() column
	Len() int
	Equal(i, j int) bool
	Less(i, j int) bool
	Swap(i, j int)
}

type boolColumn struct {
	flux.ColMeta
	data *array.Boolean
}

func (c *boolColumn) Meta() flux.ColMeta {
	return c.ColMeta
}

func (c *boolColumn) Clear() {
	if c.data != nil {
		c.data.Release()
		c.data = nil
	}
}
func (c *boolColumn) Copy() column {
	c.data.Retain()
	return &boolColumn{
		ColMeta: c.ColMeta,
		data:    c.data,
	}
}

type boolColumnBuilder struct {
	flux.ColMeta
	data  []bool
	alloc *Allocator
}

func (c *boolColumnBuilder) Meta() flux.ColMeta {
	return c.ColMeta
}

func (c *boolColumnBuilder) Clear() {
	c.alloc.Free(len(c.data), boolSize)
	c.data = c.data[0:0]
}
func (c *boolColumnBuilder) Copy() column {
	data := arrow.NewBool(c.data, c.alloc.Allocator)
	col := &boolColumn{
		ColMeta: c.ColMeta,
		data:    data,
	}
	return col
}
func (c *boolColumnBuilder) Len() int {
	return len(c.data)
}
func (c *boolColumnBuilder) Equal(i, j int) bool {
	return c.data[i] == c.data[j]
}
func (c *boolColumnBuilder) Less(i, j int) bool {
	if c.data[i] == c.data[j] {
		return false
	}
	return c.data[i]
}
func (c *boolColumnBuilder) Swap(i, j int) {
	c.data[i], c.data[j] = c.data[j], c.data[i]
}

type intColumn struct {
	flux.ColMeta
	data *array.Int64
}

func (c *intColumn) Meta() flux.ColMeta {
	return c.ColMeta
}

func (c *intColumn) Clear() {
	if c.data != nil {
		c.data.Release()
		c.data = nil
	}
}
func (c *intColumn) Copy() column {
	c.data.Retain()
	return &intColumn{
		ColMeta: c.ColMeta,
		data:    c.data,
	}
}

type intColumnBuilder struct {
	flux.ColMeta
	data  []int64
	alloc *Allocator
}

func (c *intColumnBuilder) Meta() flux.ColMeta {
	return c.ColMeta
}

func (c *intColumnBuilder) Clear() {
	c.alloc.Free(len(c.data), int64Size)
	c.data = c.data[0:0]
}
func (c *intColumnBuilder) Copy() column {
	data := arrow.NewInt(c.data, c.alloc.Allocator)
	col := &intColumn{
		ColMeta: c.ColMeta,
		data:    data,
	}
	return col
}
func (c *intColumnBuilder) Len() int {
	return len(c.data)
}
func (c *intColumnBuilder) Equal(i, j int) bool {
	return c.data[i] == c.data[j]
}
func (c *intColumnBuilder) Less(i, j int) bool {
	return c.data[i] < c.data[j]
}
func (c *intColumnBuilder) Swap(i, j int) {
	c.data[i], c.data[j] = c.data[j], c.data[i]
}

type uintColumn struct {
	flux.ColMeta
	data *array.Uint64
}

func (c *uintColumn) Meta() flux.ColMeta {
	return c.ColMeta
}

func (c *uintColumn) Clear() {
	if c.data != nil {
		c.data.Release()
		c.data = nil
	}
}
func (c *uintColumn) Copy() column {
	c.data.Retain()
	return &uintColumn{
		ColMeta: c.ColMeta,
		data:    c.data,
	}
}

type uintColumnBuilder struct {
	flux.ColMeta
	data  []uint64
	alloc *Allocator
}

func (c *uintColumnBuilder) Meta() flux.ColMeta {
	return c.ColMeta
}

func (c *uintColumnBuilder) Clear() {
	c.alloc.Free(len(c.data), uint64Size)
	c.data = c.data[0:0]
}
func (c *uintColumnBuilder) Copy() column {
	data := arrow.NewUint(c.data, c.alloc.Allocator)
	col := &uintColumn{
		ColMeta: c.ColMeta,
		data:    data,
	}
	return col
}
func (c *uintColumnBuilder) Len() int {
	return len(c.data)
}
func (c *uintColumnBuilder) Equal(i, j int) bool {
	return c.data[i] == c.data[j]
}
func (c *uintColumnBuilder) Less(i, j int) bool {
	return c.data[i] < c.data[j]
}
func (c *uintColumnBuilder) Swap(i, j int) {
	c.data[i], c.data[j] = c.data[j], c.data[i]
}

type floatColumn struct {
	flux.ColMeta
	data *array.Float64
}

func (c *floatColumn) Meta() flux.ColMeta {
	return c.ColMeta
}

func (c *floatColumn) Clear() {
	if c.data != nil {
		c.data.Release()
		c.data = nil
	}
}
func (c *floatColumn) Copy() column {
	c.data.Retain()
	return &floatColumn{
		ColMeta: c.ColMeta,
		data:    c.data,
	}
}

type floatColumnBuilder struct {
	flux.ColMeta
	data  []float64
	alloc *Allocator
}

func (c *floatColumnBuilder) Meta() flux.ColMeta {
	return c.ColMeta
}

func (c *floatColumnBuilder) Clear() {
	c.alloc.Free(len(c.data), float64Size)
	c.data = c.data[0:0]
}
func (c *floatColumnBuilder) Copy() column {
	data := arrow.NewFloat(c.data, c.alloc.Allocator)
	col := &floatColumn{
		ColMeta: c.ColMeta,
		data:    data,
	}
	return col
}
func (c *floatColumnBuilder) Len() int {
	return len(c.data)
}
func (c *floatColumnBuilder) Equal(i, j int) bool {
	return c.data[i] == c.data[j]
}
func (c *floatColumnBuilder) Less(i, j int) bool {
	return c.data[i] < c.data[j]
}
func (c *floatColumnBuilder) Swap(i, j int) {
	c.data[i], c.data[j] = c.data[j], c.data[i]
}

type stringColumn struct {
	flux.ColMeta
	data *array.Binary
}

func (c *stringColumn) Meta() flux.ColMeta {
	return c.ColMeta
}

func (c *stringColumn) Clear() {
	if c.data != nil {
		c.data.Release()
		c.data = nil
	}
}
func (c *stringColumn) Copy() column {
	c.data.Retain()
	return &stringColumn{
		ColMeta: c.ColMeta,
		data:    c.data,
	}
}

type stringColumnBuilder struct {
	flux.ColMeta
	data  []string
	alloc *Allocator
}

func (c *stringColumnBuilder) Meta() flux.ColMeta {
	return c.ColMeta
}

func (c *stringColumnBuilder) Clear() {
	c.alloc.Free(len(c.data), stringSize)
	c.data = c.data[0:0]
}
func (c *stringColumnBuilder) Copy() column {
	data := arrow.NewString(c.data, c.alloc.Allocator)
	col := &stringColumn{
		ColMeta: c.ColMeta,
		data:    data,
	}
	return col
}
func (c *stringColumnBuilder) Len() int {
	return len(c.data)
}
func (c *stringColumnBuilder) Equal(i, j int) bool {
	return c.data[i] == c.data[j]
}
func (c *stringColumnBuilder) Less(i, j int) bool {
	return c.data[i] < c.data[j]
}
func (c *stringColumnBuilder) Swap(i, j int) {
	c.data[i], c.data[j] = c.data[j], c.data[i]
}

type timeColumn struct {
	flux.ColMeta
	data *array.Int64
}

func (c *timeColumn) Meta() flux.ColMeta {
	return c.ColMeta
}

func (c *timeColumn) Clear() {
	if c.data != nil {
		c.data.Release()
		c.data = nil
	}
}
func (c *timeColumn) Copy() column {
	c.data.Retain()
	return &timeColumn{
		ColMeta: c.ColMeta,
		data:    c.data,
	}
}

type timeColumnBuilder struct {
	flux.ColMeta
	data  []Time
	alloc *Allocator
}

func (c *timeColumnBuilder) Meta() flux.ColMeta {
	return c.ColMeta
}

func (c *timeColumnBuilder) Clear() {
	c.alloc.Free(len(c.data), timeSize)
	c.data = c.data[0:0]
}
func (c *timeColumnBuilder) Copy() column {
	b := arrow.NewIntBuilder(c.alloc.Allocator)
	b.Reserve(len(c.data))
	for _, v := range c.data {
		b.UnsafeAppend(int64(v))
	}
	col := &timeColumn{
		ColMeta: c.ColMeta,
		data:    b.NewInt64Array(),
	}
	b.Release()
	return col
}
func (c *timeColumnBuilder) Len() int {
	return len(c.data)
}
func (c *timeColumnBuilder) Equal(i, j int) bool {
	return c.data[i] == c.data[j]
}
func (c *timeColumnBuilder) Less(i, j int) bool {
	return c.data[i] < c.data[j]
}
func (c *timeColumnBuilder) Swap(i, j int) {
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
	alloc  *memory.Allocator

	triggerSpec flux.TriggerSpec
}

func NewTableBuilderCache(a *memory.Allocator) *tableBuilderCache {
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
