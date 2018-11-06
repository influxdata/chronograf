package querytest

import (
	"context"

	"github.com/influxdata/flux"
)

// FromCSVCompiler wraps a compiler and replaces all From operations with FromCSV
type FromCSVCompiler struct {
	flux.Compiler
	InputFile string
}

// FromInfluxJSONCompiler wraps a compiler and replaces all From operations with FromJSON
type FromInfluxJSONCompiler struct {
	flux.Compiler
	InputFile string
}

func (c FromCSVCompiler) Compile(ctx context.Context) (*flux.Spec, error) {
	spec, err := c.Compiler.Compile(ctx)
	if err != nil {
		return nil, err
	}
	ReplaceFromSpec(spec, c.InputFile)
	return spec, nil
}

func (c FromInfluxJSONCompiler) Compile(ctx context.Context) (*flux.Spec, error) {
	spec, err := c.Compiler.Compile(ctx)
	if err != nil {
		return nil, err
	}
	ReplaceFromWithFromInfluxJSONSpec(spec, c.InputFile)
	return spec, nil
}
