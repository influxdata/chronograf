package canned

import (
	"context"
	"testing"

	clog "github.com/influxdata/chronograf/log"
)

func TestAll(t *testing.T) {
	store := BinLayoutsStore{Logger: clog.New(clog.ParseLevel("debug"))}
	all, err := store.All(context.Background())
	if err != nil {
		t.Error("No error expected!")
	}
	if len(all) != 50 {
		t.Errorf("50 items expected, but %d", len(all))
	}
}
