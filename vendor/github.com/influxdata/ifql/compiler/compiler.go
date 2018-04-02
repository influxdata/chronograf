package compiler

import (
	"errors"
	"fmt"

	"github.com/influxdata/ifql/semantic"
)

func Compile(f *semantic.FunctionExpression, inTypes map[string]semantic.Type) (Func, error) {
	declarations := make(map[string]semantic.VariableDeclaration, len(inTypes))
	for k, t := range inTypes {
		declarations[k] = semantic.NewExternalVariableDeclaration(k, t)
	}
	f = f.Copy().(*semantic.FunctionExpression)
	semantic.ApplyNewDeclarations(f, declarations)

	root, err := compile(f.Body)
	if err != nil {
		return nil, err
	}
	cpy := make(map[string]semantic.Type)
	for k, v := range inTypes {
		cpy[k] = v
	}
	return compiledFn{
		root:    root,
		inTypes: cpy,
	}, nil
}

func compile(n semantic.Node) (Evaluator, error) {
	switch n := n.(type) {
	case *semantic.BlockStatement:
		body := make([]Evaluator, len(n.Body))
		for i, s := range n.Body {
			node, err := compile(s)
			if err != nil {
				return nil, err
			}
			body[i] = node
		}
		return &blockEvaluator{
			t:    n.ReturnStatement().Argument.Type(),
			body: body,
		}, nil
	case *semantic.ExpressionStatement:
		return nil, errors.New("statement does nothing, sideffects are not supported by the compiler")
	case *semantic.ReturnStatement:
		node, err := compile(n.Argument)
		if err != nil {
			return nil, err
		}
		return returnEvaluator{
			Evaluator: node,
		}, nil
	case *semantic.NativeVariableDeclaration:
		node, err := compile(n.Init)
		if err != nil {
			return nil, err
		}
		return &declarationEvaluator{
			t:    n.Init.Type(),
			id:   n.Identifier.Name,
			init: node,
		}, nil
	case *semantic.ObjectExpression:
		properties := make(map[string]Evaluator, len(n.Properties))
		for _, p := range n.Properties {
			node, err := compile(p.Value)
			if err != nil {
				return nil, err
			}
			properties[p.Key.Name] = node
		}
		return &mapEvaluator{
			t:          n.Type(),
			properties: properties,
		}, nil
	case *semantic.IdentifierExpression:
		return &identifierEvaluator{
			t:    n.Type(),
			name: n.Name,
		}, nil
	case *semantic.MemberExpression:
		object, err := compile(n.Object)
		if err != nil {
			return nil, err
		}
		return &memberEvaluator{
			t:        n.Type(),
			object:   object,
			property: n.Property,
		}, nil
	case *semantic.BooleanLiteral:
		return &booleanEvaluator{
			t: n.Type(),
			b: n.Value,
		}, nil
	case *semantic.IntegerLiteral:
		return &integerEvaluator{
			t: n.Type(),
			i: n.Value,
		}, nil
	case *semantic.FloatLiteral:
		return &floatEvaluator{
			t: n.Type(),
			f: n.Value,
		}, nil
	case *semantic.StringLiteral:
		return &stringEvaluator{
			t: n.Type(),
			s: n.Value,
		}, nil
	case *semantic.RegexpLiteral:
		return &regexpEvaluator{
			t: n.Type(),
			r: n.Value,
		}, nil
	case *semantic.DateTimeLiteral:
		return &timeEvaluator{
			t:    n.Type(),
			time: Time(n.Value.UnixNano()),
		}, nil
	case *semantic.UnaryExpression:
		node, err := compile(n.Argument)
		if err != nil {
			return nil, err
		}
		return &unaryEvaluator{
			t:    n.Type(),
			node: node,
		}, nil
	case *semantic.LogicalExpression:
		l, err := compile(n.Left)
		if err != nil {
			return nil, err
		}
		r, err := compile(n.Right)
		if err != nil {
			return nil, err
		}
		return &logicalEvaluator{
			t:        n.Type(),
			operator: n.Operator,
			left:     l,
			right:    r,
		}, nil
	case *semantic.BinaryExpression:
		l, err := compile(n.Left)
		if err != nil {
			return nil, err
		}
		lt := l.Type()
		r, err := compile(n.Right)
		if err != nil {
			return nil, err
		}
		rt := r.Type()
		sig := binarySignature{
			Operator: n.Operator,
			Left:     lt,
			Right:    rt,
		}
		f, ok := binaryFuncs[sig]
		if !ok {
			return nil, fmt.Errorf("unsupported binary expression %v %v %v", sig.Left, sig.Operator, sig.Right)
		}
		return &binaryEvaluator{
			t:     n.Type(),
			left:  l,
			right: r,
			f:     f.Func,
		}, nil
	default:
		return nil, fmt.Errorf("unknown semantic node of type %T", n)
	}
}

// CompilationCache caches compilation results based on the types of the input parameters.
type CompilationCache struct {
	fn   *semantic.FunctionExpression
	root *compilationCacheNode
}

func NewCompilationCache(fn *semantic.FunctionExpression) *CompilationCache {
	return &CompilationCache{
		fn:   fn,
		root: new(compilationCacheNode),
	}
}

// Compile returnes a compiled function bsaed on the provided types.
// The result will be cached for subsequent calls.
func (c *CompilationCache) Compile(types map[string]semantic.Type) (Func, error) {
	return c.root.compile(c.fn, 0, types)
}

type compilationCacheNode struct {
	children map[semantic.Type]*compilationCacheNode

	fn  Func
	err error
}

// compile recursively searches for a matching child node that has compiled the function.
// If the compilation has not been performed previously its result is cached and returned.
func (c *compilationCacheNode) compile(fn *semantic.FunctionExpression, idx int, types map[string]semantic.Type) (Func, error) {
	if idx == len(fn.Params) {
		// We are the matching child, return the cached result or do the compilation.
		if c.fn == nil && c.err == nil {
			c.fn, c.err = Compile(fn, types)
		}
		return c.fn, c.err
	}
	// Find the matching child based on the order.
	next := fn.Params[idx].Key.Name
	t := types[next]
	child := c.children[t]
	if child == nil {
		child = new(compilationCacheNode)
		if c.children == nil {
			c.children = make(map[semantic.Type]*compilationCacheNode)
		}
		c.children[t] = child
	}
	return child.compile(fn, idx+1, types)
}
