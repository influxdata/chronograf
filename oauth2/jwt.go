package oauth2

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/lestrrat-go/jwx/v2/jwa"
	"github.com/lestrrat-go/jwx/v2/jwk"
	"github.com/lestrrat-go/jwx/v2/jws"
	"github.com/lestrrat-go/jwx/v2/jwt"
)

// Ensure JWT conforms to the Tokenizer interface
var _ Tokenizer = &JWT{}

// JWT represents a javascript web token that can be validated or marshaled into string.
type JWT struct {
	Secret  string
	Jwksurl string
	Now     func() time.Time
	Cache   *jwk.Cache
	// Because oauth.JWT is an open struct where anybody can bypass
	// the constructor call to NewJWT(), there is no way to guarantee
	// initialization of the (oauth.JWT).Cache field. To overcome
	// this without chaing the design, we add a sync.Once variable
	// here such that the code to initialize (oauth.JWT).Cache is
	// definitely run, but only run once.
	initCacheOnce sync.Once
}

// NewJWT creates a new JWT using time.Now
// secret is used for signing and validating signatures (HS256/HMAC)
// jwksurl is used for validating RS256 signatures.
func NewJWT(secret string, jwksurl string) *JWT {
	return &JWT{
		Secret:  secret,
		Jwksurl: jwksurl,
		Now:     DefaultNowTime,
	}
}

func parseToken(src string, options ...jwt.ParseOption) (jwt.Token, error) {
	token, err := jwt.Parse([]byte(src), options...)
	if err != nil {
		// Hack to make the rror messages compatible with previous incarnation
		switch {
		case errors.Is(err, jwt.ErrInvalidIssuedAt()):
			return nil, fmt.Errorf(`Token used before issued`)
		case errors.Is(err, jwt.ErrTokenExpired()):
			return nil, fmt.Errorf(`Token is expired`)
		default:
		}
		return nil, err
	}
	return token, nil
}

// ValidPrincipal checks if the jwtToken is signed correctly and validates with Claims.  lifespan is the
// maximum valid lifetime of a token.  If the lifespan is 0 then the auth lifespan duration is not checked.
func (j *JWT) ValidPrincipal(ctx context.Context, jwtToken Token, lifespan time.Duration) (Principal, error) {

	var options = []jwt.ParseOption{
		jwt.WithKeyProvider(j),
		jwt.WithRequiredClaim(jwt.SubjectKey),
		jwt.WithClock(jwt.ClockFunc(j.Now)),
	}

	// If the duration of the claim is longer than the auth lifespan then this is
	// an invalid claim because server assumes that lifespan is the maximum possible
	// duration.  However, a lifespan of zero means that the duration comparison
	// against the auth duration is not needed.
	if lifespan > 0 {
		options = append(options, jwt.WithValidator(jwt.ValidatorFunc(func(_ context.Context, tok jwt.Token) jwt.ValidationError {
			exp := tok.Expiration().Round(time.Second)
			iat := tok.IssuedAt().Round(time.Second)

			// If the duration of the claim is longer than the auth lifespan then this is
			// an invalid claim because server assumes that lifespan is the maximum possible
			// duration.  However, a lifespan of zero means that the duration comparison
			// against the auth duration is not needed.
			if lifespan > 0 && exp.Sub(iat) > lifespan {
				return jwt.NewValidationError(fmt.Errorf("claims duration is different from auth lifespan"))
			}
			return nil
		})))
	}

	token, err := parseToken(string(jwtToken), options...)
	if err != nil {
		return Principal{}, err
	}

	var org, grp string
	if v, ok := token.Get(`org`); ok {
		if s, ok := v.(string); ok {
			org = s
		}
	}
	if v, ok := token.Get(`grp`); ok {
		if s, ok := v.(string); ok {
			grp = s
		}
	}

	return Principal{
		Subject:      token.Subject(),
		Issuer:       token.Issuer(),
		Organization: org,
		Group:        grp,
		ExpiresAt:    token.Expiration(),
		IssuedAt:     token.IssuedAt(),
	}, nil
}

func (j *JWT) initCache(ctx context.Context) {
	cache := jwk.NewCache(ctx)
	// Note: by default updates are checked every 15 minutes
	cache.Register(j.Jwksurl)
	j.Cache = cache
}

// FetchKeys implements jws.KeyProvider, and dynamically returns the
// appropriate key to verify the token
func (j *JWT) FetchKeys(ctx context.Context, sink jws.KeySink, sig *jws.Signature, msg *jws.Message) error {
	switch sig.ProtectedHeaders().Algorithm() {
	case jwa.HS256:
		sink.Key(jwa.HS256, []byte(j.Secret))
	case jwa.RS256:
		if j.Jwksurl == "" {
			return fmt.Errorf("JWKSURL not specified, cannot validate RS256 signature")
		}

		j.initCacheOnce.Do(func() {
			j.initCache(ctx)
		})

		set, err := j.Cache.Get(ctx, j.Jwksurl)
		if err != nil {
			return err
		}

		kid := sig.ProtectedHeaders().KeyID()
		if kid == "" {
			return fmt.Errorf("could not convert JWT header kid to string")
		}

		key, ok := set.LookupKeyID(kid)
		if !ok {
			return fmt.Errorf("no JWK found with kid %s", kid)
		}

		sink.Key(jwa.RS256, key)
	default:
		return fmt.Errorf("unexpected signing method: %v", sig.ProtectedHeaders().Algorithm())
	}
	return nil
}

// For the id_token, the recommended signature algorithm is RS256, which
// means we need to verify the token against a public key. This public key
// is available from the key discovery service in JSON Web Key (JWK).
// JWK is specified in RFC 7517.
//
// The location of the key discovery service (JWKSURL) is published in the
// OpenID Provider Configuration Information at /.well-known/openid-configuration
// implements rfc7517 section 4.7 "x5c" (X.509 Certificate Chain) Parameter

// JWK defines a JSON Web KEy nested struct
type JWK struct {
	Kty string   `json:"kty"`
	Use string   `json:"use"`
	Alg string   `json:"alg"`
	Kid string   `json:"kid"`
	X5t string   `json:"x5t"`
	N   string   `json:"n"`
	E   string   `json:"e"`
	X5c []string `json:"x5c"`
}

// JWKS defines a JKW[]
type JWKS struct {
	Keys []JWK `json:"keys"`
}

// GetClaims extracts claims from id_token
func (j *JWT) GetClaims(tokenString string) (jwt.Token, error) {
	token, err := parseToken(
		tokenString,
		jwt.WithKeyProvider(j),
		jwt.WithRequiredClaim(jwt.SubjectKey),
		jwt.WithClock(jwt.ClockFunc(j.Now)),
	)
	if err != nil {
		return nil, err
	}

	return token, nil
}

// Create creates a signed JWT token from user that expires at Principal's ExpireAt time.
func (j *JWT) Create(ctx context.Context, user Principal) (Token, error) {
	// Create a new token object, specifying signing method and the claims
	// you would like it to contain.
	b := jwt.NewBuilder().
		Subject(user.Subject).
		Expiration(user.ExpiresAt).
		IssuedAt(user.IssuedAt).
		NotBefore(user.IssuedAt)

	if iss := user.Issuer; iss != "" {
		b.Issuer(user.Issuer)
	}
	if org := user.Organization; org != "" {
		b.Claim(`org`, org)
	}
	if grp := user.Group; grp != "" {
		b.Claim(`grp`, grp)
	}
	tok, err := b.Build()
	if err != nil {
		return "", err
	}

	signed, err := jwt.Sign(tok, jwt.WithKey(jwa.HS256, []byte(j.Secret)))
	if err != nil {
		return "", err
	}
	return Token(string(signed)), nil
}

// ExtendedPrincipal sets the expires at to be the current time plus the extention into the future
func (j *JWT) ExtendedPrincipal(ctx context.Context, principal Principal, extension time.Duration) (Principal, error) {
	// Extend the time of expiration.  Do not change IssuedAt as the
	// lifetime of the token is extended, but, NOT the original time
	// of issue. This is used to enforce a maximum lifetime of a token
	principal.ExpiresAt = j.Now().Add(extension)
	return principal, nil
}
