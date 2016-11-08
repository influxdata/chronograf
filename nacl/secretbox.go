package nacl

import (
	"crypto/rand"
	"io"

	"github.com/influxdata/chronograf"
	"golang.org/x/crypto/nacl/secretbox"
)

const (
	// Note that the encryption key will be padded or truncated to 32 bytes.
	keySize   = 32
	nonceSize = 24
)

// Encrypt will seal message using the key and a randomly generated nonce.
func Encrypt(k string, message string) (string, error) {
	key := new([keySize]byte)
	if len(k) > keySize {
		k = k[:keySize]
	}
	copy(key[:], k[:len(k)])

	nonce := new([nonceSize]byte)
	if _, err := io.ReadFull(rand.Reader, nonce[:]); err != nil {
		return "", chronograf.ErrEncryption
	}

	out := make([]byte, len(nonce))
	copy(out, nonce[:])
	out = secretbox.Seal(out, []byte(message), nonce, key)

	return string(out), nil
}

// Decrypt will open the box.
func Decrypt(k string, box string) (string, error) {
	key := new([keySize]byte)
	if len(k) > keySize {
		k = k[:keySize]
	}
	copy(key[:], k[:len(k)])

	b := []byte(box)
	if len(b) < (nonceSize + secretbox.Overhead) {
		return "", chronograf.ErrDecryption
	}

	var nonce [nonceSize]byte
	copy(nonce[:], b[:nonceSize])
	out, ok := secretbox.Open(nil, b[nonceSize:], &nonce, key)
	if !ok {
		return "", chronograf.ErrDecryption
	}

	return string(out), nil
}
