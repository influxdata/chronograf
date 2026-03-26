package server

import (
	"context"
	"fmt"
	"strings"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/roles"
	"github.com/influxdata/influxql"
)

const readerInfluxQLForbiddenMsg = "reader role can only execute SELECT and SHOW queries"

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
		return fmt.Errorf(readerInfluxQLForbiddenMsg)
	}

	for _, stmt := range q.Statements {
		switch s := stmt.(type) {
		case *influxql.SelectStatement:
			// SELECT ... INTO writes data and is not allowed for Reader.
			if s.Target != nil {
				return fmt.Errorf(readerInfluxQLForbiddenMsg)
			}
		default:
			if !strings.HasPrefix(strings.ToUpper(strings.TrimSpace(stmt.String())), "SHOW ") {
				return fmt.Errorf(readerInfluxQLForbiddenMsg)
			}
		}
	}

	return nil
}
