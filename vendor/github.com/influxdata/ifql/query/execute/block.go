package execute

import (
	"bytes"
	"fmt"
	"sort"
	"sync/atomic"

	"github.com/influxdata/ifql/query"
)

type BlockMetadata interface {
	Bounds() Bounds
	Tags() Tags
}

type BlockKey string

func ToBlockKey(meta BlockMetadata) BlockKey {
	// TODO: Make this not a hack
	return BlockKey(fmt.Sprintf("%s:%d-%d", meta.Tags().Key(), meta.Bounds().Start, meta.Bounds().Stop))
}

type Block interface {
	BlockMetadata

	Cols() []ColMeta
	// Col returns an iterator to consume the values for a given column.
	Col(c int) ValueIterator

	// Times returns an iterator to consume the values for the "_time" column.
	Times() ValueIterator
	// Values returns an iterator to consume the values for the "_value" column.
	// If no column exists and error is returned
	Values() (ValueIterator, error)

	// RefCount modifies the reference count on the block by n.
	// When the RefCount goes to zero, the block is freed.
	RefCount(n int)
}

// OneTimeBlock is a Block that permits reading data only once.
// Specifically the ValueIterator may only be consumed once from any of the columns.
type OneTimeBlock interface {
	Block
	onetime()
}

// CacheOneTimeBlock returns a block that can be read multiple times.
// If the block is not a OneTimeBlock it is returned directly.
// Otherwise its contents are read into a new block.
func CacheOneTimeBlock(b Block, a *Allocator) Block {
	_, ok := b.(OneTimeBlock)
	if !ok {
		return b
	}
	return CopyBlock(b, a)
}

// CopyBlock returns a copy of the block and is OneTimeBlock safe.
func CopyBlock(b Block, a *Allocator) Block {
	builder := NewColListBlockBuilder(a)
	builder.SetBounds(b.Bounds())

	cols := b.Cols()
	colMap := make([]int, len(cols))
	for j, c := range cols {
		colMap[j] = j
		builder.AddCol(c)
		if c.IsTag() && c.Common {
			builder.SetCommonString(j, b.Tags()[c.Label])
		}
	}

	AppendBlock(b, builder, colMap)
	// ColListBlockBuilders do not error
	nb, _ := builder.Block()
	return nb
}

// AddBlockCols adds the columns of b onto builder.
func AddBlockCols(b Block, builder BlockBuilder) {
	cols := b.Cols()
	for j, c := range cols {
		builder.AddCol(c)
		if c.IsTag() && c.Common {
			builder.SetCommonString(j, b.Tags()[c.Label])
		}
	}
}

// AddNewCols adds the columns of b onto builder that did not already exist.
// Returns the mapping of builder cols to block cols.
func AddNewCols(b Block, builder BlockBuilder) []int {
	cols := b.Cols()
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

			if c.IsTag() && c.Common {
				builder.SetCommonString(j, b.Tags()[c.Label])
			}
		}
	}
	return colMap
}

// AppendBlock append data from block b onto builder.
// The colMap is a map of builder columnm index to block column index.
// AppendBlock is OneTimeBlock safe.
func AppendBlock(b Block, builder BlockBuilder, colMap []int) {
	times := b.Times()

	cols := builder.Cols()
	timeIdx := TimeIdx(cols)
	times.DoTime(func(ts []Time, rr RowReader) {
		builder.AppendTimes(timeIdx, ts)
		for j, c := range cols {
			if j == timeIdx || c.Common {
				continue
			}
			for i := range ts {
				switch c.Type {
				case TBool:
					builder.AppendBool(j, rr.AtBool(i, colMap[j]))
				case TInt:
					builder.AppendInt(j, rr.AtInt(i, colMap[j]))
				case TUInt:
					builder.AppendUInt(j, rr.AtUInt(i, colMap[j]))
				case TFloat:
					builder.AppendFloat(j, rr.AtFloat(i, colMap[j]))
				case TString:
					builder.AppendString(j, rr.AtString(i, colMap[j]))
				case TTime:
					builder.AppendTime(j, rr.AtTime(i, colMap[j]))
				default:
					PanicUnknownType(c.Type)
				}
			}
		}
	})
}

// AppendRow appends a single row from rr onto builder.
// The colMap is a map of builder columnm index to rr column index.
func AppendRow(i int, rr RowReader, builder BlockBuilder, colMap []int) {
	for j, c := range builder.Cols() {
		switch c.Type {
		case TBool:
			builder.AppendBool(j, rr.AtBool(i, colMap[j]))
		case TInt:
			builder.AppendInt(j, rr.AtInt(i, colMap[j]))
		case TUInt:
			builder.AppendUInt(j, rr.AtUInt(i, colMap[j]))
		case TFloat:
			builder.AppendFloat(j, rr.AtFloat(i, colMap[j]))
		case TString:
			builder.AppendString(j, rr.AtString(i, colMap[j]))
		case TTime:
			builder.AppendTime(j, rr.AtTime(i, colMap[j]))
		default:
			PanicUnknownType(c.Type)
		}
	}
}

// AppendRowForCols appends a single row from rr onto builder for the specified cols.
// The colMap is a map of builder columnm index to rr column index.
func AppendRowForCols(i int, rr RowReader, builder BlockBuilder, cols []ColMeta, colMap []int) {
	for j, c := range cols {
		switch c.Type {
		case TBool:
			builder.AppendBool(j, rr.AtBool(i, colMap[j]))
		case TInt:
			builder.AppendInt(j, rr.AtInt(i, colMap[j]))
		case TUInt:
			builder.AppendUInt(j, rr.AtUInt(i, colMap[j]))
		case TFloat:
			builder.AppendFloat(j, rr.AtFloat(i, colMap[j]))
		case TString:
			builder.AppendString(j, rr.AtString(i, colMap[j]))
		case TTime:
			builder.AppendTime(j, rr.AtTime(i, colMap[j]))
		default:
			PanicUnknownType(c.Type)
		}
	}
}

// AddTags add columns to the builder for the given tags.
// It is assumed that all tags are common to all rows of this block.
func AddTags(t Tags, b BlockBuilder) {
	keys := t.Keys()
	for _, k := range keys {
		j := b.AddCol(ColMeta{
			Label:  k,
			Type:   TString,
			Kind:   TagColKind,
			Common: true,
		})
		b.SetCommonString(j, t[k])
	}
}

var NoDefaultValueColumn = fmt.Errorf("no default value column %q found.", DefaultValueColLabel)

func ValueCol(cols []ColMeta) (ColMeta, error) {
	for _, c := range cols {
		if c.Label == DefaultValueColLabel {
			return c, nil
		}
	}
	return ColMeta{}, NoDefaultValueColumn
}
func ValueIdx(cols []ColMeta) int {
	return ColIdx(DefaultValueColLabel, cols)
}
func TimeIdx(cols []ColMeta) int {
	return ColIdx(TimeColLabel, cols)
}
func ColIdx(label string, cols []ColMeta) int {
	for j, c := range cols {
		if c.Label == label {
			return j
		}
	}
	return -1
}

// BlockBuilder builds blocks that can be used multiple times
type BlockBuilder interface {
	SetBounds(Bounds)

	BlockMetadata

	NRows() int
	NCols() int
	Cols() []ColMeta

	// AddCol increases the size of the block by one column.
	// The index of the column is returned.
	AddCol(ColMeta) int

	// Set sets the value at the specified coordinates
	// The rows and columns must exist before calling set, otherwise Set panics.
	SetBool(i, j int, value bool)
	SetInt(i, j int, value int64)
	SetUInt(i, j int, value uint64)
	SetFloat(i, j int, value float64)
	SetString(i, j int, value string)
	SetTime(i, j int, value Time)

	// SetCommonString sets a single value for the entire column.
	SetCommonString(j int, value string)

	AppendBool(j int, value bool)
	AppendInt(j int, value int64)
	AppendUInt(j int, value uint64)
	AppendFloat(j int, value float64)
	AppendString(j int, value string)
	AppendTime(j int, value Time)

	AppendFloats(j int, values []float64)
	AppendStrings(j int, values []string)
	AppendTimes(j int, values []Time)

	// Sort the rows of the by the values of the columns in the order listed.
	Sort(cols []string, desc bool)

	// Clear removes all rows, while preserving the column meta data.
	ClearData()

	// Block returns the block that has been built.
	// Further modifications of the builder will not effect the returned block.
	Block() (Block, error)
}

type DataType int

const (
	TInvalid DataType = iota
	TBool
	TInt
	TUInt
	TFloat
	TString
	TTime
)

func (t DataType) String() string {
	switch t {
	case TInvalid:
		return "invalid"
	case TBool:
		return "bool"
	case TInt:
		return "int"
	case TUInt:
		return "uint"
	case TFloat:
		return "float"
	case TString:
		return "string"
	case TTime:
		return "time"
	default:
		return "unknown"
	}
}

type ColMeta struct {
	Label string
	Type  DataType
	Kind  ColKind
	// Common indicates that the value for the column is shared by all rows.
	Common bool
}

func (c ColMeta) IsTime() bool {
	return c.Kind == TimeColKind
}
func (c ColMeta) IsTag() bool {
	return c.Kind == TagColKind
}
func (c ColMeta) IsValue() bool {
	return c.Kind == ValueColKind
}

const (
	DefaultValueColLabel = "_value"
	TimeColLabel         = "_time"
)

type ColKind int

const (
	InvalidColKind = iota
	TimeColKind
	TagColKind
	ValueColKind
)

func (k ColKind) String() string {
	switch k {
	case InvalidColKind:
		return "invalid"
	case TimeColKind:
		return "time"
	case TagColKind:
		return "tag"
	case ValueColKind:
		return "value"
	default:
		return "unknown"
	}
}

var (
	TimeCol = ColMeta{
		Label: TimeColLabel,
		Type:  TTime,
		Kind:  TimeColKind,
	}
)

type BlockIterator interface {
	Do(f func(Block) error) error
}

type ValueIterator interface {
	DoBool(f func([]bool, RowReader))
	DoInt(f func([]int64, RowReader))
	DoUInt(f func([]uint64, RowReader))
	DoFloat(f func([]float64, RowReader))
	DoString(f func([]string, RowReader))
	DoTime(f func([]Time, RowReader))
}

type RowReader interface {
	Cols() []ColMeta
	// AtBool returns the bool value of another column and given index.
	AtBool(i, j int) bool
	// AtInt returns the int value of another column and given index.
	AtInt(i, j int) int64
	// AtUInt returns the uint value of another column and given index.
	AtUInt(i, j int) uint64
	// AtFloat returns the float value of another column and given index.
	AtFloat(i, j int) float64
	// AtString returns the string value of another column and given index.
	AtString(i, j int) string
	// AtTime returns the time value of another column and given index.
	AtTime(i, j int) Time
}

func TagsForRow(i int, rr RowReader) Tags {
	cols := rr.Cols()
	tags := make(Tags, len(cols))
	for j, c := range cols {
		if c.IsTag() {
			tags[c.Label] = rr.AtString(i, j)
		}
	}
	return tags
}

type Tags map[string]string

func (t Tags) Copy() Tags {
	nt := make(Tags, len(t))
	for k, v := range t {
		nt[k] = v
	}
	return nt
}

func (t Tags) Equal(o Tags) bool {
	if len(t) != len(o) {
		return false
	}
	for k, v := range t {
		if o[k] != v {
			return false
		}
	}
	return true
}

func (t Tags) Keys() []string {
	keys := make([]string, 0, len(t))
	for k := range t {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return keys
}

type TagsKey string

func (t Tags) Key() TagsKey {
	keys := make([]string, 0, len(t))
	for k := range t {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return TagsToKey(keys, t)
}

// Subset creates a new Tags that is a subset of t, using the list of keys.
// If a keys is provided that does not exist on t, then a subset is not possible and
// the boolean return value is false.
func (t Tags) Subset(keys []string) (Tags, bool) {
	subset := make(Tags, len(keys))
	for _, k := range keys {
		v, ok := t[k]
		if !ok {
			return nil, false
		}
		subset[k] = v
	}
	return subset, true
}

func (t Tags) IntersectingSubset(keys []string) Tags {
	subset := make(Tags, len(keys))
	for _, k := range keys {
		v, ok := t[k]
		if ok {
			subset[k] = v
		}
	}
	return subset
}

func TagsToKey(order []string, t Tags) TagsKey {
	var buf bytes.Buffer
	for i, k := range order {
		if i > 0 {
			buf.WriteRune(',')
		}
		buf.WriteString(k)
		buf.WriteRune('=')
		buf.WriteString(t[k])
	}
	return TagsKey(buf.String())
}

type blockMetadata struct {
	tags   Tags
	bounds Bounds
}

func (m blockMetadata) Tags() Tags {
	return m.tags
}
func (m blockMetadata) Bounds() Bounds {
	return m.bounds
}

type ColListBlockBuilder struct {
	blk   *ColListBlock
	key   BlockKey
	alloc *Allocator
}

func NewColListBlockBuilder(a *Allocator) *ColListBlockBuilder {
	return &ColListBlockBuilder{
		blk:   new(ColListBlock),
		alloc: a,
	}
}

func (b ColListBlockBuilder) SetBounds(bounds Bounds) {
	b.blk.bounds = bounds
}
func (b ColListBlockBuilder) Bounds() Bounds {
	return b.blk.bounds
}

func (b ColListBlockBuilder) Tags() Tags {
	return b.blk.tags
}
func (b ColListBlockBuilder) NRows() int {
	return b.blk.nrows
}
func (b ColListBlockBuilder) NCols() int {
	return len(b.blk.cols)
}
func (b ColListBlockBuilder) Cols() []ColMeta {
	return b.blk.colMeta
}

func (b ColListBlockBuilder) AddCol(c ColMeta) int {
	var col column
	switch c.Type {
	case TBool:
		col = &boolColumn{
			ColMeta: c,
			alloc:   b.alloc,
		}
	case TInt:
		col = &intColumn{
			ColMeta: c,
			alloc:   b.alloc,
		}
	case TUInt:
		col = &uintColumn{
			ColMeta: c,
			alloc:   b.alloc,
		}
	case TFloat:
		col = &floatColumn{
			ColMeta: c,
			alloc:   b.alloc,
		}
	case TString:
		if c.Common {
			col = &commonStrColumn{
				ColMeta: c,
			}
		} else {
			col = &stringColumn{
				ColMeta: c,
				alloc:   b.alloc,
			}
		}
	case TTime:
		col = &timeColumn{
			ColMeta: c,
			alloc:   b.alloc,
		}
	default:
		PanicUnknownType(c.Type)
	}
	b.blk.colMeta = append(b.blk.colMeta, c)
	b.blk.cols = append(b.blk.cols, col)
	return len(b.blk.cols) - 1
}

func (b ColListBlockBuilder) SetBool(i int, j int, value bool) {
	b.checkColType(j, TBool)
	b.blk.cols[j].(*boolColumn).data[i] = value
}
func (b ColListBlockBuilder) AppendBool(j int, value bool) {
	b.checkColType(j, TBool)
	col := b.blk.cols[j].(*boolColumn)
	col.data = b.alloc.AppendBools(col.data, value)
	b.blk.nrows = len(col.data)
}
func (b ColListBlockBuilder) AppendBools(j int, values []bool) {
	b.checkColType(j, TBool)
	col := b.blk.cols[j].(*boolColumn)
	col.data = b.alloc.AppendBools(col.data, values...)
	b.blk.nrows = len(col.data)
}

func (b ColListBlockBuilder) SetInt(i int, j int, value int64) {
	b.checkColType(j, TInt)
	b.blk.cols[j].(*intColumn).data[i] = value
}
func (b ColListBlockBuilder) AppendInt(j int, value int64) {
	b.checkColType(j, TInt)
	col := b.blk.cols[j].(*intColumn)
	col.data = b.alloc.AppendInts(col.data, value)
	b.blk.nrows = len(col.data)
}
func (b ColListBlockBuilder) AppendInts(j int, values []int64) {
	b.checkColType(j, TInt)
	col := b.blk.cols[j].(*intColumn)
	col.data = b.alloc.AppendInts(col.data, values...)
	b.blk.nrows = len(col.data)
}

func (b ColListBlockBuilder) SetUInt(i int, j int, value uint64) {
	b.checkColType(j, TUInt)
	b.blk.cols[j].(*uintColumn).data[i] = value
}
func (b ColListBlockBuilder) AppendUInt(j int, value uint64) {
	b.checkColType(j, TUInt)
	col := b.blk.cols[j].(*uintColumn)
	col.data = b.alloc.AppendUInts(col.data, value)
	b.blk.nrows = len(col.data)
}
func (b ColListBlockBuilder) AppendUInts(j int, values []uint64) {
	b.checkColType(j, TUInt)
	col := b.blk.cols[j].(*uintColumn)
	col.data = b.alloc.AppendUInts(col.data, values...)
	b.blk.nrows = len(col.data)
}

func (b ColListBlockBuilder) SetFloat(i int, j int, value float64) {
	b.checkColType(j, TFloat)
	b.blk.cols[j].(*floatColumn).data[i] = value
}
func (b ColListBlockBuilder) AppendFloat(j int, value float64) {
	b.checkColType(j, TFloat)
	col := b.blk.cols[j].(*floatColumn)
	col.data = b.alloc.AppendFloats(col.data, value)
	b.blk.nrows = len(col.data)
}
func (b ColListBlockBuilder) AppendFloats(j int, values []float64) {
	b.checkColType(j, TFloat)
	col := b.blk.cols[j].(*floatColumn)
	col.data = b.alloc.AppendFloats(col.data, values...)
	b.blk.nrows = len(col.data)
}

func (b ColListBlockBuilder) SetString(i int, j int, value string) {
	b.checkColType(j, TString)
	b.blk.cols[j].(*stringColumn).data[i] = value
}
func (b ColListBlockBuilder) AppendString(j int, value string) {
	meta := b.blk.cols[j].Meta()
	checkColType(meta, TString)
	if meta.Common {
		v := b.blk.cols[j].(*commonStrColumn).value
		if value != v {
			panic(fmt.Errorf("attempting to append a different value to the column %s, which has all common values", meta.Label))
		}
		return
	}
	col := b.blk.cols[j].(*stringColumn)
	col.data = b.alloc.AppendStrings(col.data, value)
	b.blk.nrows = len(col.data)
}
func (b ColListBlockBuilder) AppendStrings(j int, values []string) {
	b.checkColType(j, TString)
	col := b.blk.cols[j].(*stringColumn)
	col.data = b.alloc.AppendStrings(col.data, values...)
	b.blk.nrows = len(col.data)
}
func (b ColListBlockBuilder) SetCommonString(j int, value string) {
	meta := b.blk.cols[j].Meta()
	checkColType(meta, TString)
	if !meta.Common {
		panic(fmt.Errorf("cannot set common value for column %s, column is not marked as common", meta.Label))
	}
	b.blk.cols[j].(*commonStrColumn).value = value
	if meta.IsTag() {
		if b.blk.tags == nil {
			b.blk.tags = make(Tags)
		}
		b.blk.tags[meta.Label] = value
	}
}

func (b ColListBlockBuilder) SetTime(i int, j int, value Time) {
	b.checkColType(j, TTime)
	b.blk.cols[j].(*timeColumn).data[i] = value
}
func (b ColListBlockBuilder) AppendTime(j int, value Time) {
	b.checkColType(j, TTime)
	col := b.blk.cols[j].(*timeColumn)
	col.data = b.alloc.AppendTimes(col.data, value)
	b.blk.nrows = len(col.data)
}
func (b ColListBlockBuilder) AppendTimes(j int, values []Time) {
	b.checkColType(j, TTime)
	col := b.blk.cols[j].(*timeColumn)
	col.data = b.alloc.AppendTimes(col.data, values...)
	b.blk.nrows = len(col.data)
}

func (b ColListBlockBuilder) checkColType(j int, typ DataType) {
	checkColType(b.blk.colMeta[j], typ)
}

func checkColType(col ColMeta, typ DataType) {
	if col.Type != typ {
		panic(fmt.Errorf("column %s is not of type %v", col.Label, typ))
	}
}

func PanicUnknownType(typ DataType) {
	panic(fmt.Errorf("unknown type %v", typ))
}

func (b ColListBlockBuilder) Block() (Block, error) {
	// Create copy in mutable state
	return b.blk.Copy(), nil
}

// RawBlock returns the underlying block being constructed.
// The Block returned will be modified by future calls to any BlockBuilder methods.
func (b ColListBlockBuilder) RawBlock() *ColListBlock {
	// Create copy in mutable state
	return b.blk
}

func (b ColListBlockBuilder) ClearData() {
	for _, c := range b.blk.cols {
		c.Clear()
	}
	b.blk.nrows = 0
}

func (b ColListBlockBuilder) Sort(cols []string, desc bool) {
	colIdxs := make([]int, len(cols))
	for i, label := range cols {
		for j, c := range b.blk.colMeta {
			if c.Label == label {
				colIdxs[i] = j
				break
			}
		}
	}
	s := colListBlockSorter{cols: colIdxs, desc: desc, b: b.blk}
	sort.Sort(s)
}

// ColListBlock implements Block using list of columns.
// All data for the block is stored in RAM.
// As a result At* methods are provided directly on the block for easy access.
type ColListBlock struct {
	bounds Bounds
	tags   Tags

	colMeta []ColMeta
	cols    []column
	nrows   int

	refCount int32
}

func (b *ColListBlock) RefCount(n int) {
	c := atomic.AddInt32(&b.refCount, int32(n))
	if c == 0 {
		for _, c := range b.cols {
			c.Clear()
		}
	}
}

func (b *ColListBlock) Bounds() Bounds {
	return b.bounds
}

func (b *ColListBlock) Tags() Tags {
	return b.tags
}

func (b *ColListBlock) Cols() []ColMeta {
	return b.colMeta
}
func (b ColListBlock) NRows() int {
	return b.nrows
}

func (b *ColListBlock) Col(c int) ValueIterator {
	return colListValueIterator{
		col:     c,
		colMeta: b.colMeta,
		cols:    b.cols,
		nrows:   b.nrows,
	}
}

func (b *ColListBlock) Values() (ValueIterator, error) {
	j := ValueIdx(b.colMeta)
	if j >= 0 {
		return colListValueIterator{
			col:     j,
			colMeta: b.colMeta,
			cols:    b.cols,
			nrows:   b.nrows,
		}, nil
	}
	return nil, NoDefaultValueColumn
}

func (b *ColListBlock) Times() ValueIterator {
	j := TimeIdx(b.colMeta)
	if j >= 0 {
		return colListValueIterator{
			col:     j,
			colMeta: b.colMeta,
			cols:    b.cols,
			nrows:   b.nrows,
		}
	}
	return nil
}
func (b *ColListBlock) AtBool(i, j int) bool {
	checkColType(b.colMeta[j], TBool)
	return b.cols[j].(*boolColumn).data[i]
}
func (b *ColListBlock) AtInt(i, j int) int64 {
	checkColType(b.colMeta[j], TInt)
	return b.cols[j].(*intColumn).data[i]
}
func (b *ColListBlock) AtUInt(i, j int) uint64 {
	checkColType(b.colMeta[j], TUInt)
	return b.cols[j].(*uintColumn).data[i]
}
func (b *ColListBlock) AtFloat(i, j int) float64 {
	checkColType(b.colMeta[j], TFloat)
	return b.cols[j].(*floatColumn).data[i]
}
func (b *ColListBlock) AtString(i, j int) string {
	meta := b.colMeta[j]
	checkColType(meta, TString)
	if meta.IsTag() && meta.Common {
		return b.cols[j].(*commonStrColumn).value
	}
	return b.cols[j].(*stringColumn).data[i]
}
func (b *ColListBlock) AtTime(i, j int) Time {
	checkColType(b.colMeta[j], TTime)
	return b.cols[j].(*timeColumn).data[i]
}

func (b *ColListBlock) Copy() *ColListBlock {
	cpy := new(ColListBlock)
	cpy.bounds = b.bounds
	cpy.tags = b.tags.Copy()
	cpy.nrows = b.nrows

	cpy.colMeta = make([]ColMeta, len(b.colMeta))
	copy(cpy.colMeta, b.colMeta)

	cpy.cols = make([]column, len(b.cols))
	for i, c := range b.cols {
		cpy.cols[i] = c.Copy()
	}

	return cpy
}

type colListValueIterator struct {
	col     int
	cols    []column
	colMeta []ColMeta
	nrows   int
}

func (itr colListValueIterator) Cols() []ColMeta {
	return itr.colMeta
}
func (itr colListValueIterator) DoBool(f func([]bool, RowReader)) {
	checkColType(itr.colMeta[itr.col], TBool)
	f(itr.cols[itr.col].(*boolColumn).data, itr)
}
func (itr colListValueIterator) DoInt(f func([]int64, RowReader)) {
	checkColType(itr.colMeta[itr.col], TInt)
	f(itr.cols[itr.col].(*intColumn).data, itr)
}
func (itr colListValueIterator) DoUInt(f func([]uint64, RowReader)) {
	checkColType(itr.colMeta[itr.col], TUInt)
	f(itr.cols[itr.col].(*uintColumn).data, itr)
}
func (itr colListValueIterator) DoFloat(f func([]float64, RowReader)) {
	checkColType(itr.colMeta[itr.col], TFloat)
	f(itr.cols[itr.col].(*floatColumn).data, itr)
}
func (itr colListValueIterator) DoString(f func([]string, RowReader)) {
	meta := itr.colMeta[itr.col]
	checkColType(meta, TString)
	if meta.IsTag() && meta.Common {
		value := itr.cols[itr.col].(*commonStrColumn).value
		strs := make([]string, itr.nrows)
		for i := range strs {
			strs[i] = value
		}
		f(strs, itr)
	}
	f(itr.cols[itr.col].(*stringColumn).data, itr)
}
func (itr colListValueIterator) DoTime(f func([]Time, RowReader)) {
	checkColType(itr.colMeta[itr.col], TTime)
	f(itr.cols[itr.col].(*timeColumn).data, itr)
}
func (itr colListValueIterator) AtBool(i, j int) bool {
	checkColType(itr.colMeta[j], TBool)
	return itr.cols[j].(*boolColumn).data[i]
}
func (itr colListValueIterator) AtInt(i, j int) int64 {
	checkColType(itr.colMeta[j], TInt)
	return itr.cols[j].(*intColumn).data[i]
}
func (itr colListValueIterator) AtUInt(i, j int) uint64 {
	checkColType(itr.colMeta[j], TUInt)
	return itr.cols[j].(*uintColumn).data[i]
}
func (itr colListValueIterator) AtFloat(i, j int) float64 {
	checkColType(itr.colMeta[j], TFloat)
	return itr.cols[j].(*floatColumn).data[i]
}
func (itr colListValueIterator) AtString(i, j int) string {
	meta := itr.colMeta[j]
	checkColType(meta, TString)
	if meta.IsTag() && meta.Common {
		return itr.cols[j].(*commonStrColumn).value
	}
	return itr.cols[j].(*stringColumn).data[i]
}
func (itr colListValueIterator) AtTime(i, j int) Time {
	checkColType(itr.colMeta[j], TTime)
	return itr.cols[j].(*timeColumn).data[i]
}

type colListBlockSorter struct {
	cols []int
	desc bool
	b    *ColListBlock
}

func (c colListBlockSorter) Len() int {
	return c.b.nrows
}

func (c colListBlockSorter) Less(x int, y int) (less bool) {
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

func (c colListBlockSorter) Swap(x int, y int) {
	for _, col := range c.b.cols {
		col.Swap(x, y)
	}
}

type column interface {
	Meta() ColMeta
	Clear()
	Copy() column
	Equal(i, j int) bool
	Less(i, j int) bool
	Swap(i, j int)
}

type boolColumn struct {
	ColMeta
	data  []bool
	alloc *Allocator
}

func (c *boolColumn) Meta() ColMeta {
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
	ColMeta
	data  []int64
	alloc *Allocator
}

func (c *intColumn) Meta() ColMeta {
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
	ColMeta
	data  []uint64
	alloc *Allocator
}

func (c *uintColumn) Meta() ColMeta {
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
	ColMeta
	data  []float64
	alloc *Allocator
}

func (c *floatColumn) Meta() ColMeta {
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
	ColMeta
	data  []string
	alloc *Allocator
}

func (c *stringColumn) Meta() ColMeta {
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
	ColMeta
	data  []Time
	alloc *Allocator
}

func (c *timeColumn) Meta() ColMeta {
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

//commonStrColumn has the same string value for all rows
type commonStrColumn struct {
	ColMeta
	value string
}

func (c *commonStrColumn) Meta() ColMeta {
	return c.ColMeta
}
func (c *commonStrColumn) Clear() {
}
func (c *commonStrColumn) Copy() column {
	cpy := new(commonStrColumn)
	*cpy = *c
	return cpy
}
func (c *commonStrColumn) Equal(i, j int) bool {
	return true
}
func (c *commonStrColumn) Less(i, j int) bool {
	return false
}
func (c *commonStrColumn) Swap(i, j int) {}

type BlockBuilderCache interface {
	// BlockBuilder returns an existing or new BlockBuilder for the given meta data.
	// The boolean return value indicates if BlockBuilder is new.
	BlockBuilder(meta BlockMetadata) (BlockBuilder, bool)
	ForEachBuilder(f func(BlockKey, BlockBuilder))
}

type blockBuilderCache struct {
	blocks map[BlockKey]blockState
	alloc  *Allocator

	triggerSpec query.TriggerSpec
}

func NewBlockBuilderCache(a *Allocator) *blockBuilderCache {
	return &blockBuilderCache{
		blocks: make(map[BlockKey]blockState),
		alloc:  a,
	}
}

type blockState struct {
	builder BlockBuilder
	trigger Trigger
}

func (d *blockBuilderCache) SetTriggerSpec(ts query.TriggerSpec) {
	d.triggerSpec = ts
}

func (d *blockBuilderCache) Block(key BlockKey) (Block, error) {
	return d.blocks[key].builder.Block()
}
func (d *blockBuilderCache) BlockMetadata(key BlockKey) BlockMetadata {
	return d.blocks[key].builder
}

// BlockBuilder will return the builder for the specified block.
// If no builder exists, one will be created.
func (d *blockBuilderCache) BlockBuilder(meta BlockMetadata) (BlockBuilder, bool) {
	key := ToBlockKey(meta)
	b, ok := d.blocks[key]
	if !ok {
		builder := NewColListBlockBuilder(d.alloc)
		builder.SetBounds(meta.Bounds())
		t := NewTriggerFromSpec(d.triggerSpec)
		b = blockState{
			builder: builder,
			trigger: t,
		}
		d.blocks[key] = b
	}
	return b.builder, !ok
}

func (d *blockBuilderCache) ForEachBuilder(f func(BlockKey, BlockBuilder)) {
	for k, b := range d.blocks {
		f(k, b.builder)
	}
}

func (d *blockBuilderCache) DiscardBlock(key BlockKey) {
	d.blocks[key].builder.ClearData()
}
func (d *blockBuilderCache) ExpireBlock(key BlockKey) {
	d.blocks[key].builder.ClearData()
	delete(d.blocks, key)
}

func (d *blockBuilderCache) ForEach(f func(BlockKey)) {
	for bk := range d.blocks {
		f(bk)
	}
}

func (d *blockBuilderCache) ForEachWithContext(f func(BlockKey, Trigger, BlockContext)) {
	for bk, b := range d.blocks {
		f(bk, b.trigger, BlockContext{
			Bounds: b.builder.Bounds(),
			Count:  b.builder.NRows(),
		})
	}
}
