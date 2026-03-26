package server

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/influxdata/chronograf/roles"
)

func TestEnforceReaderFluxReadOnly(t *testing.T) {
	tests := []struct {
		name    string
		role    string
		method  string
		body    string
		wantErr bool
	}{
		{
			name:    "reader blocks to()",
			role:    roles.ReaderRoleName,
			method:  http.MethodPost,
			body:    `{"query":"from(bucket: \"telegraf\") |> range(start: -1h) |> to(bucket: \"out\")"}`,
			wantErr: true,
		},
		{
			name:    "reader blocks member to()",
			role:    roles.ReaderRoleName,
			method:  http.MethodPost,
			body:    "{\"query\":\"import \\\"influxdata/influxdb/v1\\\"\\nfrom(bucket: \\\"telegraf\\\") |> range(start: -1h) |> v1.to(bucket: \\\"out\\\", org: \\\"defaultorgname\\\")\"}",
			wantErr: true,
		},
		{
			name:    "reader allows read query",
			role:    roles.ReaderRoleName,
			method:  http.MethodPost,
			body:    `{"query":"from(bucket: \"telegraf\") |> range(start: -1h) |> limit(n: 1)"}`,
			wantErr: false,
		},
		{
			name:    "viewer not restricted by this guard",
			role:    roles.ViewerRoleName,
			method:  http.MethodPost,
			body:    `{"query":"from(bucket: \"telegraf\") |> range(start: -1h) |> to(bucket: \"out\")"}`,
			wantErr: false,
		},
		{
			name:    "reader parse error is denied",
			role:    roles.ReaderRoleName,
			method:  http.MethodPost,
			body:    `{"query":"from("}`,
			wantErr: true,
		},
		{
			name:    "reader GET is ignored by this guard",
			role:    roles.ReaderRoleName,
			method:  http.MethodGet,
			body:    `{"query":"from(bucket: \"telegraf\") |> range(start: -1h) |> to(bucket: \"out\")"}`,
			wantErr: false,
		},
		{
			name:    "reader non-json body is denied",
			role:    roles.ReaderRoleName,
			method:  http.MethodPost,
			body:    `not-json`,
			wantErr: true,
		},
		{
			name:    "reader oversized body is denied",
			role:    roles.ReaderRoleName,
			method:  http.MethodPost,
			body:    strings.Repeat("a", int(readerFluxMaxBodyBytes)+1),
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(
				tt.method,
				"http://server.local/chronograf/v1/sources/1/proxy/flux?path=/api/v2/query",
				strings.NewReader(tt.body),
			)
			if tt.role != "" {
				ctx := context.WithValue(req.Context(), roles.ContextKey, tt.role)
				req = req.WithContext(ctx)
			}

			err := enforceReaderFluxReadOnly(req)
			if tt.wantErr && err == nil {
				t.Fatalf("expected error, got nil")
			}
			if !tt.wantErr && err != nil {
				t.Fatalf("expected nil, got %v", err)
			}
			if err != nil && !strings.Contains(err.Error(), readerFluxForbiddenMsg) {
				t.Fatalf("expected %q, got %q", readerFluxForbiddenMsg, err.Error())
			}

			// Body must remain readable by proxy path.
			gotBody, readErr := io.ReadAll(req.Body)
			if readErr != nil {
				t.Fatalf("failed to read request body after guard: %v", readErr)
			}
			if string(gotBody) != tt.body {
				t.Fatalf("body changed by guard; got %q want %q", string(gotBody), tt.body)
			}
		})
	}
}
