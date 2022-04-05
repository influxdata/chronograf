package protoboards

import (
	"context"
	"testing"

	clog "github.com/influxdata/chronograf/log"
)

func TestAll(t *testing.T) {
	store := BinProtoboardsStore{Logger: clog.New(clog.ParseLevel("debug"))}
	all, err := store.All(context.Background())
	if err != nil {
		t.Error("No error expected!")
	}
	if len(all) != 29 {
		t.Errorf("29 items expected, but %d", len(all))
	}
}
