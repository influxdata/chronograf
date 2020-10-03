package server

import (
	"crypto/tls"
	"errors"
	"fmt"
	"sort"
	"strings"
)

type tlsServerOptions struct {
	// Cert contains path to PEM encoded public key certificate
	Cert string
	// Key contains Path to private key associated with given certificate.
	Key string
	// Ciphers is a preference list of supported ciphers, empty list means default
	Ciphers []string
	// MinVersion of TLS to be negotiated with the client  ("1.0", "1.1" ...), no value means no minimum.
	MinVersion string
	// MaxVersion of TLS to be negotiated with the client, no value means no maximum.
	MaxVersion string
}

var ciphersMap = map[string]uint16{
	// TLS 1.0 - 1.2 cipher suites.
	"TLS_RSA_WITH_RC4_128_SHA":                tls.TLS_RSA_WITH_RC4_128_SHA,
	"TLS_RSA_WITH_3DES_EDE_CBC_SHA":           tls.TLS_RSA_WITH_3DES_EDE_CBC_SHA,
	"TLS_RSA_WITH_AES_128_CBC_SHA":            tls.TLS_RSA_WITH_AES_128_CBC_SHA,
	"TLS_RSA_WITH_AES_256_CBC_SHA":            tls.TLS_RSA_WITH_AES_256_CBC_SHA,
	"TLS_RSA_WITH_AES_128_CBC_SHA256":         tls.TLS_RSA_WITH_AES_128_CBC_SHA256,
	"TLS_RSA_WITH_AES_128_GCM_SHA256":         tls.TLS_RSA_WITH_AES_128_GCM_SHA256,
	"TLS_RSA_WITH_AES_256_GCM_SHA384":         tls.TLS_RSA_WITH_AES_256_GCM_SHA384,
	"TLS_ECDHE_ECDSA_WITH_RC4_128_SHA":        tls.TLS_ECDHE_ECDSA_WITH_RC4_128_SHA,
	"TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA":    tls.TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA,
	"TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA":    tls.TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA,
	"TLS_ECDHE_RSA_WITH_RC4_128_SHA":          tls.TLS_ECDHE_RSA_WITH_RC4_128_SHA,
	"TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA":     tls.TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA,
	"TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA":      tls.TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA,
	"TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA":      tls.TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA,
	"TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256": tls.TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256,
	"TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256":   tls.TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256,
	"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256":   tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
	"TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256": tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
	"TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384":   tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
	"TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384": tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
	"TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305":    tls.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305,
	"TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305":  tls.TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305,
	// TLS 1.3 cipher suites
	"TLS_AES_128_GCM_SHA256":       tls.TLS_AES_128_GCM_SHA256,
	"TLS_AES_256_GCM_SHA384":       tls.TLS_AES_256_GCM_SHA384,
	"TLS_CHACHA20_POLY1305_SHA256": tls.TLS_CHACHA20_POLY1305_SHA256,
}

var versionsMap = map[string]uint16{
	"1.0": tls.VersionTLS10,
	"1.1": tls.VersionTLS11,
	"1.2": tls.VersionTLS12,
	"1.3": tls.VersionTLS13,
}

func createTLSConfig(o tlsServerOptions) (out *tls.Config, err error) {
	// load key pair
	if o.Cert == "" {
		return nil, errors.New("no TLS certificate specified")

	}
	key := o.Key
	if key == "" {
		key = o.Cert // If no key is specified, we assume it is in the cert
	}
	cert, err := tls.LoadX509KeyPair(o.Cert, key)
	if err != nil {
		return nil, err
	}
	out = new(tls.Config)
	out.Certificates = []tls.Certificate{cert}

	// ciphers
	if len(o.Ciphers) > 0 {
		for _, name := range o.Ciphers {
			cipherName := strings.ToUpper(strings.Trim(name, " "))
			if len(cipherName) == 0 {
				continue
			}
			cipher, ok := ciphersMap[cipherName]
			if !ok {
				if cipherName == "HELP" {
					return nil, fmt.Errorf("available ciphers are: %s",
						availableKeys(ciphersMap))
				}
				return nil, fmt.Errorf("unknown cipher suite: %q. available ciphers: %s",
					cipherName, availableKeys(ciphersMap))
			}
			out.CipherSuites = append(out.CipherSuites, cipher)
		}
		out.PreferServerCipherSuites = true
	}

	if o.MinVersion != "" {
		version, ok := versionsMap[o.MinVersion]
		if !ok {
			return nil, fmt.Errorf("unknown minimum TLS version: %q. available versions: %s",
				o.MinVersion, availableKeys(versionsMap))

		}
		out.MinVersion = version
	}

	if o.MaxVersion != "" {
		version, ok := versionsMap[o.MaxVersion]
		if !ok {
			return nil, fmt.Errorf("unknown maximum TLS version: %q. available versions: %s",
				o.MaxVersion, availableKeys(versionsMap))
		}
		out.MaxVersion = version
	}

	return out, nil
}

func availableKeys(keySource map[string]uint16) string {
	available := make([]string, 0, len(keySource))
	for name := range keySource {
		available = append(available, name)
	}
	sort.Strings(available)
	return strings.Join(available, ", ")
}
