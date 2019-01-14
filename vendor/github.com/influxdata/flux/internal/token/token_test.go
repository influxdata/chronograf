package token_test

import (
	"testing"

	"github.com/influxdata/flux/internal/token"
)

func TestToken_String(t *testing.T) {
	tokenStrings := map[token.Token]string{
		token.ILLEGAL:      "ILLEGAL",
		token.EOF:          "EOF",
		token.COMMENT:      "COMMENT",
		token.AND:          "AND",
		token.OR:           "OR",
		token.NOT:          "NOT",
		token.EMPTY:        "EMPTY",
		token.IN:           "IN",
		token.IMPORT:       "IMPORT",
		token.PACKAGE:      "PACKAGE",
		token.RETURN:       "RETURN",
		token.IDENT:        "IDENT",
		token.INT:          "INT",
		token.FLOAT:        "FLOAT",
		token.STRING:       "STRING",
		token.REGEX:        "REGEX",
		token.TIME:         "TIME",
		token.DURATION:     "DURATION",
		token.ADD:          "ADD",
		token.SUB:          "SUB",
		token.MUL:          "MUL",
		token.DIV:          "DIV",
		token.MOD:          "MOD",
		token.EQ:           "EQ",
		token.LT:           "LT",
		token.GT:           "GT",
		token.LTE:          "LTE",
		token.GTE:          "GTE",
		token.NEQ:          "NEQ",
		token.REGEXEQ:      "REGEXEQ",
		token.REGEXNEQ:     "REGEXNEQ",
		token.ASSIGN:       "ASSIGN",
		token.ARROW:        "ARROW",
		token.LPAREN:       "LPAREN",
		token.RPAREN:       "RPAREN",
		token.LBRACK:       "LBRACK",
		token.RBRACK:       "RBRACK",
		token.LBRACE:       "LBRACE",
		token.RBRACE:       "RBRACE",
		token.COMMA:        "COMMA",
		token.DOT:          "DOT",
		token.COLON:        "COLON",
		token.PIPE_FORWARD: "PIPE_FORWARD",
		token.PIPE_RECEIVE: "PIPE_RECEIVE",
	}
	for tok, s := range tokenStrings {
		if got, want := tok.String(), s; got != want {
			t.Errorf("unexpected token string got %q want %q", got, want)
		}
	}
}
