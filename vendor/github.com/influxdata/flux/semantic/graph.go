package semantic

import (
	"encoding/json"
	"regexp"
	"time"

	"github.com/influxdata/flux/ast"
)

type Node interface {
	node()
	NodeType() string
	Copy() Node

	Location() ast.SourceLocation

	json.Marshaler
}

type loc ast.SourceLocation

func (l loc) Location() ast.SourceLocation {
	return ast.SourceLocation(l)
}

func (*Program) node()     {}
func (*Extern) node()      {}
func (*ExternBlock) node() {}

func (*BlockStatement) node()              {}
func (*OptionStatement) node()             {}
func (*ExpressionStatement) node()         {}
func (*ReturnStatement) node()             {}
func (*NativeVariableDeclaration) node()   {}
func (*ExternalVariableDeclaration) node() {}

func (*ArrayExpression) node()       {}
func (*FunctionExpression) node()    {}
func (*BinaryExpression) node()      {}
func (*CallExpression) node()        {}
func (*ConditionalExpression) node() {}
func (*IdentifierExpression) node()  {}
func (*LogicalExpression) node()     {}
func (*MemberExpression) node()      {}
func (*ObjectExpression) node()      {}
func (*UnaryExpression) node()       {}

func (*Identifier) node() {}
func (*Property) node()   {}

func (*FunctionParameters) node() {}
func (*FunctionParameter) node()  {}
func (*FunctionBlock) node()      {}

func (*BooleanLiteral) node()         {}
func (*DateTimeLiteral) node()        {}
func (*DurationLiteral) node()        {}
func (*FloatLiteral) node()           {}
func (*IntegerLiteral) node()         {}
func (*StringLiteral) node()          {}
func (*RegexpLiteral) node()          {}
func (*UnsignedIntegerLiteral) node() {}

type Statement interface {
	Node
	stmt()
}

func (*BlockStatement) stmt()            {}
func (*OptionStatement) stmt()           {}
func (*ExpressionStatement) stmt()       {}
func (*ReturnStatement) stmt()           {}
func (*NativeVariableDeclaration) stmt() {}

type Expression interface {
	Node
	expression()
}

func (*ArrayExpression) expression()        {}
func (*BinaryExpression) expression()       {}
func (*BooleanLiteral) expression()         {}
func (*CallExpression) expression()         {}
func (*ConditionalExpression) expression()  {}
func (*DateTimeLiteral) expression()        {}
func (*DurationLiteral) expression()        {}
func (*FloatLiteral) expression()           {}
func (*FunctionExpression) expression()     {}
func (*IdentifierExpression) expression()   {}
func (*IntegerLiteral) expression()         {}
func (*LogicalExpression) expression()      {}
func (*MemberExpression) expression()       {}
func (*ObjectExpression) expression()       {}
func (*RegexpLiteral) expression()          {}
func (*StringLiteral) expression()          {}
func (*UnaryExpression) expression()        {}
func (*UnsignedIntegerLiteral) expression() {}

type Literal interface {
	Expression
	literal()
}

func (*BooleanLiteral) literal()         {}
func (*DateTimeLiteral) literal()        {}
func (*DurationLiteral) literal()        {}
func (*FloatLiteral) literal()           {}
func (*IntegerLiteral) literal()         {}
func (*RegexpLiteral) literal()          {}
func (*StringLiteral) literal()          {}
func (*UnsignedIntegerLiteral) literal() {}

type Program struct {
	loc `json:"-"`

	Body []Statement `json:"body"`
}

func (*Program) NodeType() string { return "Program" }

func (p *Program) Copy() Node {
	if p == nil {
		return p
	}
	np := new(Program)
	*np = *p

	if len(p.Body) > 0 {
		np.Body = make([]Statement, len(p.Body))
		for i, s := range p.Body {
			np.Body[i] = s.Copy().(Statement)
		}
	}

	return np
}

type BlockStatement struct {
	loc `json:"-"`

	Body []Statement `json:"body"`
}

func (*BlockStatement) NodeType() string { return "BlockStatement" }

func (s *BlockStatement) ReturnStatement() *ReturnStatement {
	return s.Body[len(s.Body)-1].(*ReturnStatement)
}

func (s *BlockStatement) Copy() Node {
	if s == nil {
		return s
	}
	ns := new(BlockStatement)
	*ns = *s

	if len(s.Body) > 0 {
		ns.Body = make([]Statement, len(s.Body))
		for i, stmt := range s.Body {
			ns.Body[i] = stmt.Copy().(Statement)
		}
	}

	return ns
}

type OptionStatement struct {
	loc `json:"-"`

	// Declaration represents the declaration of the option.
	// Must be one of *ExternalVariableDeclaration or *NativeVariableDeclaration.
	Declaration Node `json:"declaration"`
}

func (s *OptionStatement) NodeType() string { return "OptionStatement" }

func (s *OptionStatement) Copy() Node {
	if s == nil {
		return s
	}
	ns := new(OptionStatement)
	*ns = *s

	ns.Declaration = s.Declaration.Copy()

	return ns
}

type ExpressionStatement struct {
	loc `json:"-"`

	Expression Expression `json:"expression"`
}

func (*ExpressionStatement) NodeType() string { return "ExpressionStatement" }

func (s *ExpressionStatement) Copy() Node {
	if s == nil {
		return s
	}
	ns := new(ExpressionStatement)
	*ns = *s

	ns.Expression = s.Expression.Copy().(Expression)

	return ns
}

type ReturnStatement struct {
	loc `json:"-"`

	Argument Expression `json:"argument"`
}

func (*ReturnStatement) NodeType() string { return "ReturnStatement" }

func (s *ReturnStatement) Copy() Node {
	if s == nil {
		return s
	}
	ns := new(ReturnStatement)
	*ns = *s

	ns.Argument = s.Argument.Copy().(Expression)

	return ns
}

type NativeVariableDeclaration struct {
	loc `json:"-"`

	Identifier *Identifier `json:"identifier"`
	Init       Expression  `json:"init"`
}

func (d *NativeVariableDeclaration) ID() *Identifier {
	return d.Identifier
}

func (*NativeVariableDeclaration) NodeType() string { return "NativeVariableDeclaration" }

func (s *NativeVariableDeclaration) Copy() Node {
	if s == nil {
		return s
	}
	ns := new(NativeVariableDeclaration)
	*ns = *s

	ns.Identifier = s.Identifier.Copy().(*Identifier)

	if s.Init != nil {
		ns.Init = s.Init.Copy().(Expression)
	}

	return ns
}

// Extern is a node that represents a node with a set of external declarations defined.
type Extern struct {
	loc `json:"-"`

	Declarations []*ExternalVariableDeclaration `json:"declarations"`
	Block        *ExternBlock                   `json:"block"`
}

func (*Extern) NodeType() string { return "Extern" }

func (e *Extern) Copy() Node {
	if e == nil {
		return e
	}
	ne := new(Extern)
	*ne = *e

	if len(e.Declarations) > 0 {
		ne.Declarations = make([]*ExternalVariableDeclaration, len(e.Declarations))
		for i, d := range e.Declarations {
			ne.Declarations[i] = d.Copy().(*ExternalVariableDeclaration)
		}
	}

	ne.Block = e.Block.Copy().(*ExternBlock)

	return ne
}

// ExternalVariableDeclaration represents an externaly defined identifier and its type.
type ExternalVariableDeclaration struct {
	loc `json:"-"`

	Identifier *Identifier `json:"identifier"`
	ExternType PolyType    `json:""`
}

func (*ExternalVariableDeclaration) NodeType() string { return "ExternalVariableDeclaration" }

func (s *ExternalVariableDeclaration) Copy() Node {
	if s == nil {
		return s
	}
	ns := new(ExternalVariableDeclaration)
	*ns = *s

	ns.Identifier = s.Identifier.Copy().(*Identifier)

	return ns
}

// ExternBlock is a node that represents a node with a set of external declarations defined.
type ExternBlock struct {
	loc `json:"-"`

	Node Node
}

func (*ExternBlock) NodeType() string { return "ExternBlock" }

func (e *ExternBlock) Copy() Node {
	if e == nil {
		return e
	}
	ne := new(ExternBlock)
	*ne = *e

	if ne.Node != nil {
		ne.Node = e.Node.Copy()
	}

	return ne
}

type ArrayExpression struct {
	loc `json:"-"`

	Elements []Expression `json:"elements"`
}

func (*ArrayExpression) NodeType() string { return "ArrayExpression" }

func (e *ArrayExpression) Copy() Node {
	if e == nil {
		return e
	}
	ne := new(ArrayExpression)
	*ne = *e

	if len(e.Elements) > 0 {
		ne.Elements = make([]Expression, len(e.Elements))
		for i, elem := range e.Elements {
			ne.Elements[i] = elem.Copy().(Expression)
		}
	}

	return ne
}

// FunctionExpression represents the definition of a function
type FunctionExpression struct {
	loc `json:"-"`

	Defaults *ObjectExpression `json:"defaults,omitempty"`
	Block    *FunctionBlock    `json:"block"`
}

func (*FunctionExpression) NodeType() string { return "FunctionExpression" }

func (e *FunctionExpression) Copy() Node {
	if e == nil {
		return e
	}
	ne := new(FunctionExpression)
	*ne = *e

	if e.Defaults != nil {
		ne.Defaults = e.Defaults.Copy().(*ObjectExpression)
	}
	ne.Block = e.Block.Copy().(*FunctionBlock)

	return ne
}

// FunctionBlock represents the function parameters and the function body.
type FunctionBlock struct {
	loc `json:"-"`

	Parameters *FunctionParameters `json:"parameters"`
	Body       Node                `json:"body"`
}

func (*FunctionBlock) NodeType() string { return "FunctionBlock" }
func (b *FunctionBlock) Copy() Node {
	if b == nil {
		return b
	}
	nb := new(FunctionBlock)
	*nb = *b

	nb.Body = b.Body.Copy()

	return nb
}

// FunctionParameters represents the list of function parameters and which if any parameter is the pipe parameter.
type FunctionParameters struct {
	loc `json:"-"`

	List []*FunctionParameter `json:"list"`
	Pipe *Identifier          `json:"pipe"`
}

func (*FunctionParameters) NodeType() string { return "FunctionParameters" }

func (p *FunctionParameters) Copy() Node {
	if p == nil {
		return p
	}
	np := new(FunctionParameters)
	*np = *p

	if len(p.List) > 0 {
		np.List = make([]*FunctionParameter, len(p.List))
		for i, k := range p.List {
			np.List[i] = k.Copy().(*FunctionParameter)
		}
	}
	if p.Pipe != nil {
		np.Pipe = p.Pipe.Copy().(*Identifier)
	}

	return np
}

// FunctionParameter represents a function parameter.
type FunctionParameter struct {
	loc `json:"-"`

	Key *Identifier `json:"key"`
}

func (*FunctionParameter) NodeType() string { return "FunctionParameter" }

func (p *FunctionParameter) Copy() Node {
	if p == nil {
		return p
	}
	np := new(FunctionParameter)
	*np = *p

	np.Key = p.Key.Copy().(*Identifier)

	return np
}

type BinaryExpression struct {
	loc `json:"-"`

	Operator ast.OperatorKind `json:"operator"`
	Left     Expression       `json:"left"`
	Right    Expression       `json:"right"`
}

func (*BinaryExpression) NodeType() string { return "BinaryExpression" }

func (e *BinaryExpression) Copy() Node {
	if e == nil {
		return e
	}
	ne := new(BinaryExpression)
	*ne = *e

	ne.Left = e.Left.Copy().(Expression)
	ne.Right = e.Right.Copy().(Expression)

	return ne
}

type CallExpression struct {
	loc `json:"-"`

	Callee    Expression        `json:"callee"`
	Arguments *ObjectExpression `json:"arguments"`
	Pipe      Expression        `json:"pipe,omitempty"`
}

func (*CallExpression) NodeType() string { return "CallExpression" }

func (e *CallExpression) Copy() Node {
	if e == nil {
		return e
	}
	ne := new(CallExpression)
	*ne = *e

	ne.Callee = e.Callee.Copy().(Expression)
	ne.Arguments = e.Arguments.Copy().(*ObjectExpression)
	ne.Pipe = e.Pipe.Copy().(Expression)

	return ne
}

type ConditionalExpression struct {
	loc `json:"-"`

	Test       Expression `json:"test"`
	Alternate  Expression `json:"alternate"`
	Consequent Expression `json:"consequent"`
}

func (*ConditionalExpression) NodeType() string { return "ConditionalExpression" }

func (e *ConditionalExpression) Copy() Node {
	if e == nil {
		return e
	}
	ne := new(ConditionalExpression)
	*ne = *e

	ne.Test = e.Test.Copy().(Expression)
	ne.Alternate = e.Alternate.Copy().(Expression)
	ne.Consequent = e.Consequent.Copy().(Expression)

	return ne
}

type LogicalExpression struct {
	loc `json:"-"`

	Operator ast.LogicalOperatorKind `json:"operator"`
	Left     Expression              `json:"left"`
	Right    Expression              `json:"right"`
}

func (*LogicalExpression) NodeType() string { return "LogicalExpression" }

func (e *LogicalExpression) Copy() Node {
	if e == nil {
		return e
	}
	ne := new(LogicalExpression)
	*ne = *e

	ne.Left = e.Left.Copy().(Expression)
	ne.Right = e.Right.Copy().(Expression)

	return ne
}

type MemberExpression struct {
	loc `json:"-"`

	Object   Expression `json:"object"`
	Property string     `json:"property"`
}

func (*MemberExpression) NodeType() string { return "MemberExpression" }

func (e *MemberExpression) Copy() Node {
	if e == nil {
		return e
	}
	ne := new(MemberExpression)
	*ne = *e

	ne.Object = e.Object.Copy().(Expression)

	return ne
}

type ObjectExpression struct {
	loc `json:"-"`

	Properties []*Property `json:"properties"`
}

func (*ObjectExpression) NodeType() string { return "ObjectExpression" }

func (e *ObjectExpression) Copy() Node {
	if e == nil {
		return e
	}
	ne := new(ObjectExpression)
	*ne = *e

	if len(e.Properties) > 0 {
		ne.Properties = make([]*Property, len(e.Properties))
		for i, prop := range e.Properties {
			ne.Properties[i] = prop.Copy().(*Property)
		}
	}

	return ne
}

type UnaryExpression struct {
	loc `json:"-"`

	Operator ast.OperatorKind `json:"operator"`
	Argument Expression       `json:"argument"`
}

func (*UnaryExpression) NodeType() string { return "UnaryExpression" }

func (e *UnaryExpression) Copy() Node {
	if e == nil {
		return e
	}
	ne := new(UnaryExpression)
	*ne = *e

	ne.Argument = e.Argument.Copy().(Expression)

	return ne
}

type Property struct {
	loc `json:"-"`

	Key   *Identifier `json:"key"`
	Value Expression  `json:"value"`
}

func (*Property) NodeType() string { return "Property" }

func (p *Property) Copy() Node {
	if p == nil {
		return p
	}
	np := new(Property)
	*np = *p

	np.Value = p.Value.Copy().(Expression)

	return np
}

type IdentifierExpression struct {
	loc `json:"-"`

	Name string `json:"name"`
}

func (*IdentifierExpression) NodeType() string { return "IdentifierExpression" }

func (e *IdentifierExpression) Copy() Node {
	if e == nil {
		return e
	}
	ne := new(IdentifierExpression)
	*ne = *e

	return ne
}

type Identifier struct {
	loc `json:"-"`

	Name string `json:"name"`
}

func (*Identifier) NodeType() string { return "Identifier" }

func (i *Identifier) Copy() Node {
	if i == nil {
		return i
	}
	ni := new(Identifier)
	*ni = *i

	return ni
}

type BooleanLiteral struct {
	loc `json:"-"`

	Value bool `json:"value"`
}

func (*BooleanLiteral) NodeType() string { return "BooleanLiteral" }

func (l *BooleanLiteral) Copy() Node {
	if l == nil {
		return l
	}
	nl := new(BooleanLiteral)
	*nl = *l

	return nl
}

type DateTimeLiteral struct {
	loc `json:"-"`

	Value time.Time `json:"value"`
}

func (*DateTimeLiteral) NodeType() string { return "DateTimeLiteral" }

func (l *DateTimeLiteral) Copy() Node {
	if l == nil {
		return l
	}
	nl := new(DateTimeLiteral)
	*nl = *l

	return nl
}

type DurationLiteral struct {
	loc `json:"-"`

	Value time.Duration `json:"value"`
}

func (*DurationLiteral) NodeType() string { return "DurationLiteral" }

func (l *DurationLiteral) Copy() Node {
	if l == nil {
		return l
	}
	nl := new(DurationLiteral)
	*nl = *l

	return nl
}

type IntegerLiteral struct {
	loc `json:"-"`

	Value int64 `json:"value"`
}

func (*IntegerLiteral) NodeType() string { return "IntegerLiteral" }

func (l *IntegerLiteral) Copy() Node {
	if l == nil {
		return l
	}
	nl := new(IntegerLiteral)
	*nl = *l

	return nl
}

type FloatLiteral struct {
	loc `json:"-"`

	Value float64 `json:"value"`
}

func (*FloatLiteral) NodeType() string { return "FloatLiteral" }

func (l *FloatLiteral) Copy() Node {
	if l == nil {
		return l
	}
	nl := new(FloatLiteral)
	*nl = *l

	return nl
}

type RegexpLiteral struct {
	loc `json:"-"`

	Value *regexp.Regexp `json:"value"`
}

func (*RegexpLiteral) NodeType() string { return "RegexpLiteral" }

func (l *RegexpLiteral) Copy() Node {
	if l == nil {
		return l
	}
	nl := new(RegexpLiteral)
	*nl = *l

	nl.Value = l.Value.Copy()

	return nl
}

type StringLiteral struct {
	loc `json:"-"`

	Value string `json:"value"`
}

func (*StringLiteral) NodeType() string { return "StringLiteral" }

func (l *StringLiteral) Copy() Node {
	if l == nil {
		return l
	}
	nl := new(StringLiteral)
	*nl = *l

	return nl
}

type UnsignedIntegerLiteral struct {
	loc `json:"-"`

	Value uint64 `json:"value"`
}

func (*UnsignedIntegerLiteral) NodeType() string { return "UnsignedIntegerLiteral" }

func (l *UnsignedIntegerLiteral) Copy() Node {
	if l == nil {
		return l
	}
	nl := new(UnsignedIntegerLiteral)
	*nl = *l

	return nl
}
