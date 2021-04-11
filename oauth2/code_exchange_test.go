package oauth2

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	clog "github.com/hws522/chronograf/log"
	"github.com/stretchr/testify/require"
)

func Test_CodeExchangeCSRF_AuthCodeURL(t *testing.T) {
	// setup auth mux
	mt := &YesManTokenizer{}
	auth := &cookie{
		Name:       DefaultCookieName,
		Lifespan:   1 * time.Hour,
		Inactivity: defaultInactivityDuration,
		Now: func() time.Time {
			return testTime
		},
		Tokens: mt,
	}
	useidtoken := false
	mp := &MockProvider{
		Email:       "biff@example.com",
		ProviderURL: "http://localhost:1234",
		Orgs:        "",
	}
	authMux := NewAuthMux(mp, auth, mt, "", clog.New(clog.ParseLevel("debug")), useidtoken, "hello", nil, nil)

	// create AuthCodeURL with code exchange without PKCE
	codeExchange := NewCodeExchange(false, "")
	authCodeURLString, err := codeExchange.AuthCodeURL(context.Background(), authMux)
	require.Nil(t, err, "Unable to generate AuthCodeURL")
	authCodeURL, err := url.ParseRequestURI(authCodeURLString)
	require.Nil(t, err, "AuthCodeURL format invalid")

	expectedParams := map[string]string{
		"access_type":   "online",
		"client_id":     "",
		"state":         "",
		"response_type": "code",
		"redirect_uri":  "",
		"login_hint":    "hello",
	}
	queryParams := authCodeURL.Query()
	for key, val := range expectedParams {
		foundVal := queryParams.Get(key)
		if foundVal == "" {
			t.Errorf("Generated AuthCodeURL does not contain '%v' param", key)
			continue
		}
		if val != "" && val != foundVal {
			t.Errorf("Generated AuthCodeURL contains different '%v' param; expected: %s, got: %s", key, val, foundVal)
			continue
		}
	}
	if len(expectedParams) != len(queryParams) {
		t.Errorf("Generated AuthCodeURL contains %d params; expected: %d, url: %s", len(queryParams), len(expectedParams), authCodeURL)
	}
}

func Test_CodeExchangeCSRF_ExchangeCodeForToken(t *testing.T) {
	// mock authorization provider
	const testToken = "fake.token"
	exchangeUrlValues := url.Values{}
	authServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		rw.Header().Set("content-type", "application/json")
		rw.WriteHeader(http.StatusOK)
		r.ParseForm()
		exchangeUrlValues = r.Form

		body, _ := json.Marshal(mockCallbackResponse{AccessToken: testToken})

		rw.Write(body)
	}))
	defer authServer.Close()

	// setup auth mux
	auth := &cookie{
		Name:       DefaultCookieName,
		Lifespan:   1 * time.Hour,
		Inactivity: defaultInactivityDuration,
		Tokens:     &YesManTokenizer{},
	}
	useidtoken := false
	mp := &MockProvider{
		Email:       "biff@example.com",
		ProviderURL: authServer.URL,
		Orgs:        "",
	}
	authMux := NewAuthMux(mp, auth, auth.Tokens, "", clog.New(clog.ParseLevel("debug")), useidtoken, "hi", nil, nil)

	// create AuthCodeURL using CodeExchange with PKCE
	codeExchange := simpleTokenExchange
	authCodeURLString, err := codeExchange.AuthCodeURL(context.Background(), authMux)
	require.Nil(t, err, "Unable to generate AuthCodeURL")
	authCodeURL, err := url.ParseRequestURI(authCodeURLString)
	require.Nil(t, err, "AuthCodeURL format invalid")
	state := authCodeURL.Query().Get("state")
	token, err := codeExchange.ExchangeCodeForToken(context.Background(), state, "any code", authMux)
	require.Nil(t, err, "ExchangeCodeForToken ends with error")
	require.NotNil(t, token, "No token received")
	require.Equal(t, testToken, token.AccessToken)
	expectedParams := []string{"code"}
	for _, key := range expectedParams {
		foundVal := exchangeUrlValues.Get(key)
		if foundVal == "" {
			t.Errorf("Authorization server did not receive the required %s parameter; values=%v", key, exchangeUrlValues)
			continue
		}
	}
}

func Test_CodeExchangePKCE_AuthCodeURL(t *testing.T) {
	// setup auth mux
	mt := &YesManTokenizer{}
	auth := &cookie{
		Name:       DefaultCookieName,
		Lifespan:   1 * time.Hour,
		Inactivity: defaultInactivityDuration,
		Now: func() time.Time {
			return testTime
		},
		Tokens: mt,
	}
	useidtoken := false
	mp := &MockProvider{
		Email:       "biff@example.com",
		ProviderURL: "http://localhost:1234",
		Orgs:        "",
	}
	authMux := NewAuthMux(mp, auth, mt, "", clog.New(clog.ParseLevel("debug")), useidtoken, "hi", nil, nil)

	// create AuthCodeURL using CodeExchange with PKCE
	codeExchange := NewCodeExchange(true, "secret")
	authCodeURLString, err := codeExchange.AuthCodeURL(context.Background(), authMux)
	require.Nil(t, err, "Unable to generate AuthCodeURL")
	authCodeURL, err := url.ParseRequestURI(authCodeURLString)
	require.Nil(t, err, "Invalid AuthCodeURL format")

	expectedParams := map[string]string{
		"access_type":           "online",
		"client_id":             "",
		"state":                 "",
		"response_type":         "code",
		"redirect_uri":          "",
		"code_challenge":        "",
		"code_challenge_method": "",
		"login_hint":            "hi",
	}
	queryParams := authCodeURL.Query()
	for key, val := range expectedParams {
		foundVal := queryParams.Get(key)
		if foundVal == "" {
			t.Errorf("Generated AuthCodeURL does not contain '%v' param", key)
			continue
		}
		if val != "" && val != foundVal {
			t.Errorf("Generated AuthCodeURL contains different '%v' param; expected: %s, got: %s", key, val, foundVal)
			continue
		}
	}
	if len(expectedParams) != len(queryParams) {
		t.Errorf("Generated AuthCodeURL contains %d params; expected: %d, url: %s", len(queryParams), len(expectedParams), authCodeURL)
	}
}

func Test_CodeExchangePKCE_EncryptDecrypt(t *testing.T) {
	codeExchange := &CodeExchangePKCE{Secret: "hardtoguess"}
	plain := []byte("this is a test")
	encrypted, err := codeExchange.Encrypt([]byte(plain))
	require.Nil(t, err, "Unable to encrypt plain text ")
	decrypted, err := codeExchange.Decrypt(encrypted)
	require.Nil(t, err, "Unable to decrypt plain text")
	require.Equal(t, plain, decrypted)
}

func Test_CodeExchangePKCE_ExchangeCodeForToken(t *testing.T) {
	// mock authorization provider
	const testToken = "fake.token"
	exchangeUrlValues := url.Values{}
	authServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		rw.Header().Set("content-type", "application/json")
		rw.WriteHeader(http.StatusOK)
		r.ParseForm()
		exchangeUrlValues = r.Form

		body, _ := json.Marshal(mockCallbackResponse{AccessToken: testToken})

		rw.Write(body)
	}))
	defer authServer.Close()

	// setup auth mux
	secret := "this is a test secret"
	jwt := NewJWT(secret, "")
	auth := &cookie{
		Name:       DefaultCookieName,
		Lifespan:   1 * time.Hour,
		Inactivity: defaultInactivityDuration,
		Tokens:     jwt,
	}
	useidtoken := false
	mp := &MockProvider{
		Email:       "biff@example.com",
		ProviderURL: authServer.URL,
		Orgs:        "",
	}
	authMux := NewAuthMux(mp, auth, jwt, "", clog.New(clog.ParseLevel("debug")), useidtoken, "hi", nil, nil)

	// create AuthCodeURL using CodeExchange with PKCE
	codeExchange := CodeExchangePKCE{Secret: secret}
	authCodeURLString, err := codeExchange.AuthCodeURL(context.Background(), authMux)
	require.Nil(t, err, "Unable to generate AuthCodeURL")
	authCodeURL, err := url.ParseRequestURI(authCodeURLString)
	require.Nil(t, err, "Invalid AuthCodeURL format")
	state := authCodeURL.Query().Get("state")
	token, err := codeExchange.ExchangeCodeForToken(context.Background(), state, "any code", authMux)
	require.Nil(t, err)
	require.NotNil(t, token)
	require.Equal(t, testToken, token.AccessToken)
	stateData, err := jwt.ValidPrincipal(context.Background(), Token(state), TenMinutes)
	require.Nil(t, err, "invalid OAuth state received")
	codeVerifierBytes, err := codeExchange.Decrypt(stateData.Subject)
	require.Nil(t, err, "unable to decrypt code verifier")
	codeVerifier := base64.RawURLEncoding.EncodeToString(codeVerifierBytes)
	expectedParams := map[string]string{
		"code":          "",
		"code_verifier": codeVerifier,
	}
	if len(expectedParams["code_verifier"]) < 43 {
		t.Errorf("Code verifier must be at least 43 characters long, but it is %d; code_verifier=%s", len(codeVerifier), codeVerifier)
	}
	for key, val := range expectedParams {
		foundVal := exchangeUrlValues.Get(key)
		if foundVal == "" {
			t.Errorf("Authorization server did not receive the required %s parameter; values=%v", key, exchangeUrlValues)
			continue
		}
		if val != "" && val != foundVal {
			t.Errorf("Authorization Server receveid different '%v' param; expected: %s, got: %s", key, val, foundVal)
			continue
		}
	}
}
