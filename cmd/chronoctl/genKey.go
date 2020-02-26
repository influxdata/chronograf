package main

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"fmt"
	"io/ioutil"
	"os"

	flags "github.com/jessevdk/go-flags"
)

func init() {
	parser.AddCommand("gen-keypair",
		"Generate RSA keypair.",
		"Generate RSA keypair and write to filesystem.",
		&genKeyCommand{})
}

type genKeyCommand struct {
	Out  flags.Filename `long:"out" description:"File to save keys to. The public key is stored in a file with the same name with \".pub\" appended." default:"chronograf-rsa"`
	Bits int            `long:"bits" description:"Generate RSA keypair with the specified number of bits." default:"4096"`
}

func (t *genKeyCommand) Execute(args []string) error {
	_, err := os.Stat(string(t.Out))
	if err == nil {
		errExit(errors.New("Specify non-existant file to write to."))
	}

	_, err = os.Stat(string(t.Out) + ".pub")
	if err == nil {
		errExit(errors.New("Specify non-existant file.pub to write to."))
	}

	key, err := rsa.GenerateKey(rand.Reader, t.Bits)
	if err != nil {
		errExit(err)
	}

	ioutil.WriteFile(string(t.Out), pem.EncodeToMemory(&pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(key),
	}), 0600)

	ioutil.WriteFile(string(t.Out)+".pub", pem.EncodeToMemory(&pem.Block{
		Type:  "PUBLIC KEY",
		Bytes: x509.MarshalPKCS1PublicKey(key.Public().(*rsa.PublicKey)),
	}), 0644)

	fmt.Printf("Key pair generated and saved at %s and %s.pub\n", t.Out, t.Out)
	return nil
}
