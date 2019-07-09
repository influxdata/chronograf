package oauth2

import (
	"context"
	"fmt"
	"time"

	gojwt "github.com/dgrijalva/jwt-go"
	"github.com/lestrrat-go/jwx/jwk"
)

// Ensure JWT conforms to the Tokenizer interface
var _ Tokenizer = &JWT{}

// JWT represents a javascript web token that can be validated or marshaled into string.
type JWT struct {
	Secret  string
	Jwksurl string
	Now     func() time.Time
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

// Ensure Claims implements the jwt.Claims interface
var _ gojwt.Claims = &Claims{}

// Claims extends jwt.StandardClaims' Valid to make sure claims has a subject.
type Claims struct {
	gojwt.StandardClaims
	// We were unable to find a standard claim at https://www.iana.org/assignments/jwt/jwt.xhtml
	// that felt appropriate for Organization. As a result, we added a custom `org` field.
	Organization string `json:"org,omitempty"`
	// We were unable to find a standard claim at https://www.iana.org/assignments/jwt/jwt.xhtml
	// that felt appropriate for a users Group(s). As a result we added a custom `grp` field.
	// Multiple groups may be specified by comma delimiting the various group.
	//
	// The singlular `grp` was chosen over the `grps` to keep consistent with the JWT naming
	// convention (it is common for singlularly named values to actually be arrays, see `given_name`,
	// `family_name`, and `middle_name` in the iana link provided above). I should add the discalimer
	// I'm currently sick, so this thought process might be off.
	Group string `json:"grp,omitempty"`
}

// Valid adds an empty subject test to the StandardClaims checks.
func (c *Claims) Valid() error {
	if err := c.StandardClaims.Valid(); err != nil {
		return err
	} else if c.StandardClaims.Subject == "" {
		return fmt.Errorf("claim has no subject")
	}

	return nil
}

// ValidPrincipal checks if the jwtToken is signed correctly and validates with Claims.  lifespan is the
// maximum valid lifetime of a token.  If the lifespan is 0 then the auth lifespan duration is not checked.
func (j *JWT) ValidPrincipal(ctx context.Context, jwtToken Token, lifespan time.Duration) (Principal, error) {
	gojwt.TimeFunc = j.Now

	// Check for expected signing method.
	alg := j.KeyFunc

	return j.ValidClaims(jwtToken, lifespan, alg)
}

// KeyFunc verifies HMAC or RSA/RS256 signatures
func (j *JWT) KeyFunc(token *gojwt.Token) (interface{}, error) {
	if _, ok := token.Method.(*gojwt.SigningMethodHMAC); ok {
		return []byte(j.Secret), nil
	} else if _, ok := token.Method.(*gojwt.SigningMethodRSA); ok {
		return j.KeyFuncRS256(token)
	}
	return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
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

// KeyFuncRS256 verifies RS256 signed JWT tokens, it looks up the signing key in the key discovery service
func (j *JWT) KeyFuncRS256(token *gojwt.Token) (interface{}, error) {
	// Don't forget to validate the alg is what you expect:
	if _, ok := token.Method.(*gojwt.SigningMethodRSA); !ok {
		return nil, fmt.Errorf("Unsupported signing method: %v", token.Header["alg"])
	}

	// read JWKS document from key discovery service
	if j.Jwksurl == "" {
		return nil, fmt.Errorf("JWKSURL not specified, cannot validate RS256 signature")
	}

	set, err := jwk.Fetch(j.Jwksurl)
	if err != nil {
		return nil, err
	}

	kid, ok := token.Header["kid"].(string)
	if !ok {
		return nil, fmt.Errorf("could not convert JWT header kid to string")
	}

	keys := set.LookupKeyID(kid)
	if len(keys) == 0 {
		return nil, fmt.Errorf("no JWK found with kid %s", kid)
	}

	key, err := keys[0].Materialize()
	if err != nil {
		return nil, fmt.Errorf("failed to read JWK public key: %s", err)
	}

	return key, nil
}

// ValidClaims validates a token with StandardClaims
func (j *JWT) ValidClaims(jwtToken Token, lifespan time.Duration, alg gojwt.Keyfunc) (Principal, error) {
	// 1. Checks for expired tokens
	// 2. Checks if time is after the issued at
	// 3. Check if time is after not before (nbf)
	// 4. Check if subject is not empty
	// 5. Check if duration less than auth lifespan
	token, err := gojwt.ParseWithClaims(string(jwtToken), &Claims{}, alg)
	if err != nil {
		return Principal{}, err
		// at time of this writing and researching the docs, token.Valid seems to be always true
	} else if !token.Valid {
		return Principal{}, err
	}

	// at time of this writing and researching the docs, there will always be claims
	claims, ok := token.Claims.(*Claims)
	if !ok {
		return Principal{}, fmt.Errorf("unable to convert claims to standard claims")
	}

	exp := time.Unix(claims.ExpiresAt, 0)
	iat := time.Unix(claims.IssuedAt, 0)

	// If the duration of the claim is longer than the auth lifespan then this is
	// an invalid claim because server assumes that lifespan is the maximum possible
	// duration.  However, a lifespan of zero means that the duration comparison
	// against the auth duration is not needed.
	if lifespan > 0 && exp.Sub(iat) > lifespan {
		return Principal{}, fmt.Errorf("claims duration is different from auth lifespan")
	}

	return Principal{
		Subject:      claims.Subject,
		Issuer:       claims.Issuer,
		Organization: claims.Organization,
		Group:        claims.Group,
		ExpiresAt:    exp,
		IssuedAt:     iat,
	}, nil
}

// GetClaims extracts claims from id_token
func (j *JWT) GetClaims(tokenString string) (gojwt.MapClaims, error) {
	var claims gojwt.MapClaims

	gojwt.TimeFunc = j.Now
	token, err := gojwt.Parse(tokenString, j.KeyFunc)
	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, fmt.Errorf("token is not valid")
	}

	claims, ok := token.Claims.(gojwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("token has no claims")
	}

	return claims, nil
}

// Create creates a signed JWT token from user that expires at Principal's ExpireAt time.
func (j *JWT) Create(ctx context.Context, user Principal) (Token, error) {
	// Create a new token object, specifying signing method and the claims
	// you would like it to contain.
	claims := &Claims{
		StandardClaims: gojwt.StandardClaims{
			Subject:   user.Subject,
			Issuer:    user.Issuer,
			ExpiresAt: user.ExpiresAt.Unix(),
			IssuedAt:  user.IssuedAt.Unix(),
			NotBefore: user.IssuedAt.Unix(),
		},
		Organization: user.Organization,
		Group:        user.Group,
	}
	token := gojwt.NewWithClaims(gojwt.SigningMethodHS256, claims)
	// Sign and get the complete encoded token as a string using the secret
	t, err := token.SignedString([]byte(j.Secret))
	// this will only fail if the JSON can't be encoded correctly
	if err != nil {
		return "", err
	}
	return Token(t), nil
}

// ExtendedPrincipal sets the expires at to be the current time plus the extention into the future
func (j *JWT) ExtendedPrincipal(ctx context.Context, principal Principal, extension time.Duration) (Principal, error) {
	// Extend the time of expiration.  Do not change IssuedAt as the
	// lifetime of the token is extended, but, NOT the original time
	// of issue. This is used to enforce a maximum lifetime of a token
	principal.ExpiresAt = j.Now().Add(extension)
	return principal, nil
}
