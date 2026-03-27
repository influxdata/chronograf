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
var errReaderFluxPathForbidden = errors.New("reader role may only query /api/v2/query")
var errReaderFluxInvalidJSON = errors.New("invalid JSON request body")
var errReaderFluxQueryRequired = errors.New("query field required")
var errReaderFluxParse = errors.New("invalid Flux query")
var errReaderFluxWriteForbidden = errors.New(readerFluxForbiddenMsg)

type fluxQueryRequest struct {
	Query string `json:"query"`
}

// enforceReaderFluxReadOnly blocks Reader requests that contain write-capable Flux calls;
// as a minimum policy this guard denies to() usage for Reader role.
func enforceReaderFluxReadOnly(r *http.Request) error {
	role, ok := hasRoleContext(r.Context())
	if !ok || role != roles.ReaderRoleName {
		return nil
	}

	// Reader may only proxy the Flux query endpoint (all methods).
	if !isReaderAllowedFluxPath(r.URL.Query().Get("path")) {
		return errReaderFluxPathForbidden
	}

	// Only POST carries Flux query JSON body that needs AST checks.
	if r.Method != http.MethodPost {
		return nil
	}

	body, err := readAndRestoreBodyWithLimit(r, readerFluxMaxBodyBytes)
	if err != nil {
		if errors.Is(err, errReaderBodyTooLarge) {
			return err
		}
		return fmt.Errorf("%w: %v", errReaderFluxInvalidJSON, err)
	}

	var req fluxQueryRequest
	if err := json.Unmarshal(body, &req); err != nil {
		return fmt.Errorf("%w: %v", errReaderFluxInvalidJSON, err)
	}

	query := strings.TrimSpace(req.Query)
	if query == "" {
		return errReaderFluxQueryRequired
	}

	pkg := parser.ParseSource(query)
	if ast.Check(pkg) > 0 {
		return fmt.Errorf("%w: %v", errReaderFluxParse, ast.GetError(pkg))
	}
	if hasReaderDeniedFluxAlias(pkg) {
		return errReaderFluxWriteForbidden
	}
	if hasReaderDeniedFluxCall(pkg) {
		return errReaderFluxWriteForbidden
	}
	return nil
}

func readerFluxErrorStatus(err error) int {
	switch {
	case errors.Is(err, errReaderBodyTooLarge):
		return http.StatusRequestEntityTooLarge
	case errors.Is(err, errReaderFluxInvalidJSON),
		errors.Is(err, errReaderFluxQueryRequired),
		errors.Is(err, errReaderFluxParse):
		return http.StatusBadRequest
	default:
		// path restriction + write-capable usage remain authorization denials
		return http.StatusForbidden
	}
}

func readerFluxErrorMessage(err error) string {
	switch {
	case errors.Is(err, errReaderBodyTooLarge):
		return errReaderBodyTooLarge.Error()
	case errors.Is(err, errReaderFluxPathForbidden):
		return errReaderFluxPathForbidden.Error()
	case errors.Is(err, errReaderFluxQueryRequired):
		return errReaderFluxQueryRequired.Error()
	case errors.Is(err, errReaderFluxWriteForbidden):
		return readerFluxForbiddenMsg
	default:
		return err.Error()
	}
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

// hasReaderDeniedFluxAlias blocks direct aliases of to(), e.g.:
//
//	t = to
//	t = v1.to
func hasReaderDeniedFluxAlias(pkg *ast.Package) bool {
	blocked := false
	ast.Walk(ast.CreateVisitor(func(node ast.Node) {
		if blocked {
			return
		}
		assign, ok := node.(*ast.VariableAssignment)
		if !ok || assign == nil || assign.Init == nil {
			return
		}
		if fluxCallName(assign.Init) == "to" {
			blocked = true
		}
	}), pkg)
	return blocked
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
	case *ast.ParenExpression:
		if callee == nil || callee.Expression == nil {
			return ""
		}
		return fluxCallName(callee.Expression)
	default:
		return ""
	}
}
