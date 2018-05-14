package executetest

import (
	"fmt"

	"github.com/influxdata/ifql/query/execute"
)

type Block struct {
	Bnds    execute.Bounds
	ColMeta []execute.ColMeta
	// Data is a list of rows, i.e. Data[row][col]
	// Each row must be a list with length equal to len(ColMeta)
	Data [][]interface{}
}

func (b *Block) RefCount(n int) {}

func (b *Block) Bounds() execute.Bounds {
	return b.Bnds
}

func (b *Block) Tags() execute.Tags {
	tags := make(execute.Tags, len(b.ColMeta))
	for j, c := range b.ColMeta {
		if c.IsTag() && c.Common {
			tags[c.Label] = b.Data[0][j].(string)
		}
	}
	return tags
}

func (b *Block) Cols() []execute.ColMeta {
	return b.ColMeta
}

func (b *Block) Col(c int) execute.ValueIterator {
	return &ValueIterator{colMeta: b.ColMeta, col: c, b: b}
}

func (b *Block) Times() execute.ValueIterator {
	timeIdx := execute.TimeIdx(b.ColMeta)
	return b.Col(timeIdx)
}

func (b *Block) Values() (execute.ValueIterator, error) {
	valueIdx := execute.ValueIdx(b.ColMeta)
	if valueIdx >= 0 {
		return b.Col(valueIdx), nil
	}
	return nil, execute.NoDefaultValueColumn
}

type ValueIterator struct {
	colMeta []execute.ColMeta
	col     int
	b       *Block

	row int
}

func (v *ValueIterator) Cols() []execute.ColMeta {
	return v.colMeta
}
func (v *ValueIterator) DoBool(f func([]bool, execute.RowReader)) {
	for v.row = 0; v.row < len(v.b.Data); v.row++ {
		f([]bool{v.b.Data[v.row][v.col].(bool)}, v)
	}
}
func (v *ValueIterator) DoInt(f func([]int64, execute.RowReader)) {
	for v.row = 0; v.row < len(v.b.Data); v.row++ {
		f([]int64{v.b.Data[v.row][v.col].(int64)}, v)
	}
}
func (v *ValueIterator) DoUInt(f func([]uint64, execute.RowReader)) {
	for v.row = 0; v.row < len(v.b.Data); v.row++ {
		f([]uint64{v.b.Data[v.row][v.col].(uint64)}, v)
	}
}
func (v *ValueIterator) DoFloat(f func([]float64, execute.RowReader)) {
	for v.row = 0; v.row < len(v.b.Data); v.row++ {
		f([]float64{v.b.Data[v.row][v.col].(float64)}, v)
	}
}

func (v *ValueIterator) DoString(f func([]string, execute.RowReader)) {
	for v.row = 0; v.row < len(v.b.Data); v.row++ {
		f([]string{v.b.Data[v.row][v.col].(string)}, v)
	}
}

func (v *ValueIterator) DoTime(f func([]execute.Time, execute.RowReader)) {
	for v.row = 0; v.row < len(v.b.Data); v.row++ {
		f([]execute.Time{v.b.Data[v.row][v.col].(execute.Time)}, v)
	}
}

func (v *ValueIterator) AtBool(i int, j int) bool {
	return v.b.Data[v.row][j].(bool)
}
func (v *ValueIterator) AtInt(i int, j int) int64 {
	return v.b.Data[v.row][j].(int64)
}
func (v *ValueIterator) AtUInt(i int, j int) uint64 {
	return v.b.Data[v.row][j].(uint64)
}
func (v *ValueIterator) AtFloat(i int, j int) float64 {
	return v.b.Data[v.row][j].(float64)
}

func (v *ValueIterator) AtString(i int, j int) string {
	return v.b.Data[v.row][j].(string)
}

func (v *ValueIterator) AtTime(i int, j int) execute.Time {
	return v.b.Data[v.row][j].(execute.Time)
}

func BlocksFromCache(c execute.DataCache) []*Block {
	var blocks []*Block
	c.ForEach(func(key execute.BlockKey) {
		b, err := c.Block(key)
		if err != nil {
			panic(err)
		}
		blocks = append(blocks, ConvertBlock(b))
	})
	return blocks
}

func ConvertBlock(b execute.Block) *Block {
	blk := &Block{
		Bnds:    b.Bounds(),
		ColMeta: b.Cols(),
	}

	b.Times().DoTime(func(ts []execute.Time, rr execute.RowReader) {
		for i := range ts {
			row := make([]interface{}, len(blk.ColMeta))
			for j, c := range blk.ColMeta {
				var v interface{}
				switch c.Type {
				case execute.TBool:
					v = rr.AtBool(i, j)
				case execute.TInt:
					v = rr.AtInt(i, j)
				case execute.TUInt:
					v = rr.AtUInt(i, j)
				case execute.TFloat:
					v = rr.AtFloat(i, j)
				case execute.TString:
					v = rr.AtString(i, j)
				case execute.TTime:
					v = rr.AtTime(i, j)
				default:
					panic(fmt.Errorf("unknown column type %s", c.Type))
				}
				row[j] = v
			}
			blk.Data = append(blk.Data, row)
		}
	})
	return blk
}

type SortedBlocks []*Block

func (b SortedBlocks) Len() int {
	return len(b)
}

func (b SortedBlocks) Less(i int, j int) bool {
	if b[i].Bnds.Stop == b[j].Bnds.Stop {
		if b[i].Bnds.Start == b[j].Bnds.Start {
			return b[i].Tags().Key() < b[j].Tags().Key()
		}
		return b[i].Bnds.Start < b[j].Bnds.Start
	}
	return b[i].Bnds.Stop < b[j].Bnds.Stop
}

func (b SortedBlocks) Swap(i int, j int) {
	b[i], b[j] = b[j], b[i]
}
