package main

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"os"

	flags "github.com/jessevdk/go-flags"
)

func init() {
	parser.AddCommand("gen-secrets-master-key",
		"Generate secrets master key.",
		"Generate base64-encoded 32-byte key for Chronograf --secrets-master-key / --secrets-master-key-file.",
		&genSecretsMasterKeyCommand{})
}

type genSecretsMasterKeyCommand struct {
	Out flags.Filename `long:"out" description:"File to save the generated key (0600 permissions). If omitted, key is printed to stdout."`
}

func generateSecretsMasterKey() (string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(raw), nil
}

func (c *genSecretsMasterKeyCommand) Execute(args []string) error {
	key, err := generateSecretsMasterKey()
	if err != nil {
		errExit(err)
	}

	if c.Out == "" {
		fmt.Println(key)
		return nil
	}

	if _, err := os.Stat(string(c.Out)); err == nil {
		errExit(errors.New("Specify non-existant file to write to."))
	} else if !errors.Is(err, os.ErrNotExist) {
		errExit(err)
	}

	if err := os.WriteFile(string(c.Out), []byte(key+"\n"), 0600); err != nil {
		errExit(err)
	}

	fmt.Printf("Secrets master key generated and saved at %s\n", c.Out)
	return nil
}
