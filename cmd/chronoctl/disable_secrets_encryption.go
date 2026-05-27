package main

import (
	"context"
	"fmt"
)

func init() {
	parser.AddCommand("disable-secrets-encryption",
		"Disable secrets encryption and rewrite persisted secrets to plaintext.",
		"Decrypt stored secrets in BoltDB and remove wrapped DEK. Requires current secrets master key.",
		&disableSecretsEncryptionCommand{})
}

type disableSecretsEncryptionCommand struct {
	BoltPath string `short:"b" long:"bolt-path" description:"Full path to boltDB file (e.g. './chronograf-v1.db')" env:"BOLT_PATH" default:"chronograf-v1.db"`

	SecretsMasterKey     string `long:"secrets-master-key" description:"Current base64-encoded 32-byte secrets master key." env:"SECRETS_MASTER_KEY"`
	SecretsMasterKeyFile string `long:"secrets-master-key-file" description:"Path to file containing current base64-encoded 32-byte secrets master key." env:"SECRETS_MASTER_KEY_FILE"`
}

func (c *disableSecretsEncryptionCommand) Execute(args []string) error {
	key, err := loadCLISecretsMasterKey(c.SecretsMasterKey, c.SecretsMasterKeyFile, "current")
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

	if err := svc.DisableSecretEncryption(context.Background(), key); err != nil {
		errExit(err)
	}

	fmt.Println("Successfully disabled secrets encryption and removed wrapped DEK")
	return nil
}
