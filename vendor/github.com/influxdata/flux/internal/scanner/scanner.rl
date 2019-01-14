package scanner

import "github.com/influxdata/flux/internal/token"

%%{
	machine flux;

	include WChar "unicode.rl";

	newline = '\n' @{ s.f.AddLine(fpc + 1) };
	any_count_line = any | newline;

	identifier = ( ualpha | "_" ) ( ualnum | "_" )*;

	decimal_lit = (digit - "0") digit*;
	int_lit = "0" | decimal_lit;

	float_lit = (digit+ "." digit*) | ("." digit+);

	duration_unit = "y" | "mo" | "w" | "d" | "h" | "m" | "s" | "ms" | "us" | "µs" | "ns";
	duration_lit = ( int_lit duration_unit )+;

	date = digit{4} "-" digit{2} "-" digit{2};
	time_offset = "Z" | (("+" | "-") digit{2} ":" digit{2});
	time = digit{2} ":" digit{2} ":" digit{2} ( "." digit* )? time_offset?;
	date_time_lit = date ( "T" time )?;

	# todo(jsternberg): string expressions have to be included in the string literal.
	escaped_char = "\\" ( "n" | "r" | "t" | "\\" | '"' );
	unicode_value = (any_count_line - "\\") | escaped_char;
	byte_value = "\\x" xdigit{2};
	string_lit = '"' ( unicode_value | byte_value )* :> '"';

	regex_escaped_char = "\\" ( "/" | "\\");
	regex_unicode_value = (any_count_line - "/") | regex_escaped_char;
	regex_lit = "/" ( regex_unicode_value | byte_value )+ "/";

	# The newline is optional so that a comment at the end of a file is considered valid.
	single_line_comment = "//" [^\n]* newline?;

	action checkpoint {
		s.checkpoint = s.p
	}

	# Whitespace is standard ws, newlines and control codes.
	whitespace = ( newline | space )+ @checkpoint;

	# The regex literal is not compatible with division so we need two machines.
	# One machine contains the full grammar and is the main one, the other is used to scan when we are
	# in the middle of an expression and we are potentially expecting a division operator.
	main_with_regex := |*
		# If we see a regex literal, we accept that and do not go to the other scanner.
		regex_lit => { s.token = token.REGEX; fbreak; };

		# We have to specify whitespace here so that leading whitespace doesn't cause a state transition.
		whitespace+;

		# Any other character we transfer to the main state machine that defines the entire language.
		any => { fhold; fgoto main; };
	*|;

	# This machine does not contain the regex literal.
	main := |*
		single_line_comment => { s.token = token.COMMENT; fbreak; };

		"and" => { s.token = token.AND; fbreak; };
		"or" => { s.token = token.OR; fbreak; };
		"not" => { s.token = token.NOT; fbreak; };
		"empty" => { s.token = token.EMPTY; fbreak; };
		"in" => { s.token = token.IN; fbreak; };
		"import" => { s.token = token.IMPORT; fbreak; };
		"package" => { s.token = token.PACKAGE; fbreak; };
		"return" => { s.token = token.RETURN; fbreak; };

		identifier => { s.token = token.IDENT; fbreak; };
		int_lit => { s.token = token.INT; fbreak; };
		float_lit => { s.token = token.FLOAT; fbreak; };
		duration_lit => { s.token = token.DURATION; fbreak; };
		date_time_lit => { s.token = token.TIME; fbreak; };
		string_lit => { s.token = token.STRING; fbreak; };

		"+" => { s.token = token.ADD; fbreak; };
		"-" => { s.token = token.SUB; fbreak; };
		"*" => { s.token = token.MUL; fbreak; };
		"/" => { s.token = token.DIV; fbreak; };
		"%" => { s.token = token.MOD; fbreak; };
		"==" => { s.token = token.EQ; fbreak; };
		"<" => { s.token = token.LT; fbreak; };
		">" => { s.token = token.GT; fbreak; };
		"<=" => { s.token = token.LTE; fbreak; };
		">=" => { s.token = token.GTE; fbreak; };
		"!=" => { s.token = token.NEQ; fbreak; };
		"=~" => { s.token = token.REGEXEQ; fbreak; };
		"!~" => { s.token = token.REGEXNEQ; fbreak; };
		"=" => { s.token = token.ASSIGN; fbreak; };
		"=>" => { s.token = token.ARROW; fbreak; };
		"<-" => { s.token = token.PIPE_RECEIVE; fbreak; };
		"(" => { s.token = token.LPAREN; fbreak; };
		")" => { s.token = token.RPAREN; fbreak; };
		"[" => { s.token = token.LBRACK; fbreak; };
		"]" => { s.token = token.RBRACK; fbreak; };
		"{" => { s.token = token.LBRACE; fbreak; };
		"}" => { s.token = token.RBRACE; fbreak; };
		":" => { s.token = token.COLON; fbreak; };
		"|>" => { s.token = token.PIPE_FORWARD; fbreak; };
		"," => { s.token = token.COMMA; fbreak; };
		"." => { s.token = token.DOT; fbreak; };

		whitespace+;
	*|;
}%%

%% write data;

func (s *Scanner) exec(cs int) int {
	%% variable p s.p;
	%% variable pe s.pe;
	%% variable eof s.eof;
	%% variable data s.data;
	%% variable ts s.ts;
	%% variable te s.te;
	var act int
	%% write init nocs;
	%% write exec;
	return cs
}
