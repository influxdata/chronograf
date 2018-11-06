package lang

import (
	"context"
	"time"

	"github.com/influxdata/flux"
)

const (
	FluxCompilerType = "flux"
	SpecCompilerType = "spec"
)

// AddCompilerMappings adds the Flux specific compiler mappings.
func AddCompilerMappings(mappings flux.CompilerMappings) error {
	if err := mappings.Add(FluxCompilerType, func() flux.Compiler {
		return new(FluxCompiler)

	}); err != nil {
		return err
	}
	return mappings.Add(SpecCompilerType, func() flux.Compiler {
		return new(SpecCompiler)
	})
}

// FluxCompiler compiles a Flux script into a spec.
type FluxCompiler struct {
	Query string `json:"query"`
}

func (c FluxCompiler) Compile(ctx context.Context) (*flux.Spec, error) {
	return flux.Compile(ctx, c.Query, time.Now())
}

func (c FluxCompiler) CompilerType() flux.CompilerType {
	return FluxCompilerType
}

// SpecCompiler implements Compiler by returning a known spec.
type SpecCompiler struct {
	Spec *flux.Spec `json:"spec"`
}

func (c SpecCompiler) Compile(ctx context.Context) (*flux.Spec, error) {
	return c.Spec, nil
}
func (c SpecCompiler) CompilerType() flux.CompilerType {
	return SpecCompilerType
}
