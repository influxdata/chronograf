package oauth2

import (
	"context"
	"errors"
	"testing"
	"time"
)

func TestAuthenticate(t *testing.T) {
	var tests = []struct {
		Desc      string
		Secret    string
		Token     Token
		Duration  time.Duration
		Principal Principal
		Err       error
	}{
		{
			Desc:   "Test bad jwt token",
			Secret: "secret",
			Token:  "badtoken",
			Principal: Principal{
				Subject: "",
			},
			Err: errors.New("token contains an invalid number of segments"),
		},
		{
			Desc:   "Test valid jwt token",
			Secret: "secret",
			Token:  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIvY2hyb25vZ3JhZi92MS91c2Vycy8xIiwibmFtZSI6IkRvYyBCcm93biIsImlhdCI6LTQ0Njc3NDQwMCwiZXhwIjotNDQ2Nzc0NDAwLCJuYmYiOi00NDY3NzQ0MDB9._rZ4gOIei9PizHOABH6kLcJTA3jm8ls0YnDxtz1qeUI",
			Principal: Principal{
				Subject: "/chronograf/v1/users/1",
			},
		},
		{
			Desc:   "Test expired jwt token",
			Secret: "secret",
			Token:  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIvY2hyb25vZ3JhZi92MS91c2Vycy8xIiwibmFtZSI6IkRvYyBCcm93biIsImlhdCI6LTQ0Njc3NDQwMCwiZXhwIjotNDQ2Nzc0NDAxLCJuYmYiOi00NDY3NzQ0MDB9.vWXdm0-XQ_pW62yBpSISFFJN_yz0vqT9_INcUKTp5Q8",
			Principal: Principal{
				Subject: "",
			},
			Err: errors.New("token is expired by 1s"),
		},
		{
			Desc:   "Test jwt token not before time",
			Secret: "secret",
			Token:  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIvY2hyb25vZ3JhZi92MS91c2Vycy8xIiwibmFtZSI6IkRvYyBCcm93biIsImlhdCI6LTQ0Njc3NDQwMCwiZXhwIjotNDQ2Nzc0NDAwLCJuYmYiOi00NDY3NzQzOTl9.TMGAhv57u1aosjc4ywKC7cElP1tKyQH7GmRF2ToAxlE",
			Principal: Principal{
				Subject: "",
			},
			Err: errors.New("token is not valid yet"),
		},
		{
			Desc:   "Test jwt with empty subject is invalid",
			Secret: "secret",
			Token:  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOi00NDY3NzQ0MDAsImV4cCI6LTQ0Njc3NDQwMCwibmJmIjotNDQ2Nzc0NDAwfQ.gxsA6_Ei3s0f2I1TAtrrb8FmGiO25OqVlktlF_ylhX4",
			Principal: Principal{
				Subject: "",
			},
			Err: errors.New("claim has no subject"),
		},
		{
			Desc:     "Test jwt duration matches server auth duration",
			Secret:   "secret",
			Token:    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIvY2hyb25vZ3JhZi92MS91c2Vycy8xIiwibmFtZSI6IkRvYyBCcm93biIsImlhdCI6LTQ0Njc3NDQwMCwiZXhwIjotNDQ2Nzc0NDAwLCJuYmYiOi00NDY3NzQ0MDB9._rZ4gOIei9PizHOABH6kLcJTA3jm8ls0YnDxtz1qeUI",
			Duration: 500 * time.Hour,
			Principal: Principal{
				Subject: "/chronograf/v1/users/1",
			},
			Err: errors.New("claims duration is different from server duration"),
		},
	}
	for i, test := range tests {
		j := JWT{
			Secret: test.Secret,
			Now: func() time.Time {
				return time.Unix(-446774400, 0)
			},
		}
		principal, err := j.ValidPrincipal(context.Background(), test.Token, test.Duration)
		if err != nil {
			if test.Err == nil {
				t.Errorf("Error in test %d authenticating with bad token: %v", i, err)
			} else if err.Error() != test.Err.Error() {
				t.Errorf("Error in test %d expected error: %v actual: %v", i, err, test.Err)
			}
		} else if test.Principal != principal {
			t.Errorf("Error in test %d; principals different; expected: %v  actual: %v", i, test.Principal, principal)
		}
	}

}

func TestToken(t *testing.T) {
	duration := time.Second
	expected := Token("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOi00NDY3NzQzOTksImlhdCI6LTQ0Njc3NDQwMCwibmJmIjotNDQ2Nzc0NDAwLCJzdWIiOiIvY2hyb25vZ3JhZi92MS91c2Vycy8xIn0.ofQM6yTmrmve5JeEE0RcK4_euLXuZ_rdh6bLAbtbC9M")
	j := JWT{
		Secret: "secret",
		Now: func() time.Time {
			return time.Unix(-446774400, 0)
		},
	}
	p := Principal{
		Subject: "/chronograf/v1/users/1",
	}
	if token, err := j.Create(context.Background(), p, duration); err != nil {
		t.Errorf("Error creating token for principal: %v", err)
	} else if token != expected {
		t.Errorf("Error creating token; expected: %s  actual: %s", expected, token)
	}
}

func TestSigningMethod(t *testing.T) {
	token := Token("eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.EkN-DOsnsuRjRO6BxXemmJDm3HbxrbRzXglbN2S4sOkopdU4IsDxTI8jO19W_A4K8ZPJijNLis4EZsHeY559a4DFOd50_OqgHGuERTqYZyuhtF39yxJPAjUESwxk2J5k_4zM3O-vtd1Ghyo4IbqKKSy6J9mTniYJPenn5-HIirE")
	j := JWT{}
	if _, err := j.ValidPrincipal(context.Background(), token, 0); err == nil {
		t.Error("Error was expected while validating incorrectly signed token")
	} else if err.Error() != "unexpected signing method: RS256" {
		t.Errorf("Error wanted 'unexpected signing method', got %s", err.Error())
	}
}
