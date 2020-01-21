package kv

// todo: this isn't tested because it isn't really used*.
// *there are api routes that use this, but it doesn't integrate with anything.

import (
	"context"
	"encoding/json"
	"strconv"

	platform "github.com/influxdata/chronograf/v2"
)

// Ensure Service implements Platform.CellService.
var _ platform.CellService = &Service{}

// FindCellByID returns a single cell by ID.
func (s *Service) FindCellByID(ctx context.Context, id platform.ID) (*platform.Cell, error) {
	var c *platform.Cell

	err := s.kv.View(ctx, func(tx Tx) error {
		cell, err := findCellByID(ctx, tx, id)
		if err != nil {
			return err
		}
		c = cell
		return nil
	})

	if err != nil {
		return nil, err
	}

	return c, nil
}

func findCellByID(ctx context.Context, tx Tx, id platform.ID) (*platform.Cell, error) {
	var c platform.Cell

	v, err := tx.Bucket(cellBucket).Get([]byte(id))
	if err != nil {
		return nil, err
	}

	if len(v) == 0 {
		return nil, platform.ErrCellNotFound
	}

	if err := json.Unmarshal(v, &c); err != nil {
		return nil, err
	}

	return &c, nil
}

// FindCells retrives all cells that match an arbitrary cell filter.
func (s *Service) FindCells(ctx context.Context, filter platform.CellFilter) ([]*platform.Cell, int, error) {
	if filter.ID != nil {
		c, err := s.FindCellByID(ctx, *filter.ID)
		if err != nil {
			return nil, 0, err
		}

		return []*platform.Cell{c}, 1, nil
	}

	cs := []*platform.Cell{}
	err := s.kv.View(ctx, func(tx Tx) error {
		cells, err := findCells(ctx, tx, filter)
		if err != nil {
			return err
		}
		cs = cells
		return nil
	})

	if err != nil {
		return nil, 0, err
	}

	return cs, len(cs), nil
}

func findCells(ctx context.Context, tx Tx, filter platform.CellFilter) ([]*platform.Cell, error) {
	cells := []*platform.Cell{}

	filterFn := filterCellsFn(filter)
	err := forEachCell(ctx, tx, func(c *platform.Cell) bool {
		if filterFn(c) {
			cells = append(cells, c)
		}
		return true
	})

	if err != nil {
		return nil, err
	}

	return cells, nil
}

func filterCellsFn(filter platform.CellFilter) func(d *platform.Cell) bool {
	if filter.ID != nil {
		return func(d *platform.Cell) bool {
			return d.ID == *filter.ID
		}
	}

	return func(d *platform.Cell) bool { return true }
}

// forEachCell will iterate through all cells while fn returns true.
func forEachCell(ctx context.Context, tx Tx, fn func(*platform.Cell) bool) error {
	cur, err := tx.Bucket(cellBucket).Cursor()
	if err != nil {
		return err
	}

	for k, v := cur.First(); k != nil; k, v = cur.Next() {
		cell := &platform.Cell{}
		if err := json.Unmarshal(v, cell); err != nil {
			return err
		}
		if !fn(cell) {
			break
		}
	}

	return nil
}

// CreateCell creates a platform cell and sets cell.ID.
func (s *Service) CreateCell(ctx context.Context, cell *platform.Cell) error {
	return s.kv.Update(ctx, func(tx Tx) error {
		id, err := tx.Bucket(cellBucket).NextSequence()
		if err != nil {
			return err
		}
		cell.ID = platform.ID(strconv.Itoa(int(id)))

		return putCell(ctx, tx, cell)
	})
}

func putCell(ctx context.Context, tx Tx, cell *platform.Cell) error {
	v, err := json.Marshal(cell)
	if err != nil {
		return err
	}
	if err := tx.Bucket(cellBucket).Put([]byte(cell.ID), v); err != nil {
		return err
	}
	return nil
}

// UpdateCell updates a cell according the parameters set on upd.
func (s *Service) UpdateCell(ctx context.Context, id platform.ID, upd platform.CellUpdate) (*platform.Cell, error) {
	var cell *platform.Cell
	err := s.kv.Update(ctx, func(tx Tx) error {
		c, err := updateCell(ctx, tx, id, upd)
		if err != nil {
			return err
		}
		cell = c
		return nil
	})

	return cell, err
}

func updateCell(ctx context.Context, tx Tx, id platform.ID, upd platform.CellUpdate) (*platform.Cell, error) {
	cell, err := findCellByID(ctx, tx, id)
	if err != nil {
		return nil, err
	}

	if upd.Name != nil {
		cell.Name = *upd.Name
	}

	if upd.Visualization != nil {
		cell.Visualization = upd.Visualization
	}

	if err := putCell(ctx, tx, cell); err != nil {
		return nil, err
	}

	return cell, nil
}

// DeleteCell idempotently deletes a cell by ID and prunes it from the index.
func (s *Service) DeleteCell(ctx context.Context, id platform.ID) error {
	return s.kv.Update(ctx, func(tx Tx) error {
		return tx.Bucket(cellBucket).Delete([]byte(id))
	})
}
