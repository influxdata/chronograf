package configuration

import (
	"testing"

	"github.com/influxdata/chronograf"
)

func TestSourcesStore(t *testing.T) {
	var _ chronograf.SourcesStore = &SourcesStore{}
}
