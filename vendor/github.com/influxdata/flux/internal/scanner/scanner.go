package scanner

import (
	"fmt"
	"unicode/utf8"

	"github.com/influxdata/flux/internal/token"
)

// use uneeded generated constants to satisify staticcheck
var _ = flux_start
var _ = flux_first_final

// Scanner is used to tokenize a flux program.
type Scanner struct {
	f          *token.File
	p, pe, eof int
	ts, te     int
	token      token.Token
	data       []byte
	checkpoint int
	reset      int
}

// New will construct and initialize a new Scanner.
func New(f *token.File, data []byte) *Scanner {
	s := &Scanner{}
	s.Init(f, data)
	return s
}

// Init initializes the Scanner to scan the data in the byte array.
func (s *Scanner) Init(f *token.File, data []byte) {
	s.f = f
	s.p, s.pe, s.eof = 0, len(data), len(data)
	s.data = data
}

// File returns the file being processed by the Scanner.
func (s *Scanner) File() *token.File {
	return s.f
}

// ScanWithRegex will scan the next token for the entire grammar.
func (s *Scanner) ScanWithRegex() (pos token.Pos, tok token.Token, lit string) {
	return s.scan(flux_en_main_with_regex)
}

// Scan will scan the next token while excluding regex literal tokens.
// This is useful in situations where the parser is not expecting a regular
// expression such as when reading a binary operator in an expression.
// This method is needed because the start token for division and the token for a
// regular expression are the same so this ensures the expression "a / b / c"
// will not be parsed as a regular expression.
func (s *Scanner) Scan() (pos token.Pos, tok token.Token, lit string) {
	return s.scan(flux_en_main)
}

// Unread will reset the Scanner to go back to the Scanner's location
// before the last ScanWithRegex or Scan call. If either of the ScanWithRegex methods
// returned an EOF token, a call to Unread will not unread the discarded whitespace.
// This method is a no-op if called multiple times.
func (s *Scanner) Unread() {
	// If the checkpoint marker is ahead of reset, then use that instead.
	if s.checkpoint > s.reset {
		s.p = s.checkpoint
		return
	}
	s.p = s.reset
}

func (s *Scanner) scan(cs int) (pos token.Pos, tok token.Token, lit string) {
	s.reset, s.token, s.checkpoint = s.p, token.ILLEGAL, -1
	if es := s.exec(cs); es == flux_error {
		// Execution failed meaning we hit a pattern that we don't support and
		// doesn't produce a token. Use the unicode library to decode the next character
		// in the sequence so we don't break up any unicode tokens.
		ch, size := utf8.DecodeRune(s.data[s.ts:])
		if size == 0 {
			// This should be impossible as we would have produced an EOF token
			// instead, but going to handle this anyway as in this impossible scenario
			// we would enter an infinite loop if we continued scanning past the token.
			return s.f.Pos(s.ts), token.EOF, ""
		}
		// Advance the data pointer to after the character we just emitted.
		s.p = s.ts + size
		return s.f.Pos(s.ts), token.ILLEGAL, fmt.Sprintf("%c", ch)
	} else if s.token == token.ILLEGAL && s.p == s.eof {
		return s.f.Pos(len(s.data)), token.EOF, ""
	}
	return s.f.Pos(s.ts), s.token, string(s.data[s.ts:s.te])
}
