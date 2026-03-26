package server

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/influxdata/chronograf/roles"
	"github.com/influxdata/flux/ast"
	"github.com/influxdata/flux/parser"
)

const readerFluxForbiddenMsg = "reader role cannot execute write-capable Flux functions"

type fluxQueryRequest struct {
	Query string `json:"query"`
}

// enforceReaderFluxReadOnly blocks Reader requests that contain write-capable Flux calls.
// For OP fix #3, this enforces the known minimum: block to().
func enforceReaderFluxReadOnly(r *http.Request) error {
	role, ok := hasRoleContext(r.Context())
	if !ok || role != roles.ReaderRoleName || r.Method != http.MethodPost {
		return nil
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		return fmt.Errorf(readerFluxForbiddenMsg)
	}
	// Restore body for reverse proxy.
	r.Body = io.NopCloser(bytes.NewReader(body))

	var req fluxQueryRequest
	if err := json.Unmarshal(body, &req); err != nil {
		// Fail closed for Reader when payload cannot be inspected.
		return fmt.Errorf(readerFluxForbiddenMsg)
	}

	query := strings.TrimSpace(req.Query)
	if query == "" {
		return nil
	}

	pkg := parser.ParseSource(query)
	if ast.Check(pkg) > 0 {
		return fmt.Errorf(readerFluxForbiddenMsg)
	}
	if hasReaderDeniedFluxCall(pkg) {
		return fmt.Errorf(readerFluxForbiddenMsg)
	}
	return nil
}

func hasReaderDeniedFluxCall(pkg *ast.Package) bool {
	blocked := false
	ast.Walk(ast.CreateVisitor(func(node ast.Node) {
		if blocked {
			return
		}
		call, ok := node.(*ast.CallExpression)
		if !ok || call == nil {
			return
		}
		if fluxCallName(call.Callee) == "to" {
			blocked = true
		}
	}), pkg)
	return blocked
}

func fluxCallName(expr ast.Expression) string {
	switch callee := expr.(type) {
	case *ast.Identifier:
		return callee.Name
	case *ast.MemberExpression:
		return callee.Property.Key()
	default:
		return ""
	}
}
