//+build tools

package flux

import (
	_ "github.com/goreleaser/goreleaser"
	_ "honnef.co/go/tools/cmd/staticcheck"
)

// This package is a workaround for adding additional paths to the go.mod file
// and ensuring they stay there. The build tag ensures this file never gets
// compiled, but the go module tool will still look at the dependencies and
// add/keep them in go.mod so we can version these paths along with our other
// dependencies. When we run build on any of these paths, we get the version
// that has been specified in go.mod rather than the master copy.
