package internal

import (
	"bytes"
	"testing"
)

func TestGenerateDEK(t *testing.T) {
	dek, err := generateDEK()
	if err != nil {
		t.Fatalf("generateDEK returned error: %v", err)
	}
	if len(dek) != aes256KeySize {
		t.Fatalf("unexpected DEK length: got %d, want %d", len(dek), aes256KeySize)
	}
}

func TestWrapUnwrapDEK(t *testing.T) {
	masterKey := bytes.Repeat([]byte{0x11}, aes256KeySize)
	dek := bytes.Repeat([]byte{0x22}, aes256KeySize)

	wrappedDEK, err := wrapDEK(masterKey, dek)
	if err != nil {
		t.Fatalf("wrapDEK returned error: %v", err)
	}
	if bytes.Equal(wrappedDEK, dek) {
		t.Fatalf("wrapped DEK must not equal plaintext DEK")
	}

	unwrappedDEK, err := unwrapDEK(masterKey, wrappedDEK)
	if err != nil {
		t.Fatalf("unwrapDEK returned error: %v", err)
	}
	if !bytes.Equal(unwrappedDEK, dek) {
		t.Fatalf("unwrapped DEK mismatch: got %x, want %x", unwrappedDEK, dek)
	}
}

func TestEncryptDecryptSecret(t *testing.T) {
	dek := bytes.Repeat([]byte{0x33}, aes256KeySize)
	plaintextSecret := []byte("super-secret-value")

	encryptedSecret, err := encryptSecret(dek, plaintextSecret)
	if err != nil {
		t.Fatalf("encryptSecret returned error: %v", err)
	}
	if bytes.Equal(encryptedSecret, plaintextSecret) {
		t.Fatalf("encrypted secret must not equal plaintext")
	}

	decryptedSecret, err := decryptSecret(dek, encryptedSecret)
	if err != nil {
		t.Fatalf("decryptSecret returned error: %v", err)
	}
	if !bytes.Equal(decryptedSecret, plaintextSecret) {
		t.Fatalf("decrypted secret mismatch: got %q, want %q", decryptedSecret, plaintextSecret)
	}
}

func TestDecryptSecretInvalidCases(t *testing.T) {
	dek := bytes.Repeat([]byte{0x44}, aes256KeySize)
	validPayload, err := encryptSecret(dek, []byte("value"))
	if err != nil {
		t.Fatalf("encryptSecret returned error: %v", err)
	}

	tests := []struct {
		name    string
		key     []byte
		payload []byte
	}{
		{
			name:    "invalid key length",
			key:     []byte("short"),
			payload: validPayload,
		},
		{
			name:    "payload too short",
			key:     dek,
			payload: []byte{secretCryptoVersionV1},
		},
		{
			name:    "unsupported version",
			key:     dek,
			payload: append([]byte{2}, validPayload[1:]...),
		},
		{
			name: "tampered payload",
			key:  dek,
			payload: func() []byte {
				copied := append([]byte(nil), validPayload...)
				copied[len(copied)-1] ^= 0xff
				return copied
			}(),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := decryptSecret(tt.key, tt.payload)
			if err == nil {
				t.Fatalf("expected error, got nil")
			}
		})
	}
}
