package util

import (
	"crypto/tls"
	"net"
	"net/http"
	"time"
)

// CreateTransport creates a new HTTP transport. The supplied skipVerify parameter
// turn off TLS verification when true.
func CreateTransport(skipVerify bool) *http.Transport {
	var transport *http.Transport
	if cloneable, ok := http.DefaultTransport.(interface{ Clone() *http.Transport }); ok {
		transport = cloneable.Clone() // available since go1.13
	} else {
		// This uses the same values as http.DefaultTransport
		transport = &http.Transport{
			Proxy: http.ProxyFromEnvironment,
			DialContext: (&net.Dialer{
				Timeout:   30 * time.Second,
				KeepAlive: 30 * time.Second,
				DualStack: true,
			}).DialContext,
			MaxIdleConns:          100,
			IdleConnTimeout:       90 * time.Second,
			TLSHandshakeTimeout:   10 * time.Second,
			ExpectContinueTimeout: 1 * time.Second,
		}
	}
	if skipVerify {
		if transport.TLSClientConfig == nil {
			transport.TLSClientConfig = &tls.Config{}
		}
		transport.TLSClientConfig.InsecureSkipVerify = true
	}
	return transport
}
