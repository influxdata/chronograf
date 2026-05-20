package server

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/roles"
	"github.com/influxdata/influxql"
)

var errReaderInfluxQLParse = errors.New("invalid InfluxQL query")
var errReaderInfluxQLForbidden = errors.New("reader role can only execute SELECT and SHOW queries")

const readerInfluxQLForbiddenMsg = "reader role can only execute SELECT and SHOW queries"
const readerInfluxQLBodyTooLargeMsg = "reader request body too large"
const readerInfluxQLMaxBodyBytes int64 = 1 << 20 // 1 MiB

var influxqlTimePlaceholderPattern = regexp.MustCompile(`(?i)time\(\s*:[\w-]+:\s*\)`)
var influxqlTemplatePattern = regexp.MustCompile(`:[\w-]+:`)

func enforceReaderInfluxQLReadOnly(ctx context.Context, command string) error {
	role, ok := hasRoleContext(ctx)
	if !ok || role != roles.ReaderRoleName {
		return nil
	}

	// Reuse existing query preprocessing so Reader can run:
	// USE <db>; SELECT ...
	req := chronograf.Query{Command: command}
	setupQueryFromCommand(&req)

	guardCommand := strings.TrimSpace(normalizeInfluxQLTemplatesForParse(req.Command))
	if guardCommand == "" {
		return nil
	}

	q, err := influxql.ParseQuery(guardCommand)
	if err != nil {
		return fmt.Errorf("%w: %v", errReaderInfluxQLParse, err)
	}

	for _, stmt := range q.Statements {
		switch s := stmt.(type) {
		case *influxql.SelectStatement:
			// SELECT ... INTO writes data and is not allowed for Reader.
			if s.Target != nil {
				return errReaderInfluxQLForbidden
			}
		default:
			if !strings.HasPrefix(strings.ToUpper(strings.TrimSpace(stmt.String())), "SHOW ") {
				return errReaderInfluxQLForbidden
			}
		}
	}

	return nil
}

func normalizeInfluxQLTemplatesForParse(query string) string {
	// Reader guard parses query text only to classify statements as read-only.
	// Placeholders must therefore be replaced with syntactically valid InfluxQL
	// literals for parsing, but these substitution values are never executed.
	normalized := influxqlTimePlaceholderPattern.ReplaceAllString(query, "time(1m)")
	normalized = influxqlTemplatePattern.ReplaceAllString(normalized, "now()")
	return normalized
}
