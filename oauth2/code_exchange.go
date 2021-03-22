package oauth2

import (
	"context"
	"crypto/rand"
	"encoding/base64"
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

func NewCodeExchange(withPKCE bool) CodeExchange {
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
	csrf := randomString(32) // 32 is not important... just long
	now := j.Now()

	// This token will be valid for 10 minutes.  Any chronograf server will
	// be able to validate this token.
	stateData := Principal{
		Subject:   csrf,
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

func randomString(length int) string {
	k := make([]byte, length)
	if _, err := io.ReadFull(rand.Reader, k); err != nil {
		return ""
	}
	// use the simplest encoding that is also required by PKCE
	return base64.RawURLEncoding.EncodeToString(k)
}
