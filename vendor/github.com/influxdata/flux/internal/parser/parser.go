package parser

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"

	"github.com/influxdata/flux/ast"
	"github.com/influxdata/flux/internal/scanner"
	"github.com/influxdata/flux/internal/token"
)

// Scanner defines the interface for reading a stream of tokens.
type Scanner interface {
	// Scan will scan the next token.
	Scan() (pos token.Pos, tok token.Token, lit string)

	// ScanWithRegex will scan the next token and include any regex literals.
	ScanWithRegex() (pos token.Pos, tok token.Token, lit string)

	// File returns the file being processed by the Scanner.
	File() *token.File

	// Unread will unread back to the previous location within the Scanner.
	// This can only be called once so the maximum lookahead is one.
	Unread()
}

// NewAST parses Flux query and produces an ast.Program.
func NewAST(src []byte) *ast.Program {
	f := token.NewFile("", len(src))
	p := &parser{
		s: &scannerSkipComments{
			Scanner: scanner.New(f, src),
		},
		src: src,
	}
	return p.parseProgram()
}

// scannerSkipComments is a temporary Scanner used for stripping comments
// from the input stream. We want to attach comments to nodes within the
// AST, but first we want to have feature parity with the old parser so
// the easiest method is just to strip comments at the moment.
type scannerSkipComments struct {
	Scanner
}

func (s *scannerSkipComments) Scan() (pos token.Pos, tok token.Token, lit string) {
	for {
		pos, tok, lit = s.Scanner.Scan()
		if tok != token.COMMENT {
			return pos, tok, lit
		}
	}
}

func (s *scannerSkipComments) ScanWithRegex() (pos token.Pos, tok token.Token, lit string) {
	for {
		pos, tok, lit = s.Scanner.ScanWithRegex()
		if tok != token.COMMENT {
			return pos, tok, lit
		}
	}
}

type parser struct {
	s        Scanner
	src      []byte
	pos      token.Pos
	tok      token.Token
	lit      string
	buffered bool
}

func (p *parser) parseProgram() *ast.Program {
	pos, _, _ := p.peek()
	program := &ast.Program{
		BaseNode: ast.BaseNode{
			Loc: &ast.SourceLocation{
				Start: p.s.File().Position(pos),
			},
		},
	}
	program.Package = p.parsePackageClause()
	if program.Package != nil {
		program.Loc.End = locEnd(program.Package)
	}
	program.Imports = p.parseImportList()
	if len(program.Imports) > 0 {
		program.Loc.End = locEnd(program.Imports[len(program.Imports)-1])
	}
	program.Body = p.parseStatementList(token.EOF)
	if len(program.Body) > 0 {
		program.Loc.End = locEnd(program.Body[len(program.Body)-1])
	}
	program.Loc = p.sourceLocation(program.Loc.Start, program.Loc.End)
	return program
}

func (p *parser) parsePackageClause() *ast.PackageClause {
	pos, tok, _ := p.peek()
	if tok == token.PACKAGE {
		p.consume()
		ident := p.parseIdentifier()
		return &ast.PackageClause{
			BaseNode: ast.BaseNode{
				Loc: p.sourceLocation(
					p.s.File().Position(pos),
					locEnd(ident),
				),
			},
			Name: ident,
		}
	}
	return nil
}

func (p *parser) parseImportList() (imports []*ast.ImportDeclaration) {
	for {
		if _, tok, _ := p.peek(); tok != token.IMPORT {
			return
		}
		imports = append(imports, p.parseImportDeclaration())
	}
}
func (p *parser) parseImportDeclaration() *ast.ImportDeclaration {
	start, _ := p.expect(token.IMPORT)
	var as *ast.Identifier
	if _, tok, _ := p.peek(); tok == token.IDENT {
		as = p.parseIdentifier()
	}
	path := p.parseStringLiteral()
	return &ast.ImportDeclaration{
		BaseNode: ast.BaseNode{
			Loc: p.sourceLocation(
				p.s.File().Position(start),
				locEnd(path),
			),
		},
		As:   as,
		Path: path,
	}
}

func (p *parser) parseStatementList(eof token.Token) []ast.Statement {
	var stmts []ast.Statement
	for {
		if _, tok, _ := p.peek(); tok == eof || tok == token.EOF {
			return stmts
		}
		stmts = append(stmts, p.parseStatement())
	}
}

func (p *parser) parseStatement() ast.Statement {
	switch _, tok, lit := p.peek(); tok {
	case token.IDENT:
		if lit == "option" {
			return p.parseOptionStatement()
		}
		return p.parseIdentStatement()
	case token.RETURN:
		return p.parseReturnStatement()
	case token.INT, token.FLOAT, token.STRING, token.DIV,
		token.TIME, token.DURATION, token.PIPE_RECEIVE,
		token.LPAREN, token.LBRACK, token.LBRACE,
		token.ADD, token.SUB, token.NOT:
		return p.parseExpressionStatement()
	default:
		// todo(jsternberg): error handling.
		p.consume()
		return nil
	}
}

func (p *parser) parseOptionStatement() ast.Statement {
	pos, _ := p.expect(token.IDENT)
	return p.parseOptionStatementSuffix(pos)
}

func (p *parser) parseOptionStatementSuffix(pos token.Pos) ast.Statement {
	switch _, tok, _ := p.peek(); tok {
	case token.IDENT:
		decl := p.parseVariableAssignment()
		return &ast.OptionStatement{
			Assignment: decl,
			BaseNode: ast.BaseNode{
				Loc: p.sourceLocation(
					p.s.File().Position(pos),
					locEnd(decl),
				),
			},
		}
	case token.ASSIGN:
		expr := p.parseAssignStatement()
		return &ast.VariableAssignment{
			BaseNode: ast.BaseNode{
				Loc: p.sourceLocation(
					p.s.File().Position(pos),
					locEnd(expr),
				),
			},
			ID: &ast.Identifier{
				Name:     "option",
				BaseNode: p.posRange(pos, 6),
			},
			Init: expr,
		}
	default:
		ident := &ast.Identifier{
			Name:     "option",
			BaseNode: p.posRange(pos, 6),
		}
		expr := p.parseExpressionSuffix(ident)
		loc := expr.Location()
		return &ast.ExpressionStatement{
			Expression: expr,
			BaseNode: ast.BaseNode{
				Loc: &loc,
			},
		}
	}
}

func (p *parser) parseVariableAssignment() *ast.VariableAssignment {
	id := p.parseIdentifier()
	expr := p.parseAssignStatement()
	return &ast.VariableAssignment{
		ID:   id,
		Init: expr,
		BaseNode: ast.BaseNode{
			Loc: p.sourceLocation(locStart(id), locEnd(expr)),
		},
	}
}

func (p *parser) parseIdentStatement() ast.Statement {
	id := p.parseIdentifier()
	switch _, tok, _ := p.peek(); tok {
	case token.ASSIGN:
		expr := p.parseAssignStatement()
		return &ast.VariableAssignment{
			BaseNode: ast.BaseNode{
				Loc: p.sourceLocation(locStart(id), locEnd(expr)),
			},
			ID:   id,
			Init: expr,
		}
	default:
		expr := p.parseExpressionSuffix(id)
		loc := expr.Location()
		return &ast.ExpressionStatement{
			Expression: expr,
			BaseNode: ast.BaseNode{
				Loc: &loc,
			},
		}
	}
}

func (p *parser) parseAssignStatement() ast.Expression {
	p.expect(token.ASSIGN)
	return p.parseExpression()
}

func (p *parser) parseReturnStatement() *ast.ReturnStatement {
	pos, _ := p.expect(token.RETURN)
	expr := p.parseExpression()
	return &ast.ReturnStatement{
		Argument: expr,
		BaseNode: ast.BaseNode{
			Loc: p.sourceLocation(
				p.s.File().Position(pos),
				locEnd(expr),
			),
		},
	}
}

func (p *parser) parseExpressionStatement() *ast.ExpressionStatement {
	expr := p.parseExpression()
	loc := expr.Location()
	return &ast.ExpressionStatement{
		Expression: expr,
		BaseNode: ast.BaseNode{
			Loc: &loc,
		},
	}
}

func (p *parser) parseBlock() *ast.Block {
	start, _ := p.expect(token.LBRACE)
	stmts := p.parseStatementList(token.RBRACE)
	end, rbrace := p.expect(token.RBRACE)
	return &ast.Block{
		Body:     stmts,
		BaseNode: p.position(start, end+token.Pos(len(rbrace))),
	}
}

func (p *parser) parseExpression() ast.Expression {
	return p.parseLogicalExpression()
}

func (p *parser) parseExpressionSuffix(expr ast.Expression) ast.Expression {
	p.repeat(p.parsePostfixOperatorSuffix(&expr))
	p.repeat(p.parsePipeExpressionSuffix(&expr))
	p.repeat(p.parseAdditiveExpressionSuffix(&expr))
	p.repeat(p.parseMultiplicativeExpressionSuffix(&expr))
	p.repeat(p.parseComparisonExpressionSuffix(&expr))
	p.repeat(p.parseLogicalExpressionSuffix(&expr))
	return expr
}

func (p *parser) parseExpressionList() []ast.Expression {
	var exprs []ast.Expression
	for {
		switch _, tok, _ := p.peek(); tok {
		case token.IDENT, token.INT, token.FLOAT, token.STRING, token.DIV,
			token.TIME, token.DURATION, token.PIPE_RECEIVE,
			token.LPAREN, token.LBRACK, token.LBRACE,
			token.ADD, token.SUB, token.NOT:
			exprs = append(exprs, p.parseExpression())
		default:
			return exprs
		}

		if _, tok, _ := p.peek(); tok != token.COMMA {
			return exprs
		}
		p.consume()
	}
}

func (p *parser) parseLogicalExpression() ast.Expression {
	expr := p.parseUnaryLogicalExpression()
	p.repeat(p.parseLogicalExpressionSuffix(&expr))
	return expr
}

func (p *parser) parseLogicalExpressionSuffix(expr *ast.Expression) func() bool {
	return func() bool {
		op, ok := p.parseLogicalOperator()
		if !ok {
			return false
		}
		rhs := p.parseUnaryLogicalExpression()
		*expr = &ast.LogicalExpression{
			Operator: op,
			Left:     *expr,
			Right:    rhs,
			BaseNode: ast.BaseNode{
				Loc: p.sourceLocation(locStart(*expr), locEnd(rhs)),
			},
		}
		return true
	}
}

func (p *parser) parseLogicalOperator() (ast.LogicalOperatorKind, bool) {
	switch _, tok, _ := p.peek(); tok {
	case token.AND:
		p.consume()
		return ast.AndOperator, true
	case token.OR:
		p.consume()
		return ast.OrOperator, true
	default:
		return 0, false
	}
}

func (p *parser) parseUnaryLogicalExpression() ast.Expression {
	pos, op, ok := p.parseUnaryLogicalOperator()
	if ok {
		expr := p.parseUnaryLogicalExpression()
		return &ast.UnaryExpression{
			Operator: op,
			Argument: expr,
			BaseNode: ast.BaseNode{
				Loc: p.sourceLocation(
					p.s.File().Position(pos),
					locEnd(expr),
				),
			},
		}
	}
	return p.parseComparisonExpression()
}

func (p *parser) parseUnaryLogicalOperator() (token.Pos, ast.OperatorKind, bool) {
	switch pos, tok, _ := p.peek(); tok {
	case token.NOT:
		p.consume()
		return pos, ast.NotOperator, true
	default:
		return 0, 0, false
	}
}

func (p *parser) parseComparisonExpression() ast.Expression {
	expr := p.parseMultiplicativeExpression()
	p.repeat(p.parseComparisonExpressionSuffix(&expr))
	return expr
}

func (p *parser) parseComparisonExpressionSuffix(expr *ast.Expression) func() bool {
	return func() bool {
		op, ok := p.parseComparisonOperator()
		if !ok {
			return false
		}
		rhs := p.parseMultiplicativeExpression()
		*expr = &ast.BinaryExpression{
			Operator: op,
			Left:     *expr,
			Right:    rhs,
			BaseNode: ast.BaseNode{
				Loc: p.sourceLocation(locStart(*expr), locEnd(rhs)),
			},
		}
		return true
	}
}

func (p *parser) parseComparisonOperator() (ast.OperatorKind, bool) {
	switch _, tok, _ := p.peek(); tok {
	case token.EQ:
		p.consume()
		return ast.EqualOperator, true
	case token.NEQ:
		p.consume()
		return ast.NotEqualOperator, true
	case token.LTE:
		p.consume()
		return ast.LessThanEqualOperator, true
	case token.LT:
		p.consume()
		return ast.LessThanOperator, true
	case token.GTE:
		p.consume()
		return ast.GreaterThanEqualOperator, true
	case token.GT:
		p.consume()
		return ast.GreaterThanOperator, true
	case token.REGEXEQ:
		p.consume()
		return ast.RegexpMatchOperator, true
	case token.REGEXNEQ:
		p.consume()
		return ast.NotRegexpMatchOperator, true
	default:
		return 0, false
	}
}

func (p *parser) parseMultiplicativeExpression() ast.Expression {
	expr := p.parseAdditiveExpression()
	p.repeat(p.parseMultiplicativeExpressionSuffix(&expr))
	return expr
}

func (p *parser) parseMultiplicativeExpressionSuffix(expr *ast.Expression) func() bool {
	return func() bool {
		op, ok := p.parseMultiplicativeOperator()
		if !ok {
			return false
		}
		rhs := p.parseAdditiveExpression()
		*expr = &ast.BinaryExpression{
			Operator: op,
			Left:     *expr,
			Right:    rhs,
			BaseNode: ast.BaseNode{
				Loc: p.sourceLocation(locStart(*expr), locEnd(rhs)),
			},
		}
		return true
	}
}

func (p *parser) parseMultiplicativeOperator() (ast.OperatorKind, bool) {
	switch _, tok, _ := p.peek(); tok {
	case token.MUL:
		p.consume()
		return ast.MultiplicationOperator, true
	case token.DIV:
		p.consume()
		return ast.DivisionOperator, true
	default:
		return 0, false
	}
}

func (p *parser) parseAdditiveExpression() ast.Expression {
	expr := p.parsePipeExpression()
	p.repeat(p.parseAdditiveExpressionSuffix(&expr))
	return expr
}

func (p *parser) parseAdditiveExpressionSuffix(expr *ast.Expression) func() bool {
	return func() bool {
		op, ok := p.parseAdditiveOperator()
		if !ok {
			return false
		}
		rhs := p.parsePipeExpression()
		*expr = &ast.BinaryExpression{
			Operator: op,
			Left:     *expr,
			Right:    rhs,
			BaseNode: ast.BaseNode{
				Loc: p.sourceLocation(locStart(*expr), locEnd(rhs)),
			},
		}
		return true
	}
}

func (p *parser) parseAdditiveOperator() (ast.OperatorKind, bool) {
	switch _, tok, _ := p.peek(); tok {
	case token.ADD:
		p.consume()
		return ast.AdditionOperator, true
	case token.SUB:
		p.consume()
		return ast.SubtractionOperator, true
	default:
		return 0, false
	}
}

func (p *parser) parsePipeExpression() ast.Expression {
	expr := p.parseUnaryExpression()
	p.repeat(p.parsePipeExpressionSuffix(&expr))
	return expr
}

func (p *parser) parsePipeExpressionSuffix(expr *ast.Expression) func() bool {
	return func() bool {
		if ok := p.parsePipeOperator(); !ok {
			return false
		}
		// todo(jsternberg): this is not correct.
		rhs := p.parseUnaryExpression()
		call, _ := rhs.(*ast.CallExpression)
		*expr = &ast.PipeExpression{
			Argument: *expr,
			Call:     call,
			BaseNode: ast.BaseNode{
				Loc: p.sourceLocation(locStart(*expr), locEnd(rhs)),
			},
		}
		return true
	}
}

func (p *parser) parsePipeOperator() bool {
	if _, tok, _ := p.peek(); tok == token.PIPE_FORWARD {
		p.consume()
		return true
	}
	return false
}

func (p *parser) parseUnaryExpression() ast.Expression {
	pos, op, ok := p.parsePrefixOperator()
	if ok {
		expr := p.parseUnaryExpression()
		return &ast.UnaryExpression{
			Operator: op,
			Argument: expr,
			BaseNode: ast.BaseNode{
				Loc: p.sourceLocation(
					p.s.File().Position(pos),
					locEnd(expr),
				),
			},
		}
	}
	return p.parsePostfixExpression()
}

func (p *parser) parsePrefixOperator() (token.Pos, ast.OperatorKind, bool) {
	switch pos, tok, _ := p.peek(); tok {
	case token.ADD:
		p.consume()
		return pos, ast.AdditionOperator, true
	case token.SUB:
		p.consume()
		return pos, ast.SubtractionOperator, true
	default:
		return 0, 0, false
	}
}

func (p *parser) parsePostfixExpression() ast.Expression {
	expr := p.parsePrimaryExpression()
	for {
		if ok := p.parsePostfixOperator(&expr); !ok {
			return expr
		}
	}
}

func (p *parser) parsePostfixOperatorSuffix(expr *ast.Expression) func() bool {
	return func() bool {
		return p.parsePostfixOperator(expr)
	}
}

func (p *parser) parsePostfixOperator(expr *ast.Expression) bool {
	switch _, tok, _ := p.peek(); tok {
	case token.DOT:
		*expr = p.parseDotExpression(*expr)
		return true
	case token.LPAREN:
		*expr = p.parseCallExpression(*expr)
		return true
	case token.LBRACK:
		*expr = p.parseIndexExpression(*expr)
		return true
	}
	return false
}

func (p *parser) parseDotExpression(expr ast.Expression) ast.Expression {
	p.expect(token.DOT)
	ident := p.parseIdentifier()
	return &ast.MemberExpression{
		Object:   expr,
		Property: ident,
		BaseNode: ast.BaseNode{
			Loc: p.sourceLocation(locStart(expr), locEnd(ident)),
		},
	}
}

func (p *parser) parseCallExpression(callee ast.Expression) ast.Expression {
	p.expect(token.LPAREN)
	params := p.parsePropertyList()
	end, rparen := p.expect(token.RPAREN)
	expr := &ast.CallExpression{
		Callee: callee,
		BaseNode: ast.BaseNode{
			Loc: p.sourceLocation(
				locStart(callee),
				p.s.File().Position(end+token.Pos(len(rparen))),
			),
		},
	}
	if len(params) > 0 {
		expr.Arguments = []ast.Expression{
			&ast.ObjectExpression{
				Properties: params,
				BaseNode: ast.BaseNode{
					Loc: p.sourceLocation(
						locStart(params[0]),
						locEnd(params[len(params)-1]),
					),
				},
			},
		}
	}
	return expr
}

func (p *parser) parseIndexExpression(callee ast.Expression) ast.Expression {
	p.expect(token.LBRACK)
	expr := p.parseExpression()
	end, rbrack := p.expect(token.RBRACK)
	if lit, ok := expr.(*ast.StringLiteral); ok {
		return &ast.MemberExpression{
			Object:   callee,
			Property: lit,
			BaseNode: ast.BaseNode{
				Loc: p.sourceLocation(
					locStart(callee),
					p.s.File().Position(end+token.Pos(len(rbrack))),
				),
			},
		}
	}
	return &ast.IndexExpression{
		Array: callee,
		Index: expr,
		BaseNode: ast.BaseNode{
			Loc: p.sourceLocation(
				locStart(callee),
				p.s.File().Position(end+token.Pos(len(rbrack))),
			),
		},
	}
}

func (p *parser) parsePrimaryExpression() ast.Expression {
	switch _, tok, _ := p.peekWithRegex(); tok {
	case token.IDENT:
		return p.parseIdentifier()
	case token.INT:
		return p.parseIntLiteral()
	case token.FLOAT:
		return p.parseFloatLiteral()
	case token.STRING:
		return p.parseStringLiteral()
	case token.REGEX:
		return p.parseRegexpLiteral()
	case token.TIME:
		return p.parseTimeLiteral()
	case token.DURATION:
		return p.parseDurationLiteral()
	case token.PIPE_RECEIVE:
		return p.parsePipeLiteral()
	case token.LBRACK:
		return p.parseArrayLiteral()
	case token.LBRACE:
		return p.parseObjectLiteral()
	case token.LPAREN:
		return p.parseParenExpression()
	default:
		return nil
	}
}

func (p *parser) parseIdentifier() *ast.Identifier {
	pos, lit := p.expect(token.IDENT)
	return &ast.Identifier{
		Name:     lit,
		BaseNode: p.posRange(pos, len(lit)),
	}
}

func (p *parser) parseIntLiteral() *ast.IntegerLiteral {
	pos, lit := p.expect(token.INT)
	// todo(jsternberg): handle errors.
	value, _ := strconv.ParseInt(lit, 10, 64)
	return &ast.IntegerLiteral{
		Value:    value,
		BaseNode: p.posRange(pos, len(lit)),
	}
}

func (p *parser) parseFloatLiteral() *ast.FloatLiteral {
	pos, lit := p.expect(token.FLOAT)
	// todo(jsternberg): handle errors.
	value, _ := strconv.ParseFloat(lit, 64)
	return &ast.FloatLiteral{
		Value:    value,
		BaseNode: p.posRange(pos, len(lit)),
	}
}

func (p *parser) parseStringLiteral() *ast.StringLiteral {
	pos, lit := p.expect(token.STRING)
	value, _ := parseString(lit)
	return &ast.StringLiteral{
		Value:    value,
		BaseNode: p.posRange(pos, len(lit)),
	}
}

func (p *parser) parseRegexpLiteral() *ast.RegexpLiteral {
	pos, lit := p.expect(token.REGEX)
	// todo(jsternberg): handle errors.
	value, _ := parseRegexp(lit)
	return &ast.RegexpLiteral{
		Value:    value,
		BaseNode: p.posRange(pos, len(lit)),
	}
}

func (p *parser) parseTimeLiteral() *ast.DateTimeLiteral {
	pos, lit := p.expect(token.TIME)
	value, _ := parseTime(lit)
	return &ast.DateTimeLiteral{
		Value:    value,
		BaseNode: p.posRange(pos, len(lit)),
	}
}

func (p *parser) parseDurationLiteral() *ast.DurationLiteral {
	pos, lit := p.expect(token.DURATION)
	// todo(jsternberg): handle errors.
	values, _ := parseDuration(lit)
	return &ast.DurationLiteral{
		Values:   values,
		BaseNode: p.posRange(pos, len(lit)),
	}
}

func (p *parser) parsePipeLiteral() *ast.PipeLiteral {
	pos, lit := p.expect(token.PIPE_RECEIVE)
	return &ast.PipeLiteral{
		BaseNode: p.posRange(pos, len(lit)),
	}
}

func (p *parser) parseArrayLiteral() ast.Expression {
	start, _ := p.expect(token.LBRACK)
	exprs := p.parseExpressionList()
	end, rbrack := p.expect(token.RBRACK)
	return &ast.ArrayExpression{
		Elements: exprs,
		BaseNode: p.position(start, end+token.Pos(len(rbrack))),
	}
}

func (p *parser) parseObjectLiteral() ast.Expression {
	start, _ := p.expect(token.LBRACE)
	properties := p.parsePropertyList()
	end, rbrace := p.expect(token.RBRACE)
	return &ast.ObjectExpression{
		Properties: properties,
		BaseNode:   p.position(start, end+token.Pos(len(rbrace))),
	}
}

func (p *parser) parseParenExpression() ast.Expression {
	pos, _ := p.expect(token.LPAREN)
	return p.parseParenBodyExpression(pos)
}

func (p *parser) parseParenBodyExpression(lparen token.Pos) ast.Expression {
	switch _, tok, _ := p.peek(); tok {
	case token.RPAREN:
		p.consume()
		return p.parseFunctionExpression(lparen, nil)
	case token.IDENT:
		ident := p.parseIdentifier()
		return p.parseParenIdentExpression(lparen, ident)
	default:
		expr := p.parseExpression()
		p.expect(token.RPAREN)
		return expr
	}
}

func (p *parser) parseParenIdentExpression(lparen token.Pos, key *ast.Identifier) ast.Expression {
	switch _, tok, _ := p.peek(); tok {
	case token.RPAREN:
		p.consume()
		if _, tok, _ := p.peek(); tok == token.ARROW {
			loc := key.Location()
			return p.parseFunctionExpression(lparen, []*ast.Property{{
				Key: key,
				BaseNode: ast.BaseNode{
					Loc: &loc,
				},
			}})
		}
		return key
	case token.ASSIGN:
		p.consume()
		value := p.parseExpression()
		params := []*ast.Property{{
			Key:   key,
			Value: value,
			BaseNode: ast.BaseNode{
				Loc: p.sourceLocation(locStart(key), locEnd(value)),
			},
		}}
		if _, tok, _ := p.peek(); tok == token.COMMA {
			p.consume()
			params = append(params, p.parseParameterList()...)
		}
		p.expect(token.RPAREN)
		return p.parseFunctionExpression(lparen, params)
	case token.COMMA:
		p.consume()
		loc := key.Location()
		params := []*ast.Property{{
			Key: key,
			BaseNode: ast.BaseNode{
				Loc: &loc,
			},
		}}
		params = append(params, p.parseParameterList()...)
		p.expect(token.RPAREN)
		return p.parseFunctionExpression(lparen, params)
	default:
		expr := p.parseExpressionSuffix(key)
		p.expect(token.RPAREN)
		return expr
	}
}

func (p *parser) parsePropertyList() []*ast.Property {
	var params []*ast.Property
	for {
		var param *ast.Property
		_, tok, _ := p.peek()
		switch tok {
		case token.IDENT:
			param = p.parseIdentProperty()
		case token.STRING:
			param = p.parseStringProperty()
		default:
			return params
		}
		params = append(params, param)
		if _, tok, _ := p.peek(); tok != token.COMMA {
			return params
		}
		p.consume()
	}
}

func (p *parser) parseStringProperty() *ast.Property {
	key := p.parseStringLiteral()
	p.expect(token.COLON)
	val := p.parseExpression()
	return &ast.Property{
		Key:   key,
		Value: val,
		BaseNode: ast.BaseNode{
			Loc: p.sourceLocation(
				locStart(key),
				locEnd(val),
			),
		},
	}
}

func (p *parser) parseIdentProperty() *ast.Property {
	key := p.parseIdentifier()
	loc := key.Location()
	property := &ast.Property{
		Key: key,
		BaseNode: ast.BaseNode{
			Loc: &loc,
		},
	}
	if _, tok, _ := p.peek(); tok == token.COLON {
		p.consume()
		property.Value = p.parseExpression()
		property.Loc = p.sourceLocation(
			locStart(key),
			locEnd(property.Value),
		)
	}
	return property
}

func (p *parser) parseParameterList() []*ast.Property {
	var params []*ast.Property
	for {
		if _, tok, _ := p.peek(); tok != token.IDENT {
			return params
		}
		param := p.parseParameter()
		params = append(params, param)
		if _, tok, _ := p.peek(); tok != token.COMMA {
			return params
		}
		p.consume()
	}
}

func (p *parser) parseParameter() *ast.Property {
	key := p.parseIdentifier()
	loc := key.Location()
	param := &ast.Property{
		Key: key,
		BaseNode: ast.BaseNode{
			Loc: &loc,
		},
	}
	if _, tok, _ := p.peek(); tok == token.ASSIGN {
		p.consume()
		param.Value = p.parseExpression()
		param.Loc = p.sourceLocation(
			locStart(key),
			locEnd(param.Value),
		)
	}
	return param
}

func (p *parser) parseFunctionExpression(lparen token.Pos, params []*ast.Property) ast.Expression {
	p.expect(token.ARROW)
	return p.parseFunctionBodyExpression(lparen, params)
}

func (p *parser) parseFunctionBodyExpression(lparen token.Pos, params []*ast.Property) ast.Expression {
	_, tok, _ := p.peek()
	fn := &ast.FunctionExpression{
		Params: params,
		Body: func() ast.Node {
			switch tok {
			case token.LBRACE:
				return p.parseBlock()
			default:
				return p.parseExpression()
			}
		}(),
	}
	fn.Loc = p.sourceLocation(
		p.s.File().Position(lparen),
		locEnd(fn.Body),
	)
	return fn
}

// scan will read the next token from the Scanner. If peek has been used,
// this will return the peeked token and consume it.
func (p *parser) scan() (token.Pos, token.Token, string) {
	if p.buffered {
		p.buffered = false
		return p.pos, p.tok, p.lit
	}
	pos, tok, lit := p.s.Scan()
	return pos, tok, lit
}

// peek will read the next token from the Scanner and then buffer it.
// It will return information about the token.
func (p *parser) peek() (token.Pos, token.Token, string) {
	if !p.buffered {
		p.pos, p.tok, p.lit = p.s.Scan()
		p.buffered = true
	}
	return p.pos, p.tok, p.lit
}

// peekWithRegex is the same as peek, except that the scan step will allow scanning regexp tokens.
func (p *parser) peekWithRegex() (token.Pos, token.Token, string) {
	if p.buffered {
		if p.tok != token.DIV {
			return p.pos, p.tok, p.lit
		}
		p.s.Unread()
	}
	p.pos, p.tok, p.lit = p.s.ScanWithRegex()
	p.buffered = true
	return p.pos, p.tok, p.lit
}

// consume will consume a token that has been retrieve using peek.
// This will panic if a token has not been buffered with peek.
func (p *parser) consume() {
	if !p.buffered {
		panic("called consume on an unbuffered input")
	}
	p.buffered = false
}

// expect will continuously scan the input until it reads the requested
// token. If a token has been buffered by peek, then the token type
// must match expect or it will panic. This is to catch errors in the
// parser since the peek/expect combination should never result in
// an invalid token.
// todo(jsternberg): Find a way to let this method handle errors.
// There are also parts of the code that use expect to get the tail
// of an expression. These locations should pass the expected token
// to the non-terminal so the non-terminal knows the token that is
// being expected, but they don't use that yet.
func (p *parser) expect(exp token.Token) (token.Pos, string) {
	if p.buffered {
		p.buffered = false
		if p.tok == exp || p.tok == token.EOF {
			return p.pos, p.lit
		}
	}

	for {
		pos, tok, lit := p.scan()
		if tok == token.EOF || tok == exp {
			return pos, lit
		}
	}
}

// repeat will repeatedly call the function until it returns false.
func (p *parser) repeat(fn func() bool) {
	for {
		if ok := fn(); !ok {
			return
		}
	}
}

// position will return a BaseNode with the position information
// filled based on the start and end position.
func (p *parser) position(start, end token.Pos) ast.BaseNode {
	soffset := int(start) - p.s.File().Base()
	eoffset := int(end) - p.s.File().Base()
	return ast.BaseNode{
		Loc: &ast.SourceLocation{
			Start:  p.s.File().Position(start),
			End:    p.s.File().Position(end),
			Source: string(p.src[soffset:eoffset]),
		},
	}
}

// posRange will posRange the position cursor to the end of the given
// literal.
func (p *parser) posRange(start token.Pos, sz int) ast.BaseNode {
	return p.position(start, start+token.Pos(sz))
}

// sourceLocation constructs an ast.SourceLocation from two
// ast.Position values.
func (p *parser) sourceLocation(start, end ast.Position) *ast.SourceLocation {
	soffset := p.s.File().Offset(start)
	if soffset == -1 {
		return nil
	}
	eoffset := p.s.File().Offset(end)
	if eoffset == -1 {
		return nil
	}
	return &ast.SourceLocation{
		Start:  start,
		End:    end,
		Source: string(p.src[soffset:eoffset]),
	}
}

func parseTime(lit string) (time.Time, error) {
	if !strings.Contains(lit, "T") {
		// This is a date.
		return time.Parse("2006-01-02", lit)
	}
	// todo(jsternberg): need to also parse when there is no time offset.
	return time.Parse(time.RFC3339Nano, lit)
}

func parseDuration(lit string) ([]ast.Duration, error) {
	var values []ast.Duration
	for len(lit) > 0 {
		n := 0
		for n < len(lit) {
			ch, size := utf8.DecodeRuneInString(lit[n:])
			if size == 0 {
				panic("invalid rune in duration")
			}

			if !unicode.IsDigit(ch) {
				break
			}
			n += size
		}

		magnitude, err := strconv.ParseInt(lit[:n], 10, 64)
		if err != nil {
			return nil, err
		}
		lit = lit[n:]

		n = 0
		for n < len(lit) {
			ch, size := utf8.DecodeRuneInString(lit[n:])
			if size == 0 {
				panic("invalid rune in duration")
			}

			if !unicode.IsLetter(ch) {
				break
			}
			n += size
		}
		unit := lit[:n]
		if unit == "µs" {
			unit = "us"
		}
		values = append(values, ast.Duration{
			Magnitude: magnitude,
			Unit:      unit,
		})
		lit = lit[n:]
	}
	return values, nil
}

// parseString removes quotes and unescapes the string literal.
func parseString(lit string) (string, error) {
	if len(lit) < 2 || lit[0] != '"' || lit[len(lit)-1] != '"' {
		return "", fmt.Errorf("invalid syntax")
	}
	lit = lit[1 : len(lit)-1]
	var (
		builder    strings.Builder
		width, pos int
		err        error
	)
	builder.Grow(len(lit))
	for pos < len(lit) {
		width, err = writeNextUnescapedRune(lit[pos:], &builder)
		if err != nil {
			return "", err
		}
		pos += width
	}
	return builder.String(), nil
}

// writeNextUnescapedRune writes a rune to builder from s.
// The rune is the next decoded UTF-8 rune with escaping rules applied.
func writeNextUnescapedRune(s string, builder *strings.Builder) (width int, err error) {
	var r rune
	r, width = utf8.DecodeRuneInString(s)
	if r == '\\' {
		next, w := utf8.DecodeRuneInString(s[width:])
		width += w
		switch next {
		case 'n':
			r = '\n'
		case 'r':
			r = '\r'
		case 't':
			r = '\t'
		case '\\':
			r = '\\'
		case '"':
			r = '"'
		case 'x':
			// Decode two hex chars as a single byte
			if len(s[width:]) < 2 {
				return 0, fmt.Errorf("invalid byte value %q", s[width:])
			}
			ch1, ok1 := fromHexChar(s[width])
			ch2, ok2 := fromHexChar(s[width+1])
			if !ok1 || !ok2 {
				return 0, fmt.Errorf("invalid byte value %q", s[width:])
			}
			builder.WriteByte((ch1 << 4) | ch2)
			return width + 2, nil
		default:
			return 0, fmt.Errorf("invalid escape character %q", next)
		}
	}
	// sanity check before writing the rune
	if width > 0 {
		builder.WriteRune(r)
	}
	return
}

// fromHexChar converts a hex character into its value and a success flag.
func fromHexChar(c byte) (byte, bool) {
	switch {
	case '0' <= c && c <= '9':
		return c - '0', true
	case 'a' <= c && c <= 'f':
		return c - 'a' + 10, true
	case 'A' <= c && c <= 'F':
		return c - 'A' + 10, true
	}
	return 0, false
}

func parseRegexp(lit string) (*regexp.Regexp, error) {
	if len(lit) < 3 {
		return nil, fmt.Errorf("regexp must be at least 3 characters")
	}

	if lit[0] != '/' {
		return nil, fmt.Errorf("regexp literal must start with a slash")
	} else if lit[len(lit)-1] != '/' {
		return nil, fmt.Errorf("regexp literal must end with a slash")
	}

	expr := lit[1 : len(lit)-1]
	if index := strings.Index(expr, "\\/"); index != -1 {
		expr = strings.Replace(expr, "\\/", "/", -1)
	}
	return regexp.Compile(expr)
}

// locStart is a utility method for retrieving the start position
// from a node. This is needed only because error handling isn't present
// so it is possible for nil nodes to be present.
func locStart(node ast.Node) ast.Position {
	if node == nil {
		return ast.Position{}
	}
	return node.Location().Start
}

// locEnd is a utility method for retrieving the end position
// from a node. This is needed only because error handling isn't present
// so it is possible for nil nodes to be present.
func locEnd(node ast.Node) ast.Position {
	if node == nil {
		return ast.Position{}
	}
	return node.Location().End
}
