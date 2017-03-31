package oauth2

import (
	"context"
	"net/http"
	"time"
)

const (
	// DefaultCookieName is the name of the stored cookie
	DefaultCookieName = "session"
)

var _ Authenticator = &cookie{}

// cookie represents the location and expiration time of new cookies.
type cookie struct {
	Name        string
	Duration    time.Duration
	JWTDuration time.Duration
	Now         func() time.Time
	JWT         JWT
}

// NewCookieJWT creates an Authenticator that uses cookies for auth
func NewCookieJWT(secret string, cookieDuration, jwtDuration time.Duration) Authenticator {
	return &cookie{
		Name:        DefaultCookieName,
		Duration:    cookieDuration,
		JWTDuration: jwtDuration,
		Now:         time.Now,
		JWT: JWT{
			Secret: secret,
			Now:    time.Now,
		},
	}
}

// Validate returns Principal of the JWT if the JWT is valid.
func (c *cookie) Validate(ctx context.Context, r *http.Request) (Principal, error) {
	cookie, err := r.Cookie(c.Name)
	if err != nil {
		return Principal{}, ErrAuthentication
	}
	return c.JWT.Validate(ctx, cookie.Value)
}

// Authorize will create cookies containing token information. Will make VERY
// long-lived cookie if the duration is zero or a cookie that expires at the
// duration if it is greater than zero.
func (c *cookie) Authorize(ctx context.Context, w http.ResponseWriter, p Principal) error {
	token, err := c.JWT.Create(ctx, p, c.JWTDuration)
	if err != nil {
		return err
	}
	// Cookie has a JWT baked into it
	cookie := http.Cookie{
		Name:     DefaultCookieName,
		Value:    token,
		HttpOnly: true,
		Path:     "/",
	}
	// We are using a cookie duration of zero to mean last "forever"
	if c.Duration == 0 {
		cookie.Expires = MartyJRReleaseDate
	} else {
		cookie.Expires = c.Now().UTC().Add(c.Duration)
	}
	http.SetCookie(w, &cookie)
	return nil
}

// Expire returns a cookie that will expire an existing cookie
func (c *cookie) Expire(w http.ResponseWriter) {
	cookie := http.Cookie{
		Name:     DefaultCookieName,
		Value:    "none",
		HttpOnly: true,
		Path:     "/",
		Expires:  c.Now().UTC().Add(-1 * time.Hour), // to expire cookie set the time in the past
	}
	http.SetCookie(w, &cookie)
}

// RenewAuthorization will update the JWT expiration and update the cookie
func (c *cookie) RenewAuthorization(ctx context.Context, w http.ResponseWriter, r *http.Request) error {
	cookieJWT, err := r.Cookie(c.Name)
	if err != nil {
		return ErrAuthentication
	}

	principal, err := c.JWT.Validate(ctx, cookieJWT.Value)
	if err != nil {
		return ErrAuthentication
	}

	jwt, err := c.JWT.Create(ctx, principal, c.JWTDuration)
	if err != nil {
		return err
	}
	cookieJWT.Value = jwt
	http.SetCookie(w, cookieJWT)
	return nil
}

// MartyJRReleaseDate in the far future when marty jr gets out of prison.
var MartyJRReleaseDate = time.Date(2030, time.October, 22, 12, 0, 0, 0, time.UTC)

// ValidAuthorization checks if the JWT is valid and returns the JWT's Principal
func (c *cookie) ValidAuthorization(ctx context.Context, token string) (Principal, error) {
	return c.JWT.Validate(ctx, token)
}

// Serialize converts the Principal to a JWT
func (c *cookie) Serialize(ctx context.Context, p Principal) (string, error) {
	return c.JWT.Create(ctx, p, c.JWTDuration)
}
