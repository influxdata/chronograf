package dist_test

import (
	"testing"

	"github.com/influxdata/chronograf/dist"
)

func TestGetVersion(t *testing.T) {
	version := dist.GetVersion()
	if version == "" {
		t.Error("No version information is available!")
	}
}
