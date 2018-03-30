package functions

import (
	"fmt"
	"log"
	"math"
	"sort"
	"sync"

	"github.com/influxdata/ifql/compiler"
	"github.com/influxdata/ifql/query"
	"github.com/influxdata/ifql/query/execute"
	"github.com/influxdata/ifql/query/plan"
	"github.com/influxdata/ifql/semantic"
	"github.com/pkg/errors"
)

const JoinKind = "join"
const MergeJoinKind = "merge-join"

type JoinOpSpec struct {
	// On is a list of tags on which to join.
	On []string `json:"on"`
	// Fn is a function accepting a single parameter.
	// The parameter is map if records for each of the parent operations.
	Fn *semantic.FunctionExpression `json:"fn"`
	// TableNames are the names to give to each parent when populating the parameter for the function.
	// The first parent is referenced by the first name and so forth.
	// TODO(nathanielc): Change this to a map of parent operation IDs to names.
	// Then make it possible for the transformation to map operation IDs to parent IDs.
	TableNames map[query.OperationID]string `json:"table_names"`
}

var joinSignature = semantic.FunctionSignature{
	Params: map[string]semantic.Type{
		"tables": semantic.Object,
		"fn":     semantic.Function,
		"on":     semantic.NewArrayType(semantic.String),
	},
	ReturnType:   query.TableObjectType,
	PipeArgument: "tables",
}

func init() {
	query.RegisterFunction(JoinKind, createJoinOpSpec, semantic.FunctionSignature{})
	query.RegisterOpSpec(JoinKind, newJoinOp)
	//TODO(nathanielc): Allow for other types of join implementations
	plan.RegisterProcedureSpec(MergeJoinKind, newMergeJoinProcedure, JoinKind)
	execute.RegisterTransformation(MergeJoinKind, createMergeJoinTransformation)
}

func createJoinOpSpec(args query.Arguments, a *query.Administration) (query.OperationSpec, error) {
	f, err := args.GetRequiredFunction("fn")
	if err != nil {
		return nil, err
	}
	resolved, err := f.Resolve()
	if err != nil {
		return nil, err
	}
	spec := &JoinOpSpec{
		Fn:         resolved,
		TableNames: make(map[query.OperationID]string),
	}

	if array, ok, err := args.GetArray("on", semantic.String); err != nil {
		return nil, err
	} else if ok {
		spec.On = array.AsStrings()
	}

	if m, ok, err := args.GetObject("tables"); err != nil {
		return nil, err
	} else if ok {
		for k, t := range m.Properties {
			if t.Type().Kind() != semantic.Object {
				return nil, fmt.Errorf("value for key %q in tables must be an object: got %v", k, t.Type().Kind())
			}
			if t.Type() != query.TableObjectType {
				return nil, fmt.Errorf("value for key %q in tables must be an table object: got %v", k, t.Type())
			}
			p := t.(query.TableObject)
			a.AddParent(p)
			spec.TableNames[p.ID()] = k
		}
	}

	return spec, nil
}

func newJoinOp() query.OperationSpec {
	return new(JoinOpSpec)
}

func (s *JoinOpSpec) Kind() query.OperationKind {
	return JoinKind
}

type MergeJoinProcedureSpec struct {
	On         []string                     `json:"keys"`
	Fn         *semantic.FunctionExpression `json:"f"`
	TableNames map[plan.ProcedureID]string  `json:"table_names"`
}

func newMergeJoinProcedure(qs query.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*JoinOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}

	tableNames := make(map[plan.ProcedureID]string, len(spec.TableNames))
	for qid, name := range spec.TableNames {
		pid := pa.ConvertID(qid)
		tableNames[pid] = name
	}

	p := &MergeJoinProcedureSpec{
		On:         spec.On,
		Fn:         spec.Fn,
		TableNames: tableNames,
	}
	sort.Strings(p.On)
	return p, nil
}

func (s *MergeJoinProcedureSpec) Kind() plan.ProcedureKind {
	return MergeJoinKind
}
func (s *MergeJoinProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(MergeJoinProcedureSpec)

	ns.On = make([]string, len(s.On))
	copy(ns.On, s.On)

	ns.Fn = s.Fn.Copy().(*semantic.FunctionExpression)

	return ns
}

func (s *MergeJoinProcedureSpec) ParentChanged(old, new plan.ProcedureID) {
	if v, ok := s.TableNames[old]; ok {
		delete(s.TableNames, old)
		s.TableNames[new] = v
	}
}

func createMergeJoinTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	s, ok := spec.(*MergeJoinProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", spec)
	}
	parents := a.Parents()
	if len(parents) != 2 {
		//TODO(nathanielc): Support n-way joins
		return nil, nil, errors.New("joins currently must only have two parents")
	}

	tableNames := make(map[execute.DatasetID]string, len(s.TableNames))
	for pid, name := range s.TableNames {
		id := a.ConvertID(pid)
		tableNames[id] = name
	}
	leftName := tableNames[parents[0]]
	rightName := tableNames[parents[1]]

	joinFn, err := NewRowJoinFunction(s.Fn, parents, tableNames)
	if err != nil {
		return nil, nil, errors.Wrap(err, "invalid expression")
	}
	cache := NewMergeJoinCache(joinFn, a.Allocator(), leftName, rightName)
	d := execute.NewDataset(id, mode, cache)
	t := NewMergeJoinTransformation(d, cache, s, parents, tableNames)
	return t, d, nil
}

type mergeJoinTransformation struct {
	parents []execute.DatasetID

	mu sync.Mutex

	d     execute.Dataset
	cache MergeJoinCache

	leftID, rightID     execute.DatasetID
	leftName, rightName string

	parentState map[execute.DatasetID]*mergeJoinParentState

	keys []string
}

func NewMergeJoinTransformation(d execute.Dataset, cache MergeJoinCache, spec *MergeJoinProcedureSpec, parents []execute.DatasetID, tableNames map[execute.DatasetID]string) *mergeJoinTransformation {
	t := &mergeJoinTransformation{
		d:         d,
		cache:     cache,
		keys:      spec.On,
		leftID:    parents[0],
		rightID:   parents[1],
		leftName:  tableNames[parents[0]],
		rightName: tableNames[parents[1]],
	}
	t.parentState = make(map[execute.DatasetID]*mergeJoinParentState)
	for _, id := range parents {
		t.parentState[id] = new(mergeJoinParentState)
	}
	return t
}

type mergeJoinParentState struct {
	mark       execute.Time
	processing execute.Time
	finished   bool
}

func (t *mergeJoinTransformation) RetractBlock(id execute.DatasetID, meta execute.BlockMetadata) error {
	t.mu.Lock()
	defer t.mu.Unlock()

	bm := blockMetadata{
		tags:   meta.Tags().IntersectingSubset(t.keys),
		bounds: meta.Bounds(),
	}
	return t.d.RetractBlock(execute.ToBlockKey(bm))
}

func (t *mergeJoinTransformation) Process(id execute.DatasetID, b execute.Block) error {
	t.mu.Lock()
	defer t.mu.Unlock()

	bm := blockMetadata{
		tags:   b.Tags().IntersectingSubset(t.keys),
		bounds: b.Bounds(),
	}
	tables := t.cache.Tables(bm)

	var table execute.BlockBuilder
	switch id {
	case t.leftID:
		table = tables.left
	case t.rightID:
		table = tables.right
	}

	colMap := t.addNewCols(b, table)

	times := b.Times()
	times.DoTime(func(ts []execute.Time, rr execute.RowReader) {
		for i := range ts {
			execute.AppendRow(i, rr, table, colMap)
		}
	})
	return nil
}

// addNewCols adds column to builder that exist on b and are part of the join keys.
// This method ensures that the left and right tables always have the same columns.
// A colMap is returned mapping cols of builder to cols of b.
func (t *mergeJoinTransformation) addNewCols(b execute.Block, builder execute.BlockBuilder) []int {
	cols := b.Cols()
	existing := builder.Cols()
	colMap := make([]int, len(existing))
	for j, c := range cols {
		// Skip common tags or tags that are not one of the join keys.
		if c.IsTag() {
			if c.Common {
				continue
			}
			found := false
			for _, k := range t.keys {
				if c.Label == k {
					found = true
					break
				}
			}
			// Column is not one of the join keys
			if !found {
				continue
			}
		}
		// Check if column already exists
		found := false
		for ej, ec := range existing {
			if c.Label == ec.Label {
				colMap[ej] = j
				found = true
				break
			}
		}
		// Add new column
		if !found {
			builder.AddCol(c)
			colMap = append(colMap, j)
		}
	}
	return colMap
}

func (t *mergeJoinTransformation) UpdateWatermark(id execute.DatasetID, mark execute.Time) error {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.parentState[id].mark = mark

	min := execute.Time(math.MaxInt64)
	for _, state := range t.parentState {
		if state.mark < min {
			min = state.mark
		}
	}

	return t.d.UpdateWatermark(min)
}

func (t *mergeJoinTransformation) UpdateProcessingTime(id execute.DatasetID, pt execute.Time) error {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.parentState[id].processing = pt

	min := execute.Time(math.MaxInt64)
	for _, state := range t.parentState {
		if state.processing < min {
			min = state.processing
		}
	}

	return t.d.UpdateProcessingTime(min)
}

func (t *mergeJoinTransformation) Finish(id execute.DatasetID, err error) {
	t.mu.Lock()
	defer t.mu.Unlock()
	if err != nil {
		t.d.Finish(err)
	}

	t.parentState[id].finished = true
	finished := true
	for _, state := range t.parentState {
		finished = finished && state.finished
	}

	if finished {
		t.d.Finish(nil)
	}
}

type MergeJoinCache interface {
	Tables(execute.BlockMetadata) *joinTables
}

type mergeJoinCache struct {
	data  map[execute.BlockKey]*joinTables
	alloc *execute.Allocator

	leftName, rightName string

	triggerSpec query.TriggerSpec

	joinFn *joinFunc
}

func NewMergeJoinCache(joinFn *joinFunc, a *execute.Allocator, leftName, rightName string) *mergeJoinCache {
	return &mergeJoinCache{
		data:      make(map[execute.BlockKey]*joinTables),
		joinFn:    joinFn,
		alloc:     a,
		leftName:  leftName,
		rightName: rightName,
	}
}

func (c *mergeJoinCache) BlockMetadata(key execute.BlockKey) execute.BlockMetadata {
	return c.data[key]
}

func (c *mergeJoinCache) Block(key execute.BlockKey) (execute.Block, error) {
	return c.data[key].Join()
}

func (c *mergeJoinCache) ForEach(f func(execute.BlockKey)) {
	for bk := range c.data {
		f(bk)
	}
}

func (c *mergeJoinCache) ForEachWithContext(f func(execute.BlockKey, execute.Trigger, execute.BlockContext)) {
	for bk, tables := range c.data {
		bc := execute.BlockContext{
			Bounds: tables.bounds,
			Count:  tables.Size(),
		}
		f(bk, tables.trigger, bc)
	}
}

func (c *mergeJoinCache) DiscardBlock(key execute.BlockKey) {
	c.data[key].ClearData()
}

func (c *mergeJoinCache) ExpireBlock(key execute.BlockKey) {
	delete(c.data, key)
}

func (c *mergeJoinCache) SetTriggerSpec(spec query.TriggerSpec) {
	c.triggerSpec = spec
}

func (c *mergeJoinCache) Tables(bm execute.BlockMetadata) *joinTables {
	key := execute.ToBlockKey(bm)
	tables := c.data[key]
	if tables == nil {
		tables = &joinTables{
			tags:      bm.Tags(),
			bounds:    bm.Bounds(),
			alloc:     c.alloc,
			left:      execute.NewColListBlockBuilder(c.alloc),
			right:     execute.NewColListBlockBuilder(c.alloc),
			leftName:  c.leftName,
			rightName: c.rightName,
			trigger:   execute.NewTriggerFromSpec(c.triggerSpec),
			joinFn:    c.joinFn,
		}
		tables.left.AddCol(execute.TimeCol)
		tables.right.AddCol(execute.TimeCol)
		c.data[key] = tables
	}
	return tables
}

type joinTables struct {
	tags   execute.Tags
	bounds execute.Bounds

	alloc *execute.Allocator

	left, right         *execute.ColListBlockBuilder
	leftName, rightName string

	trigger execute.Trigger

	joinFn *joinFunc
}

func (t *joinTables) Bounds() execute.Bounds {
	return t.bounds
}
func (t *joinTables) Tags() execute.Tags {
	return t.tags
}
func (t *joinTables) Size() int {
	return t.left.NRows() + t.right.NRows()
}

func (t *joinTables) ClearData() {
	t.left = execute.NewColListBlockBuilder(t.alloc)
	t.right = execute.NewColListBlockBuilder(t.alloc)
}

// Join performs a sort-merge join
func (t *joinTables) Join() (execute.Block, error) {
	// First prepare the join function
	left := t.left.RawBlock()
	right := t.right.RawBlock()
	err := t.joinFn.Prepare(map[string]*execute.ColListBlock{
		t.leftName:  left,
		t.rightName: right,
	})
	if err != nil {
		return nil, errors.Wrap(err, "failed to prepare join function")
	}
	// Create a builder to the result of the join
	builder := execute.NewColListBlockBuilder(t.alloc)
	builder.SetBounds(t.bounds)
	builder.AddCol(execute.TimeCol)

	// Add new value columns in sorted order
	properties := t.joinFn.Type().Properties()
	keys := make([]string, 0, len(properties))
	for k := range properties {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		builder.AddCol(execute.ColMeta{
			Label: k,
			Type:  execute.ConvertFromKind(properties[k].Kind()),
			Kind:  execute.ValueColKind,
		})
	}

	// Add common tags
	execute.AddTags(t.tags, builder)

	// Add non common tags
	cols := t.left.Cols()
	for _, c := range cols {
		if c.IsTag() && !c.Common {
			builder.AddCol(c)
		}
	}

	// Now that all columns have been added, keep a reference.
	bCols := builder.Cols()

	// Determine sort order for the joining tables
	sortOrder := make([]string, len(cols))
	for i, c := range cols {
		sortOrder[i] = c.Label
	}
	t.left.Sort(sortOrder, false)
	t.right.Sort(sortOrder, false)

	var (
		leftSet, rightSet subset
		leftKey, rightKey joinKey
	)

	rows := map[string]int{
		t.leftName:  -1,
		t.rightName: -1,
	}

	leftSet, leftKey = t.advance(leftSet.Stop, left)
	rightSet, rightKey = t.advance(rightSet.Stop, right)
	for !leftSet.Empty() && !rightSet.Empty() {
		if leftKey.Equal(rightKey) {
			// Inner join
			for l := leftSet.Start; l < leftSet.Stop; l++ {
				for r := rightSet.Start; r < rightSet.Stop; r++ {
					// Evaluate expression and add to block
					rows[t.leftName] = l
					rows[t.rightName] = r
					m, err := t.joinFn.Eval(rows)
					if err != nil {
						return nil, errors.Wrap(err, "failed to evaluate join function")
					}
					for j, c := range bCols {
						switch c.Kind {
						case execute.TimeColKind:
							builder.AppendTime(j, leftKey.Time)
						case execute.TagColKind:
							if c.Common {
								continue
							}

							builder.AppendString(j, leftKey.Tags[c.Label])
						case execute.ValueColKind:
							v := m.Get(c.Label)
							execute.AppendValue(builder, j, v)
						default:
							log.Printf("unexpected column %v", c)
						}
					}
				}
			}
			leftSet, leftKey = t.advance(leftSet.Stop, left)
			rightSet, rightKey = t.advance(rightSet.Stop, right)
		} else if leftKey.Less(rightKey) {
			leftSet, leftKey = t.advance(leftSet.Stop, left)
		} else {
			rightSet, rightKey = t.advance(rightSet.Stop, right)
		}
	}
	return builder.Block()
}

func (t *joinTables) advance(offset int, table *execute.ColListBlock) (subset, joinKey) {
	if n := table.NRows(); n == offset {
		return subset{Start: n, Stop: n}, joinKey{}
	}
	start := offset
	key := rowKey(start, table)
	s := subset{Start: start}
	offset++
	for offset < table.NRows() && equalRowKeys(start, offset, table) {
		offset++
	}
	s.Stop = offset
	return s, key
}

type subset struct {
	Start int
	Stop  int
}

func (s subset) Empty() bool {
	return s.Start == s.Stop
}

func rowKey(i int, table *execute.ColListBlock) (k joinKey) {
	k.Tags = make(map[string]string)
	for j, c := range table.Cols() {
		switch c.Kind {
		case execute.TimeColKind:
			k.Time = table.AtTime(i, j)
		case execute.TagColKind:
			k.Tags[c.Label] = table.AtString(i, j)
		}
	}
	return
}

func equalRowKeys(x, y int, table *execute.ColListBlock) bool {
	for j, c := range table.Cols() {
		if c.Label == execute.TimeColLabel {
			if table.AtTime(x, j) != table.AtTime(y, j) {
				return false
			}
		} else if c.IsTag() {
			if table.AtString(x, j) != table.AtString(y, j) {
				return false
			}
		}
	}
	return true
}

type joinKey struct {
	Time execute.Time
	Tags map[string]string
}

func (k joinKey) Equal(o joinKey) bool {
	if k.Time == o.Time {
		for t := range k.Tags {
			if k.Tags[t] != o.Tags[t] {
				return false
			}
		}
		return true
	}
	return false
}
func (k joinKey) Less(o joinKey) bool {
	if k.Time == o.Time {
		for t := range k.Tags {
			if k.Tags[t] != o.Tags[t] {
				return k.Tags[t] < o.Tags[t]
			}
		}
	}
	return k.Time < o.Time
}

type joinFunc struct {
	fn               *semantic.FunctionExpression
	compilationCache *compiler.CompilationCache
	scope            compiler.Scope

	preparedFn compiler.Func

	recordName string
	record     *compiler.Object

	recordCols map[tableCol]int
	references map[string][]string

	isWrap  bool
	wrapObj *compiler.Object

	tableData map[string]*execute.ColListBlock
}

type tableCol struct {
	table, col string
}

func NewRowJoinFunction(fn *semantic.FunctionExpression, parentIDs []execute.DatasetID, tableNames map[execute.DatasetID]string) (*joinFunc, error) {
	if len(fn.Params) != 1 {
		return nil, errors.New("join function should only have one parameter for the map of tables")
	}
	return &joinFunc{
		compilationCache: compiler.NewCompilationCache(fn),
		scope:            make(compiler.Scope, 1),
		references:       findTableReferences(fn),
		recordCols:       make(map[tableCol]int),
		record:           compiler.NewObject(),
		recordName:       fn.Params[0].Key.Name,
		wrapObj:          compiler.NewObject(),
	}, nil
}

func (f *joinFunc) Prepare(tables map[string]*execute.ColListBlock) error {
	f.tableData = tables
	propertyTypes := make(map[string]semantic.Type, len(f.references))
	// Prepare types and recordcols
	for tbl, b := range tables {
		cols := b.Cols()
		f.record.Set(tbl, compiler.NewObject())
		tblPropertyTypes := make(map[string]semantic.Type, len(f.references[tbl]))
		for _, r := range f.references[tbl] {
			found := false
			for j, c := range cols {
				if r == c.Label {
					f.recordCols[tableCol{table: tbl, col: c.Label}] = j
					tblPropertyTypes[r] = execute.ConvertToKind(c.Type)
					found = true
					break
				}
			}
			if !found {
				return fmt.Errorf("function references unknown column %q of table %q", r, tbl)
			}
		}
		propertyTypes[tbl] = semantic.NewObjectType(tblPropertyTypes)
	}
	// Compile fn for given types
	fn, err := f.compilationCache.Compile(map[string]semantic.Type{
		f.recordName: semantic.NewObjectType(propertyTypes),
	})
	if err != nil {
		return err
	}
	f.preparedFn = fn

	k := f.preparedFn.Type().Kind()
	f.isWrap = k != semantic.Object
	if f.isWrap {
		f.wrapObj.SetPropertyType(execute.DefaultValueColLabel, f.preparedFn.Type())
	}
	return nil
}

func (f *joinFunc) Type() semantic.Type {
	if f.isWrap {
		return f.wrapObj.Type()
	}
	return f.preparedFn.Type()
}

func (f *joinFunc) Eval(rows map[string]int) (*compiler.Object, error) {
	for tbl, references := range f.references {
		row := rows[tbl]
		data := f.tableData[tbl]
		obj := f.record.Get(tbl).(*compiler.Object)
		for _, r := range references {
			obj.Set(r, readValue(row, f.recordCols[tableCol{table: tbl, col: r}], data))
		}
		f.record.Set(tbl, obj)
	}
	f.scope[f.recordName] = f.record

	v, err := f.preparedFn.Eval(f.scope)
	if err != nil {
		return nil, err
	}
	if f.isWrap {
		f.wrapObj.Set(execute.DefaultValueColLabel, v)
		return f.wrapObj, nil
	}
	return v.Object(), nil
}

func readValue(i, j int, table *execute.ColListBlock) compiler.Value {
	cols := table.Cols()
	switch t := cols[j].Type; t {
	case execute.TBool:
		return compiler.NewBool(table.AtBool(i, j))
	case execute.TInt:
		return compiler.NewInt(table.AtInt(i, j))
	case execute.TUInt:
		return compiler.NewUInt(table.AtUInt(i, j))
	case execute.TFloat:
		return compiler.NewFloat(table.AtFloat(i, j))
	case execute.TString:
		return compiler.NewString(table.AtString(i, j))
	default:
		execute.PanicUnknownType(t)
		return nil
	}
}

func findTableReferences(fn *semantic.FunctionExpression) map[string][]string {
	v := &tableReferenceVisitor{
		record: fn.Params[0].Key.Name,
		refs:   make(map[string][]string),
	}
	semantic.Walk(v, fn)
	return v.refs
}

type tableReferenceVisitor struct {
	record string
	refs   map[string][]string
}

func (c *tableReferenceVisitor) Visit(node semantic.Node) semantic.Visitor {
	if col, ok := node.(*semantic.MemberExpression); ok {
		if table, ok := col.Object.(*semantic.MemberExpression); ok {
			if record, ok := table.Object.(*semantic.IdentifierExpression); ok && record.Name == c.record {
				c.refs[table.Property] = append(c.refs[table.Property], col.Property)
				return nil
			}
		}
	}
	return c
}

func (c *tableReferenceVisitor) Done() {}
