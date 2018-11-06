package compiler

import (
	"fmt"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/semantic"
	"github.com/influxdata/flux/values"
	"github.com/pkg/errors"
)

func Compile(f *semantic.FunctionExpression, in semantic.Type, builtins Scope) (Func, error) {
	if in.Nature() != semantic.Object {
		return nil, errors.New("function input must be an object")
	}
	declarations := externDeclarations(builtins)
	extern := &semantic.Extern{
		Declarations: declarations,
		Block:        &semantic.ExternBlock{Node: f},
	}

	typeSol, err := semantic.InferTypes(extern)
	if err != nil {
		return nil, err
	}

	pt, err := typeSol.PolyTypeOf(f)
	if err != nil {
		return nil, err
	}
	props := in.Properties()
	parameters := make(map[string]semantic.PolyType, len(props))
	for k, p := range props {
		parameters[k] = p.PolyType()
	}
	fpt := semantic.NewFunctionPolyType(semantic.FunctionPolySignature{
		Parameters: parameters,
		Return:     typeSol.Fresh(),
	})
	if err := typeSol.AddConstraint(pt, fpt); err != nil {
		return nil, err
	}
	fnType, err := typeSol.TypeOf(f)
	if err != nil {
		return nil, errors.Wrap(err, "cannot compile polymorphic function")
	}

	root, err := compile(f.Block.Body, typeSol, builtins, make(map[string]*semantic.FunctionExpression))
	if err != nil {
		return nil, err
	}
	return compiledFn{
		root:       root,
		fnType:     fnType,
		inputScope: make(Scope),
	}, nil
}

// monoType ignores any errors when reading the type of a node.
// This is safe becase we already validated that the function type is a mono type.
func monoType(t semantic.Type, err error) semantic.Type {
	return t
}

// compile recursively compiles semantic nodes into evaluators.
func compile(n semantic.Node, typeSol semantic.TypeSolution, builtIns Scope, funcExprs map[string]*semantic.FunctionExpression) (Evaluator, error) {
	switch n := n.(type) {
	case *semantic.BlockStatement:
		body := make([]Evaluator, len(n.Body))
		for i, s := range n.Body {
			node, err := compile(s, typeSol, builtIns, funcExprs)
			if err != nil {
				return nil, err
			}
			body[i] = node
		}
		return &blockEvaluator{
			t:    monoType(typeSol.TypeOf(n.ReturnStatement().Argument)),
			body: body,
		}, nil
	case *semantic.ExpressionStatement:
		return nil, errors.New("statement does nothing, sideffects are not supported by the compiler")
	case *semantic.ReturnStatement:
		node, err := compile(n.Argument, typeSol, builtIns, funcExprs)
		if err != nil {
			return nil, err
		}
		return returnEvaluator{
			Evaluator: node,
		}, nil
	case *semantic.NativeVariableDeclaration:
		if fe, ok := n.Init.(*semantic.FunctionExpression); ok {
			funcExprs[n.Identifier.Name] = fe
			return &blockEvaluator{
				t: semantic.Invalid,
			}, nil
		}
		node, err := compile(n.Init, typeSol, builtIns, funcExprs)
		if err != nil {
			return nil, err
		}
		return &declarationEvaluator{
			t:    monoType(typeSol.TypeOf(n.Init)),
			id:   n.Identifier.Name,
			init: node,
		}, nil
	case *semantic.ObjectExpression:
		properties := make(map[string]Evaluator, len(n.Properties))
		propertyTypes := make(map[string]semantic.Type, len(n.Properties))
		for _, p := range n.Properties {
			node, err := compile(p.Value, typeSol, builtIns, funcExprs)
			if err != nil {
				return nil, err
			}
			properties[p.Key.Name] = node
			propertyTypes[p.Key.Name] = node.Type()
		}
		return &objEvaluator{
			t:          semantic.NewObjectType(propertyTypes),
			properties: properties,
		}, nil
	case *semantic.IdentifierExpression:
		if v, ok := builtIns[n.Name]; ok {
			//Resolve any built in identifiers now
			return &valueEvaluator{
				value: v,
			}, nil
		}

		// Create type instance of the function
		if fe, ok := funcExprs[n.Name]; ok {
			it, err := typeSol.PolyTypeOf(n)
			if err != nil {
				return nil, err
			}
			ft, err := typeSol.PolyTypeOf(fe)
			if err != nil {
				return nil, err
			}

			typeSol := typeSol.FreshSolution()
			// Add constraint on the identifier type and the function type.
			// This way all type variables in the body of the function will know their monotype.
			err = typeSol.AddConstraint(it, ft)
			if err != nil {
				return nil, err
			}

			return compile(fe, typeSol, builtIns, funcExprs)
		}
		return &identifierEvaluator{
			t:    monoType(typeSol.TypeOf(n)),
			name: n.Name,
		}, nil
	case *semantic.MemberExpression:
		object, err := compile(n.Object, typeSol, builtIns, funcExprs)
		if err != nil {
			return nil, err
		}
		return &memberEvaluator{
			t:        monoType(typeSol.TypeOf(n)),
			object:   object,
			property: n.Property,
		}, nil
	case *semantic.BooleanLiteral:
		return &booleanEvaluator{
			t: monoType(typeSol.TypeOf(n)),
			b: n.Value,
		}, nil
	case *semantic.IntegerLiteral:
		return &integerEvaluator{
			t: monoType(typeSol.TypeOf(n)),
			i: n.Value,
		}, nil
	case *semantic.FloatLiteral:
		return &floatEvaluator{
			t: monoType(typeSol.TypeOf(n)),
			f: n.Value,
		}, nil
	case *semantic.StringLiteral:
		return &stringEvaluator{
			t: monoType(typeSol.TypeOf(n)),
			s: n.Value,
		}, nil
	case *semantic.RegexpLiteral:
		return &regexpEvaluator{
			t: monoType(typeSol.TypeOf(n)),
			r: n.Value,
		}, nil
	case *semantic.DateTimeLiteral:
		return &timeEvaluator{
			t:    monoType(typeSol.TypeOf(n)),
			time: values.ConvertTime(n.Value),
		}, nil
	case *semantic.UnaryExpression:
		node, err := compile(n.Argument, typeSol, builtIns, funcExprs)
		if err != nil {
			return nil, err
		}
		return &unaryEvaluator{
			t:    monoType(typeSol.TypeOf(n)),
			node: node,
		}, nil
	case *semantic.LogicalExpression:
		l, err := compile(n.Left, typeSol, builtIns, funcExprs)
		if err != nil {
			return nil, err
		}
		r, err := compile(n.Right, typeSol, builtIns, funcExprs)
		if err != nil {
			return nil, err
		}
		return &logicalEvaluator{
			t:        monoType(typeSol.TypeOf(n)),
			operator: n.Operator,
			left:     l,
			right:    r,
		}, nil
	case *semantic.BinaryExpression:
		l, err := compile(n.Left, typeSol, builtIns, funcExprs)
		if err != nil {
			return nil, err
		}
		lt := l.Type()
		r, err := compile(n.Right, typeSol, builtIns, funcExprs)
		if err != nil {
			return nil, err
		}
		rt := r.Type()
		f, err := values.LookupBinaryFunction(values.BinaryFuncSignature{
			Operator: n.Operator,
			Left:     lt,
			Right:    rt,
		})
		if err != nil {
			return nil, err
		}
		return &binaryEvaluator{
			t:     monoType(typeSol.TypeOf(n)),
			left:  l,
			right: r,
			f:     f,
		}, nil
	case *semantic.CallExpression:
		args, err := compile(n.Arguments, typeSol, builtIns, funcExprs)
		if err != nil {
			return nil, err
		}
		callee, err := compile(n.Callee, typeSol, builtIns, funcExprs)
		if err != nil {
			return nil, err
		}
		return &callEvaluator{
			t:      monoType(typeSol.TypeOf(n)),
			callee: callee,
			args:   args,
		}, nil
	case *semantic.FunctionExpression:
		fnType := monoType(typeSol.TypeOf(n))
		body, err := compile(n.Block.Body, typeSol, builtIns, funcExprs)
		if err != nil {
			return nil, err
		}
		sig := fnType.FunctionSignature()
		params := make([]functionParam, 0, len(sig.Parameters))
		for k, pt := range sig.Parameters {
			param := functionParam{
				Key:  k,
				Type: pt,
			}
			if n.Defaults != nil {
				// Search for default value
				for _, d := range n.Defaults.Properties {
					if d.Key.Name == k {
						d, err := compile(d.Value, typeSol, builtIns, funcExprs)
						if err != nil {
							return nil, err
						}
						param.Default = d
						break
					}
				}
			}
			params = append(params, param)
		}
		return &functionEvaluator{
			t:      fnType,
			params: params,
			body:   body,
		}, nil
	default:
		return nil, fmt.Errorf("unknown semantic node of type %T", n)
	}
}

// CompilationCache caches compilation results based on the type of the function.
type CompilationCache struct {
	fn       *semantic.FunctionExpression
	scope    Scope
	compiled map[semantic.Type]funcErr
}

func NewCompilationCache(fn *semantic.FunctionExpression, scope Scope) *CompilationCache {
	return &CompilationCache{
		fn:       fn,
		scope:    scope,
		compiled: make(map[semantic.Type]funcErr),
	}
}

// Compile returns a compiled function based on the provided type.
// The result will be cached for subsequent calls.
func (c *CompilationCache) Compile(in semantic.Type) (Func, error) {
	f, ok := c.compiled[in]
	if ok {
		return f.F, f.Err
	}
	fun, err := Compile(c.fn, in, c.scope)
	c.compiled[in] = funcErr{
		F:   fun,
		Err: err,
	}
	return fun, err
}

type funcErr struct {
	F   Func
	Err error
}

// Utility function for compiling an `fn` parameter for rename or drop/keep. In addition
// to the function expression, it takes two types to verify the result against:
// a single argument type, and a single return type.
func CompileFnParam(fn *semantic.FunctionExpression, paramType, returnType semantic.Type) (Func, string, error) {
	scope := flux.BuiltIns()
	compileCache := NewCompilationCache(fn, scope)
	if fn.Block.Parameters != nil && len(fn.Block.Parameters.List) != 1 {
		return nil, "", errors.New("function should only have a single parameter")
	}
	paramName := fn.Block.Parameters.List[0].Key.Name

	compiled, err := compileCache.Compile(semantic.NewObjectType(map[string]semantic.Type{
		paramName: paramType,
	}))
	if err != nil {
		return nil, "", err
	}

	if compiled.Type() != returnType {
		return nil, "", fmt.Errorf("provided function does not evaluate to type %s", returnType.Nature())
	}

	return compiled, paramName, nil
}

// externDeclarations produces a list of external declarations from a scope
func externDeclarations(scope Scope) []*semantic.ExternalVariableDeclaration {
	declarations := make([]*semantic.ExternalVariableDeclaration, 0, len(scope))
	for k, v := range scope {
		declarations = append(declarations, &semantic.ExternalVariableDeclaration{
			Identifier: &semantic.Identifier{Name: k},
			ExternType: v.PolyType(),
		})
	}
	return declarations
}
