package server

import (
	"context"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/influxdata/chronograf/roles"
)

type trackingReadCloser struct {
	io.Reader
	closed bool
}

func (t *trackingReadCloser) Close() error {
	t.closed = true
	return nil
}

func TestEnforceReaderFluxReadOnly(t *testing.T) {
	tests := []struct {
		name    string
		role    string
		method  string
		path    string
		body    string
		wantErr bool
		wantMsg string
	}{
		{
			name:    "reader blocks to()",
			role:    roles.ReaderRoleName,
			method:  http.MethodPost,
			body:    `{"query":"from(bucket: \"telegraf\") |> range(start: -1h) |> to(bucket: \"out\")"}`,
			wantErr: true,
			wantMsg: readerFluxForbiddenMsg,
		},
		{
			name:    "reader blocks member to()",
			role:    roles.ReaderRoleName,
			method:  http.MethodPost,
			body:    "{\"query\":\"import \\\"influxdata/influxdb/v1\\\"\\nfrom(bucket: \\\"telegraf\\\") |> range(start: -1h) |> v1.to(bucket: \\\"out\\\", org: \\\"defaultorgname\\\")\"}",
			wantErr: true,
			wantMsg: readerFluxForbiddenMsg,
		},
		{
			name:    "reader blocks aliased to()",
			role:    roles.ReaderRoleName,
			method:  http.MethodPost,
			body:    `{"query":"t = to\nfrom(bucket: \"telegraf\") |> range(start: -1h) |> t(bucket: \"out\")"}`,
			wantErr: true,
			wantMsg: readerFluxForbiddenMsg,
		},
		{
			name:    "reader blocks member aliased to()",
			role:    roles.ReaderRoleName,
			method:  http.MethodPost,
			body:    "{\"query\":\"import \\\"influxdata/influxdb/v1\\\"\\nt = v1.to\\nfrom(bucket: \\\"telegraf\\\") |> range(start: -1h) |> t(bucket: \\\"out\\\", org: \\\"defaultorgname\\\")\"}",
			wantErr: true,
			wantMsg: readerFluxForbiddenMsg,
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
			wantMsg: "invalid Flux query",
		},
		{
			name:    "reader GET query path allowed",
			role:    roles.ReaderRoleName,
			method:  http.MethodGet,
			body:    `{"query":"from(bucket: \"telegraf\") |> range(start: -1h) |> to(bucket: \"out\")"}`,
			wantErr: false,
		},
		{
			name:    "reader GET non-query flux endpoint is denied",
			role:    roles.ReaderRoleName,
			method:  http.MethodGet,
			path:    "/api/v2/delete",
			body:    ``,
			wantErr: true,
			wantMsg: errReaderFluxPathForbidden.Error(),
		},
		{
			name:    "reader non-json body is denied",
			role:    roles.ReaderRoleName,
			method:  http.MethodPost,
			body:    `not-json`,
			wantErr: true,
			wantMsg: "invalid JSON request body",
		},
		{
			name:    "reader oversized body is denied",
			role:    roles.ReaderRoleName,
			method:  http.MethodPost,
			body:    strings.Repeat("a", int(readerFluxMaxBodyBytes)+1),
			wantErr: true,
			wantMsg: errReaderBodyTooLarge.Error(),
		},
		{
			name:    "reader empty query is denied",
			role:    roles.ReaderRoleName,
			method:  http.MethodPost,
			body:    `{"query":""}`,
			wantErr: true,
			wantMsg: errReaderFluxQueryRequired.Error(),
		},
		{
			name:    "reader non-query flux endpoint is denied",
			role:    roles.ReaderRoleName,
			method:  http.MethodPost,
			path:    "/api/v2/delete",
			body:    `{"start":"2020-01-01T00:00:00Z","stop":"2020-01-02T00:00:00Z"}`,
			wantErr: true,
			wantMsg: errReaderFluxPathForbidden.Error(),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			path := tt.path
			if path == "" {
				path = "/api/v2/query"
			}
			req := httptest.NewRequest(
				tt.method,
				"http://server.local/chronograf/v1/sources/1/proxy/flux?path="+url.QueryEscape(path),
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
			if tt.wantMsg != "" && (err == nil || !strings.Contains(err.Error(), tt.wantMsg)) {
				t.Fatalf("expected error containing %q, got %v", tt.wantMsg, err)
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

func TestReadAndRestoreBodyWithLimit_CloseDelegatesToOriginalBody(t *testing.T) {
	req := httptest.NewRequest("POST", "/", strings.NewReader("abc"))
	original := &trackingReadCloser{Reader: strings.NewReader("abc")}
	req.Body = original

	body, err := readAndRestoreBodyWithLimit(req, 1024)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if string(body) != "abc" {
		t.Fatalf("body=%q want=%q", string(body), "abc")
	}

	if err := req.Body.Close(); err != nil {
		t.Fatalf("close error: %v", err)
	}
	if !original.closed {
		t.Fatal("expected original body to be closed")
	}
}

func TestReadAndRestoreBodyWithLimit_TooLargePreservesReadableBody(t *testing.T) {
	payload := "abcdef"
	req := httptest.NewRequest("POST", "/", strings.NewReader(payload))
	original := &trackingReadCloser{Reader: strings.NewReader(payload)}
	req.Body = original

	_, err := readAndRestoreBodyWithLimit(req, 3)
	if !errors.Is(err, errReaderBodyTooLarge) {
		t.Fatalf("expected errReaderBodyTooLarge, got %v", err)
	}

	got, readErr := io.ReadAll(req.Body)
	if readErr != nil {
		t.Fatalf("read error: %v", readErr)
	}
	if string(got) != payload {
		t.Fatalf("body=%q want=%q", string(got), payload)
	}

	if err := req.Body.Close(); err != nil {
		t.Fatalf("close error: %v", err)
	}
	if !original.closed {
		t.Fatal("expected original body to be closed")
	}
}
