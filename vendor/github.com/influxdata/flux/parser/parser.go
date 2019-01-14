package parser

import (
	"github.com/influxdata/flux/ast"
	fastparser "github.com/influxdata/flux/internal/parser"
)

// NewAST parses Flux query and produces an ast.Program
func NewAST(flux string) (*ast.Program, error) {
	return fastparser.NewAST([]byte(flux)), nil
}
