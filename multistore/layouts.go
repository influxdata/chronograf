package multistore

import (
	"context"

	"github.com/influxdata/chronograf"
)

// Layouts is a LayoutsStore that contains multiple LayoutsStores
// The All method will return the set of all Layouts.
// Each method will be tried against the Stores slice serially.
type Layouts struct {
	Stores []chronograf.LayoutsStore
}

// All returns the set of all layouts
func (s *Layouts) All(ctx context.Context) ([]chronograf.Layout, error) {
	all := []chronograf.Layout{}
	layoutSet := map[string]chronograf.Layout{}
	ok := false
	var err error
	for _, store := range s.Stores {
		var layouts []chronograf.Layout
		layouts, err = store.All(ctx)
		if err != nil {
			// Try to load as many layouts as possible
			continue
		}
		ok = true
		for _, l := range layouts {
			// Enforce that the layout has a unique ID
			// If the layout has been seen before then skip
			if _, okay := layoutSet[l.ID]; !okay {
				layoutSet[l.ID] = l
				all = append(all, l)
			}
		}
	}
	if !ok {
		return nil, err
	}
	return all, nil
}

// Get retrieves Layout if `ID` exists.  Searches through each store sequentially until success.
func (s *Layouts) Get(ctx context.Context, ID string) (chronograf.Layout, error) {
	var err error
	for _, store := range s.Stores {
		var l chronograf.Layout
		l, err = store.Get(ctx, ID)
		if err == nil {
			return l, nil
		}
	}
	return chronograf.Layout{}, err
}
