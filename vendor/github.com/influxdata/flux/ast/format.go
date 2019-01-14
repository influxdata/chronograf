package ast

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

/*
Returns a valid script for a given AST rooted at node `n`.

Formatting rules:
 - In a list of statements, if two statements are of a different type
	(e.g. an `OptionStatement` followed by an `ExpressionStatement`), they are separated by a double newline.
 - In a function call (or object definition), if the arguments (or properties) are more than 3,
	they are split into multiple lines.
*/
func Format(n Node) string {
	f := &formatter{new(strings.Builder), 0}
	f.formatNode(n)
	return f.get()
}

type formatter struct {
	*strings.Builder
	indentation int
}

func (f *formatter) get() string {
	return f.String()
}

// `strings.Builder`'s methods never return a non-nil error,
// so it is safe to ignore it.
func (f *formatter) writeString(s string) {
	f.WriteString(s)
}

func (f *formatter) writeRune(r rune) {
	f.WriteRune(r)
}

func (f *formatter) writeIndent() {
	for i := 0; i < f.indentation; i++ {
		f.writeRune('\t')
	}
}

func (f *formatter) indent() {
	f.indentation++
}

func (f *formatter) unIndent() {
	f.indentation--
}

func (f *formatter) setIndent(i int) {
	f.indentation = i
}

func (f *formatter) formatProgram(n *Program) {
	sep := '\n'

	if n.Package != nil && len(n.Package.Name.Name) > 0 {
		f.writeIndent()
		f.formatNode(n.Package)

		if len(n.Imports) > 0 || len(n.Body) > 0 {
			f.writeRune(sep)
			f.writeRune(sep)
		}
	}

	for i, imp := range n.Imports {
		if i != 0 {
			f.writeRune(sep)
		}

		f.writeIndent()
		f.formatNode(imp)
	}

	if len(n.Imports) > 0 && len(n.Body) > 0 {
		f.writeRune(sep)
		f.writeRune(sep)
	}

	for i, c := range n.Body {
		if i != 0 {
			f.writeRune(sep)

			// separate different statements with double newline
			if n.Body[i-1].Type() != n.Body[i].Type() {
				f.writeRune(sep)
			}
		}

		f.writeIndent()
		f.formatNode(c)
	}
}

func (f *formatter) formatBlock(n *Block) {
	f.writeRune('{')

	sep := '\n'
	if len(n.Body) > 0 {
		f.indent()
	}

	for i, c := range n.Body {
		f.writeRune(sep)

		if i != 0 {
			// separate different statements with double newline
			if n.Body[i-1].Type() != n.Body[i].Type() {
				f.writeRune(sep)
			}
		}

		f.writeIndent()
		f.formatNode(c)
	}

	if len(n.Body) > 0 {
		f.writeRune(sep)
		f.unIndent()
		f.writeIndent()
	}

	f.writeRune('}')
}

func (f *formatter) formatPackageClause(n *PackageClause) {
	f.writeString("package ")
	f.formatNode(n.Name)
}

func (f *formatter) formatImportDeclaration(n *ImportDeclaration) {
	f.writeString("import ")

	if n.As != nil && len(n.As.Name) > 0 {
		f.formatNode(n.As)
		f.writeRune(' ')
	}

	f.formatNode(n.Path)
}

func (f *formatter) formatExpressionStatement(n *ExpressionStatement) {
	f.formatNode(n.Expression)
}

func (f *formatter) formatReturnStatement(n *ReturnStatement) {
	f.writeString("return ")
	f.formatNode(n.Argument)
}

func (f *formatter) formatOptionStatement(n *OptionStatement) {
	f.writeString("option ")
	f.formatNode(n.Assignment)
}

func (f *formatter) formatVariableAssignment(n *VariableAssignment) {
	f.formatNode(n.ID)
	f.writeString(" = ")
	f.formatNode(n.Init)
}

func (f *formatter) formatArrayExpression(n *ArrayExpression) {
	f.writeRune('[')

	sep := ", "
	for i, c := range n.Elements {
		if i != 0 {
			f.writeString(sep)
		}

		f.formatNode(c)
	}

	f.writeRune(']')
}

func (f *formatter) formatFunctionExpression(n *FunctionExpression) {
	f.writeRune('(')

	sep := ", "
	for i, c := range n.Params {
		if i != 0 {
			f.writeString(sep)
		}

		// treat properties differently than in general case
		f.formatFunctionArgument(c)
	}

	f.writeString(") =>")

	// must wrap body with parenthesis in order to discriminate between:
	//  - returning an object: (x) => ({foo: x})
	//  - and block statements:
	//		(x) => {
	//			return x + 1
	//		}
	_, block := n.Body.(*Block)
	if !block {
		f.writeRune('\n')
		f.indent()
		f.writeIndent()
		f.writeRune('(')
	} else {
		f.writeRune(' ')
	}

	f.formatNode(n.Body)
	if !block {
		f.writeRune(')')
	}
}

func (f *formatter) formatUnaryExpression(n *UnaryExpression) {
	f.writeString(n.Operator.String())
	f.formatNode(n.Argument)
}

func (f *formatter) formatBinaryExpression(n *BinaryExpression) {
	f.formatNode(n.Left)
	f.writeRune(' ')
	f.writeString(n.Operator.String())
	f.writeRune(' ')
	f.formatNode(n.Right)
}

func (f *formatter) formatLogicalExpression(n *LogicalExpression) {
	f.formatNode(n.Left)
	f.writeRune(' ')
	f.writeString(n.Operator.String())
	f.writeRune(' ')
	f.formatNode(n.Right)
}

func (f *formatter) formatCallExpression(n *CallExpression) {
	f.formatNode(n.Callee)
	f.writeRune('(')

	sep := ", "
	for i, c := range n.Arguments {
		if i != 0 {
			f.writeString(sep)
		}

		// treat ObjectExpression as argument in a special way
		// (an object as argument doesn't need braces)
		if oe, ok := c.(*ObjectExpression); ok {
			f.formatObjectExpressionAsFunctionArgument(oe)
		} else {
			f.formatNode(c)
		}
	}

	f.writeRune(')')
}

func (f *formatter) formatPipeExpression(n *PipeExpression) {
	f.formatNode(n.Argument)
	f.writeRune('\n')
	f.indent()
	f.writeIndent()
	f.writeString("|> ")
	f.formatNode(n.Call)
}

func (f *formatter) formatConditionalExpression(n *ConditionalExpression) {
	f.formatNode(n.Test)
	f.writeString(" ? ")
	f.formatNode(n.Consequent)
	f.writeString(" : ")
	f.formatNode(n.Alternate)
}

func (f *formatter) formatMemberExpression(n *MemberExpression) {
	f.formatNode(n.Object)

	if _, ok := n.Property.(*StringLiteral); ok {
		f.writeRune('[')
		f.formatNode(n.Property)
		f.writeRune('[')
	} else {
		f.writeRune('.')
		f.formatNode(n.Property)
	}
}

func (f *formatter) formatIndexExpression(n *IndexExpression) {
	f.formatNode(n.Array)
	f.writeRune('[')
	f.formatNode(n.Index)
	f.writeRune(']')
}

func (f *formatter) formatObjectExpression(n *ObjectExpression) {
	f.formatObjectExpressionBraces(n, true)
}

func (f *formatter) formatObjectExpressionAsFunctionArgument(n *ObjectExpression) {
	// not called from formatNode, need to save indentation
	i := f.indentation
	f.formatObjectExpressionBraces(n, false)
	f.setIndent(i)
}

func (f *formatter) formatObjectExpressionBraces(n *ObjectExpression, braces bool) {
	multiline := len(n.Properties) > 3

	if braces {
		f.writeRune('{')
	}

	if multiline {
		f.writeRune('\n')
		f.indent()
		f.writeIndent()
	}

	var sep string
	if multiline {
		sep = ",\n"
	} else {
		sep = ", "
	}

	for i, c := range n.Properties {
		if i != 0 {
			f.writeString(sep)

			if multiline {
				f.writeIndent()
			}
		}

		f.formatNode(c)
	}

	if multiline {
		f.writeString(sep)
		f.unIndent()
		f.writeIndent()
	}

	if braces {
		f.writeRune('}')
	}
}

func (f *formatter) formatProperty(n *Property) {
	f.formatNode(n.Key)
	if n.Value != nil {
		f.writeString(": ")
		f.formatNode(n.Value)
	}
}

func (f *formatter) formatFunctionArgument(n *Property) {
	if n.Value == nil {
		f.formatNode(n.Key)
		return
	}

	f.formatNode(n.Key)
	f.writeRune('=')
	f.formatNode(n.Value)
}

func (f *formatter) formatIdentifier(n *Identifier) {
	f.writeString(n.Name)
}

func (f *formatter) formatStringLiteral(n *StringLiteral) {
	if n.Loc != nil && n.Loc.Source != "" {
		// Preserve the exact literal if we have it
		f.writeString(n.Loc.Source)
		return
	}
	// Write out escaped string value
	f.writeRune('"')
	f.writeString(escapeStr(n.Value))
	f.writeRune('"')
}

func escapeStr(s string) string {
	if !strings.ContainsAny(s, `"\`) {
		return s
	}
	var builder strings.Builder
	// Allocate for worst case where every rune needs to be escaped.
	builder.Grow(len(s) * 2)
	for _, r := range s {
		switch r {
		case '"', '\\':
			builder.WriteRune('\\')
		}
		builder.WriteRune(r)
	}
	return builder.String()
}

func (f *formatter) formatBooleanLiteral(n *BooleanLiteral) {
	f.writeString(strconv.FormatBool(n.Value))
}

func (f *formatter) formatDateTimeLiteral(n *DateTimeLiteral) {
	f.writeString(n.Value.Format(time.RFC3339Nano))
}

func (f *formatter) formatDurationLiteral(n *DurationLiteral) {
	formatDuration := func(d Duration) {
		f.writeString(strconv.FormatInt(d.Magnitude, 10))
		f.writeString(d.Unit)
	}

	for _, d := range n.Values {
		formatDuration(d)
	}
}

func (f *formatter) formatFloatLiteral(n *FloatLiteral) {
	sf := strconv.FormatFloat(n.Value, 'f', -1, 64)

	if !strings.Contains(sf, ".") {
		sf += ".0" // force to make it a float
	}

	f.writeString(sf)
}

func (f *formatter) formatIntegerLiteral(n *IntegerLiteral) {
	f.writeString(strconv.FormatInt(n.Value, 10))
}

func (f *formatter) formatUnsignedIntegerLiteral(n *UnsignedIntegerLiteral) {
	f.writeString(strconv.FormatUint(n.Value, 10))
}

func (f *formatter) formatPipeLiteral(_ *PipeLiteral) {
	f.writeString("<-")
}

func (f *formatter) formatRegexpLiteral(n *RegexpLiteral) {
	f.writeRune('/')
	f.writeString(strings.Replace(n.Value.String(), "/", "\\/", -1))
	f.writeRune('/')
}

func (f *formatter) formatNode(n Node) {
	//save current indentation
	currInd := f.indentation

	switch n := n.(type) {
	case *Program:
		f.formatProgram(n)
	case *Block:
		f.formatBlock(n)
	case *PackageClause:
		f.formatPackageClause(n)
	case *ImportDeclaration:
		f.formatImportDeclaration(n)
	case *OptionStatement:
		f.formatOptionStatement(n)
	case *ExpressionStatement:
		f.formatExpressionStatement(n)
	case *ReturnStatement:
		f.formatReturnStatement(n)
	case *VariableAssignment:
		f.formatVariableAssignment(n)
	case *CallExpression:
		f.formatCallExpression(n)
	case *PipeExpression:
		f.formatPipeExpression(n)
	case *MemberExpression:
		f.formatMemberExpression(n)
	case *IndexExpression:
		f.formatIndexExpression(n)
	case *BinaryExpression:
		f.formatBinaryExpression(n)
	case *UnaryExpression:
		f.formatUnaryExpression(n)
	case *LogicalExpression:
		f.formatLogicalExpression(n)
	case *ObjectExpression:
		f.formatObjectExpression(n)
	case *ConditionalExpression:
		f.formatConditionalExpression(n)
	case *ArrayExpression:
		f.formatArrayExpression(n)
	case *Identifier:
		f.formatIdentifier(n)
	case *PipeLiteral:
		f.formatPipeLiteral(n)
	case *StringLiteral:
		f.formatStringLiteral(n)
	case *BooleanLiteral:
		f.formatBooleanLiteral(n)
	case *FloatLiteral:
		f.formatFloatLiteral(n)
	case *IntegerLiteral:
		f.formatIntegerLiteral(n)
	case *UnsignedIntegerLiteral:
		f.formatUnsignedIntegerLiteral(n)
	case *RegexpLiteral:
		f.formatRegexpLiteral(n)
	case *DurationLiteral:
		f.formatDurationLiteral(n)
	case *DateTimeLiteral:
		f.formatDateTimeLiteral(n)
	case *FunctionExpression:
		f.formatFunctionExpression(n)
	case *Property:
		f.formatProperty(n)
	default:
		// If we were able not to find the type, than this switch is wrong
		panic(fmt.Errorf("unknown type %q", n.Type()))
	}

	// reset indentation
	f.setIndent(currInd)
}
