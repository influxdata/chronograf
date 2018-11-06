package flux

import "fmt"

// Dialect describes how to encode results.
type Dialect interface {
	// Encoder creates an encoder for the results
	Encoder() MultiResultEncoder
	// DialectType report the type of the dialect
	DialectType() DialectType
}

// DialectType is the name of a query result dialect.
type DialectType string
type CreateDialect func() Dialect

type DialectMappings map[DialectType]CreateDialect

func (m DialectMappings) Add(t DialectType, c CreateDialect) error {
	if _, ok := m[t]; ok {
		return fmt.Errorf("duplicate dialect mapping for %q", t)
	}
	m[t] = c
	return nil
}
