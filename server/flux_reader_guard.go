package server

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"github.com/influxdata/chronograf/roles"
	"github.com/influxdata/flux/ast"
	"github.com/influxdata/flux/parser"
)

const readerFluxForbiddenMsg = "reader role cannot execute write-capable Flux functions"
const readerFluxMaxBodyBytes int64 = 1 << 20 // 1 MiB
var errReaderBodyTooLarge = errors.New("reader request body too large")

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

	// Reader may only proxy Flux query endpoint.
	if !isReaderAllowedFluxPath(r.URL.Query().Get("path")) {
		return fmt.Errorf(readerFluxForbiddenMsg)
	}

	body, err := readAndRestoreBodyWithLimit(r, readerFluxMaxBodyBytes)
	if err != nil {
		return fmt.Errorf(readerFluxForbiddenMsg)
	}

	var req fluxQueryRequest
	if err := json.Unmarshal(body, &req); err != nil {
		// Fail closed for Reader when payload cannot be inspected.
		return fmt.Errorf(readerFluxForbiddenMsg)
	}

	query := strings.TrimSpace(req.Query)
	if query == "" {
		return fmt.Errorf(readerFluxForbiddenMsg)
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

type readCloser struct {
	io.Reader
	io.Closer
}

// readAndRestoreBodyWithLimit reads up to maxBytes+1, restores r.Body for downstream
// consumers, and returns errReaderBodyTooLarge if the limit is exceeded.
func readAndRestoreBodyWithLimit(r *http.Request, maxBytes int64) ([]byte, error) {
	originalBody := r.Body
	body, err := io.ReadAll(io.LimitReader(originalBody, maxBytes+1))
	if err != nil {
		return nil, err
	}

	// Preserve full stream and preserve close semantics of original body.
	r.Body = &readCloser{
		Reader: io.MultiReader(bytes.NewReader(body), originalBody),
		Closer: originalBody,
	}

	if int64(len(body)) > maxBytes {
		return nil, errReaderBodyTooLarge
	}

	return body, nil
}

func isReaderAllowedFluxPath(rawPath string) bool {
	rawPath = strings.TrimSpace(rawPath)
	if rawPath == "" {
		return false
	}
	u, err := url.Parse(rawPath)
	if err != nil {
		return false
	}
	return u.Path == "/api/v2/query"
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
