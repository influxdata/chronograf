package server

import (
	"context"
	"strings"
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

func TestEnforceReaderInfluxQLReadOnly_DashboardPlaceholdersAllowed(t *testing.T) {
	ctx := context.WithValue(context.Background(), roles.ContextKey, roles.ReaderRoleName)
	queries := []string{
		`SELECT mean("usage_user") AS "mean_usage_user" FROM "telegraf"."autogen"."cpu" WHERE time > :dashboardTime: AND time < :upperDashboardTime: GROUP BY time(:interval:) FILL(null)`,
		`SELECT mean("usage_system") AS "mean_usage_system" FROM "telegraf"."autogen"."cpu" WHERE time > :dashboardTime: AND time < :upperDashboardTime: GROUP BY time(:interval:) FILL(linear)`,
	}

	for _, q := range queries {
		if err := enforceReaderInfluxQLReadOnly(ctx, q); err != nil {
			t.Fatalf("query should be allowed, got err: %v", err)
		}
	}
}

func TestNormalizeInfluxQLTemplatesForParse_ReplacesPlaceholdersWithValidLiterals(t *testing.T) {
	in := `SELECT mean("v") FROM "m" WHERE time > :dashboardTime: AND time < :upperDashboardTime: GROUP BY time(:interval:)`
	out := normalizeInfluxQLTemplatesForParse(in)

	if strings.Contains(out, ":dashboardTime:") ||
		strings.Contains(out, ":upperDashboardTime:") ||
		strings.Contains(out, ":interval:") {
		t.Fatalf("placeholders were not fully replaced: %q", out)
	}
	if !strings.Contains(out, "time(1m)") {
		t.Fatalf("expected interval placeholder to become time(1m), got: %q", out)
	}
	if !strings.Contains(out, "now()") {
		t.Fatalf("expected generic placeholders to become now(), got: %q", out)
	}
}
