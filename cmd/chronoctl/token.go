package main

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/tls"
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
		"Get current token for a superadmin user (chronograf must be started with a public key)",
		"Token gets and signs the nonce, providing an expiring token to use in the header: 'Authorization: CHRONOGRAF-SHA256 xxx'",
		&tokenCommand{})
}

type tokenCommand struct {
	ChronoURL   string         `long:"chronograf-url" default:"http://localhost:8888" description:"Chronograf's URL." env:"CHRONOGRAF_URL"`
	SkipVerify  bool           `long:"skip-verify" short:"k" description:"Don't verify TLS cert at endpoint (allows self-signed certs)."`
	PrivKeyFile flags.Filename `long:"priv-key-file" description:"File location of private key (corresponding to the public key chronograf was started with) for superadmin token authentication." env:"PRIV_KEY_FILE"`
}

func (t *tokenCommand) Execute(args []string) error {
	key, err := parsePrivKey(string(t.PrivKeyFile))
	if err != nil {
		errExit(fmt.Errorf("failed to parse RSA key: %s", err.Error()))
	}

	msg, err := getNonceMsg(t.ChronoURL, t.SkipVerify)
	if err != nil {
		errExit(err)
	}

	dgst, err := signMsg(msg, key)
	if err != nil {
		errExit(fmt.Errorf("failed to sign: %s", err.Error()))
	}

	fmt.Println(base64.StdEncoding.EncodeToString(dgst))
	return nil
}

func parsePrivKey(privKeyFile string) (*rsa.PrivateKey, error) {
	if privKeyFile == "" {
		return nil, errors.New("no private key file specified")
	}

	pemBytes, err := ioutil.ReadFile(string(privKeyFile))
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %s", err.Error())
	}

	block, _ := pem.Decode(pemBytes)
	if block == nil {
		return nil, errors.New("no PEM formatted key found")
	} else if block.Type != "RSA PRIVATE KEY" {
		return nil, fmt.Errorf("unsupported key type %q", block.Type)
	}

	return x509.ParsePKCS1PrivateKey(block.Bytes)
}

func getNonceMsg(url string, insecureSkipVerify bool) ([]byte, error) {
	req, err := http.NewRequest("GET", url+"/nonce", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %s", err.Error())
	}

	hc := &http.Client{
		Transport: &http.Transport{
			Proxy:           http.ProxyFromEnvironment,
			TLSClientConfig: &tls.Config{InsecureSkipVerify: insecureSkipVerify},
		},
	}

	resp, err := hc.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get nonce: %s", err.Error())
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
