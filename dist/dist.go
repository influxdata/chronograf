package dist

import (
	"net/http"

	"github.com/influxdata/chronograf/ui"
)

// DebugAssets serves assets via a specified directory
type DebugAssets struct {
	Dir     string // Dir is a directory location of asset files
	Default string // Default is the file to serve if file is not found.
}

// Handler is an http.FileServer for the Dir
func (d *DebugAssets) Handler() http.Handler {
	return http.FileServer(NewDir(d.Dir, d.Default))
}

// GetVersion returns version of the packed assets
func GetVersion() string {
	return ui.GetVersion()
}
