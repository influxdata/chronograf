package pb

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"strings"

	"github.com/influxdata/ifql/functions/storage"
	"github.com/influxdata/ifql/query/execute"
	"github.com/influxdata/yarpc"
	"github.com/pkg/errors"
)

func NewReader(hl storage.HostLookup) (*reader, error) {
	// TODO(nathanielc): Watch for host changes
	hosts := hl.Hosts()
	conns := make([]connection, len(hosts))
	for i, h := range hosts {
		conn, err := yarpc.Dial(h)
		if err != nil {
			return nil, err
		}
		conns[i] = connection{
			host:   h,
			conn:   conn,
			client: NewStorageClient(conn),
		}
	}
	return &reader{
		conns: conns,
	}, nil
}

type reader struct {
	conns []connection
}

type connection struct {
	host   string
	conn   *yarpc.ClientConn
	client StorageClient
}

func (sr *reader) Read(ctx context.Context, trace map[string]string, readSpec storage.ReadSpec, start, stop execute.Time) (execute.BlockIterator, error) {
	var predicate *Predicate
	if readSpec.Predicate != nil {
		p, err := ToStoragePredicate(readSpec.Predicate)
		if err != nil {
			return nil, err
		}
		predicate = p
	}

	bi := &bockIterator{
		ctx:   ctx,
		trace: trace,
		bounds: execute.Bounds{
			Start: start,
			Stop:  stop,
		},
		conns:     sr.conns,
		readSpec:  readSpec,
		predicate: predicate,
	}
	return bi, nil
}

func (sr *reader) Close() {
	for _, conn := range sr.conns {
		_ = conn.conn.Close()
	}
}

type bockIterator struct {
	ctx       context.Context
	trace     map[string]string
	bounds    execute.Bounds
	conns     []connection
	readSpec  storage.ReadSpec
	predicate *Predicate
}

func (bi *bockIterator) Do(f func(execute.Block) error) error {
	// Setup read request
	var req ReadRequest
	req.Database = string(bi.readSpec.BucketID)
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
	} else if agg != AggregateTypeNone {
		req.Aggregate = &Aggregate{Type: agg}
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
		block := newBlock(bi.bounds, tags, keptTags, k, ms, &bi.readSpec, typ)

		if err := f(block); err != nil {
			// TODO(nathanielc): Close streams since we have abandoned the request
			return err
		}
		// Wait until the block has been read.
		block.wait()
	}
	return nil
}

func determineAggregateMethod(agg string) (Aggregate_AggregateType, error) {
	if agg == "" {
		return AggregateTypeNone, nil
	}

	if t, ok := Aggregate_AggregateType_value[strings.ToUpper(agg)]; ok {
		return Aggregate_AggregateType(t), nil
	}
	return 0, fmt.Errorf("unknown aggregate type %q", agg)
}

func convertDataType(t ReadResponse_DataType) execute.DataType {
	switch t {
	case DataTypeFloat:
		return execute.TFloat
	case DataTypeInteger:
		return execute.TInt
	case DataTypeUnsigned:
		return execute.TUInt
	case DataTypeBoolean:
		return execute.TBool
	case DataTypeString:
		return execute.TString
	default:
		return execute.TInvalid
	}
}

func (bi *bockIterator) determineBlockTags(s *ReadResponse_SeriesFrame) (tags, keptTags execute.Tags) {
	if len(bi.readSpec.GroupKeys) > 0 {
		tags = make(execute.Tags, len(bi.readSpec.GroupKeys))
		for _, key := range bi.readSpec.GroupKeys {
			for _, tag := range s.Tags {
				if string(tag.Key) == key {
					tags[key] = string(tag.Value)
					break
				}
			}
		}
		if len(bi.readSpec.GroupKeep) > 0 {
			keptTags = make(execute.Tags, len(bi.readSpec.GroupKeep))
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
		tags = make(execute.Tags, len(s.Tags)-len(bi.readSpec.GroupExcept))
		keptTags = make(execute.Tags, len(bi.readSpec.GroupKeep))
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
		tags = make(execute.Tags, len(s.Tags))
		for _, t := range s.Tags {
			tags[string(t.Key)] = string(t.Value)
		}
	} else {
		keptTags = make(execute.Tags, len(bi.readSpec.GroupKeep))
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

func appendSeriesKey(b key, s *ReadResponse_SeriesFrame, readSpec *storage.ReadSpec) key {
	appendTag := func(t Tag) {
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

// block implement OneTimeBlock as it can only be read once.
// Since it can only be read once it is also a ValueIterator for itself.
type block struct {
	bounds execute.Bounds
	tags   execute.Tags
	tagKey key
	// keptTags is a set of non common tags.
	keptTags execute.Tags
	// colMeta always has at least two columns, where the first is a TimeCol
	// and the second is any Value column.
	colMeta []execute.ColMeta

	readSpec *storage.ReadSpec

	done chan struct{}

	ms *mergedStreams

	// The index of the column to iterate
	col int
	// colBufs are the buffers for the given columns.
	colBufs [2]interface{}

	// resuable buffer for the time column
	timeBuf []execute.Time

	// resuable buffers for the different types of values
	boolBuf   []bool
	intBuf    []int64
	uintBuf   []uint64
	floatBuf  []float64
	stringBuf []string
}

func newBlock(bounds execute.Bounds, tags, keptTags execute.Tags, tagKey key, ms *mergedStreams, readSpec *storage.ReadSpec, typ execute.DataType) *block {
	colMeta := make([]execute.ColMeta, 2, 2+len(tags)+len(keptTags))
	colMeta[0] = execute.TimeCol
	colMeta[1] = execute.ColMeta{
		Label: execute.DefaultValueColLabel,
		Type:  typ,
		Kind:  execute.ValueColKind,
	}

	for _, k := range tags.Keys() {
		colMeta = append(colMeta, execute.ColMeta{
			Label:  k,
			Type:   execute.TString,
			Kind:   execute.TagColKind,
			Common: true,
		})
	}
	for _, k := range keptTags.Keys() {
		colMeta = append(colMeta, execute.ColMeta{
			Label:  k,
			Type:   execute.TString,
			Kind:   execute.TagColKind,
			Common: false,
		})
	}
	return &block{
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

func (b *block) RefCount(n int) {
	//TODO(nathanielc): Have the storageBlock consume the Allocator,
	// once we have zero-copy serialization over the network
}

func (b *block) wait() {
	<-b.done
}

// onetime satisfies the OneTimeBlock interface since this block may only be read once.
func (b *block) onetime() {}

func (b *block) Bounds() execute.Bounds {
	return b.bounds
}
func (b *block) Tags() execute.Tags {
	return b.tags
}
func (b *block) Cols() []execute.ColMeta {
	return b.colMeta
}

func (b *block) Col(c int) execute.ValueIterator {
	b.col = c
	return b
}

func (b *block) Times() execute.ValueIterator {
	return b.Col(0)
}
func (b *block) Values() (execute.ValueIterator, error) {
	return b.Col(1), nil
}

func (b *block) DoBool(f func([]bool, execute.RowReader)) {
	execute.CheckColType(b.colMeta[b.col], execute.TBool)
	for b.advance() {
		f(b.colBufs[b.col].([]bool), b)
	}
	close(b.done)
}
func (b *block) DoInt(f func([]int64, execute.RowReader)) {
	execute.CheckColType(b.colMeta[b.col], execute.TInt)
	for b.advance() {
		f(b.colBufs[b.col].([]int64), b)
	}
	close(b.done)
}
func (b *block) DoUInt(f func([]uint64, execute.RowReader)) {
	execute.CheckColType(b.colMeta[b.col], execute.TUInt)
	for b.advance() {
		f(b.colBufs[b.col].([]uint64), b)
	}
	close(b.done)
}
func (b *block) DoFloat(f func([]float64, execute.RowReader)) {
	execute.CheckColType(b.colMeta[b.col], execute.TFloat)
	for b.advance() {
		f(b.colBufs[b.col].([]float64), b)
	}
	close(b.done)
}
func (b *block) DoString(f func([]string, execute.RowReader)) {
	defer close(b.done)

	meta := b.colMeta[b.col]
	execute.CheckColType(meta, execute.TString)
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
func (b *block) DoTime(f func([]execute.Time, execute.RowReader)) {
	execute.CheckColType(b.colMeta[b.col], execute.TTime)
	for b.advance() {
		f(b.colBufs[b.col].([]execute.Time), b)
	}
	close(b.done)
}

func (b *block) AtBool(i, j int) bool {
	execute.CheckColType(b.colMeta[j], execute.TBool)
	return b.colBufs[j].([]bool)[i]
}
func (b *block) AtInt(i, j int) int64 {
	execute.CheckColType(b.colMeta[j], execute.TInt)
	return b.colBufs[j].([]int64)[i]
}
func (b *block) AtUInt(i, j int) uint64 {
	execute.CheckColType(b.colMeta[j], execute.TUInt)
	return b.colBufs[j].([]uint64)[i]
}
func (b *block) AtFloat(i, j int) float64 {
	execute.CheckColType(b.colMeta[j], execute.TFloat)
	return b.colBufs[j].([]float64)[i]
}
func (b *block) AtString(i, j int) string {
	meta := b.colMeta[j]
	execute.CheckColType(meta, execute.TString)
	if meta.IsTag() {
		if meta.Common {
			return b.tags[meta.Label]
		}
		return b.keptTags[meta.Label]
	}
	return b.colBufs[j].([]string)[i]
}
func (b *block) AtTime(i, j int) execute.Time {
	execute.CheckColType(b.colMeta[j], execute.TTime)
	return b.colBufs[j].([]execute.Time)[i]
}

func (b *block) advance() bool {
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
			b.keptTags = make(execute.Tags, len(b.readSpec.GroupKeep))
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
			if b.colMeta[1].Type != execute.TBool {
				// TODO: Add error handling
				// Type changed,
				return false
			}
			// read next frame
			frame := b.ms.next()
			p := frame.GetBooleanPoints()
			l := len(p.Timestamps)
			if l > cap(b.timeBuf) {
				b.timeBuf = make([]execute.Time, l)
			} else {
				b.timeBuf = b.timeBuf[:l]
			}
			if l > cap(b.boolBuf) {
				b.boolBuf = make([]bool, l)
			} else {
				b.boolBuf = b.boolBuf[:l]
			}

			for i, c := range p.Timestamps {
				b.timeBuf[i] = execute.Time(c)
				b.boolBuf[i] = p.Values[i]
			}
			b.colBufs[0] = b.timeBuf
			b.colBufs[1] = b.boolBuf
			return true
		case intPointsType:
			if b.colMeta[1].Type != execute.TInt {
				// TODO: Add error handling
				// Type changed,
				return false
			}
			// read next frame
			frame := b.ms.next()
			p := frame.GetIntegerPoints()
			l := len(p.Timestamps)
			if l > cap(b.timeBuf) {
				b.timeBuf = make([]execute.Time, l)
			} else {
				b.timeBuf = b.timeBuf[:l]
			}
			if l > cap(b.uintBuf) {
				b.intBuf = make([]int64, l)
			} else {
				b.intBuf = b.intBuf[:l]
			}

			for i, c := range p.Timestamps {
				b.timeBuf[i] = execute.Time(c)
				b.intBuf[i] = p.Values[i]
			}
			b.colBufs[0] = b.timeBuf
			b.colBufs[1] = b.intBuf
			return true
		case uintPointsType:
			if b.colMeta[1].Type != execute.TUInt {
				// TODO: Add error handling
				// Type changed,
				return false
			}
			// read next frame
			frame := b.ms.next()
			p := frame.GetUnsignedPoints()
			l := len(p.Timestamps)
			if l > cap(b.timeBuf) {
				b.timeBuf = make([]execute.Time, l)
			} else {
				b.timeBuf = b.timeBuf[:l]
			}
			if l > cap(b.intBuf) {
				b.uintBuf = make([]uint64, l)
			} else {
				b.uintBuf = b.uintBuf[:l]
			}

			for i, c := range p.Timestamps {
				b.timeBuf[i] = execute.Time(c)
				b.uintBuf[i] = p.Values[i]
			}
			b.colBufs[0] = b.timeBuf
			b.colBufs[1] = b.uintBuf
			return true
		case floatPointsType:
			if b.colMeta[1].Type != execute.TFloat {
				// TODO: Add error handling
				// Type changed,
				return false
			}
			// read next frame
			frame := b.ms.next()
			p := frame.GetFloatPoints()

			l := len(p.Timestamps)
			if l > cap(b.timeBuf) {
				b.timeBuf = make([]execute.Time, l)
			} else {
				b.timeBuf = b.timeBuf[:l]
			}
			if l > cap(b.floatBuf) {
				b.floatBuf = make([]float64, l)
			} else {
				b.floatBuf = b.floatBuf[:l]
			}

			for i, c := range p.Timestamps {
				b.timeBuf[i] = execute.Time(c)
				b.floatBuf[i] = p.Values[i]
			}
			b.colBufs[0] = b.timeBuf
			b.colBufs[1] = b.floatBuf
			return true
		case stringPointsType:
			if b.colMeta[1].Type != execute.TString {
				// TODO: Add error handling
				// Type changed,
				return false
			}
			// read next frame
			frame := b.ms.next()
			p := frame.GetStringPoints()

			l := len(p.Timestamps)
			if l > cap(b.timeBuf) {
				b.timeBuf = make([]execute.Time, l)
			} else {
				b.timeBuf = b.timeBuf[:l]
			}
			if l > cap(b.stringBuf) {
				b.stringBuf = make([]string, l)
			} else {
				b.stringBuf = b.stringBuf[:l]
			}

			for i, c := range p.Timestamps {
				b.timeBuf[i] = execute.Time(c)
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
	stream     Storage_ReadClient
	rep        ReadResponse
	currentKey key
	readSpec   *storage.ReadSpec
	finished   bool
}

func (s *streamState) peek() ReadResponse_Frame {
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
func (s *streamState) next() ReadResponse_Frame {
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
func (s *mergedStreams) peek() ReadResponse_Frame {
	return s.streams[s.i].peek()
}

func (s *mergedStreams) next() ReadResponse_Frame {
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

func readFrameType(frame ReadResponse_Frame) frameType {
	switch frame.Data.(type) {
	case *ReadResponse_Frame_Series:
		return seriesType
	case *ReadResponse_Frame_BooleanPoints:
		return boolPointsType
	case *ReadResponse_Frame_IntegerPoints:
		return intPointsType
	case *ReadResponse_Frame_UnsignedPoints:
		return uintPointsType
	case *ReadResponse_Frame_FloatPoints:
		return floatPointsType
	case *ReadResponse_Frame_StringPoints:
		return stringPointsType
	default:
		panic(fmt.Errorf("unknown read response frame type: %T", frame.Data))
	}
}
