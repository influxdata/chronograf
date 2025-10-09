package config_test

import (
	"crypto/tls"
	"crypto/x509"
	"testing"

	"github.com/influxdata/chronograf/server/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_CreateTLSConfig(t *testing.T) {
	var tests = []struct {
		name string
		in   config.TLSOptions
		out  *tls.Config
		err  string
	}{
		{
			name: "empty options",
			in:   config.TLSOptions{},
			err:  "no TLS certificate specified",
		},
		{
			name: "certificate optional",
			in:   config.TLSOptions{CertOptional: true},
			out:  &tls.Config{},
		},
		{
			name: "missing key",
			in: config.TLSOptions{
				Cert: "tls_options_test.cert",
			},
			err: "private key",
		},
		{
			name: "cert and key",
			in: config.TLSOptions{
				Cert: "tls_options_test.cert",
				Key:  "tls_options_test.key",
			},
			out: &tls.Config{}, // certificates are not compared, they only must exist
		},
		{
			name: "cert and key (certOptional)",
			in: config.TLSOptions{
				Cert:         "tls_options_test.cert",
				Key:          "tls_options_test.key",
				CertOptional: true,
			},
			out: &tls.Config{}, // certificates are not compared, they only must exist
		},
		{
			name: "minVersion",
			in: config.TLSOptions{
				Cert:       "tls_options_test.cert",
				Key:        "tls_options_test.key",
				MinVersion: "1.1",
			},
			out: &tls.Config{MinVersion: tls.VersionTLS11},
		},
		{
			name: "maxVersion",
			in: config.TLSOptions{
				Cert:       "tls_options_test.cert",
				Key:        "tls_options_test.key",
				MaxVersion: "1.2",
			},
			out: &tls.Config{MaxVersion: tls.VersionTLS12},
		},
		{
			name: "ciphers",
			in: config.TLSOptions{
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
			in: config.TLSOptions{
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
			in: config.TLSOptions{
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
			in: config.TLSOptions{
				Cert:       "tls_options_test.cert",
				Key:        "tls_options_test.key",
				MinVersion: "0.9",
			},
			err: `unknown minimum TLS version: "0.9". available versions: 1.0, `, // + + other versions follow
		},
		{
			name: "unknown maxVersion",
			in: config.TLSOptions{
				Cert:       "tls_options_test.cert",
				Key:        "tls_options_test.key",
				MaxVersion: "f1",
			},
			err: `unknown maximum TLS version: "f1". available versions: 1.0, `, // + + other versions follow
		},
		{
			name: "custom ca certs",
			in: config.TLSOptions{
				Cert:    "tls_options_test.cert",
				Key:     "tls_options_test.key",
				CACerts: "tls_options_test.cert",
			},
			out: &tls.Config{}, // certificates are compared
		},
		{
			name: "unknown ca certs",
			in: config.TLSOptions{
				Cert:    "tls_options_test.cert",
				Key:     "tls_options_test.key",
				CACerts: "tls_options_test2.cert",
			},
			err: "open tls_options_test2.cert:.*file.*",
		},
		{
			name: "unsupported ca certs",
			in: config.TLSOptions{
				Cert:    "tls_options_test.cert",
				Key:     "tls_options_test.key",
				CACerts: "tls_options_test.key",
			},
			err: "error appending CA certificates from tls_options_test.key",
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			config, err := config.CreateTLSConfig(test.in)
			if test.err == "" {
				require.Nil(t, err)
				if !test.in.CertOptional {
					require.NotNil(t, config.Certificates)
				}
				if test.in.CACerts != "" {
					require.NotNil(t, config.RootCAs)
					x509Cert, _ := x509.ParseCertificate(config.Certificates[0].Certificate[0])
					require.Equal(t, config.RootCAs.Subjects()[0], x509Cert.RawSubject)
				}
				config.Certificates = nil // we don't want to compare certificates
				config.RootCAs = nil      // and also root CA certs
				require.Equal(t, test.out, config)
			} else {
				require.NotNil(t, err)
				require.Nil(t, config)
				// Regexp is used, because of platform difference message and nested exceptions can evolve with go versions
				assert.Regexp(t, test.err, err.Error())
			}
		})
	}
}
