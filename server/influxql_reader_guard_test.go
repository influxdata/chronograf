package server

import (
	"context"
	"testing"

	"github.com/influxdata/chronograf/roles"
)

func TestEnforceReaderInfluxQLReadOnly_UseThenSelectAllowed(t *testing.T) {
	ctx := context.WithValue(context.Background(), roles.ContextKey, roles.ReaderRoleName)
	cmd := `USE mydb; SELECT * FROM cpu`

	if err := enforceReaderInfluxQLReadOnly(ctx, cmd); err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
}

func TestEnforceReaderInfluxQLReadOnly_UseThenUnsafeStillRejected(t *testing.T) {
	ctx := context.WithValue(context.Background(), roles.ContextKey, roles.ReaderRoleName)
	cmd := `USE mydb; DROP DATABASE mydb`

	err := enforceReaderInfluxQLReadOnly(ctx, cmd)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if err.Error() != readerInfluxQLForbiddenMsg {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestEnforceReaderInfluxQLReadOnly_NonReaderUnchanged(t *testing.T) {
	ctx := context.WithValue(context.Background(), roles.ContextKey, roles.AdminRoleName)
	cmd := `DROP DATABASE mydb`

	if err := enforceReaderInfluxQLReadOnly(ctx, cmd); err != nil {
		t.Fatalf("expected nil error for non-reader, got %v", err)
	}
}
