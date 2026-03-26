package server

import (
	"context"
	"errors"
	"fmt"
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

func enforceReaderInfluxQLReadOnly(ctx context.Context, command string) error {
	role, ok := hasRoleContext(ctx)
	if !ok || role != roles.ReaderRoleName {
		return nil
	}

	// Reuse existing query preprocessing so Reader can run:
	// USE <db>; SELECT ...
	req := chronograf.Query{Command: command}
	setupQueryFromCommand(&req)

	guardCommand := strings.TrimSpace(req.Command)
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
