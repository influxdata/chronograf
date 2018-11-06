package semantic

import (
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/influxdata/flux/ast"
)

// New creates a semantic graph from the provided AST
func New(prog *ast.Program) (*Program, error) {
	return analyzeProgram(prog)
}

func analyzeProgram(prog *ast.Program) (*Program, error) {
	p := &Program{
		loc:  loc(prog.Location()),
		Body: make([]Statement, len(prog.Body)),
	}
	for i, s := range prog.Body {
		n, err := analyzeStatment(s)
		if err != nil {
			return nil, err
		}
		p.Body[i] = n
	}
	return p, nil
}

func analyzeNode(n ast.Node) (Node, error) {
	switch n := n.(type) {
	case ast.Statement:
		return analyzeStatment(n)
	case ast.Expression:
		return analyzeExpression(n)
	default:
		return nil, fmt.Errorf("unsupported node %T", n)
	}
}

func analyzeStatment(s ast.Statement) (Statement, error) {
	switch s := s.(type) {
	case *ast.BlockStatement:
		return analyzeBlockStatement(s)
	case *ast.OptionStatement:
		return analyzeOptionStatement(s)
	case *ast.ExpressionStatement:
		return analyzeExpressionStatement(s)
	case *ast.ReturnStatement:
		return analyzeReturnStatement(s)
	case *ast.VariableDeclaration:
		// Expect a single declaration
		if len(s.Declarations) != 1 {
			return nil, fmt.Errorf("only single variable declarations are supported, found %d declarations", len(s.Declarations))
		}
		return analyzeVariableDeclaration(s.Declarations[0])
	default:
		return nil, fmt.Errorf("unsupported statement %T", s)
	}
}

func analyzeBlockStatement(block *ast.BlockStatement) (*BlockStatement, error) {
	b := &BlockStatement{
		loc:  loc(block.Location()),
		Body: make([]Statement, len(block.Body)),
	}
	for i, s := range block.Body {
		n, err := analyzeStatment(s)
		if err != nil {
			return nil, err
		}
		b.Body[i] = n
	}
	last := len(b.Body) - 1
	if _, ok := b.Body[last].(*ReturnStatement); !ok {
		return nil, errors.New("missing return statement in block")
	}
	return b, nil
}

func analyzeOptionStatement(option *ast.OptionStatement) (*OptionStatement, error) {
	declaration, err := analyzeVariableDeclaration(option.Declaration)
	if err != nil {
		return nil, err
	}
	return &OptionStatement{
		loc:         loc(option.Location()),
		Declaration: declaration,
	}, nil
}

func analyzeExpressionStatement(expr *ast.ExpressionStatement) (*ExpressionStatement, error) {
	e, err := analyzeExpression(expr.Expression)
	if err != nil {
		return nil, err
	}
	return &ExpressionStatement{
		loc:        loc(expr.Location()),
		Expression: e,
	}, nil
}

func analyzeReturnStatement(ret *ast.ReturnStatement) (*ReturnStatement, error) {
	arg, err := analyzeExpression(ret.Argument)
	if err != nil {
		return nil, err
	}
	return &ReturnStatement{
		loc:      loc(ret.Location()),
		Argument: arg,
	}, nil
}

func analyzeVariableDeclaration(decl *ast.VariableDeclarator) (*NativeVariableDeclaration, error) {
	id, err := analyzeIdentifier(decl.ID)
	if err != nil {
		return nil, err
	}
	init, err := analyzeExpression(decl.Init)
	if err != nil {
		return nil, err
	}
	vd := &NativeVariableDeclaration{
		loc:        loc(decl.Location()),
		Identifier: id,
		Init:       init,
	}
	return vd, nil
}

func analyzeExpression(expr ast.Expression) (Expression, error) {
	switch expr := expr.(type) {
	case *ast.ArrowFunctionExpression:
		return analyzeArrowFunctionExpression(expr)
	case *ast.CallExpression:
		return analyzeCallExpression(expr)
	case *ast.MemberExpression:
		return analyzeMemberExpression(expr)
	case *ast.PipeExpression:
		return analyzePipeExpression(expr)
	case *ast.BinaryExpression:
		return analyzeBinaryExpression(expr)
	case *ast.UnaryExpression:
		return analyzeUnaryExpression(expr)
	case *ast.LogicalExpression:
		return analyzeLogicalExpression(expr)
	case *ast.ObjectExpression:
		return analyzeObjectExpression(expr)
	case *ast.ArrayExpression:
		return analyzeArrayExpression(expr)
	case *ast.Identifier:
		return analyzeIdentifierExpression(expr)
	case ast.Literal:
		return analyzeLiteral(expr)
	default:
		return nil, fmt.Errorf("unsupported expression %T", expr)
	}
}

func analyzeLiteral(lit ast.Literal) (Literal, error) {
	switch lit := lit.(type) {
	case *ast.StringLiteral:
		return analyzeStringLiteral(lit)
	case *ast.BooleanLiteral:
		return analyzeBooleanLiteral(lit)
	case *ast.FloatLiteral:
		return analyzeFloatLiteral(lit)
	case *ast.IntegerLiteral:
		return analyzeIntegerLiteral(lit)
	case *ast.UnsignedIntegerLiteral:
		return analyzeUnsignedIntegerLiteral(lit)
	case *ast.RegexpLiteral:
		return analyzeRegexpLiteral(lit)
	case *ast.DurationLiteral:
		return analyzeDurationLiteral(lit)
	case *ast.DateTimeLiteral:
		return analyzeDateTimeLiteral(lit)
	case *ast.PipeLiteral:
		return nil, errors.New("a pipe literal may only be used as a default value for an argument in a function definition")
	default:
		return nil, fmt.Errorf("unsupported literal %T", lit)
	}
}

func analyzeArrowFunctionExpression(arrow *ast.ArrowFunctionExpression) (*FunctionExpression, error) {
	var parameters *FunctionParameters
	var defaults *ObjectExpression
	if len(arrow.Params) > 0 {
		pipedCount := 0
		parameters = &FunctionParameters{
			loc: loc(arrow.Location()),
		}
		parameters.List = make([]*FunctionParameter, len(arrow.Params))
		for i, p := range arrow.Params {
			key, err := analyzeIdentifier(p.Key)
			if err != nil {
				return nil, err
			}

			var def Expression
			var piped bool
			if p.Value != nil {
				if _, ok := p.Value.(*ast.PipeLiteral); ok {
					// Special case the PipeLiteral
					piped = true
					pipedCount++
					if pipedCount > 1 {
						return nil, errors.New("only a single argument may be piped")
					}
				} else {
					d, err := analyzeExpression(p.Value)
					if err != nil {
						return nil, err
					}
					def = d
				}
			}

			parameters.List[i] = &FunctionParameter{
				loc: loc(p.Location()),
				Key: key,
			}
			if def != nil {
				if defaults == nil {
					defaults = &ObjectExpression{
						loc:        loc(arrow.Location()),
						Properties: make([]*Property, 0, len(arrow.Params)),
					}
				}
				defaults.Properties = append(defaults.Properties, &Property{
					loc:   loc(p.Location()),
					Key:   key,
					Value: def,
				})
			}
			if piped {
				parameters.Pipe = key
			}
		}
	}

	b, err := analyzeNode(arrow.Body)
	if err != nil {
		return nil, err
	}

	f := &FunctionExpression{
		loc:      loc(arrow.Location()),
		Defaults: defaults,
		Block: &FunctionBlock{
			loc:        loc(arrow.Location()),
			Parameters: parameters,
			Body:       b,
		},
	}

	return f, nil
}

func analyzeCallExpression(call *ast.CallExpression) (*CallExpression, error) {
	callee, err := analyzeExpression(call.Callee)
	if err != nil {
		return nil, err
	}
	var args *ObjectExpression
	if l := len(call.Arguments); l > 1 {
		return nil, fmt.Errorf("arguments are not a single object expression %v", args)
	} else if l == 1 {
		obj, ok := call.Arguments[0].(*ast.ObjectExpression)
		if !ok {
			return nil, fmt.Errorf("arguments not an object expression")
		}
		var err error
		args, err = analyzeObjectExpression(obj)
		if err != nil {
			return nil, err
		}
	} else {
		args = &ObjectExpression{
			loc: loc(call.Location()),
		}
	}

	return &CallExpression{
		loc:       loc(call.Location()),
		Callee:    callee,
		Arguments: args,
	}, nil
}

func analyzeMemberExpression(member *ast.MemberExpression) (*MemberExpression, error) {
	obj, err := analyzeExpression(member.Object)
	if err != nil {
		return nil, err
	}

	var propertyName string
	switch p := member.Property.(type) {
	case *ast.Identifier:
		propertyName = p.Name
	case *ast.StringLiteral:
		propertyName = p.Value
	case *ast.IntegerLiteral:
		propertyName = strconv.FormatInt(p.Value, 10)
	default:
		return nil, fmt.Errorf("unsupported member property expression of type %T", member.Property)
	}

	return &MemberExpression{
		loc:      loc(member.Location()),
		Object:   obj,
		Property: propertyName,
	}, nil
}

func analyzePipeExpression(pipe *ast.PipeExpression) (*CallExpression, error) {
	call, err := analyzeCallExpression(pipe.Call)
	if err != nil {
		return nil, err
	}

	value, err := analyzeExpression(pipe.Argument)
	if err != nil {
		return nil, err
	}

	call.Pipe = value
	return call, nil
}

func analyzeBinaryExpression(binary *ast.BinaryExpression) (*BinaryExpression, error) {
	left, err := analyzeExpression(binary.Left)
	if err != nil {
		return nil, err
	}
	right, err := analyzeExpression(binary.Right)
	if err != nil {
		return nil, err
	}
	return &BinaryExpression{
		loc:      loc(binary.Location()),
		Operator: binary.Operator,
		Left:     left,
		Right:    right,
	}, nil
}

func analyzeUnaryExpression(unary *ast.UnaryExpression) (*UnaryExpression, error) {
	arg, err := analyzeExpression(unary.Argument)
	if err != nil {
		return nil, err
	}
	return &UnaryExpression{
		loc:      loc(unary.Location()),
		Operator: unary.Operator,
		Argument: arg,
	}, nil
}
func analyzeLogicalExpression(logical *ast.LogicalExpression) (*LogicalExpression, error) {
	left, err := analyzeExpression(logical.Left)
	if err != nil {
		return nil, err
	}
	right, err := analyzeExpression(logical.Right)
	if err != nil {
		return nil, err
	}
	return &LogicalExpression{
		loc:      loc(logical.Location()),
		Operator: logical.Operator,
		Left:     left,
		Right:    right,
	}, nil
}
func analyzeObjectExpression(obj *ast.ObjectExpression) (*ObjectExpression, error) {
	o := &ObjectExpression{
		loc:        loc(obj.Location()),
		Properties: make([]*Property, len(obj.Properties)),
	}
	for i, p := range obj.Properties {
		n, err := analyzeProperty(p)
		if err != nil {
			return nil, err
		}
		o.Properties[i] = n
	}
	return o, nil
}
func analyzeArrayExpression(array *ast.ArrayExpression) (*ArrayExpression, error) {
	a := &ArrayExpression{
		loc:      loc(array.Location()),
		Elements: make([]Expression, len(array.Elements)),
	}
	for i, e := range array.Elements {
		n, err := analyzeExpression(e)
		if err != nil {
			return nil, err
		}
		a.Elements[i] = n
	}
	return a, nil
}

func analyzeIdentifier(ident *ast.Identifier) (*Identifier, error) {
	return &Identifier{
		loc:  loc(ident.Location()),
		Name: ident.Name,
	}, nil
}

func analyzeIdentifierExpression(ident *ast.Identifier) (*IdentifierExpression, error) {
	return &IdentifierExpression{
		loc:  loc(ident.Location()),
		Name: ident.Name,
	}, nil
}

func analyzeProperty(property *ast.Property) (*Property, error) {
	key, err := analyzeIdentifier(property.Key)
	if err != nil {
		return nil, err
	}
	value, err := analyzeExpression(property.Value)
	if err != nil {
		return nil, err
	}
	return &Property{
		loc:   loc(property.Location()),
		Key:   key,
		Value: value,
	}, nil
}

func analyzeDateTimeLiteral(lit *ast.DateTimeLiteral) (*DateTimeLiteral, error) {
	return &DateTimeLiteral{
		loc:   loc(lit.Location()),
		Value: lit.Value,
	}, nil
}
func analyzeDurationLiteral(lit *ast.DurationLiteral) (*DurationLiteral, error) {
	var duration time.Duration
	for _, d := range lit.Values {
		dur, err := toDuration(d)
		if err != nil {
			return nil, err
		}
		duration += dur
	}
	return &DurationLiteral{
		loc:   loc(lit.Location()),
		Value: duration,
	}, nil
}
func analyzeFloatLiteral(lit *ast.FloatLiteral) (*FloatLiteral, error) {
	return &FloatLiteral{
		loc:   loc(lit.Location()),
		Value: lit.Value,
	}, nil
}
func analyzeIntegerLiteral(lit *ast.IntegerLiteral) (*IntegerLiteral, error) {
	return &IntegerLiteral{
		loc:   loc(lit.Location()),
		Value: lit.Value,
	}, nil
}
func analyzeUnsignedIntegerLiteral(lit *ast.UnsignedIntegerLiteral) (*UnsignedIntegerLiteral, error) {
	return &UnsignedIntegerLiteral{
		loc:   loc(lit.Location()),
		Value: lit.Value,
	}, nil
}
func analyzeStringLiteral(lit *ast.StringLiteral) (*StringLiteral, error) {
	return &StringLiteral{
		loc:   loc(lit.Location()),
		Value: lit.Value,
	}, nil
}
func analyzeBooleanLiteral(lit *ast.BooleanLiteral) (*BooleanLiteral, error) {
	return &BooleanLiteral{
		loc:   loc(lit.Location()),
		Value: lit.Value,
	}, nil
}
func analyzeRegexpLiteral(lit *ast.RegexpLiteral) (*RegexpLiteral, error) {
	return &RegexpLiteral{
		loc:   loc(lit.Location()),
		Value: lit.Value,
	}, nil
}
func toDuration(lit ast.Duration) (time.Duration, error) {
	// TODO: This is temporary code until we have proper duration type that takes different months, DST, etc into account
	var dur time.Duration
	var err error
	mag := lit.Magnitude
	unit := lit.Unit

	switch unit {
	case "y":
		mag *= 12
		unit = "mo"
		fallthrough
	case "mo":
		const weeksPerMonth = 365.25 / 12 / 7
		mag = int64(float64(mag) * weeksPerMonth)
		unit = "w"
		fallthrough
	case "w":
		mag *= 7
		unit = "d"
		fallthrough
	case "d":
		mag *= 24
		unit = "h"
		fallthrough
	default:
		// ParseDuration will handle h, m, s, ms, us, ns.
		dur, err = time.ParseDuration(strconv.FormatInt(mag, 10) + unit)
	}
	return dur, err
}
