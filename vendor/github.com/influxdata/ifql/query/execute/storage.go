package execute

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"strings"

	"github.com/influxdata/ifql/ast"
	"github.com/influxdata/ifql/query/execute/storage"
	"github.com/influxdata/ifql/semantic"
	"github.com/influxdata/yarpc"
	"github.com/pkg/errors"
)

type StorageReader interface {
	Read(ctx context.Context, trace map[string]string, rs ReadSpec, start, stop Time) (BlockIterator, error)
	Close()
}

type ReadSpec struct {
	RAMLimit     uint64
	Database     string
	Hosts        []string
	Predicate    *semantic.FunctionExpression
	PointsLimit  int64
	SeriesLimit  int64
	SeriesOffset int64
	Descending   bool

	AggregateMethod string

	// OrderByTime indicates that series reads should produce all
	// series for a time before producing any series for a larger time.
	// By default this is false meaning all values of time are produced for a given series,
	// before any values are produced from the next series.
	OrderByTime bool
	// MergeAll indicates that all series should be merged into a single group
	MergeAll bool
	// GroupKeys is the list of dimensions along which to group
	GroupKeys []string
	// GroupExcept is the list of dimensions along which to not group
	GroupExcept []string
	// GroupKeep is the list of tags to keep but not group by.
	GroupKeep []string
}

func NewStorageReader(hosts []string) (StorageReader, error) {
	if len(hosts) == 0 {
		return nil, errors.New("must provide at least one storage host")
	}
	conns := make([]connection, len(hosts))
	for i, h := range hosts {
		conn, err := yarpc.Dial(h)
		if err != nil {
			return nil, err
		}
		conns[i] = connection{
			host:   h,
			conn:   conn,
			client: storage.NewStorageClient(conn),
		}
	}
	return &storageReader{
		conns: conns,
	}, nil
}

type storageReader struct {
	conns []connection
}

type connection struct {
	host   string
	conn   *yarpc.ClientConn
	client storage.StorageClient
}

func (sr *storageReader) Read(ctx context.Context, trace map[string]string, readSpec ReadSpec, start, stop Time) (BlockIterator, error) {
	var predicate *storage.Predicate
	if readSpec.Predicate != nil {
		p, err := ToStoragePredicate(readSpec.Predicate)
		if err != nil {
			return nil, err
		}
		predicate = p
	}

	bi := &storageBlockIterator{
		ctx:   ctx,
		trace: trace,
		bounds: Bounds{
			Start: start,
			Stop:  stop,
		},
		conns:     sr.conns,
		readSpec:  readSpec,
		predicate: predicate,
	}
	return bi, nil
}

func (sr *storageReader) Close() {
	for _, conn := range sr.conns {
		_ = conn.conn.Close()
	}
}

type storageBlockIterator struct {
	ctx       context.Context
	trace     map[string]string
	bounds    Bounds
	conns     []connection
	readSpec  ReadSpec
	predicate *storage.Predicate
}

func (bi *storageBlockIterator) Do(f func(Block) error) error {
	// Setup read request
	var req storage.ReadRequest
	req.Database = bi.readSpec.Database
	req.Predicate = bi.predicate
	req.Descending = bi.readSpec.Descending
	req.TimestampRange.Start = int64(bi.bounds.Start)
	req.TimestampRange.End = int64(bi.bounds.Stop)
	req.Grouping = bi.readSpec.GroupKeys

	req.SeriesLimit = uint64(bi.readSpec.SeriesLimit)
	req.PointsLimit = uint64(bi.readSpec.PointsLimit)
	req.SeriesOffset = uint64(bi.readSpec.SeriesOffset)
	req.Trace = bi.trace

	if agg, err := determineAggregateMethod(bi.readSpec.AggregateMethod); err != nil {
		return err
	} else if agg != storage.AggregateTypeNone {
		req.Aggregate = &storage.Aggregate{Type: agg}
	}

	streams := make([]*streamState, 0, len(bi.conns))
	for _, c := range bi.conns {
		if len(bi.readSpec.Hosts) > 0 {
			// Filter down to only hosts provided
			found := false
			for _, h := range bi.readSpec.Hosts {
				if c.host == h {
					found = true
					break
				}
			}
			if !found {
				continue
			}
		}
		stream, err := c.client.Read(bi.ctx, &req)
		if err != nil {
			return err
		}
		streams = append(streams, &streamState{
			stream:   stream,
			readSpec: &bi.readSpec,
		})
	}
	ms := &mergedStreams{
		streams: streams,
	}

	for ms.more() {
		if p := ms.peek(); readFrameType(p) != seriesType {
			//This means the consumer didn't read all the data off the block
			return errors.New("internal error: short read")
		}
		frame := ms.next()
		s := frame.GetSeries()
		typ := convertDataType(s.DataType)
		tags, keptTags := bi.determineBlockTags(s)
		k := appendSeriesKey(nil, s, &bi.readSpec)
		block := newStorageBlock(bi.bounds, tags, keptTags, k, ms, &bi.readSpec, typ)

		if err := f(block); err != nil {
			// TODO(nathanielc): Close streams since we have abandoned the request
			return err
		}
		// Wait until the block has been read.
		block.wait()
	}
	return nil
}

func determineAggregateMethod(agg string) (storage.Aggregate_AggregateType, error) {
	if agg == "" {
		return storage.AggregateTypeNone, nil
	}

	if t, ok := storage.Aggregate_AggregateType_value[strings.ToUpper(agg)]; ok {
		return storage.Aggregate_AggregateType(t), nil
	}
	return 0, fmt.Errorf("unknown aggregate type %q", agg)
}
func convertDataType(t storage.ReadResponse_DataType) DataType {
	switch t {
	case storage.DataTypeFloat:
		return TFloat
	case storage.DataTypeInteger:
		return TInt
	case storage.DataTypeUnsigned:
		return TUInt
	case storage.DataTypeBoolean:
		return TBool
	case storage.DataTypeString:
		return TString
	default:
		return TInvalid
	}
}

func (bi *storageBlockIterator) determineBlockTags(s *storage.ReadResponse_SeriesFrame) (tags, keptTags Tags) {
	if len(bi.readSpec.GroupKeys) > 0 {
		tags = make(Tags, len(bi.readSpec.GroupKeys))
		for _, key := range bi.readSpec.GroupKeys {
			for _, tag := range s.Tags {
				if string(tag.Key) == key {
					tags[key] = string(tag.Value)
					break
				}
			}
		}
		if len(bi.readSpec.GroupKeep) > 0 {
			keptTags = make(Tags, len(bi.readSpec.GroupKeep))
			for _, key := range bi.readSpec.GroupKeep {
				for _, tag := range s.Tags {
					if string(tag.Key) == key {
						keptTags[key] = string(tag.Value)
						break
					}
				}
			}
		}
	} else if len(bi.readSpec.GroupExcept) > 0 {
		tags = make(Tags, len(s.Tags)-len(bi.readSpec.GroupExcept))
		keptTags = make(Tags, len(bi.readSpec.GroupKeep))
	TAGS:
		for _, t := range s.Tags {
			k := string(t.Key)
			for _, key := range bi.readSpec.GroupKeep {
				if k == key {
					keptTags[key] = string(t.Value)
					continue TAGS
				}
			}
			for _, key := range bi.readSpec.GroupExcept {
				if k == key {
					continue TAGS
				}
			}
			tags[k] = string(t.Value)
		}
	} else if !bi.readSpec.MergeAll {
		tags = make(Tags, len(s.Tags))
		for _, t := range s.Tags {
			tags[string(t.Key)] = string(t.Value)
		}
	} else {
		keptTags = make(Tags, len(bi.readSpec.GroupKeep))
		for _, t := range s.Tags {
			k := string(t.Key)
			for _, key := range bi.readSpec.GroupKeep {
				if k == key {
					keptTags[key] = string(t.Value)
				}
			}
		}
	}
	return
}

func appendSeriesKey(b key, s *storage.ReadResponse_SeriesFrame, readSpec *ReadSpec) key {
	appendTag := func(t storage.Tag) {
		b = append(b, t.Key...)
		b = append(b, '=')
		b = append(b, t.Value...)
	}
	if len(readSpec.GroupKeys) > 0 {
		for i, key := range readSpec.GroupKeys {
			if i != 0 {
				b = append(b, ',')
			}
			for _, tag := range s.Tags {
				if string(tag.Key) == key {
					appendTag(tag)
					break
				}
			}
		}
	} else if len(readSpec.GroupExcept) > 0 {
		i := 0
	TAGS:
		for _, t := range s.Tags {
			k := string(t.Key)
			for _, key := range readSpec.GroupKeep {
				if k == key {
					continue TAGS
				}
			}
			for _, key := range readSpec.GroupExcept {
				if k == key {
					continue TAGS
				}
			}
			if i != 0 {
				b = append(b, ',')
			}
			appendTag(t)
			i++
		}
	} else if !readSpec.MergeAll {
		for i, t := range s.Tags {
			if i != 0 {
				b = append(b, ',')
			}
			appendTag(t)
		}
	}
	return b
}

// storageBlock implement OneTimeBlock as it can only be read once.
// Since it can only be read once it is also a ValueIterator for itself.
type storageBlock struct {
	bounds Bounds
	tags   Tags
	tagKey key
	// keptTags is a set of non common tags.
	keptTags Tags
	// colMeta always has at least two columns, where the first is a TimeCol
	// and the second is any Value column.
	colMeta []ColMeta

	readSpec *ReadSpec

	done chan struct{}

	ms *mergedStreams

	// The index of the column to iterate
	col int
	// colBufs are the buffers for the given columns.
	colBufs [2]interface{}

	// resuable buffer for the time column
	timeBuf []Time

	// resuable buffers for the different types of values
	boolBuf   []bool
	intBuf    []int64
	uintBuf   []uint64
	floatBuf  []float64
	stringBuf []string
}

func newStorageBlock(bounds Bounds, tags, keptTags Tags, tagKey key, ms *mergedStreams, readSpec *ReadSpec, typ DataType) *storageBlock {
	colMeta := make([]ColMeta, 2, 2+len(tags)+len(keptTags))
	colMeta[0] = TimeCol
	colMeta[1] = ColMeta{
		Label: DefaultValueColLabel,
		Type:  typ,
		Kind:  ValueColKind,
	}

	for _, k := range tags.Keys() {
		colMeta = append(colMeta, ColMeta{
			Label:  k,
			Type:   TString,
			Kind:   TagColKind,
			Common: true,
		})
	}
	for _, k := range keptTags.Keys() {
		colMeta = append(colMeta, ColMeta{
			Label:  k,
			Type:   TString,
			Kind:   TagColKind,
			Common: false,
		})
	}
	return &storageBlock{
		bounds:   bounds,
		tagKey:   tagKey,
		tags:     tags,
		keptTags: keptTags,
		colMeta:  colMeta,
		readSpec: readSpec,
		ms:       ms,
		done:     make(chan struct{}),
	}
}

func (b *storageBlock) RefCount(n int) {
	//TODO(nathanielc): Have the storageBlock consume the Allocator,
	// once we have zero-copy serialization over the network
}

func (b *storageBlock) wait() {
	<-b.done
}

// onetime satisfies the OneTimeBlock interface since this block may only be read once.
func (b *storageBlock) onetime() {}

func (b *storageBlock) Bounds() Bounds {
	return b.bounds
}
func (b *storageBlock) Tags() Tags {
	return b.tags
}
func (b *storageBlock) Cols() []ColMeta {
	return b.colMeta
}

func (b *storageBlock) Col(c int) ValueIterator {
	b.col = c
	return b
}

func (b *storageBlock) Times() ValueIterator {
	return b.Col(0)
}
func (b *storageBlock) Values() (ValueIterator, error) {
	return b.Col(1), nil
}

func (b *storageBlock) DoBool(f func([]bool, RowReader)) {
	checkColType(b.colMeta[b.col], TBool)
	for b.advance() {
		f(b.colBufs[b.col].([]bool), b)
	}
	close(b.done)
}
func (b *storageBlock) DoInt(f func([]int64, RowReader)) {
	checkColType(b.colMeta[b.col], TInt)
	for b.advance() {
		f(b.colBufs[b.col].([]int64), b)
	}
	close(b.done)
}
func (b *storageBlock) DoUInt(f func([]uint64, RowReader)) {
	checkColType(b.colMeta[b.col], TUInt)
	for b.advance() {
		f(b.colBufs[b.col].([]uint64), b)
	}
	close(b.done)
}
func (b *storageBlock) DoFloat(f func([]float64, RowReader)) {
	checkColType(b.colMeta[b.col], TFloat)
	for b.advance() {
		f(b.colBufs[b.col].([]float64), b)
	}
	close(b.done)
}
func (b *storageBlock) DoString(f func([]string, RowReader)) {
	defer close(b.done)

	meta := b.colMeta[b.col]
	checkColType(meta, TString)
	if meta.IsTag() {
		// Handle creating a strs slice that can be ranged according to actual data received.
		var strs []string
		var value string
		if meta.Common {
			value = b.tags[meta.Label]
		} else {
			value = b.keptTags[meta.Label]
		}
		for b.advance() {
			l := len(b.timeBuf)
			if cap(strs) < l {
				strs = make([]string, l)
				for i := range strs {
					strs[i] = value
				}
			} else if len(strs) < l {
				new := strs[len(strs)-1 : l]
				for i := range new {
					new[i] = value
				}
				strs = strs[0:l]
			} else {
				strs = strs[0:l]
			}
			f(strs, b)
		}
		return
	}
	// Do ordinary range over column data.
	for b.advance() {
		f(b.colBufs[b.col].([]string), b)
	}
}
func (b *storageBlock) DoTime(f func([]Time, RowReader)) {
	checkColType(b.colMeta[b.col], TTime)
	for b.advance() {
		f(b.colBufs[b.col].([]Time), b)
	}
	close(b.done)
}

func (b *storageBlock) AtBool(i, j int) bool {
	checkColType(b.colMeta[j], TBool)
	return b.colBufs[j].([]bool)[i]
}
func (b *storageBlock) AtInt(i, j int) int64 {
	checkColType(b.colMeta[j], TInt)
	return b.colBufs[j].([]int64)[i]
}
func (b *storageBlock) AtUInt(i, j int) uint64 {
	checkColType(b.colMeta[j], TUInt)
	return b.colBufs[j].([]uint64)[i]
}
func (b *storageBlock) AtFloat(i, j int) float64 {
	checkColType(b.colMeta[j], TFloat)
	return b.colBufs[j].([]float64)[i]
}
func (b *storageBlock) AtString(i, j int) string {
	meta := b.colMeta[j]
	checkColType(meta, TString)
	if meta.IsTag() {
		if meta.Common {
			return b.tags[meta.Label]
		}
		return b.keptTags[meta.Label]
	}
	return b.colBufs[j].([]string)[i]
}
func (b *storageBlock) AtTime(i, j int) Time {
	checkColType(b.colMeta[j], TTime)
	return b.colBufs[j].([]Time)[i]
}

func (b *storageBlock) advance() bool {
	for b.ms.more() {
		//reset buffers
		b.timeBuf = b.timeBuf[0:0]
		b.boolBuf = b.boolBuf[0:0]
		b.intBuf = b.intBuf[0:0]
		b.uintBuf = b.uintBuf[0:0]
		b.stringBuf = b.stringBuf[0:0]
		b.floatBuf = b.floatBuf[0:0]

		switch p := b.ms.peek(); readFrameType(p) {
		case seriesType:
			if b.ms.key().Compare(b.tagKey) != 0 {
				// We have reached the end of data for this block
				return false
			}
			s := p.GetSeries()
			// Populate keptTags with new series values
			b.keptTags = make(Tags, len(b.readSpec.GroupKeep))
			for _, t := range s.Tags {
				k := string(t.Key)
				for _, key := range b.readSpec.GroupKeep {
					if k == key {
						b.keptTags[key] = string(t.Value)
					}
				}
			}
			// Advance to next frame
			b.ms.next()
		case boolPointsType:
			if b.colMeta[1].Type != TBool {
				// TODO: Add error handling
				// Type changed,
				return false
			}
			// read next frame
			frame := b.ms.next()
			p := frame.GetBooleanPoints()
			l := len(p.Timestamps)
			if l > cap(b.timeBuf) {
				b.timeBuf = make([]Time, l)
			} else {
				b.timeBuf = b.timeBuf[:l]
			}
			if l > cap(b.boolBuf) {
				b.boolBuf = make([]bool, l)
			} else {
				b.boolBuf = b.boolBuf[:l]
			}

			for i, c := range p.Timestamps {
				b.timeBuf[i] = Time(c)
				b.boolBuf[i] = p.Values[i]
			}
			b.colBufs[0] = b.timeBuf
			b.colBufs[1] = b.boolBuf
			return true
		case intPointsType:
			if b.colMeta[1].Type != TInt {
				// TODO: Add error handling
				// Type changed,
				return false
			}
			// read next frame
			frame := b.ms.next()
			p := frame.GetIntegerPoints()
			l := len(p.Timestamps)
			if l > cap(b.timeBuf) {
				b.timeBuf = make([]Time, l)
			} else {
				b.timeBuf = b.timeBuf[:l]
			}
			if l > cap(b.uintBuf) {
				b.intBuf = make([]int64, l)
			} else {
				b.intBuf = b.intBuf[:l]
			}

			for i, c := range p.Timestamps {
				b.timeBuf[i] = Time(c)
				b.intBuf[i] = p.Values[i]
			}
			b.colBufs[0] = b.timeBuf
			b.colBufs[1] = b.intBuf
			return true
		case uintPointsType:
			if b.colMeta[1].Type != TUInt {
				// TODO: Add error handling
				// Type changed,
				return false
			}
			// read next frame
			frame := b.ms.next()
			p := frame.GetUnsignedPoints()
			l := len(p.Timestamps)
			if l > cap(b.timeBuf) {
				b.timeBuf = make([]Time, l)
			} else {
				b.timeBuf = b.timeBuf[:l]
			}
			if l > cap(b.intBuf) {
				b.uintBuf = make([]uint64, l)
			} else {
				b.uintBuf = b.uintBuf[:l]
			}

			for i, c := range p.Timestamps {
				b.timeBuf[i] = Time(c)
				b.uintBuf[i] = p.Values[i]
			}
			b.colBufs[0] = b.timeBuf
			b.colBufs[1] = b.uintBuf
			return true
		case floatPointsType:
			if b.colMeta[1].Type != TFloat {
				// TODO: Add error handling
				// Type changed,
				return false
			}
			// read next frame
			frame := b.ms.next()
			p := frame.GetFloatPoints()

			l := len(p.Timestamps)
			if l > cap(b.timeBuf) {
				b.timeBuf = make([]Time, l)
			} else {
				b.timeBuf = b.timeBuf[:l]
			}
			if l > cap(b.floatBuf) {
				b.floatBuf = make([]float64, l)
			} else {
				b.floatBuf = b.floatBuf[:l]
			}

			for i, c := range p.Timestamps {
				b.timeBuf[i] = Time(c)
				b.floatBuf[i] = p.Values[i]
			}
			b.colBufs[0] = b.timeBuf
			b.colBufs[1] = b.floatBuf
			return true
		case stringPointsType:
			if b.colMeta[1].Type != TString {
				// TODO: Add error handling
				// Type changed,
				return false
			}
			// read next frame
			frame := b.ms.next()
			p := frame.GetStringPoints()

			l := len(p.Timestamps)
			if l > cap(b.timeBuf) {
				b.timeBuf = make([]Time, l)
			} else {
				b.timeBuf = b.timeBuf[:l]
			}
			if l > cap(b.stringBuf) {
				b.stringBuf = make([]string, l)
			} else {
				b.stringBuf = b.stringBuf[:l]
			}

			for i, c := range p.Timestamps {
				b.timeBuf[i] = Time(c)
				b.stringBuf[i] = p.Values[i]
			}
			b.colBufs[0] = b.timeBuf
			b.colBufs[1] = b.stringBuf
			return true
		}
	}
	return false
}

type streamState struct {
	stream     storage.Storage_ReadClient
	rep        storage.ReadResponse
	currentKey key
	readSpec   *ReadSpec
	finished   bool
}

func (s *streamState) peek() storage.ReadResponse_Frame {
	return s.rep.Frames[0]
}

func (s *streamState) more() bool {
	if s.finished {
		return false
	}
	if len(s.rep.Frames) > 0 {
		return true
	}
	if err := s.stream.RecvMsg(&s.rep); err != nil {
		s.finished = true
		if err == io.EOF {
			// We are done
			return false
		}
		//TODO add proper error handling
		return false
	}
	if len(s.rep.Frames) == 0 {
		return false
	}
	s.computeKey()
	return true
}

func (s *streamState) key() key {
	return s.currentKey
}

func (s *streamState) computeKey() {
	// Determine new currentKey
	if p := s.peek(); readFrameType(p) == seriesType {
		series := p.GetSeries()
		s.currentKey = appendSeriesKey(s.currentKey[0:0], series, s.readSpec)
	}
}
func (s *streamState) next() storage.ReadResponse_Frame {
	frame := s.rep.Frames[0]
	s.rep.Frames = s.rep.Frames[1:]
	if len(s.rep.Frames) > 0 {
		s.computeKey()
	}
	return frame
}

type key []byte

// Compare keys, a nil key is always greater.
func (k key) Compare(o key) int {
	if k == nil && o == nil {
		return 0
	}
	if k == nil {
		return 1
	}
	if o == nil {
		return -1
	}
	return bytes.Compare([]byte(k), []byte(o))
}

type mergedStreams struct {
	streams    []*streamState
	currentKey key
	i          int
}

func (s *mergedStreams) key() key {
	if len(s.streams) == 1 {
		return s.streams[0].key()
	}
	return s.currentKey
}
func (s *mergedStreams) peek() storage.ReadResponse_Frame {
	return s.streams[s.i].peek()
}

func (s *mergedStreams) next() storage.ReadResponse_Frame {
	return s.streams[s.i].next()
}

func (s *mergedStreams) more() bool {
	// Optimze for the case of just one stream
	if len(s.streams) == 1 {
		return s.streams[0].more()
	}
	if s.i < 0 {
		return false
	}
	if s.currentKey == nil {
		return s.determineNewKey()
	}
	if s.streams[s.i].more() {
		cmp := s.streams[s.i].key().Compare(s.currentKey)
		switch cmp {
		case 0:
			return true
		case 1:
			return s.advance()
		case -1:
			panic(errors.New("found smaller key, this should not be possible"))
		}
	}
	return s.advance()
}

func (s *mergedStreams) advance() bool {
	s.i++
	if s.i == len(s.streams) {
		if !s.determineNewKey() {
			// no new data on any stream
			return false
		}
	}
	return s.more()
}

func (s *mergedStreams) determineNewKey() bool {
	minIdx := -1
	var minKey key
	for i, stream := range s.streams {
		if !stream.more() {
			continue
		}
		k := stream.key()
		if k.Compare(minKey) < 0 {
			minIdx = i
			minKey = k
		}
	}
	l := len(minKey)
	if cap(s.currentKey) < l {
		s.currentKey = make(key, l)
	} else {
		s.currentKey = s.currentKey[:l]
	}
	copy(s.currentKey, minKey)
	s.i = minIdx
	return s.i >= 0
}

type frameType int

const (
	seriesType frameType = iota
	boolPointsType
	intPointsType
	uintPointsType
	floatPointsType
	stringPointsType
)

func readFrameType(frame storage.ReadResponse_Frame) frameType {
	switch frame.Data.(type) {
	case *storage.ReadResponse_Frame_Series:
		return seriesType
	case *storage.ReadResponse_Frame_BooleanPoints:
		return boolPointsType
	case *storage.ReadResponse_Frame_IntegerPoints:
		return intPointsType
	case *storage.ReadResponse_Frame_UnsignedPoints:
		return uintPointsType
	case *storage.ReadResponse_Frame_FloatPoints:
		return floatPointsType
	case *storage.ReadResponse_Frame_StringPoints:
		return stringPointsType
	default:
		panic(fmt.Errorf("unknown read response frame type: %T", frame.Data))
	}
}

func ToStoragePredicate(f *semantic.FunctionExpression) (*storage.Predicate, error) {
	if len(f.Params) != 1 {
		return nil, errors.New("storage predicate functions must have exactly one parameter")
	}

	root, err := toStoragePredicate(f.Body.(semantic.Expression), f.Params[0].Key.Name)
	if err != nil {
		return nil, err
	}

	return &storage.Predicate{
		Root: root,
	}, nil
}

func toStoragePredicate(n semantic.Expression, objectName string) (*storage.Node, error) {
	switch n := n.(type) {
	case *semantic.LogicalExpression:
		left, err := toStoragePredicate(n.Left, objectName)
		if err != nil {
			return nil, errors.Wrap(err, "left hand side")
		}
		right, err := toStoragePredicate(n.Right, objectName)
		if err != nil {
			return nil, errors.Wrap(err, "right hand side")
		}
		children := []*storage.Node{left, right}
		switch n.Operator {
		case ast.AndOperator:
			return &storage.Node{
				NodeType: storage.NodeTypeLogicalExpression,
				Value:    &storage.Node_Logical_{Logical: storage.LogicalAnd},
				Children: children,
			}, nil
		case ast.OrOperator:
			return &storage.Node{
				NodeType: storage.NodeTypeLogicalExpression,
				Value:    &storage.Node_Logical_{Logical: storage.LogicalOr},
				Children: children,
			}, nil
		default:
			return nil, fmt.Errorf("unknown logical operator %v", n.Operator)
		}
	case *semantic.BinaryExpression:
		left, err := toStoragePredicate(n.Left, objectName)
		if err != nil {
			return nil, errors.Wrap(err, "left hand side")
		}
		right, err := toStoragePredicate(n.Right, objectName)
		if err != nil {
			return nil, errors.Wrap(err, "right hand side")
		}
		children := []*storage.Node{left, right}
		op, err := toComparisonOperator(n.Operator)
		if err != nil {
			return nil, err
		}
		return &storage.Node{
			NodeType: storage.NodeTypeComparisonExpression,
			Value:    &storage.Node_Comparison_{Comparison: op},
			Children: children,
		}, nil
	case *semantic.StringLiteral:
		return &storage.Node{
			NodeType: storage.NodeTypeLiteral,
			Value: &storage.Node_StringValue{
				StringValue: n.Value,
			},
		}, nil
	case *semantic.IntegerLiteral:
		return &storage.Node{
			NodeType: storage.NodeTypeLiteral,
			Value: &storage.Node_IntegerValue{
				IntegerValue: n.Value,
			},
		}, nil
	case *semantic.BooleanLiteral:
		return &storage.Node{
			NodeType: storage.NodeTypeLiteral,
			Value: &storage.Node_BooleanValue{
				BooleanValue: n.Value,
			},
		}, nil
	case *semantic.FloatLiteral:
		return &storage.Node{
			NodeType: storage.NodeTypeLiteral,
			Value: &storage.Node_FloatValue{
				FloatValue: n.Value,
			},
		}, nil
	case *semantic.RegexpLiteral:
		return &storage.Node{
			NodeType: storage.NodeTypeLiteral,
			Value: &storage.Node_RegexValue{
				RegexValue: n.Value.String(),
			},
		}, nil
	case *semantic.MemberExpression:
		// Sanity check that the object is the objectName identifier
		if ident, ok := n.Object.(*semantic.IdentifierExpression); !ok || ident.Name != objectName {
			return nil, fmt.Errorf("unknown object %q", n.Object)
		}
		if n.Property == "_value" {
			return &storage.Node{
				NodeType: storage.NodeTypeFieldRef,
				Value: &storage.Node_FieldRefValue{
					FieldRefValue: "_value",
				},
			}, nil
		}
		return &storage.Node{
			NodeType: storage.NodeTypeTagRef,
			Value: &storage.Node_TagRefValue{
				TagRefValue: n.Property,
			},
		}, nil
	case *semantic.DurationLiteral:
		return nil, errors.New("duration literals not supported in storage predicates")
	case *semantic.DateTimeLiteral:
		return nil, errors.New("time literals not supported in storage predicates")
	default:
		return nil, fmt.Errorf("unsupported semantic expression type %T", n)
	}
}

func toComparisonOperator(o ast.OperatorKind) (storage.Node_Comparison, error) {
	switch o {
	case ast.EqualOperator:
		return storage.ComparisonEqual, nil
	case ast.NotEqualOperator:
		return storage.ComparisonNotEqual, nil
	case ast.RegexpMatchOperator:
		return storage.ComparisonRegex, nil
	case ast.NotRegexpMatchOperator:
		return storage.ComparisonNotRegex, nil
	case ast.StartsWithOperator:
		return storage.ComparisonStartsWith, nil
	case ast.LessThanOperator:
		return storage.ComparisonLess, nil
	case ast.LessThanEqualOperator:
		return storage.ComparisonLessEqual, nil
	case ast.GreaterThanOperator:
		return storage.ComparisonGreater, nil
	case ast.GreaterThanEqualOperator:
		return storage.ComparisonGreaterEqual, nil
	default:
		return 0, fmt.Errorf("unknown operator %v", o)
	}
}
