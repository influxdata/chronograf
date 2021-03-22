package oauth2

import (
	"net/http"
	"path"
	"time"

	"github.com/influxdata/chronograf"
)

// Check to ensure AuthMux is an oauth2.Mux
var _ Mux = &AuthMux{}

// TenMinutes is the default length of time to get a response back from the OAuth provider
const TenMinutes = 10 * time.Minute

// NewAuthMux constructs a Mux handler that checks a cookie against the authenticator
func NewAuthMux(p Provider, a Authenticator, t Tokenizer,
	basepath string, l chronograf.Logger,
	UseIDToken bool, LoginHint string,
	client *http.Client, codeExchange CodeExchange,
) *AuthMux {
	if codeExchange == nil {
		codeExchange = simpleTokenExchange
	}
	mux := &AuthMux{
		Provider:     p,
		Auth:         a,
		Tokens:       t,
		SuccessURL:   path.Join(basepath, "/"),
		FailureURL:   path.Join(basepath, "/login"),
		Now:          DefaultNowTime,
		Logger:       l,
		UseIDToken:   UseIDToken,
		LoginHint:    LoginHint,
		CodeExchange: codeExchange,
	}

	if client != nil {
		mux.client = client
	}

	return mux
}

// AuthMux services an Oauth2 interaction with a provider and browser and
// stores the resultant token in the user's browser as a cookie. The benefit of
// this is that the cookie's authenticity can be verified independently by any
// Chronograf instance as long as the Authenticator has no external
// dependencies (e.g. on a Database).
type AuthMux struct {
	Provider     Provider          // Provider is the OAuth2 service
	Auth         Authenticator     // Auth is used to Authorize after successful OAuth2 callback and Expire on Logout
	Tokens       Tokenizer         // Tokens is used to create and validate OAuth2 "state"
	Logger       chronograf.Logger // Logger is used to give some more information about the OAuth2 process
	SuccessURL   string            // SuccessURL is redirect location after successful authorization
	FailureURL   string            // FailureURL is redirect location after authorization failure
	Now          func() time.Time  // Now returns the current time (for testing)
	UseIDToken   bool              // UseIDToken enables OpenID id_token support
	LoginHint    string            // LoginHint will be included as a parameter during authentication if non-nil
	client       *http.Client      // client is the http client used in oauth exchange.
	CodeExchange CodeExchange      // helps with CSRF in exchange of token for authorization code
}

// Login returns a handler that redirects to the providers OAuth login.
func (j *AuthMux) Login() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		url, err := j.CodeExchange.AuthCodeURL(r.Context(), j)
		if err != nil {
			j.Logger.
				WithField("component", "auth").
				WithField("remote_addr", r.RemoteAddr).
				WithField("method", r.Method).
				WithField("url", r.URL).
				Error("Internal authentication error: ", err.Error())
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		http.Redirect(w, r, url, http.StatusTemporaryRedirect)
	})
}

// Callback is used by OAuth2 provider after authorization is granted.  If
// granted, Callback will set a cookie with a month-long expiration.  It is
// recommended that the value of the cookie be encoded as a JWT because the JWT
// can be validated without the need for saving state. The JWT contains the
// principal's identifier (e.g.  email address).
func (j *AuthMux) Callback() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log := j.Logger.
			WithField("component", "auth").
			WithField("remote_addr", r.RemoteAddr).
			WithField("method", r.Method).
			WithField("url", r.URL)

		state := r.FormValue("state")
		code := r.FormValue("code")

		token, err := j.CodeExchange.ExchangeCodeForToken(r.Context(), state, code, j)
		if err != nil {
			log.Error("Unable to exchange code for token ", err.Error())
			http.Redirect(w, r, j.FailureURL, http.StatusTemporaryRedirect)
			return
		}

		if token.Extra("id_token") != nil && !j.UseIDToken {
			log.Info("found an extra id_token, but option --useidtoken is not set")
		}

		// if we received an extra id_token, inspect it
		var id string
		var group string
		if j.UseIDToken && token.Extra("id_token") != nil && token.Extra("id_token") != "" {
			log.Debug("found an extra id_token")
			if provider, ok := j.Provider.(ExtendedProvider); ok {
				log.Debug("provider implements PrincipalIDFromClaims()")
				tokenString, ok := token.Extra("id_token").(string)
				if !ok {
					log.Error("cannot cast id_token as string")
					http.Redirect(w, r, j.FailureURL, http.StatusTemporaryRedirect)
					return
				}
				claims, err := j.Tokens.GetClaims(tokenString)
				if err != nil {
					log.Error("parsing extra id_token failed:", err)
					http.Redirect(w, r, j.FailureURL, http.StatusTemporaryRedirect)
					return
				}
				log.Debug("found claims: ", claims)
				id, err = provider.PrincipalIDFromClaims(claims)
				if err != nil {
					log.Error("requested claim not found in id_token:", err)
					http.Redirect(w, r, j.FailureURL, http.StatusTemporaryRedirect)
					return
				}
				group, err = provider.GroupFromClaims(claims)
				if err != nil {
					log.Error("requested claim not found in id_token:", err)
					http.Redirect(w, r, j.FailureURL, http.StatusTemporaryRedirect)
					return
				}
			} else {
				log.Debug("provider does not implement PrincipalIDFromClaims()")
			}
		} else {
			// otherwise perform an additional lookup
			oauthClient := j.Provider.Config().Client(r.Context(), token)
			// Using the token get the principal identifier from the provider
			id, err = j.Provider.PrincipalID(oauthClient)
			if err != nil {
				log.Error("Unable to get principal identifier ", err.Error())
				http.Redirect(w, r, j.FailureURL, http.StatusTemporaryRedirect)
				return
			}
			group, err = j.Provider.Group(oauthClient)
			if err != nil {
				log.Error("Unable to get OAuth Group", err.Error())
				http.Redirect(w, r, j.FailureURL, http.StatusTemporaryRedirect)
				return
			}
		}

		p := Principal{
			Subject: id,
			Issuer:  j.Provider.Name(),
			Group:   group,
		}
		err = j.Auth.Authorize(r.Context(), w, p)
		if err != nil {
			log.Error("Unable to get add session to response ", err.Error())
			http.Redirect(w, r, j.FailureURL, http.StatusTemporaryRedirect)
			return
		}
		log.Info("User ", id, " is authenticated")
		http.Redirect(w, r, j.SuccessURL, http.StatusTemporaryRedirect)
	})
}

// Logout handler will expire our authentication cookie and redirect to the successURL
func (j *AuthMux) Logout() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		j.Auth.Expire(w)
		http.Redirect(w, r, j.SuccessURL, http.StatusTemporaryRedirect)
	})
}
