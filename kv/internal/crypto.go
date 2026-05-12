package internal

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"fmt"
	"io"
)

const (
	secretCryptoVersionV1 byte = 1
	aes256KeySize              = 32
	gcmNonceSize               = 12
)

func generateDEK() ([]byte, error) {
	dek := make([]byte, aes256KeySize)
	if _, err := io.ReadFull(rand.Reader, dek); err != nil {
		return nil, fmt.Errorf("generate DEK: %w", err)
	}
	return dek, nil
}

func wrapDEK(masterKey, dek []byte) ([]byte, error) {
	return sealV1(masterKey, dek)
}

func unwrapDEK(masterKey, wrappedDEK []byte) ([]byte, error) {
	return openV1(masterKey, wrappedDEK)
}

func encryptSecret(dek, plaintextSecret []byte) ([]byte, error) {
	return sealV1(dek, plaintextSecret)
}

func decryptSecret(dek, encryptedSecret []byte) ([]byte, error) {
	return openV1(dek, encryptedSecret)
}

func sealV1(key, plaintext []byte) ([]byte, error) {
	if len(key) != aes256KeySize {
		return nil, fmt.Errorf("invalid key length: got %d bytes, expected %d", len(key), aes256KeySize)
	}

	aesBlock, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("create AES cipher: %w", err)
	}
	gcmCipher, err := cipher.NewGCM(aesBlock)
	if err != nil {
		return nil, fmt.Errorf("create GCM: %w", err)
	}

	nonce := make([]byte, gcmNonceSize)
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, fmt.Errorf("generate nonce: %w", err)
	}

	// Envelope format: [version|nonce|ciphertext]
	ciphertext := gcmCipher.Seal(nil, nonce, plaintext, nil)
	payload := make([]byte, 0, 1+len(nonce)+len(ciphertext))
	payload = append(payload, secretCryptoVersionV1)
	payload = append(payload, nonce...)
	payload = append(payload, ciphertext...)
	return payload, nil
}

func openV1(key, payload []byte) ([]byte, error) {
	if len(key) != aes256KeySize {
		return nil, fmt.Errorf("invalid key length: got %d bytes, expected %d", len(key), aes256KeySize)
	}
	if len(payload) < 1+gcmNonceSize+16 {
		return nil, fmt.Errorf("invalid payload length: %d", len(payload))
	}
	if payload[0] != secretCryptoVersionV1 {
		return nil, fmt.Errorf("unsupported payload version: %d", payload[0])
	}

	nonce := payload[1 : 1+gcmNonceSize]
	ciphertext := payload[1+gcmNonceSize:]

	aesBlock, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("create AES cipher: %w", err)
	}
	gcmCipher, err := cipher.NewGCM(aesBlock)
	if err != nil {
		return nil, fmt.Errorf("create GCM: %w", err)
	}

	plaintext, err := gcmCipher.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, fmt.Errorf("decrypt payload: %w", err)
	}
	return plaintext, nil
}
