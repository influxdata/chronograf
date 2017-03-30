package server_test

import (
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/bouk/httprouter"
	"github.com/influxdata/chronograf/server"
)

func Test_MountableRouter_MountsRoutesUnderPrefix(t *testing.T) {
	t.Parallel()

	mr := &server.MountableRouter{
		Prefix:   "/chronograf",
		Delegate: httprouter.New(),
	}

	expected := "Hello?! McFly?! Anybody in there?!"
	mr.GET("/biff", http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(rw, expected)
	}))

	ts := httptest.NewServer(mr)
	defer ts.Close()

	resp, err := http.Get(ts.URL + "/chronograf/biff")
	if err != nil {
		t.Fatal("Unexpected error fetching from mounted router: err:", err)
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		t.Fatal("Unexpected error decoding response body: err:", err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Fatal("Expected 200 but received", resp.StatusCode)
	}

	if string(body) != expected {
		t.Fatalf("Unexpected response body: Want: \"%s\". Got: \"%s\"", expected, string(body))
	}
}

func Test_MountableRouter_PrefixesPosts(t *testing.T) {
	t.Parallel()

	mr := &server.MountableRouter{
		Prefix:   "/chronograf",
		Delegate: httprouter.New(),
	}

	expected := "Great Scott!"
	actual := make([]byte, len(expected))
	mr.POST("/doc", http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		defer r.Body.Close()
		if _, err := io.ReadFull(r.Body, actual); err != nil {
			rw.WriteHeader(http.StatusInternalServerError)
		} else {
			rw.WriteHeader(http.StatusOK)
		}
	}))

	ts := httptest.NewServer(mr)
	defer ts.Close()

	resp, err := http.Post(ts.URL+"/chronograf/doc", "text/plain", strings.NewReader(expected))
	if err != nil {
		t.Fatal("Unexpected error posting to mounted router: err:", err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Fatal("Expected 200 but received", resp.StatusCode)
	}

	if string(actual) != expected {
		t.Fatalf("Unexpected request body: Want: \"%s\". Got: \"%s\"", expected, string(actual))
	}
}

func Test_MountableRouter_PrefixesPuts(t *testing.T) {
	t.Parallel()

	mr := &server.MountableRouter{
		Prefix:   "/chronograf",
		Delegate: httprouter.New(),
	}

	expected := "Great Scott!"
	actual := make([]byte, len(expected))
	mr.PUT("/doc", http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		defer r.Body.Close()
		if _, err := io.ReadFull(r.Body, actual); err != nil {
			rw.WriteHeader(http.StatusInternalServerError)
		} else {
			rw.WriteHeader(http.StatusOK)
		}
	}))

	ts := httptest.NewServer(mr)
	defer ts.Close()

	req, _ := http.NewRequest(http.MethodPut, ts.URL+"/chrongraf/doc", strings.NewReader(expected))
	client := http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatal("Unexpected error posting to mounted router: err:", err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Fatal("Expected 200 but received", resp.StatusCode)
	}

	if string(actual) != expected {
		t.Fatalf("Unexpected request body: Want: \"%s\". Got: \"%s\"", expected, string(actual))
	}
}
