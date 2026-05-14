package main

import (
	"bytes"
	"encoding/base64"
	"os"
	"path/filepath"
	"testing"

	flags "github.com/jessevdk/go-flags"
)

func TestChronoctlCommands(t *testing.T) {
	tests := []struct {
		args []string
		err  bool
	}{
		{
			args: []string{"not", "a", "command"},
			err:  true,
		},
		{
			args: []string{"add-superadmin", "-h"},
			err:  false,
		},
		{
			args: []string{"gen-keypair", "-h"},
			err:  false,
		},
		{
			args: []string{"gen-secrets-master-key", "-h"},
			err:  false,
		},
		{
			args: []string{"disable-secrets-encryption", "-h"},
			err:  false,
		},
		{
			args: []string{"rewrap-secrets-master-key", "-h"},
			err:  false,
		},
		{
			args: []string{"list-users", "-h"},
			err:  false,
		},
		{
			args: []string{"token", "-h"},
			err:  false,
		},
	}

	for _, test := range tests {
		t.Log("Testing", test.args)
		if _, err := parser.ParseArgs(test.args); err != nil {
			if flagsErr, ok := err.(*flags.Error); ok && flagsErr.Type == flags.ErrHelp {
				if test.err {
					t.Errorf("%v - should have failed", test.args)
				}
			} else {
				if !test.err {
					t.Errorf("%v - shouldn't have failed", test.args)
				}
			}
		}
	}
}

func TestLoadCLISecretsMasterKey(t *testing.T) {
	validRaw := bytes.Repeat([]byte{0x11}, 32)
	validB64 := base64.StdEncoding.EncodeToString(validRaw)

	tests := []struct {
		name     string
		value    string
		fileBody string
		useFile  bool
		wantErr  bool
	}{
		{
			name:     "value and file both set",
			value:    validB64,
			fileBody: validB64,
			useFile:  true,
			wantErr:  true,
		},
		{
			name:    "value and file both empty",
			wantErr: true,
		},
		{
			name:    "invalid base64 in value",
			value:   "%%%not-base64%%%",
			wantErr: true,
		},
		{
			name:    "wrong decoded length",
			value:   base64.StdEncoding.EncodeToString([]byte("short")),
			wantErr: true,
		},
		{
			name:    "valid value",
			value:   validB64,
			wantErr: false,
		},
		{
			name:     "valid file",
			fileBody: validB64 + "\n",
			useFile:  true,
			wantErr:  false,
		},
		{
			name:     "invalid base64 file",
			fileBody: "invalid@@@",
			useFile:  true,
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var filePath string
			if tt.useFile {
				dir := t.TempDir()
				filePath = filepath.Join(dir, "secrets.key")
				if err := os.WriteFile(filePath, []byte(tt.fileBody), 0600); err != nil {
					t.Fatal(err)
				}
			}

			key, err := loadCLISecretsMasterKey(tt.value, filePath, "test")
			if tt.wantErr {
				if err == nil {
					t.Fatalf("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if len(key) != 32 {
				t.Fatalf("unexpected key length: got %d, want 32", len(key))
			}
		})
	}
}

func TestGenerateSecretsMasterKey(t *testing.T) {
	key, err := generateSecretsMasterKey()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	raw, err := base64.StdEncoding.DecodeString(key)
	if err != nil {
		t.Fatalf("generated key is not valid base64: %v", err)
	}
	if len(raw) != 32 {
		t.Fatalf("unexpected decoded key length: got %d, want 32", len(raw))
	}
}
