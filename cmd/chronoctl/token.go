package main

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"

	flags "github.com/jessevdk/go-flags"
)

func init() {
	parser.AddCommand("token",
		"Get current token for superadmin user (if configured)",
		"Token gets and signs the nonce, providing an expiring token to use in the header: 'Authorization: CHRONOGRAF-SHA256 xxx'",
		&tokenCommand{})
}

type tokenCommand struct {
	ChronoURL   string         `long:"chronograf-url" default:"http://localhost:8888" description:"Chronograf's URL." env:"CHRONOGRAF_URL"`
	PrivKeyFile flags.Filename `long:"priv-key-file" description:"File location of private key for superadmin token authentication." env:"PRIV_KEY_FILE"`
}

func (t *tokenCommand) Execute(args []string) error {
	key, err := parsePrivKey(string(t.PrivKeyFile))
	if err != nil {
		errExit(fmt.Errorf("Failed to parse RSA key: %s", err.Error()))
	}

	msg, err := getNonceMsg(t.ChronoURL)
	if err != nil {
		errExit(err)
	}

	dgst, err := signMsg(msg, key)
	if err != nil {
		errExit(fmt.Errorf("Failed to sign: %s", err.Error()))
	}

	fmt.Println(base64.StdEncoding.EncodeToString(dgst))
	return nil
}

func parsePrivKey(privKeyFile string) (*rsa.PrivateKey, error) {
	if privKeyFile == "" {
		errExit(errors.New("No private key file specified"))
	}

	pemBytes, err := ioutil.ReadFile(string(privKeyFile))
	if err != nil {
		errExit(fmt.Errorf("Failed to read file: %s", err.Error()))
	}

	block, _ := pem.Decode(pemBytes)
	if block == nil {
		errExit(errors.New("No PEM formatted key found"))
	} else if block.Type != "RSA PRIVATE KEY" {
		errExit(fmt.Errorf("Unsupported key type %q", block.Type))
	}

	return x509.ParsePKCS1PrivateKey(block.Bytes)
}

func getNonceMsg(url string) ([]byte, error) {
	req, err := http.NewRequest("GET", url+"/nonce", nil)
	if err != nil {
		errExit(fmt.Errorf("Failed to create request: %s", err.Error()))
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		errExit(fmt.Errorf("Failed to get nonce: %s", err.Error()))
	}
	defer resp.Body.Close()

	return ioutil.ReadAll(resp.Body)
}

func signMsg(msg []byte, key *rsa.PrivateKey) ([]byte, error) {
	h := crypto.SHA256.New()
	h.Write(msg)
	d := h.Sum(nil)

	return rsa.SignPKCS1v15(rand.Reader, key, crypto.SHA256, d)
}
