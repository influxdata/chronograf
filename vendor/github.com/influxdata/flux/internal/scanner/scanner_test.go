package scanner_test

import (
	"fmt"
	"testing"

	"github.com/google/go-cmp/cmp"

	"github.com/influxdata/flux/internal/scanner"
	"github.com/influxdata/flux/internal/token"
)

type TokenPattern struct {
	s   string
	tok token.Token
	lit string
}

// common lists the patterns common for both scanning functions.
var common = []TokenPattern{
	{s: `// anything goes here
`, tok: token.COMMENT, lit: `// anything goes here
`},
	{s: `// a comment at the end of the file with no newline is fine`, tok: token.COMMENT, lit: `// a comment at the end of the file with no newline is fine`},
	{s: "0", tok: token.INT, lit: "0"},
	{s: "42", tok: token.INT, lit: "42"},
	{s: "317316873", tok: token.INT, lit: "317316873"},
	{s: "0.", tok: token.FLOAT, lit: "0."},
	{s: "72.40", tok: token.FLOAT, lit: "72.40"},
	{s: "072.40", tok: token.FLOAT, lit: "072.40"},
	{s: "2.71828", tok: token.FLOAT, lit: "2.71828"},
	{s: ".26", tok: token.FLOAT, lit: ".26"},
	{s: "1s", tok: token.DURATION, lit: "1s"},
	{s: "10d", tok: token.DURATION, lit: "10d"},
	{s: "1h15m", tok: token.DURATION, lit: "1h15m"},
	{s: "5w", tok: token.DURATION, lit: "5w"},
	{s: "1mo5d", tok: token.DURATION, lit: "1mo5d"},
	{s: "1952-01-25T12:35:51Z", tok: token.TIME, lit: "1952-01-25T12:35:51Z"},
	{s: "2018-08-15T13:36:23-07:00", tok: token.TIME, lit: "2018-08-15T13:36:23-07:00"},
	{s: "2009-10-15T09:00:00", tok: token.TIME, lit: "2009-10-15T09:00:00"},
	{s: "2018-01-01", tok: token.TIME, lit: "2018-01-01"},
	{s: `"abc"`, tok: token.STRING, lit: `"abc"`},
	{s: `"string with double \" quote"`, tok: token.STRING, lit: `"string with double \" quote"`},
	{s: `"string with backslash \\"`, tok: token.STRING, lit: `"string with backslash \\"`},
	{s: `"日本語"`, tok: token.STRING, lit: `"日本語"`},
	{s: `"\xe6\x97\xa5\xe6\x9c\xac\xe8\xaa\x9e"`, tok: token.STRING, lit: `"\xe6\x97\xa5\xe6\x9c\xac\xe8\xaa\x9e"`},
	{s: `a`, tok: token.IDENT, lit: `a`},
	{s: `_x`, tok: token.IDENT, lit: `_x`},
	{s: `longIdentifierName`, tok: token.IDENT, lit: `longIdentifierName`},
	{s: `αβ`, tok: token.IDENT, lit: `αβ`},
	{s: `and`, tok: token.AND, lit: `and`},
	{s: `or`, tok: token.OR, lit: `or`},
	{s: `not`, tok: token.NOT, lit: `not`},
	{s: `empty`, tok: token.EMPTY, lit: `empty`},
	{s: `in`, tok: token.IN, lit: `in`},
	{s: `import`, tok: token.IMPORT, lit: `import`},
	{s: `package`, tok: token.PACKAGE, lit: `package`},
	{s: `return`, tok: token.RETURN, lit: `return`},
	{s: `+`, tok: token.ADD, lit: `+`},
	{s: `-`, tok: token.SUB, lit: `-`},
	{s: `*`, tok: token.MUL, lit: `*`},
	// We skip div because the general parser can't tell the difference
	// between div and regex.
	{s: `%`, tok: token.MOD, lit: `%`},
	{s: `==`, tok: token.EQ, lit: `==`},
	{s: `<`, tok: token.LT, lit: `<`},
	{s: `>`, tok: token.GT, lit: `>`},
	{s: `<=`, tok: token.LTE, lit: `<=`},
	{s: `>=`, tok: token.GTE, lit: `>=`},
	{s: `!=`, tok: token.NEQ, lit: `!=`},
	{s: `=~`, tok: token.REGEXEQ, lit: `=~`},
	{s: `!~`, tok: token.REGEXNEQ, lit: `!~`},
	{s: `=`, tok: token.ASSIGN, lit: `=`},
	{s: `=>`, tok: token.ARROW, lit: `=>`},
	{s: `<-`, tok: token.PIPE_RECEIVE, lit: `<-`},
	{s: `(`, tok: token.LPAREN, lit: `(`},
	{s: `)`, tok: token.RPAREN, lit: `)`},
	{s: `[`, tok: token.LBRACK, lit: `[`},
	{s: `]`, tok: token.RBRACK, lit: `]`},
	{s: `{`, tok: token.LBRACE, lit: `{`},
	{s: `}`, tok: token.RBRACE, lit: `}`},
	{s: `,`, tok: token.COMMA, lit: `,`},
	{s: `.`, tok: token.DOT, lit: `.`},
	{s: `:`, tok: token.COLON, lit: `:`},
	{s: `|>`, tok: token.PIPE_FORWARD, lit: `|>`},
}

// regex contains the regex patterns for the normal scan method.
var regex = []TokenPattern{
	{s: `/.*/`, tok: token.REGEX, lit: `/.*/`},
	{s: `/http:\/\/localhost:9999/`, tok: token.REGEX, lit: `/http:\/\/localhost:9999/`},
	{s: `/^\xe6\x97\xa5\xe6\x9c\xac\xe8\xaa\x9e(ZZ)?$/`, tok: token.REGEX, lit: `/^\xe6\x97\xa5\xe6\x9c\xac\xe8\xaa\x9e(ZZ)?$/`},
	{s: `/^日本語(ZZ)?$/`, tok: token.REGEX, lit: `/^日本語(ZZ)?$/`},
	{s: `/\\xZZ/`, tok: token.REGEX, lit: `/\\xZZ/`},
	{s: `/a\/b\\c\d/`, tok: token.REGEX, lit: `/a\/b\\c\d/`},
	{s: `/(?:)/`, tok: token.REGEX, lit: `/(?:)/`},
}

// noRegex contains the patterns to test when excluding regexes.
var noRegex = []TokenPattern{
	{s: `/`, tok: token.DIV, lit: `/`},
}

func patterns(patterns ...[]TokenPattern) []TokenPattern {
	sz := 0
	for _, a := range patterns {
		sz += len(a)
	}

	combined := make([]TokenPattern, 0, sz)
	for _, a := range patterns {
		combined = append(combined, a...)
	}
	return combined
}

func TestScanner_Scan(t *testing.T) {
	for _, tt := range patterns(common, noRegex) {
		t.Run(tt.s, func(t *testing.T) {
			f := token.NewFile("query.flux", len(tt.s))
			s := scanner.New(f, []byte(tt.s))
			_, tok, lit := s.Scan()
			if want, got := tt.tok, tok; want != got {
				t.Errorf("unexpected token -want/+got\n\t- %d\n\t+ %d", want, got)
			}
			if want, got := tt.lit, lit; want != got {
				t.Errorf("unexpected literal -want/+got\n\t- %s\n\t+ %s", want, got)
			}

			// Expect an EOF token.
			if _, tok, _ := s.Scan(); tok != token.EOF {
				t.Errorf("expected eof token, got %d", tok)
			}
		})
	}
}

func TestScanner_ScanWithRegex(t *testing.T) {
	for _, tt := range patterns(common, regex) {
		t.Run(tt.s, func(t *testing.T) {
			f := token.NewFile("query.flux", len(tt.s))
			s := scanner.New(f, []byte(tt.s))
			_, tok, lit := s.ScanWithRegex()
			if want, got := tt.tok, tok; want != got {
				t.Errorf("unexpected token -want/+got\n\t- %d\n\t+ %d", want, got)
			}
			if want, got := tt.lit, lit; want != got {
				t.Errorf("unexpected literal -want/+got\n\t- %s\n\t+ %s", want, got)
			}

			// Expect an EOF token.
			if _, tok, _ := s.ScanWithRegex(); tok != token.EOF {
				t.Errorf("expected eof token, got %d", tok)
			}
		})
	}
}

func TestScanner_Unread(t *testing.T) {
	f := token.NewFile("query.flux", 9)
	s := scanner.New(f, []byte(`a /hello/`))
	_, tok, _ := s.ScanWithRegex()
	if want, got := token.IDENT, tok; want != got {
		t.Fatalf("unexpected first token: %d", tok)
	}

	// First unread should read the same ident again.
	s.Unread()

	_, tok, _ = s.ScanWithRegex()
	if want, got := token.IDENT, tok; want != got {
		t.Fatalf("unexpected token after first unread: %d", tok)
	}

	// Read the next token using the standard scan.
	_, tok, _ = s.ScanWithRegex()
	if want, got := token.REGEX, tok; want != got {
		t.Fatalf("unexpected token after first unread: %d", tok)
	}

	// Unread should move back to the beginning and scanning without
	// regex should give us the division operator.
	s.Unread()
	_, tok, _ = s.Scan()
	if want, got := token.DIV, tok; want != got {
		t.Fatalf("unexpected token after first unread: %d", tok)
	}

	// Unread twice and scan again should give us the regex again.
	s.Unread()
	s.Unread()
	_, tok, _ = s.ScanWithRegex()
	if want, got := token.REGEX, tok; want != got {
		t.Fatalf("unexpected token after first unread: %d", tok)
	}
}

func TestScanner_UnreadEOF(t *testing.T) {
	// Trailing whitespace should cause unread to not reset to the last token
	// as the token is considered "complete".
	f := token.NewFile("query.flux", 2)
	s := scanner.New(f, []byte(`a `))
	_, tok, _ := s.ScanWithRegex()
	if want, got := token.IDENT, tok; want != got {
		t.Fatalf("unexpected first token: %d", tok)
	}

	// Unread should read the ident again because we didn't scan an EOF token.
	s.Unread()

	_, tok, _ = s.ScanWithRegex()
	if want, got := token.IDENT, tok; want != got {
		t.Fatalf("unexpected token after first unread: %d", tok)
	}

	// Read the next token to skip the whitespace and hit EOF.
	_, tok, _ = s.ScanWithRegex()
	if want, got := token.EOF, tok; want != got {
		t.Fatalf("unexpected token after first unread: %d", tok)
	}

	// Unread should not reset back to the beginning of the whitespace
	// because the whitespace was already consumed.
	s.Unread()
	_, tok, _ = s.ScanWithRegex()
	if want, got := token.EOF, tok; want != got {
		t.Fatalf("unexpected token after first unread: %d", tok)
	}
}

func TestScanner_MultipleTokens(t *testing.T) {
	for _, tt := range []struct {
		name string
		s    string
		want []token.Token
	}{
		{
			name: "variable declaration",
			s:    `x = 5`,
			want: []token.Token{
				token.IDENT,
				token.ASSIGN,
				token.INT,
			},
		},
		{
			name: "illegal token",
			s:    `x = 5 @ y = 1`,
			want: []token.Token{
				token.IDENT,
				token.ASSIGN,
				token.INT,
				token.ILLEGAL,
				token.IDENT,
				token.ASSIGN,
				token.INT,
			},
		},
		{
			name: "function chain",
			s:    `from(bucket: "telegraf") |> range(start: -5m) |> last()`,
			want: []token.Token{
				token.IDENT,
				token.LPAREN,
				token.IDENT,
				token.COLON,
				token.STRING,
				token.RPAREN,
				token.PIPE_FORWARD,
				token.IDENT,
				token.LPAREN,
				token.IDENT,
				token.COLON,
				token.SUB,
				token.DURATION,
				token.RPAREN,
				token.PIPE_FORWARD,
				token.IDENT,
				token.LPAREN,
				token.RPAREN,
			},
		},
		{
			name: "multiple regexes",
			s:    `/.*/ /c$/`,
			want: []token.Token{
				token.REGEX,
				token.REGEX,
			},
		},
		{
			name: "two comments",
			s: `// first line
// second line`,
			want: []token.Token{
				token.COMMENT,
				token.COMMENT,
			},
		},
		{
			name: "two string literals",
			s:    `"hello" "world"`,
			want: []token.Token{
				token.STRING,
				token.STRING,
			},
		},
		{
			name: "illegal unicode point",
			s: string([]byte{
				byte('r'), byte('['), 240, 157, 128, 128,
			}),
			want: []token.Token{
				token.IDENT,
				token.LBRACK,
				token.ILLEGAL,
			},
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			f := token.NewFile("query.flux", len(tt.s))
			s := scanner.New(f, []byte(tt.s))

			var got []token.Token
			for {
				_, tok, _ := s.ScanWithRegex()
				if tok == token.EOF {
					break
				}
				got = append(got, tok)
			}

			if !cmp.Equal(tt.want, got) {
				t.Fatalf("unexpected tokens:\n%s", cmp.Diff(tt.want, got))
			}
		})
	}
}

func TestScanner_IllegalToken(t *testing.T) {
	for _, tt := range []struct {
		name string
		ch   rune
	}{
		{name: "Ascii", ch: '@'},
		{name: "Multibyte", ch: '£'},
	} {
		t.Run(tt.name, func(t *testing.T) {
			src := []byte(fmt.Sprintf(`%c x = 5`, tt.ch))
			f := token.NewFile("query.flux", len(src))
			s := scanner.New(f, src)
			_, tok, lit := s.ScanWithRegex()
			if want, got := token.ILLEGAL, tok; want != got {
				t.Errorf("unexpected token -want/+got\n\t- %d\n\t+ %d", want, got)
			}
			if want, got := fmt.Sprintf("%c", tt.ch), lit; want != got {
				t.Errorf("unexpected literal -want/+got\n\t- %s\n\t+ %s", want, got)
			}

			// It should continue and read the next token.
			_, tok, lit = s.ScanWithRegex()
			if want, got := token.IDENT, tok; want != got {
				t.Errorf("unexpected token -want/+got\n\t- %d\n\t+ %d", want, got)
			}
			if want, got := "x", lit; want != got {
				t.Errorf("unexpected literal -want/+got\n\t- %s\n\t+ %s", want, got)
			}

			_, tok, lit = s.ScanWithRegex()
			if want, got := token.ASSIGN, tok; want != got {
				t.Errorf("unexpected token -want/+got\n\t- %d\n\t+ %d", want, got)
			}
			if want, got := "=", lit; want != got {
				t.Errorf("unexpected literal -want/+got\n\t- %s\n\t+ %s", want, got)
			}

			_, tok, lit = s.ScanWithRegex()
			if want, got := token.INT, tok; want != got {
				t.Errorf("unexpected token -want/+got\n\t- %d\n\t+ %d", want, got)
			}
			if want, got := "5", lit; want != got {
				t.Errorf("unexpected literal -want/+got\n\t- %s\n\t+ %s", want, got)
			}

			// Expect an EOF token.
			if _, tok, _ := s.ScanWithRegex(); tok != token.EOF {
				t.Errorf("expected eof token, got %d", tok)
			}
		})
	}
}

type Position struct {
	Token  token.Token
	Line   int
	Column int
}

func TestScanner_Position(t *testing.T) {
	for _, tt := range []struct {
		name string
		s    string
		want []Position
	}{
		{
			name: "two idents",
			s: `a
b`,
			want: []Position{
				{Token: token.IDENT, Line: 1, Column: 1},
				{Token: token.IDENT, Line: 2, Column: 1},
			},
		},
		{
			name: "comment",
			s: `hello
// world
"how are you?"`,
			want: []Position{
				{Token: token.IDENT, Line: 1, Column: 1},
				{Token: token.COMMENT, Line: 2, Column: 1},
				{Token: token.STRING, Line: 3, Column: 1},
			},
		},
		{
			name: "multiline string",
			s: `"hello
world"
line3`,
			want: []Position{
				{Token: token.STRING, Line: 1, Column: 1},
				{Token: token.IDENT, Line: 3, Column: 1},
			},
		},
		{
			name: "simple program",
			s: `from(bucket: "telegraf") |>
    range(start: -5m)
`,
			want: []Position{
				{Token: token.IDENT, Line: 1, Column: 1},
				{Token: token.LPAREN, Line: 1, Column: 5},
				{Token: token.IDENT, Line: 1, Column: 6},
				{Token: token.COLON, Line: 1, Column: 12},
				{Token: token.STRING, Line: 1, Column: 14},
				{Token: token.RPAREN, Line: 1, Column: 24},
				{Token: token.PIPE_FORWARD, Line: 1, Column: 26},
				{Token: token.IDENT, Line: 2, Column: 5},
				{Token: token.LPAREN, Line: 2, Column: 10},
				{Token: token.IDENT, Line: 2, Column: 11},
				{Token: token.COLON, Line: 2, Column: 16},
				{Token: token.SUB, Line: 2, Column: 18},
				{Token: token.DURATION, Line: 2, Column: 19},
				{Token: token.RPAREN, Line: 2, Column: 21},
			},
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			f := token.NewFile("query.flux", len(tt.s))
			s := scanner.New(f, []byte(tt.s))

			var got []Position
			for {
				pos, tok, _ := s.Scan()
				if tok == token.EOF {
					break
				}

				p := f.Position(pos)
				got = append(got, Position{
					Token:  tok,
					Line:   p.Line,
					Column: p.Column,
				})
			}

			if !cmp.Equal(tt.want, got) {
				t.Fatalf("unexpected token stream -want/+got:\n%s", cmp.Diff(tt.want, got))
			}
		})
	}
}

func TestScanner_EOF_Position(t *testing.T) {
	f := token.NewFile("query.flux", 1)
	s := scanner.New(f, []byte(`a`))

	pos, tok, lit := s.Scan()
	if want, got := token.Pos(1), pos; want != got {
		t.Errorf("unexpected position -want/+got:\n\t- %v\n\t+ %v", want, got)
	}
	if want, got := token.IDENT, tok; want != got {
		t.Errorf("unexpected token -want/+got:\n\t- %v\n\t+ %v", want, got)
	}
	if want, got := "a", lit; want != got {
		t.Errorf("unexpected literal -want/+got:\n\t- %v\n\t+ %v", want, got)
	}

	pos, tok, lit = s.Scan()
	if want, got := token.Pos(2), pos; want != got {
		t.Errorf("unexpected position -want/+got:\n\t- %v\n\t+ %v", want, got)
	}
	if want, got := token.EOF, tok; want != got {
		t.Errorf("unexpected token -want/+got:\n\t- %v\n\t+ %v", want, got)
	}
	if want, got := "", lit; want != got {
		t.Errorf("unexpected literal -want/+got:\n\t- %v\n\t+ %v", want, got)
	}

	// Multiple scans of the EOF token should continue producing the same value.
	pos, tok, lit = s.Scan()
	if want, got := token.Pos(2), pos; want != got {
		t.Errorf("unexpected position -want/+got:\n\t- %v\n\t+ %v", want, got)
	}
	if want, got := token.EOF, tok; want != got {
		t.Errorf("unexpected token -want/+got:\n\t- %v\n\t+ %v", want, got)
	}
	if want, got := "", lit; want != got {
		t.Errorf("unexpected literal -want/+got:\n\t- %v\n\t+ %v", want, got)
	}
}
