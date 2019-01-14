// Package parser implements a parser for Flux source files. Input is provided
// by a string and output is an abstract-syntax tree (AST) representing the
// Flux source.
//
// The parser accepts a larger language than is syntactically permitted and
// will embed any errors from parsing the source into the AST itself.
package parser
