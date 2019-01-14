package ast

import "fmt"

/*
`Walk` recursively visits every children of a given `Node` given a `Visitor`.
It performs a pre-order visit of the AST (visit parent node, then visit children from left to right).
If a call to `Visit` for a node returns a nil visitor, walk stops and doesn't visit the AST rooted at that node,
otherwise it uses the returned visitor to continue walking.
Once Walk has finished visiting a node (the node itself and its children), it invokes `Done` on the node's visitor.
NOTE: `Walk` doesn't visit `nil` nodes.
*/
func Walk(v Visitor, node Node) {
	walk(v, node)
}

/*
A `Visitor` extracts information from a `Node` to build a result and/or have side-effects on it.
The result of `Visit` is a `Visitor` that, in turn, is used by `Walk` to visit the children of the node under exam.
To stop walking, `Visit` must return `nil`.
*/
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

func walk(v Visitor, node Node) {
	// We need to check if node is nil.
	// We perform an initial check here, but because of Go's type system,
	// we also need to compare against the concrete type of n within each case statement.
	if node == nil {
		return
	}

	switch n := node.(type) {
	case *Program:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			walk(w, n.Package)
			for _, i := range n.Imports {
				walk(w, i)
			}
			for _, s := range n.Body {
				walk(w, s)
			}
		}
	case *PackageClause:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			walk(w, n.Name)
		}
	case *ImportDeclaration:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			walk(w, n.As)
			walk(w, n.Path)
		}
	case *Block:
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
		if w != nil && n.Assignment != nil {
			walk(w, n.Assignment)
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
	case *VariableAssignment:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			walk(w, n.ID)
			walk(w, n.Init)
		}
	case *CallExpression:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			walk(w, n.Callee)
			for _, s := range n.Arguments {
				walk(w, s)
			}
		}
	case *PipeExpression:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			walk(w, n.Argument)
			walk(w, n.Call)
		}
	case *MemberExpression:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			walk(w, n.Object)
			walk(w, n.Property)
		}
	case *IndexExpression:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			walk(w, n.Array)
			walk(w, n.Index)
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
	case *UnaryExpression:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			walk(w, n.Argument)
		}
	case *LogicalExpression:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			walk(w, n.Left)
			walk(w, n.Right)
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
	case *FunctionExpression:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			for _, e := range n.Params {
				walk(w, e)
			}
			walk(w, n.Body)
		}
	case *Property:
		if n == nil {
			return
		}
		w := v.Visit(n)
		if w != nil {
			walk(w, n.Key)
			walk(w, n.Value)
		}
	case *Identifier:
		if n == nil {
			return
		}
		v.Visit(n)
	case *PipeLiteral:
		if n == nil {
			return
		}
		v.Visit(n)
	case *StringLiteral:
		if n == nil {
			return
		}
		v.Visit(n)
	case *BooleanLiteral:
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
	case *UnsignedIntegerLiteral:
		if n == nil {
			return
		}
		v.Visit(n)
	case *RegexpLiteral:
		if n == nil {
			return
		}
		v.Visit(n)
	case *DurationLiteral:
		if n == nil {
			return
		}
		v.Visit(n)
	case *DateTimeLiteral:
		if n == nil {
			return
		}
		v.Visit(n)
	default:
		panic(fmt.Errorf("walk not defined for node %T", n))
	}

	// Cannot use defer here as we need to check for n == nil which needs to happen in each case.
	v.Done(node)
}
