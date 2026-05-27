package main

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"os"
	"strings"
)

func init() {
	parser.AddCommand("rewrap-secrets-master-key",
		"Rewrap stored DEK with new secrets master key.",
		"Rotate Chronograf secrets master key by rewrapping the stored DEK in BoltDB.",
		&rewrapSecretsMasterKeyCommand{})
}

type rewrapSecretsMasterKeyCommand struct {
	BoltPath string `short:"b" long:"bolt-path" description:"Full path to boltDB file (e.g. './chronograf-v1.db')" env:"BOLT_PATH" default:"chronograf-v1.db"`

	OldSecretsMasterKey     string `long:"old-secrets-master-key" description:"Current base64-encoded 32-byte secrets master key." env:"OLD_SECRETS_MASTER_KEY"`
	OldSecretsMasterKeyFile string `long:"old-secrets-master-key-file" description:"Path to file containing current base64-encoded 32-byte secrets master key." env:"OLD_SECRETS_MASTER_KEY_FILE"`

	NewSecretsMasterKey     string `long:"new-secrets-master-key" description:"New base64-encoded 32-byte secrets master key." env:"NEW_SECRETS_MASTER_KEY"`
	NewSecretsMasterKeyFile string `long:"new-secrets-master-key-file" description:"Path to file containing new base64-encoded 32-byte secrets master key." env:"NEW_SECRETS_MASTER_KEY_FILE"`
}

func (c *rewrapSecretsMasterKeyCommand) Execute(args []string) error {
	oldKey, err := loadCLISecretsMasterKey(c.OldSecretsMasterKey, c.OldSecretsMasterKeyFile, "old")
	if err != nil {
		errExit(err)
	}
	newKey, err := loadCLISecretsMasterKey(c.NewSecretsMasterKey, c.NewSecretsMasterKeyFile, "new")
	if err != nil {
		errExit(err)
	}

	if err := validateExistingBoltPath(c.BoltPath); err != nil {
		errExit(err)
	}

	store, err := NewBoltClient(c.BoltPath)
	if err != nil {
		return err
	}
	defer store.Close()

	svc, err := NewService(store)
	if err != nil {
		return err
	}

	if err := svc.RewrapSecretDEK(context.Background(), oldKey, newKey); err != nil {
		errExit(err)
	}

	fmt.Println("Successfully rewrapped DEK with new secrets master key")
	return nil
}

func loadCLISecretsMasterKey(value, filePath, label string) ([]byte, error) {
	if value != "" && filePath != "" {
		return nil, fmt.Errorf("%s secrets master key must be provided by value or file, not both", label)
	}
	if value == "" && filePath == "" {
		return nil, fmt.Errorf("%s secrets master key is required", label)
	}

	raw := value
	if filePath != "" {
		b, err := os.ReadFile(filePath)
		if err != nil {
			return nil, fmt.Errorf("reading %s secrets master key file: %w", label, err)
		}
		raw = string(b)
	}
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, fmt.Errorf("%s secrets master key is empty", label)
	}

	key, err := base64.StdEncoding.DecodeString(raw)
	if err != nil {
		return nil, fmt.Errorf("decoding %s secrets master key: %w", label, err)
	}
	if len(key) != 32 {
		return nil, errors.New("secrets master key must decode to 32 bytes")
	}
	return key, nil
}
