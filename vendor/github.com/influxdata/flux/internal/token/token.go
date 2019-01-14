package token

type Token int

const (
	ILLEGAL Token = iota
	EOF
	COMMENT

	// Reserved keywords.
	AND
	OR
	NOT
	EMPTY
	IN
	IMPORT
	PACKAGE
	RETURN

	// Identifiers and literals.
	IDENT
	INT
	FLOAT
	STRING
	REGEX
	TIME
	DURATION

	// Operators.
	ADD
	SUB
	MUL
	DIV
	MOD
	EQ
	LT
	GT
	LTE
	GTE
	NEQ
	REGEXEQ
	REGEXNEQ
	ASSIGN
	ARROW
	LPAREN
	RPAREN
	LBRACK
	RBRACK
	LBRACE
	RBRACE
	COMMA
	DOT
	COLON
	PIPE_FORWARD
	PIPE_RECEIVE
)

func (t Token) String() string {
	if t < 0 || int(t) >= len(tokenStrings) {
		return "UNKNOWN"
	}
	return tokenStrings[int(t)]
}

var tokenStrings = []string{
	"ILLEGAL",
	"EOF",
	"COMMENT",
	"AND",
	"OR",
	"NOT",
	"EMPTY",
	"IN",
	"IMPORT",
	"PACKAGE",
	"RETURN",
	"IDENT",
	"INT",
	"FLOAT",
	"STRING",
	"REGEX",
	"TIME",
	"DURATION",
	"ADD",
	"SUB",
	"MUL",
	"DIV",
	"MOD",
	"EQ",
	"LT",
	"GT",
	"LTE",
	"GTE",
	"NEQ",
	"REGEXEQ",
	"REGEXNEQ",
	"ASSIGN",
	"ARROW",
	"LPAREN",
	"RPAREN",
	"LBRACK",
	"RBRACK",
	"LBRACE",
	"RBRACE",
	"COMMA",
	"DOT",
	"COLON",
	"PIPE_FORWARD",
	"PIPE_RECEIVE",
}

type Pos int
