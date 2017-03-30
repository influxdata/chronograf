package oauth2

import (
	"context"
	"net/http"
	"time"
)

// InorganicCookie generates a cookie
type InorganicCookie struct {
	Now func() time.Time
}

// Generate will create cookies containing token information. Will make VERY
// long-lived cookie if the duration is zero or a cookie that expires at the
// duration if it is greater than zero.
func (c *InorganicCookie) Generate(ctx context.Context, name, token string, expires time.Duration) http.Cookie {
	cookie := http.Cookie{
		Name:     name,
		Value:    token,
		HttpOnly: true,
		Path:     "/",
	}
	if expires == 0 {
		cookie.Expires = MartyJRReleaseDate
	} else {
		cookie.Expires = c.Now().UTC().Add(expires)
	}
	return cookie
}
