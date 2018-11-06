package semantic

import "fmt"

func Walk(v Visitor, node Node) {
	walk(v, node)
}

type Visitor interface {
	Visit(node Node) Visitor
	Done(node Node)
}

func CreateVisitor(f func(Node)) Visitor {
	return &visitor{f: f}
}

type visitor struct {
	f func(Node)
}

func (v *visitor) Visit(node Node) Visitor {
	v.f(node)
	return v
}

func (v *visitor) Done(node Node) {}

func walk(v Visitor, n Node) {
	switch n := n.(type) {
	case *Program:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			for _, s := range n.Body {
				walk(w, s)
			}
		}
	case *Extern:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			for _, d := range n.Declarations {
				walk(w, d)
			}
			walk(w, n.Block)
		}
	case *ExternBlock:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			walk(w, n.Node)
		}
	case *BlockStatement:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			for _, s := range n.Body {
				walk(w, s)
			}
		}
	case *OptionStatement:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil && n.Declaration != nil {
			walk(w, n.Declaration)
		}
	case *ExpressionStatement:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			walk(w, n.Expression)
		}
	case *ReturnStatement:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			walk(w, n.Argument)
		}
	case *NativeVariableDeclaration:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			walk(w, n.Identifier)
			walk(w, n.Init)
		}
	case *ExternalVariableDeclaration:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			walk(w, n.Identifier)
		}
	case *FunctionExpression:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			// Walk defaults first as they are evaluated in
			// the enclosing scope, not the function scope.
			walk(w, n.Defaults)
			walk(w, n.Block)
		}
	case *FunctionBlock:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			walk(w, n.Parameters)
			walk(w, n.Body)
		}
	case *FunctionParameters:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			for _, p := range n.List {
				walk(w, p)
			}
		}
	case *FunctionParameter:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			walk(w, n.Key)
		}
	case *ArrayExpression:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			for _, e := range n.Elements {
				walk(w, e)
			}
		}
	case *BinaryExpression:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			walk(w, n.Left)
			walk(w, n.Right)
		}
	case *CallExpression:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			walk(w, n.Callee)
			walk(w, n.Arguments)
			if n.Pipe != nil {
				walk(w, n.Pipe)
			}
		}
	case *ConditionalExpression:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			walk(w, n.Test)
			walk(w, n.Alternate)
			walk(w, n.Consequent)
		}
	case *IdentifierExpression:
		if n == nil {
			return
		}
		v.Visit(n)
	case *LogicalExpression:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			walk(w, n.Left)
			walk(w, n.Right)
		}
	case *MemberExpression:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			walk(w, n.Object)
		}
	case *ObjectExpression:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			for _, p := range n.Properties {
				walk(w, p)
			}
		}
	case *UnaryExpression:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			walk(w, n.Argument)
		}
	case *Identifier:
		if n == nil {
			return
		}
		v.Visit(n)
	case *Property:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			walk(w, n.Key)
			walk(w, n.Value)
		}
	case *BooleanLiteral:
		if n == nil {
			return
		}
		v.Visit(n)
	case *DateTimeLiteral:
		if n == nil {
			return
		}
		v.Visit(n)
	case *DurationLiteral:
		if n == nil {
			return
		}
		v.Visit(n)
	case *FloatLiteral:
		if n == nil {
			return
		}
		v.Visit(n)
	case *IntegerLiteral:
		if n == nil {
			return
		}
		v.Visit(n)
	case *RegexpLiteral:
		if n == nil {
			return
		}
		v.Visit(n)
	case *StringLiteral:
		if n == nil {
			return
		}
		v.Visit(n)
	case *UnsignedIntegerLiteral:
		if n == nil {
			return
		}
		v.Visit(n)
	default:
		panic(fmt.Errorf("walk not defined for node %T", n))
	}
	// We cannot use defer here as we only call Done if n != nil,
	// which we cannot check except for in each case.
	v.Done(n)
}

type NestingVisitor interface {
	Visitor
	Nest() NestingVisitor
}

// ScopedVisitor will nest the given visitor when the scope changes.
type ScopedVisitor struct {
	v NestingVisitor
}

func NewScopedVisitor(v NestingVisitor) ScopedVisitor {
	return ScopedVisitor{v: v}
}

func (v ScopedVisitor) Visit(node Node) Visitor {
	visitor := v.v.Visit(node)
	if visitor == nil {
		return nil
	}
	v.v = visitor.(NestingVisitor)
	switch node.(type) {
	case *ExternBlock,
		*BlockStatement,
		*FunctionBlock:
		return ScopedVisitor{
			v: v.v.Nest(),
		}
	}
	return v
}

func (v ScopedVisitor) Done(node Node) {
	v.v.Done(node)
}
