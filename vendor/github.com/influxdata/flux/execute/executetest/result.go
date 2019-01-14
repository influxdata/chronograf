package executetest

import (
	"fmt"

	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/flux"
)

type Result struct {
	Nm    string
	Tbls  []*Table
	Err   error
	Stats flux.Statistics
}

func NewResult(tables []*Table) *Result {
	return &Result{Tbls: tables}
}

func (r *Result) Name() string {
	return r.Nm
}

func (r *Result) Tables() flux.TableIterator {
	return &TableIterator{
		r.Tbls,
		r.Err,
	}
}

func (r *Result) Normalize() {
	NormalizeTables(r.Tbls)
}

func (r *Result) Statistics() flux.Statistics {
	return r.Stats
}

type TableIterator struct {
	tables []*Table
	err    error
}

func (ti *TableIterator) Statistics() flux.Statistics { return flux.Statistics{} }

func (ti *TableIterator) Do(f func(flux.Table) error) error {
	if ti.err != nil {
		return ti.err
	}
	for _, t := range ti.tables {
		if err := f(t); err != nil {
			return err
		}
	}
	return nil
}

// EqualResults compares two lists of Flux Results for equlity
func EqualResults(want, got []flux.Result) (bool, error) {
	if len(want) != len(got) {
		return false, fmt.Errorf("unexpected number of results - want %d results, got %d results", len(want), len(got))
	}
	for i, result := range want {
		w := result
		g := got[i]
		if w.Name() != g.Name() {
			return false, fmt.Errorf("unexpected result name - want %s, got %s", w.Name(), g.Name())
		}
		var wt, gt []*Table
		if err := w.Tables().Do(func(tbl flux.Table) error {
			t, err := ConvertTable(tbl)
			if err != nil {
				return err
			}
			wt = append(wt, t)
			return nil
		}); err != nil {
			return false, err
		}
		if err := g.Tables().Do(func(tbl flux.Table) error {
			t, err := ConvertTable(tbl)
			if err != nil {
				return err
			}
			gt = append(gt, t)
			return nil
		}); err != nil {
			return false, err
		}
		NormalizeTables(wt)
		NormalizeTables(gt)
		if len(wt) != len(gt) {
			return false, fmt.Errorf("unexpected size for result %s - want %d tables, got %d tables", w.Name(), len(wt), len(gt))
		}
		if !cmp.Equal(wt, gt, floatOptions) {
			return false, fmt.Errorf("unexpected tables -want/+got\n%s", cmp.Diff(wt, gt))
		}
	}
	return true, nil
}
