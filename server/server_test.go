package server

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/pem"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/bouk/httprouter"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// WithContext is a helper function to cut down on boilerplate in server test files
func WithContext(ctx context.Context, r *http.Request, kv map[string]string) *http.Request {
	params := make(httprouter.Params, 0, len(kv))
	for k, v := range kv {
		params = append(params, httprouter.Param{
			Key:   k,
			Value: v,
		})
	}
	return r.WithContext(httprouter.WithParams(ctx, params))
}

func Test_validBasepath(t *testing.T) {
	type args struct {
		basepath string
	}
	tests := []struct {
		name string
		args args
		want bool
	}{
		{
			name: "Basepath can be empty",
			args: args{
				basepath: "",
			},
			want: true,
		},
		{
			name: "Basepath is not empty and valid",
			args: args{
				basepath: "/russ",
			},
			want: true,
		},
		{
			name: "Basepath can include numbers, hyphens, and underscores",
			args: args{
				basepath: "/3shishka-bob/-rus4s_rus-1_s-",
			},
			want: true,
		},
		{
			name: "Basepath is not empty and invalid - no slashes",
			args: args{
				basepath: "russ",
			},
			want: false,
		},
		{
			name: "Basepath is not empty and invalid - extra slashes",
			args: args{
				basepath: "//russ//",
			},
			want: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := validBasepath(tt.args.basepath); got != tt.want {
				t.Errorf("validBasepath() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestValidAuth(t *testing.T) {
	tests := []struct {
		desc string
		s    *Server
		err  string
	}{
		{
			desc: "test valid github config",
			s: &Server{
				GithubClientID:     "abc123",
				GithubClientSecret: "abc123",
				TokenSecret:        "abc123",
			},
			err: "<nil>",
		},
		{
			desc: "test invalid github config (no clientID)",
			s: &Server{
				GithubClientSecret: "abc123",
				TokenSecret:        "abc123",
			},
			err: "missing Github oauth setting[s]: client id",
		},
		{
			desc: "test invalid github config (no token or clientID)",
			s: &Server{
				GithubClientSecret: "abc123",
			},
			err: "missing Github oauth setting[s]: token secret, client id",
		},
		{
			desc: "test invalid generic config (no clientSecret)",
			s: &Server{
				GenericClientID: "abc123",
				GenericAuthURL:  "abc123",
				GenericTokenURL: "abc123",
				TokenSecret:     "abc123",
			},
			err: "missing Generic oauth setting[s]: client secret",
		},
		{
			desc: "test invalid heroku config (no clientSecret)",
			s: &Server{
				HerokuClientID: "abc123",
				TokenSecret:    "abc123",
			},
			err: "missing Heroku oauth setting[s]: client secret",
		},
		{
			desc: "test invalid auth0 config (no clientSecret)",
			s: &Server{
				Auth0ClientID: "abc123",
			},
			err: "missing Auth0 oauth setting[s]: client secret",
		},
		{
			desc: "test invalid google config (no token or clientSecret or publicUrl)",
			s: &Server{
				GoogleClientID: "abc123",
			},
			err: "missing Google oauth setting[s]: token secret, client secret, public url",
		},
		{
			desc: "test invalid config (only token)",
			s: &Server{
				TokenSecret: "abc123",
			},
			err: "token secret without oauth config is invalid",
		},
		{
			desc: "test valid generic config",
			s: &Server{
				TokenSecret:         "abc123",
				GenericClientID:     "abc123",
				GenericClientSecret: "abc123",
				GenericAuthURL:      "abc123",
				GenericTokenURL:     "abc123",
			},
			err: "<nil>",
		},
		{
			desc: "test valid generic config with public url",
			s: &Server{
				TokenSecret:         "abc123",
				GenericClientID:     "abc123",
				GenericClientSecret: "abc123",
				GenericAuthURL:      "abc123",
				GenericTokenURL:     "abc123",
				PublicURL:           "abc123",
			},
			err: "<nil>",
		},
	}

	for _, test := range tests {
		t.Run(test.desc, func(t *testing.T) {
			err := test.s.validateAuth()
			assert.Equal(t, test.err, fmt.Sprintf("%v", err), test.desc)
		})
	}
}

func TestProcessCerts(t *testing.T) {
	ts := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "Hello, client")
	}))
	defer ts.Close()

	tcrt := ts.Certificate()
	require.True(t, tcrt != nil)

	pool, err := processCerts(bytes.NewReader(pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: tcrt.Raw})))
	require.NoError(t, err)

	tests := []struct {
		tc  http.Client
		err bool
	}{
		{
			tc:  http.Client{},
			err: true,
		},
		{
			tc: http.Client{
				Transport: &http.Transport{
					TLSClientConfig: &tls.Config{
						InsecureSkipVerify: true,
					},
				},
			},
		},
		{
			tc: http.Client{
				Transport: &http.Transport{
					TLSClientConfig: &tls.Config{
						RootCAs: pool,
					},
				},
			},
		},
	}

	for _, test := range tests {
		_, err := test.tc.Get(ts.URL)
		assert.Equal(t, test.err, err != nil)
		if test.err {
			t.Log(err)
			continue
		}
	}
}
