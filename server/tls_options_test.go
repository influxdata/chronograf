package server

import (
	"crypto/tls"
	"fmt"
	"testing"

	"github.com/stretchr/testify/require"
)

func Test_createTLSConfig(t *testing.T) {
	var tests = []struct {
		name string
		in   tlsServerOptions
		out  *tls.Config
		err  string
	}{
		{
			name: "empty options",
			in:   tlsServerOptions{},
			err:  "no TLS certificate specified",
		},
		{
			name: "missing key",
			in: tlsServerOptions{
				Cert: "tls_options_test.cert",
			},
			err: "private key",
		},
		{
			name: "cert and key",
			in: tlsServerOptions{
				Cert: "tls_options_test.cert",
				Key:  "tls_options_test.key",
			},
			out: &tls.Config{}, // certificates are not compared, they only must exist
		},
		{
			name: "minVersion",
			in: tlsServerOptions{
				Cert:       "tls_options_test.cert",
				Key:        "tls_options_test.key",
				MinVersion: "1.1",
			},
			out: &tls.Config{MinVersion: tls.VersionTLS11},
		},
		{
			name: "maxVersion",
			in: tlsServerOptions{
				Cert:       "tls_options_test.cert",
				Key:        "tls_options_test.key",
				MaxVersion: "1.2",
			},
			out: &tls.Config{MaxVersion: tls.VersionTLS12},
		},
		{
			name: "ciphers",
			in: tlsServerOptions{
				Cert: "tls_options_test.cert",
				Key:  "tls_options_test.key",
				Ciphers: []string{
					"TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
					" ",
					" TLS_RSA_WITH_AES_256_GCM_SHA384",
				},
			},
			out: &tls.Config{
				CipherSuites: []uint16{
					tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
					tls.TLS_RSA_WITH_AES_256_GCM_SHA384,
				},
				PreferServerCipherSuites: true,
			},
		},
		{
			name: "help on ciphers",
			in: tlsServerOptions{
				Cert: "tls_options_test.cert",
				Key:  "tls_options_test.key",
				Ciphers: []string{
					"help",
				},
			},
			err: "available ciphers are: TLS_AES_128_GCM_SHA256, TLS", // + the rest is printed in alphabetical order
		},
		{
			name: "unknown cipher",
			in: tlsServerOptions{
				Cert: "tls_options_test.cert",
				Key:  "tls_options_test.key",
				Ciphers: []string{
					"krtek",
				},
			},
			err: `unknown cipher suite: "KRTEK". available ciphers: TLS_AES_128_GCM_SHA256, TLS`, // + the rest is printed in alphabetical order
		},
		{
			name: "unknown minVersion",
			in: tlsServerOptions{
				Cert:       "tls_options_test.cert",
				Key:        "tls_options_test.key",
				MinVersion: "0.9",
			},
			err: `unknown minimum TLS version: "0.9". available versions: 1.0, `, // + + other versions follow
		},
		{
			name: "unknown maxVersion",
			in: tlsServerOptions{
				Cert:       "tls_options_test.cert",
				Key:        "tls_options_test.key",
				MaxVersion: "f1",
			},
			err: `unknown maximum TLS version: "f1". available versions: 1.0, `, // + + other versions follow
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			config, err := createTLSConfig(test.in)
			if test.err == "" {
				require.Nil(t, err)
				require.NotNil(t, config.Certificates)
				config.Certificates = nil // we don't want to compare certificates
				require.Equal(t, test.out, config)
			} else {
				require.NotNil(t, err)
				require.Nil(t, config)
				// Contains is used, because nested exceptions can evolve with go versions
				require.Contains(t, fmt.Sprintf("%v", err), test.err)
			}
		})
	}
}
