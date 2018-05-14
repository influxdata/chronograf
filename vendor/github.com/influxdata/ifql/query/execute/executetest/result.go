package executetest

import "github.com/influxdata/ifql/query/execute"


type Result struct {
	blocks []*Block
}

func NewResult(blocks []*Block) *Result {
	return &Result{blocks:blocks}
}

func (r *Result) Blocks() execute.BlockIterator {
	return &BlockIterator{
		r.blocks,
	}
}

type BlockIterator struct {
	blocks []*Block
}

func (bi *BlockIterator) Do(f func(execute.Block) error) error {
	for _, b := range bi.blocks {
		if err := f(b); err != nil {
			return err
		}
	}
	return nil
}