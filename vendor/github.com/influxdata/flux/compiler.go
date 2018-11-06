package flux

import (
	"context"
	"fmt"
)

// Compiler produces a specification for the query.
type Compiler interface {
	// Compile produces a specification for the query.
	Compile(ctx context.Context) (*Spec, error)
	CompilerType() CompilerType
}

// CompilerType is the name of a query compiler.
type CompilerType string
type CreateCompiler func() Compiler
type CompilerMappings map[CompilerType]CreateCompiler

func (m CompilerMappings) Add(t CompilerType, c CreateCompiler) error {
	if _, ok := m[t]; ok {
		return fmt.Errorf("duplicate compiler mapping for %q", t)
	}
	m[t] = c
	return nil
}
