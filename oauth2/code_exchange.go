package oauth2

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"io"

	"golang.org/x/oauth2"
)

// CodeExchange helps to ensure secure exchange
// of the authorization code for token.
type CodeExchange interface {
	// AuthCodeURL generates authorization URL with a state that prevents CSRF attacks.
	// It can also use OAuth2 PKCE.
	AuthCodeURL(ctx context.Context, j *AuthMux) (string, error)
	// ExchangeCodeForToken receives authorization token having a verified state and code
	ExchangeCodeForToken(ctx context.Context, state, code string, j *AuthMux) (*oauth2.Token, error)
}

// default implementation
var simpleTokenExchange CodeExchange = &CodeExchangeCSRF{}

func NewCodeExchange(withPKCE bool, secret string) CodeExchange {
	if withPKCE {
		return &CodeExchangePKCE{Secret: secret}
	}
	return simpleTokenExchange
}

// CodeExchangeCSRF prevents CSRF attacks during retrieval of OAuth token
// by using a signed random state in the exchange with authorization server.
// It uses a random string as the state validation method. The state is a JWT. It is
// a good choice here for encoding because they can be validated without
// storing state.
type CodeExchangeCSRF struct {
}

// AuthCodeURL generates authorization URL with a state that prevents CSRF attacks.
func (p *CodeExchangeCSRF) AuthCodeURL(ctx context.Context, j *AuthMux) (string, error) {
	// We are creating a token with an encoded random string to prevent CSRF attacks
	// This token will be validated during the OAuth callback.
	// We'll give our users 10 minutes from this point to type in their
	// oauth2 provider's password.
	// If the callback is not received within 10 minutes, then authorization will fail.
	csrf := make([]byte, 32) // 32 is not important... just long
	if _, err := io.ReadFull(rand.Reader, csrf); err != nil {
		return "", err
	}

	now := j.Now()

	// This token will be valid for 10 minutes.  Any chronograf server will
	// be able to validate this token.
	stateData := Principal{
		Subject:   base64.RawURLEncoding.EncodeToString(csrf),
		IssuedAt:  now,
		ExpiresAt: now.Add(TenMinutes),
	}
	token, err := j.Tokens.Create(ctx, stateData)
	if err != nil {
		return "", err
	}

	urlOpts := []oauth2.AuthCodeOption{oauth2.AccessTypeOnline}
	if j.LoginHint != "" {
		urlOpts = append(urlOpts, oauth2.SetAuthURLParam("login_hint", j.LoginHint))
	}
	url := j.Provider.Config().AuthCodeURL(string(token), urlOpts...)
	return url, nil
}

func (p *CodeExchangeCSRF) ExchangeCodeForToken(ctx context.Context, state, code string, j *AuthMux) (*oauth2.Token, error) {
	// Check if the OAuth state token is valid to prevent CSRF
	// The state variable we set is actually a token.  We'll check
	// if the token is valid.  We don't need to know anything
	// about the contents of the principal only that it hasn't expired.
	if _, err := j.Tokens.ValidPrincipal(ctx, Token(state), TenMinutes); err != nil {
		return nil, fmt.Errorf("invalid OAuth state received: %v", err.Error())
	}

	// Exchange the code back with the provider to the the token
	conf := j.Provider.Config()

	// Use http client with transport options.
	if j.client != nil {
		ctx = context.WithValue(ctx, oauth2.HTTPClient, j.client)
	}

	return conf.Exchange(ctx, code)
}

// CodeExchangePKCE extends CodeExchangeCSRF and adds OAuth2 PKCE
// to protect against interception attacks. See RFC7636 for details.
type CodeExchangePKCE struct {
	// Secret is used encrypt PKCE code verifier in the state data. The state
	// data are chosen to avoid the need for the server to remember the sate.
	Secret string
}

// Encrypt encrypts the codeVerifier supplied
func (c *CodeExchangePKCE) Encrypt(codeVerifier []byte) (string, error) {
	// create a AES256 key out of secret
	key := sha256.Sum256([]byte(c.Secret))

	// create a cipher
	block, err := aes.NewCipher(key[:32])
	if err != nil {
		return "", err
	}
	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	// create a nonce for the cipher
	nonce := make([]byte, aesGCM.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	// encrypt the data
	cipherText := aesGCM.Seal(nonce, nonce, codeVerifier, nil)
	return base64.RawURLEncoding.EncodeToString(cipherText), nil
}

// Decrypt decrypts the supplied encrypted string
func (c *CodeExchangePKCE) Decrypt(encrypted string) ([]byte, error) {
	// create a AES256 key out of secret
	key := sha256.Sum256([]byte(c.Secret))
	enc, err := base64.RawURLEncoding.Strict().DecodeString(encrypted)
	if err != nil {
		return []byte{}, err
	}

	// create a new cipher
	block, err := aes.NewCipher(key[:32])
	if err != nil {
		return []byte{}, err
	}
	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return []byte{}, err
	}

	// separate nonce and cipherText
	nonceSize := aesGCM.NonceSize()
	if len(enc) <= nonceSize {
		return []byte{}, errors.New("malformed encrypted data")
	}
	nonce, cipherText := enc[:nonceSize], enc[nonceSize:]

	// decrypt
	plain, err := aesGCM.Open(nil, nonce, cipherText, nil)
	if err != nil {
		return []byte{}, err
	}
	return plain, nil

}

// AuthCodeURL generates authorization URL with PKCE
// challenge parameters and a state that prevents CSRF and.
func (p *CodeExchangePKCE) AuthCodeURL(ctx context.Context, j *AuthMux) (string, error) {
	// generate code verifier
	codeVerifier := make([]byte, 32)
	if _, err := io.ReadFull(rand.Reader, codeVerifier); err != nil {
		return "", err
	}

	// encrypt code verifier so it can be added to state,
	// we don't need to remember it on the server side then
	encryptedCodeVerifier, err := p.Encrypt(codeVerifier)
	if err != nil {
		return "", err
	}

	now := j.Now()
	// This token will be valid for 10 minutes.  Any chronograf server will
	// be able to validate this token.
	stateData := Principal{
		Subject:   encryptedCodeVerifier,
		IssuedAt:  now,
		ExpiresAt: now.Add(TenMinutes),
	}
	token, err := j.Tokens.Create(ctx, stateData)
	if err != nil {
		return "", err
	}

	// setup URL options including PKCE code challenge
	codeVerifierDigest := sha256.Sum256([]byte(
		base64.RawURLEncoding.EncodeToString(codeVerifier),
	))
	codeChallenge := base64.RawURLEncoding.EncodeToString(
		codeVerifierDigest[:],
	)
	urlOpts := make([]oauth2.AuthCodeOption, 0, 4)
	urlOpts = append(urlOpts,
		oauth2.AccessTypeOnline,
		oauth2.SetAuthURLParam("code_challenge", codeChallenge),
		oauth2.SetAuthURLParam("code_challenge_method", "S256"),
	)
	if j.LoginHint != "" {
		urlOpts = append(urlOpts, oauth2.SetAuthURLParam("login_hint", j.LoginHint))
	}
	url := j.Provider.Config().AuthCodeURL(string(token), urlOpts...)
	return url, nil
}

func (p *CodeExchangePKCE) ExchangeCodeForToken(ctx context.Context, state, code string, j *AuthMux) (*oauth2.Token, error) {
	// Check if the OAuth state token is valid.
	stateData, err := j.Tokens.ValidPrincipal(ctx, Token(state), TenMinutes)
	if err != nil {
		return nil, fmt.Errorf("invalid OAuth state received: %v", err.Error())
	}
	codeVerifier, err := p.Decrypt(stateData.Subject)
	if err != nil {
		return nil, fmt.Errorf("invalid OAuth state received: %v", err.Error())
	}

	// Exchange the code back with the provider to the the token
	conf := j.Provider.Config()

	// Use http client with transport options.
	if j.client != nil {
		ctx = context.WithValue(ctx, oauth2.HTTPClient, j.client)
	}

	// exhange code for token with PKCE code_verifier supplied
	return conf.Exchange(ctx,
		code,
		oauth2.SetAuthURLParam("code_verifier", base64.RawURLEncoding.EncodeToString(codeVerifier)),
	)
}
