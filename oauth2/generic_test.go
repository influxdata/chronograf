package oauth2_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	clog "github.com/influxdata/chronograf/log"
	"github.com/influxdata/chronograf/oauth2"
)

func TestGenericGroup_withNotEmail(t *testing.T) {
	t.Parallel()

	response := struct {
		Email string `json:"not-email"`
	}{
		"martymcfly@pinheads.rok",
	}
	mockAPI := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			rw.WriteHeader(http.StatusNotFound)
			return
		}
		enc := json.NewEncoder(rw)

		rw.WriteHeader(http.StatusOK)
		_ = enc.Encode(response)
	}))
	defer mockAPI.Close()

	logger := clog.New(clog.ParseLevel("debug"))
	prov := oauth2.Generic{
		Logger: logger,
		APIURL: mockAPI.URL,
		APIKey: "not-email",
	}
	tt, err := oauth2.NewTestTripper(logger, mockAPI, http.DefaultTransport)
	if err != nil {
		t.Fatal("Error initializing TestTripper: err:", err)
	}

	tc := &http.Client{
		Transport: tt,
	}

	got, err := prov.Group(tc)
	if err != nil {
		t.Fatal("Unexpected error while retrieiving PrincipalID: err:", err)
	}

	want := "pinheads.rok"
	if got != want {
		t.Fatal("Retrieved group was not as expected. Want:", want, "Got:", got)
	}
}

func TestGenericGroup_withEmail(t *testing.T) {
	t.Parallel()

	response := struct {
		Email string `json:"email"`
	}{
		"martymcfly@pinheads.rok",
	}
	mockAPI := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			rw.WriteHeader(http.StatusNotFound)
			return
		}
		enc := json.NewEncoder(rw)

		rw.WriteHeader(http.StatusOK)
		_ = enc.Encode(response)
	}))
	defer mockAPI.Close()

	logger := clog.New(clog.ParseLevel("debug"))
	prov := oauth2.Generic{
		Logger: logger,
		APIURL: mockAPI.URL,
		APIKey: "email",
	}
	tt, err := oauth2.NewTestTripper(logger, mockAPI, http.DefaultTransport)
	if err != nil {
		t.Fatal("Error initializing TestTripper: err:", err)
	}

	tc := &http.Client{
		Transport: tt,
	}

	got, err := prov.Group(tc)
	if err != nil {
		t.Fatal("Unexpected error while retrieiving PrincipalID: err:", err)
	}

	want := "pinheads.rok"
	if got != want {
		t.Fatal("Retrieved group was not as expected. Want:", want, "Got:", got)
	}
}

func TestGenericPrincipalID(t *testing.T) {
	t.Parallel()

	response := struct {
		Email string `json:"email"`
	}{
		"martymcfly@pinheads.rok",
	}
	mockAPI := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			rw.WriteHeader(http.StatusNotFound)
			return
		}
		enc := json.NewEncoder(rw)

		rw.WriteHeader(http.StatusOK)
		_ = enc.Encode(response)
	}))
	defer mockAPI.Close()

	logger := clog.New(clog.ParseLevel("debug"))
	prov := oauth2.Generic{
		Logger: logger,
		APIURL: mockAPI.URL,
		APIKey: "email",
	}
	tt, err := oauth2.NewTestTripper(logger, mockAPI, http.DefaultTransport)
	if err != nil {
		t.Fatal("Error initializing TestTripper: err:", err)
	}

	tc := &http.Client{
		Transport: tt,
	}

	got, err := prov.PrincipalID(tc)
	if err != nil {
		t.Fatal("Unexpected error while retrieiving PrincipalID: err:", err)
	}

	want := "martymcfly@pinheads.rok"
	if got != want {
		t.Fatal("Retrieved email was not as expected. Want:", want, "Got:", got)
	}
}

func TestGenericPrincipalIDDomain(t *testing.T) {
	t.Parallel()
	expectedEmail := []struct {
		Email    string `json:"email"`
		Primary  bool   `json:"primary"`
		Verified bool   `json:"verified"`
	}{
		{"martymcfly@pinheads.rok", true, false},
	}
	mockAPI := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			enc := json.NewEncoder(rw)
			rw.WriteHeader(http.StatusOK)
			_ = enc.Encode(struct{}{})
			return
		}
		if r.URL.Path == "/emails" {
			enc := json.NewEncoder(rw)
			rw.WriteHeader(http.StatusOK)
			_ = enc.Encode(expectedEmail)
			return
		}

		rw.WriteHeader(http.StatusNotFound)
	}))
	defer mockAPI.Close()

	logger := clog.New(clog.ParseLevel("debug"))
	prov := oauth2.Generic{
		Logger:  logger,
		Domains: []string{"pinheads.rok"},
	}
	tt, err := oauth2.NewTestTripper(logger, mockAPI, http.DefaultTransport)
	if err != nil {
		t.Fatal("Error initializing TestTripper: err:", err)
	}

	tc := &http.Client{
		Transport: tt,
	}

	got, err := prov.PrincipalID(tc)
	if err != nil {
		t.Fatal("Unexpected error while retrieiving PrincipalID: err:", err)
	}
	want := "martymcfly@pinheads.rok"
	if got != want {
		t.Fatal("Retrieved email was not as expected. Want:", want, "Got:", got)
	}
}

func TestGenericPrincipalIDDomain_BitBucket(t *testing.T) {
	// Test of https://github.com/influxdata/chronograf/issues/5399
	t.Parallel()
	expectedGroup := "xyz.io"
	expectedPrincipalID := "pavel.zavora@xyz.io"
	emailsResponse := `{
		"pagelen": 10,
		"values": [
			{
				"is_primary": true,
				"is_confirmed": true,
				"type": "email",
				"email": "pavel.zavora@xyz.io",
				"links": {
					"self": {
						"href": "https://api.bitbucket.org/2.0/user/emails/pavel.zavora@xyz.io"
					}
				}
			}
		],
		"page": 1,
		"size": 1
	}`

	mockAPI := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			enc := json.NewEncoder(rw)
			rw.WriteHeader(http.StatusOK)
			_ = enc.Encode(struct{}{})
			return
		}
		if r.URL.Path == "/emails" {
			rw.WriteHeader(http.StatusOK)
			rw.Write([]byte(emailsResponse))
			return
		}

		rw.WriteHeader(http.StatusNotFound)
	}))
	defer mockAPI.Close()

	logger := clog.New(clog.ParseLevel("debug"))
	prov := oauth2.Generic{
		Logger:  logger,
		Domains: []string{expectedGroup},
	}
	tt, err := oauth2.NewTestTripper(logger, mockAPI, http.DefaultTransport)
	if err != nil {
		t.Fatal("Error initializing TestTripper: err:", err)
	}

	tc := &http.Client{
		Transport: tt,
	}

	got, err := prov.PrincipalID(tc)
	if err != nil {
		t.Fatal("Unexpected error while retrieiving PrincipalID: err:", err)
	}
	if got != expectedPrincipalID {
		t.Fatal("Retrieved email was not as expected. Want:", expectedPrincipalID, "Got:", got)
	}

	group, err := prov.Group(tc)
	if err != nil {
		t.Fatal("Unexpected error while retrieiving PrincipalID: err:", err)
	}
	if group != expectedGroup {
		t.Fatal("Retrieved group was not as expected. Want:", expectedGroup, "Got:", group)
	}

}
