package influx_test

import (
	"context"
	"encoding/base64"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	gojwt "github.com/golang-jwt/jwt/v4"
	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/influx"
	"github.com/influxdata/chronograf/log"
	"github.com/influxdata/chronograf/mocks"
)

// NewClient initializes an HTTP Client for InfluxDB.
func NewClient(host string, lg chronograf.Logger) (*influx.Client, error) {
	l := lg.WithField("host", host)
	u, err := url.Parse(host)
	if err != nil {
		l.Error("Error initialize influx client: err:", err)
		return nil, err
	}
	return &influx.Client{
		URL:    u,
		Logger: l,
	}, nil
}

func Test_Influx_MakesRequestsToQueryEndpoint(t *testing.T) {
	t.Parallel()
	called := false
	ts := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		rw.WriteHeader(http.StatusOK)
		rw.Write([]byte(`{}`))
		called = true
		if path := r.URL.Path; path != "/query" {
			t.Error("Expected the path to contain `/query` but was", path)
		}
	}))
	defer ts.Close()

	var series chronograf.TimeSeries
	series, err := NewClient(ts.URL, log.New(log.DebugLevel))
	if err != nil {
		t.Fatal("Unexpected error initializing client: err:", err)
	}

	query := chronograf.Query{
		Command: "show databases",
	}
	_, err = series.Query(context.Background(), query)
	if err != nil {
		t.Fatal("Expected no error but was", err)
	}

	if called == false {
		t.Error("Expected http request to Influx but there was none")
	}
}

type MockAuthorization struct {
	Bearer string
	Error  error
}

func (m *MockAuthorization) Set(req *http.Request) error {
	return m.Error
}
func Test_Influx_AuthorizationBearer(t *testing.T) {
	t.Parallel()
	ts := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		rw.WriteHeader(http.StatusOK)
		rw.Write([]byte(`{}`))
		auth := r.Header.Get("Authorization")
		tokenString := strings.Split(auth, " ")[1]
		token, err := gojwt.Parse(tokenString, func(token *gojwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*gojwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("Unexpected signing method: %v", token.Header["alg"])
			}
			return []byte("42"), nil
		})
		if err != nil {
			t.Errorf("Invalid token %v", err)
		}

		if claims, ok := token.Claims.(gojwt.MapClaims); ok && token.Valid {
			got := claims["username"]
			want := "AzureDiamond"
			if got != want {
				t.Errorf("Test_Influx_AuthorizationBearer got %s want %s", got, want)
			}
			return
		}
		t.Errorf("Invalid token %v", token)
	}))
	defer ts.Close()

	src := &chronograf.Source{
		Username:     "AzureDiamond",
		URL:          ts.URL,
		SharedSecret: "42",
	}
	series := &influx.Client{
		Logger: log.New(log.DebugLevel),
	}
	series.Connect(context.Background(), src)

	query := chronograf.Query{
		Command: "show databases",
	}
	_, err := series.Query(context.Background(), query)
	if err != nil {
		t.Fatal("Expected no error but was", err)
	}
}

func Test_Influx_AuthorizationBearerCtx(t *testing.T) {
	t.Parallel()
	ts := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		rw.WriteHeader(http.StatusOK)
		rw.Write([]byte(`{}`))
		got := r.Header.Get("Authorization")
		if got == "" {
			t.Error("Test_Influx_AuthorizationBearerCtx got empty string")
		}
		incomingToken := strings.Split(got, " ")[1]

		alg := func(token *gojwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*gojwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte("hunter2"), nil
		}
		claims := &gojwt.MapClaims{}
		token, err := gojwt.ParseWithClaims(string(incomingToken), claims, alg)
		if err != nil {
			t.Errorf("Test_Influx_AuthorizationBearerCtx unexpected claims error %v", err)
		}
		if !token.Valid {
			t.Error("Test_Influx_AuthorizationBearerCtx unexpected valid claim")
		}
		if err := claims.Valid(); err != nil {
			t.Errorf("Test_Influx_AuthorizationBearerCtx not expires already %v", err)
		}
		user := (*claims)["username"].(string)
		if user != "AzureDiamond" {
			t.Errorf("Test_Influx_AuthorizationBearerCtx expected username AzureDiamond but got %s", user)
		}
	}))
	defer ts.Close()

	series := &influx.Client{
		Logger: log.New(log.DebugLevel),
	}

	err := series.Connect(context.Background(), &chronograf.Source{
		Username:           "AzureDiamond",
		SharedSecret:       "hunter2",
		URL:                ts.URL,
		InsecureSkipVerify: true,
	})

	query := chronograf.Query{
		Command: "show databases",
	}
	_, err = series.Query(context.Background(), query)
	if err != nil {
		t.Fatal("Expected no error but was", err)
	}
}

func Test_Influx_AuthorizationBearerFailure(t *testing.T) {
	t.Parallel()
	bearer := &MockAuthorization{
		Error: fmt.Errorf("cracked1337"),
	}

	u, _ := url.Parse("http://haxored.net")
	u.User = url.UserPassword("AzureDiamond", "hunter2")
	series := &influx.Client{
		URL:        u,
		Authorizer: bearer,
		Logger:     log.New(log.DebugLevel),
	}

	query := chronograf.Query{
		Command: "show databases",
	}
	_, err := series.Query(context.Background(), query)
	if err == nil {
		t.Fatal("Test_Influx_AuthorizationBearerFailure Expected error but received nil")
	}
}

func Test_Influx_HTTPS_Failure(t *testing.T) {
	called := false
	ts := httptest.NewTLSServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		called = true
	}))
	defer ts.Close()

	ctx := context.Background()
	var series chronograf.TimeSeries
	series, err := NewClient(ts.URL, log.New(log.DebugLevel))
	if err != nil {
		t.Fatal("Unexpected error initializing client: err:", err)
	}

	src := chronograf.Source{
		URL: ts.URL,
	}
	if err := series.Connect(ctx, &src); err != nil {
		t.Fatal("Unexpected error connecting to client: err:", err)
	}

	query := chronograf.Query{
		Command: "show databases",
	}
	_, err = series.Query(ctx, query)
	if err == nil {
		t.Error("Expected error but was successful")
	}

	if called == true {
		t.Error("Expected http request to fail, but, succeeded")
	}

}

func Test_Influx_HTTPS_InsecureSkipVerify(t *testing.T) {
	t.Parallel()
	called := false
	q := ""
	ts := httptest.NewTLSServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		rw.WriteHeader(http.StatusOK)
		rw.Write([]byte(`{}`))
		called = true
		if path := r.URL.Path; path != "/query" {
			t.Error("Expected the path to contain `/query` but was", path)
		}
		values := r.URL.Query()
		q = values.Get("q")
	}))
	defer ts.Close()

	ctx := context.Background()
	var series chronograf.TimeSeries
	series, err := NewClient(ts.URL, log.New(log.DebugLevel))
	if err != nil {
		t.Fatal("Unexpected error initializing client: err:", err)
	}

	src := chronograf.Source{
		URL:                ts.URL,
		InsecureSkipVerify: true,
	}
	if err := series.Connect(ctx, &src); err != nil {
		t.Fatal("Unexpected error connecting to client: err:", err)
	}

	query := chronograf.Query{
		Command: "show databases",
	}
	_, err = series.Query(ctx, query)
	if err != nil {
		t.Fatal("Expected no error but was", err)
	}

	if called == false {
		t.Error("Expected http request to Influx but there was none")
	}
	called = false
	q = ""
	query = chronograf.Query{
		Command: `select "usage_user" from cpu`,
	}
	_, err = series.Query(ctx, query)
	if err != nil {
		t.Fatal("Expected no error but was", err)
	}

	if called == false {
		t.Error("Expected http request to Influx but there was none")
	}

	if q != `select "usage_user" from cpu` {
		t.Errorf("Unexpected query: %s", q)
	}
}

func Test_Influx_CancelsInFlightRequests(t *testing.T) {
	t.Parallel()

	started := make(chan bool, 1)
	finished := make(chan bool, 1)
	ts := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		started <- true
		time.Sleep(20 * time.Millisecond)
		finished <- true
	}))
	defer func() {
		ts.CloseClientConnections()
		ts.Close()
	}()

	series, _ := NewClient(ts.URL, log.New(log.DebugLevel))
	ctx, cancel := context.WithCancel(context.Background())

	errs := make(chan (error))
	go func() {
		query := chronograf.Query{
			Command: "show databases",
		}

		_, err := series.Query(ctx, query)
		errs <- err
	}()

	timer := time.NewTimer(10 * time.Second)
	defer timer.Stop()

	select {
	case s := <-started:
		if !s {
			t.Errorf("Expected cancellation during request processing. Started: %t", s)
		}
	case <-timer.C:
		t.Fatalf("Expected server to finish")
	}

	cancel()

	select {
	case f := <-finished:
		if !f {
			t.Errorf("Expected cancellation during request processing. Finished: %t", f)
		}
	case <-timer.C:
		t.Fatalf("Expected server to finish")
	}

	err := <-errs
	if err != chronograf.ErrUpstreamTimeout {
		t.Error("Expected timeout error but wasn't. err was", err)
	}
}

func Test_Influx_RejectsInvalidHosts(t *testing.T) {
	_, err := NewClient(":", log.New(log.DebugLevel))
	if err == nil {
		t.Fatal("Expected err but was nil")
	}
}

func Test_Influx_ReportsInfluxErrs(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		rw.WriteHeader(http.StatusOK)
	}))
	defer ts.Close()

	cl, err := NewClient(ts.URL, log.New(log.DebugLevel))
	if err != nil {
		t.Fatal("Encountered unexpected error while initializing influx client: err:", err)
	}

	_, err = cl.Query(context.Background(), chronograf.Query{
		Command: "show shards",
		DB:      "_internal",
		RP:      "autogen",
	})
	if err == nil {
		t.Fatal("Expected an error but received none")
	}
}

func TestClient_Roles(t *testing.T) {
	c := &influx.Client{}
	_, err := c.Roles(context.Background())
	if err == nil {
		t.Errorf("Client.Roles() want error")
	}
}

func TestClient_write(t *testing.T) {
	type fields struct {
		Authorizer         influx.Authorizer
		InsecureSkipVerify bool
		Logger             chronograf.Logger
	}
	type args struct {
		ctx   context.Context
		point chronograf.Point
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		body    string
		wantErr bool
	}{
		{
			name: "write point to influxdb",
			fields: fields{
				Logger: mocks.NewLogger(),
			},
			args: args{
				ctx: context.Background(),
				point: chronograf.Point{
					Database:        "mydb",
					RetentionPolicy: "myrp",
					Measurement:     "mymeas",
					Time:            10,
					Tags: map[string]string{
						"tag1": "value1",
						"tag2": "value2",
					},
					Fields: map[string]interface{}{
						"field1": "value1",
					},
				},
			},
		},
		{
			name: "point without fields",
			args: args{
				ctx:   context.Background(),
				point: chronograf.Point{},
			},
			wantErr: true,
		},
		{
			name: "hinted handoff errors are not errors really.",
			fields: fields{
				Logger: mocks.NewLogger(),
			},
			args: args{
				ctx: context.Background(),
				point: chronograf.Point{
					Database:        "mydb",
					RetentionPolicy: "myrp",
					Measurement:     "mymeas",
					Time:            10,
					Tags: map[string]string{
						"tag1": "value1",
						"tag2": "value2",
					},
					Fields: map[string]interface{}{
						"field1": "value1",
					},
				},
			},
			body: `{"error":"hinted handoff queue not empty"}`,
		},
		{
			name: "database not found creates a new db",
			fields: fields{
				Logger: mocks.NewLogger(),
			},
			args: args{
				ctx: context.Background(),
				point: chronograf.Point{
					Database:        "mydb",
					RetentionPolicy: "myrp",
					Measurement:     "mymeas",
					Time:            10,
					Tags: map[string]string{
						"tag1": "value1",
						"tag2": "value2",
					},
					Fields: map[string]interface{}{
						"field1": "value1",
					},
				},
			},
			body: `{"error":"database not found"}`,
		},
		{
			name: "error from database reported",
			fields: fields{
				Logger: mocks.NewLogger(),
			},
			args: args{
				ctx: context.Background(),
				point: chronograf.Point{
					Database:        "mydb",
					RetentionPolicy: "myrp",
					Measurement:     "mymeas",
					Time:            10,
					Tags: map[string]string{
						"tag1": "value1",
						"tag2": "value2",
					},
					Fields: map[string]interface{}{
						"field1": "value1",
					},
				},
			},
			body:    `{"error":"oh no!"}`,
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			retry := 0 // if the retry is > 0 then we don't error
			ts := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
				if strings.HasPrefix(r.RequestURI, "/write") {
					if tt.body == "" || retry > 0 {
						rw.WriteHeader(http.StatusNoContent)
						return
					}
					retry++
					rw.WriteHeader(http.StatusBadRequest)
					rw.Write([]byte(tt.body))
					return
				}
				rw.WriteHeader(http.StatusOK)
				rw.Write([]byte(`{"results":[{}]}`))
			}))
			defer ts.Close()
			u, _ := url.Parse(ts.URL)
			c := &influx.Client{
				URL:                u,
				Authorizer:         tt.fields.Authorizer,
				InsecureSkipVerify: tt.fields.InsecureSkipVerify,
				Logger:             tt.fields.Logger,
			}
			if err := c.Write(tt.args.ctx, []chronograf.Point{tt.args.point}); (err != nil) != tt.wantErr {
				t.Errorf("Client.write() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func Test_Influx_ValidateAuth_V1(t *testing.T) {
	t.Parallel()
	calledPath := ""
	ts := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		rw.WriteHeader(http.StatusUnauthorized)
		rw.Write([]byte(`{"error":"v1authfailed"}`))
		calledPath = r.URL.Path
		expectedAuth := "Basic " + base64.StdEncoding.EncodeToString(([]byte)("my-user:my-pwd"))
		if auth := r.Header.Get("Authorization"); auth != expectedAuth {
			t.Errorf("Expected Authorization '%v' but was: %v", expectedAuth, auth)
		}
	}))
	defer ts.Close()

	for _, urlContext := range []string{"", "/ctx"} {
		client, err := NewClient(ts.URL+urlContext, log.New(log.DebugLevel))
		if err != nil {
			t.Fatal("Unexpected error initializing client: err:", err)
		}
		source := &chronograf.Source{
			URL:      ts.URL + urlContext,
			Username: "my-user",
			Password: "my-pwd",
		}

		client.Connect(context.Background(), source)
		err = client.ValidateAuth(context.Background(), &chronograf.Source{})
		if err == nil {
			t.Fatal("Expected error but nil")
		}
		if !strings.Contains(err.Error(), "v1authfailed") {
			t.Errorf("Expected client error '%v' to contain server-sent error message", err)
		}
		if calledPath != urlContext+"/query" {
			t.Errorf("Path received: %v, want: %v ", calledPath, urlContext+"/query")
		}
	}
}

func Test_Influx_ValidateAuth_V2(t *testing.T) {
	t.Parallel()
	calledPath := ""
	ts := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		rw.WriteHeader(http.StatusUnauthorized)
		rw.Write([]byte(`{"message":"v2authfailed"}`))
		calledPath = r.URL.Path
		if auth := r.Header.Get("Authorization"); auth != "Token my-token" {
			t.Error("Expected Authorization 'Token my-token' but was: ", auth)
		}
		if path := r.URL.Path; !strings.HasSuffix(path, "/api/v2/query") {
			t.Error("Expected the path to contain `api/v2/query` but was: ", path)
		}
	}))
	defer ts.Close()
	for _, urlContext := range []string{"", "/ctx"} {
		calledPath = ""
		client, err := NewClient(ts.URL+urlContext, log.New(log.DebugLevel))
		if err != nil {
			t.Fatal("Unexpected error initializing client: err:", err)
		}
		source := &chronograf.Source{
			URL:      ts.URL + urlContext,
			Type:     chronograf.InfluxDBv2,
			Username: "my-org",
			Password: "my-token",
		}

		client.Connect(context.Background(), source)
		err = client.ValidateAuth(context.Background(), source)
		if err == nil {
			t.Fatal("Expected error but nil")
		}
		if !strings.Contains(err.Error(), "v2authfailed") {
			t.Errorf("Expected client error '%v' to contain server-sent error message", err)
		}
		if calledPath != urlContext+"/api/v2/query" {
			t.Errorf("Path received: %v, want: %v ", calledPath, urlContext+"/api/v2/query")
		}
	}
}

func Test_Influx_Version(t *testing.T) {
	t.Parallel()
	calledPath := ""
	serverVersion := ""
	ts := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		rw.Header().Add("X-Influxdb-Version", serverVersion)
		rw.WriteHeader(http.StatusNoContent)
		calledPath = r.URL.Path

	}))
	defer ts.Close()
	for _, urlContext := range []string{"", "/ctx"} {
		calledPath = ""
		client, err := NewClient(ts.URL+urlContext, log.New(log.DebugLevel))
		if err != nil {
			t.Fatal("Unexpected error initializing client: err:", err)
		}
		source := &chronograf.Source{
			URL:      ts.URL + urlContext,
			Type:     chronograf.InfluxDBv2,
			Username: "my-org",
			Password: "my-token",
		}

		client.Connect(context.Background(), source)

		versions := []struct {
			server   string
			expected string
		}{
			{
				server:   "1.8.3",
				expected: "1.8.3",
			},
			{
				server:   "v2.2.0",
				expected: "2.2.0",
			},
		}
		for _, testPair := range versions {
			serverVersion = testPair.server
			version, err := client.Version(context.Background())
			if err != nil {
				t.Fatalf("No error expected, but received: %v", err)
			}
			if version != testPair.expected {
				t.Errorf("Version received: %v, want: %v ", version, testPair.expected)
			}
			if calledPath != urlContext+"/ping" {
				t.Errorf("Path received: %v, want: %v ", calledPath, urlContext+"/ping")
			}
		}
	}
}

func Test_Write(t *testing.T) {
	t.Parallel()
	calledPath := ""
	data := ""
	ts := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		calledPath = r.URL.Path
		content, _ := ioutil.ReadAll(r.Body)
		data = string(content)
		rw.WriteHeader(http.StatusNoContent)
	}))
	defer ts.Close()
	for _, urlContext := range []string{"", "/ctx"} {
		calledPath = ""
		client, err := NewClient(ts.URL+urlContext, log.New(log.DebugLevel))
		if err != nil {
			t.Fatal("Unexpected error initializing client: err:", err)
		}
		source := &chronograf.Source{
			URL:      ts.URL + urlContext,
			Type:     chronograf.InfluxDBv2,
			Username: "my-org",
			Password: "my-token",
		}

		client.Connect(context.Background(), source)

		err = client.Write(context.Background(), []chronograf.Point{
			{
				Database:        "mydb",
				RetentionPolicy: "default",
				Measurement:     "temperature",
				Fields: map[string]interface{}{
					"v": true,
				},
			},
		})
		if err != nil {
			t.Fatalf("No error expected, but received: %v", err)
		}
		expectedLine := "temperature v=true"
		if data != expectedLine {
			t.Errorf("Data received: %v, want: %v ", data, expectedLine)
		}
		if calledPath != urlContext+"/write" {
			t.Errorf("Path received: %v, want: %v ", calledPath, urlContext+"/write")
		}
	}
}

func Test_Query(t *testing.T) {
	t.Parallel()
	calledPath := ""
	ts := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		calledPath = r.URL.Path
		rw.WriteHeader(http.StatusOK)
		rw.Write([]byte(`{"message":"hi"}`))
	}))
	defer ts.Close()

	for _, urlContext := range []string{"", "/ctx"} {
		calledPath = ""
		client, err := NewClient(ts.URL+urlContext, log.New(log.DebugLevel))
		if err != nil {
			t.Fatal("Unexpected error initializing client: err:", err)
		}
		source := &chronograf.Source{
			URL:      ts.URL + urlContext,
			Type:     chronograf.InfluxDBv2,
			Username: "my-org",
			Password: "my-token",
		}

		client.Connect(context.Background(), source)

		_, err = client.Query(context.Background(), chronograf.Query{
			DB:      "mydb",
			RP:      "default",
			Command: "show databases",
		})
		if err != nil {
			t.Fatalf("No error expected, but received: %v", err)
		}
		if calledPath != urlContext+"/query" {
			t.Errorf("Path received: %v, want: %v ", calledPath, urlContext+"/query")
		}
	}
}

func Test_Influx_ValidateAuth_V3Core(t *testing.T) {
	t.Parallel()
	calledPath := ""
	ts := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		calledPath = r.URL.Path
		// V3 Core uses /api/v3/query_influxql for SHOW DATABASES
		if strings.HasSuffix(r.URL.Path, "/api/v3/query_influxql") {
			rw.WriteHeader(http.StatusUnauthorized)
			rw.Write([]byte(`{"error":"v3coreauthfailed"}`))
			if auth := r.Header.Get("Authorization"); auth != "Bearer my-db-token" {
				t.Errorf("Expected Authorization 'Bearer my-db-token' but was: %v", auth)
			}
		}
	}))
	defer ts.Close()
	for _, urlContext := range []string{"", "/ctx"} {
		calledPath = ""
		client, err := NewClient(ts.URL+urlContext, log.New(log.DebugLevel))
		if err != nil {
			t.Fatal("Unexpected error initializing client: err:", err)
		}
		source := &chronograf.Source{
			URL:           ts.URL + urlContext,
			Type:          chronograf.InfluxDBv3Core,
			DatabaseToken: "my-db-token",
		}

		client.Connect(context.Background(), source)
		err = client.ValidateAuth(context.Background(), source)
		if err == nil {
			t.Fatal("Expected error but nil")
		}
		if !strings.Contains(err.Error(), "v3coreauthfailed") {
			t.Errorf("Expected client error '%v' to contain server-sent error message", err)
		}
		expectedPath := urlContext + "/api/v3/query_influxql"
		if calledPath != expectedPath {
			t.Errorf("Path received: %v, want: %v ", calledPath, expectedPath)
		}
	}
}

func Test_Influx_ValidateAuth_V3Enterprise(t *testing.T) {
	t.Parallel()
	calledPath := ""
	ts := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		calledPath = r.URL.Path
		// V3 Enterprise uses /api/v3/query_influxql for SHOW DATABASES
		if strings.HasSuffix(r.URL.Path, "/api/v3/query_influxql") {
			rw.WriteHeader(http.StatusUnauthorized)
			rw.Write([]byte(`{"error":"v3enterpriseauthfailed"}`))
			if auth := r.Header.Get("Authorization"); auth != "Bearer my-db-token" {
				t.Errorf("Expected Authorization 'Bearer my-db-token' but was: %v", auth)
			}
		}
	}))
	defer ts.Close()
	for _, urlContext := range []string{"", "/ctx"} {
		calledPath = ""
		client, err := NewClient(ts.URL+urlContext, log.New(log.DebugLevel))
		if err != nil {
			t.Fatal("Unexpected error initializing client: err:", err)
		}
		source := &chronograf.Source{
			URL:           ts.URL + urlContext,
			Type:          chronograf.InfluxDBv3Enterprise,
			DatabaseToken: "my-db-token",
		}

		client.Connect(context.Background(), source)
		err = client.ValidateAuth(context.Background(), source)
		if err == nil {
			t.Fatal("Expected error but nil")
		}
		if !strings.Contains(err.Error(), "v3enterpriseauthfailed") {
			t.Errorf("Expected client error '%v' to contain server-sent error message", err)
		}
		expectedPath := urlContext + "/api/v3/query_influxql"
		if calledPath != expectedPath {
			t.Errorf("Path received: %v, want: %v ", calledPath, expectedPath)
		}
	}
}

func Test_Influx_ValidateAuth_V3Clustered(t *testing.T) {
	t.Parallel()
	mgmtAuthCalled := false
	ts := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		// V3 Clustered validates both management and database auth
		if strings.Contains(r.URL.Path, "/api/v0/accounts/") {
			// Management API call
			mgmtAuthCalled = true
			auth := r.Header.Get("Authorization")
			if auth != "Bearer my-mgmt-token" {
				t.Errorf("Expected Authorization 'Bearer my-mgmt-token' but was: %v", auth)
			}
			rw.WriteHeader(http.StatusUnauthorized)
			rw.Write([]byte(`{"error":"mgmt auth failed"}`))
		} else if strings.HasSuffix(r.URL.Path, "/query") {
			// Database query endpoint
			auth := r.Header.Get("Authorization")
			if auth != "Bearer my-db-token" {
				t.Errorf("Expected Authorization 'Bearer my-db-token' but was: %v", auth)
			}
			rw.WriteHeader(http.StatusUnauthorized)
			rw.Write([]byte(`{"error":"db auth failed"}`))
		}
	}))
	defer ts.Close()

	client, err := NewClient(ts.URL, log.New(log.DebugLevel))
	if err != nil {
		t.Fatal("Unexpected error initializing client: err:", err)
	}
	source := &chronograf.Source{
		URL:             ts.URL,
		Type:            chronograf.InfluxDBv3Clustered,
		DatabaseToken:   "my-db-token",
		ManagementToken: "my-mgmt-token",
	}

	client.Connect(context.Background(), source)
	err = client.ValidateAuth(context.Background(), source)
	if err == nil {
		t.Fatal("Expected error but nil")
	}
	if !strings.Contains(err.Error(), "management authentication failed") {
		t.Errorf("Expected error to contain 'management authentication failed' but was: %v", err)
	}
	if !mgmtAuthCalled {
		t.Error("Expected management API to be called")
	}
}

func Test_Influx_ValidateAuth_V3CloudDedicated(t *testing.T) {
	t.Parallel()
	mgmtAuthCalled := false
	ts := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		// V3 Cloud Dedicated validates both management and database auth
		if strings.Contains(r.URL.Path, "/api/v0/accounts/") {
			// Management API call
			mgmtAuthCalled = true
			auth := r.Header.Get("Authorization")
			if auth != "Bearer my-mgmt-token" {
				t.Errorf("Expected Authorization 'Bearer my-mgmt-token' but was: %v", auth)
			}
			rw.WriteHeader(http.StatusUnauthorized)
			rw.Write([]byte(`{"error":"mgmt auth failed"}`))
		} else if strings.HasSuffix(r.URL.Path, "/query") {
			// Database query endpoint
			auth := r.Header.Get("Authorization")
			if auth != "Bearer my-db-token" {
				t.Errorf("Expected Authorization 'Bearer my-db-token' but was: %v", auth)
			}
			rw.WriteHeader(http.StatusUnauthorized)
			rw.Write([]byte(`{"error":"db auth failed"}`))
		}
	}))
	defer ts.Close()

	client, err := NewClient(ts.URL, log.New(log.DebugLevel))
	client.V3Config = influx.V3Config{
		CloudDedicatedManagementURL: ts.URL,
		ClusteredAccountID:          "test-account-id",
		ClusteredClusterID:          "test-cluster-id",
	}
	if err != nil {
		t.Fatal("Unexpected error initializing client: err:", err)
	}
	source := &chronograf.Source{
		URL:             ts.URL,
		Type:            chronograf.InfluxDBv3CloudDedicated,
		DatabaseToken:   "my-db-token",
		ManagementToken: "my-mgmt-token",
		AccountID:       "test-account-id",
		ClusterID:       "test-cluster-id",
	}

	client.Connect(context.Background(), source)
	err = client.ValidateAuth(context.Background(), source)
	if err == nil {
		t.Fatal("Expected error but nil")
	}
	// Cloud Dedicated validates management auth first
	if !strings.Contains(err.Error(), "management authentication failed") {
		t.Errorf("Expected error to contain 'management authentication failed' but was: %v", err)
	}
	if !mgmtAuthCalled {
		t.Error("Expected management API to be called")
	}
}

func Test_Influx_Authorization_V3Core(t *testing.T) {
	t.Parallel()
	ts := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		auth := r.Header.Get("Authorization")
		if auth != "Bearer test-token-core" {
			t.Errorf("Expected Authorization 'Bearer test-token-core' but was: %v", auth)
		}
		rw.WriteHeader(http.StatusOK)
		// V3 Core returns different response format
		if strings.HasSuffix(r.URL.Path, "/api/v3/query_influxql") {
			rw.Write([]byte(`[{"iox::database":"mydb","deleted":false}]`))
		} else {
			rw.Write([]byte(`{"results":[{}]}`))
		}
	}))
	defer ts.Close()

	client, err := NewClient(ts.URL, log.New(log.DebugLevel))
	if err != nil {
		t.Fatal("Unexpected error initializing client: err:", err)
	}
	source := &chronograf.Source{
		URL:           ts.URL,
		Type:          chronograf.InfluxDBv3Core,
		DatabaseToken: "test-token-core",
	}

	client.Connect(context.Background(), source)
	query := chronograf.Query{
		Command: "SHOW DATABASES",
	}
	_, err = client.Query(context.Background(), query)
	if err != nil {
		t.Fatal("Expected no error but was", err)
	}
}

func Test_Influx_Authorization_V3Enterprise(t *testing.T) {
	t.Parallel()
	ts := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		auth := r.Header.Get("Authorization")
		if auth != "Bearer test-token-enterprise" {
			t.Errorf("Expected Authorization 'Bearer test-token-enterprise' but was: %v", auth)
		}
		rw.WriteHeader(http.StatusOK)
		// V3 Enterprise returns different response format
		if strings.HasSuffix(r.URL.Path, "/api/v3/query_influxql") {
			rw.Write([]byte(`[{"iox::database":"mydb","deleted":false}]`))
		} else {
			rw.Write([]byte(`{"results":[{}]}`))
		}
	}))
	defer ts.Close()

	client, err := NewClient(ts.URL, log.New(log.DebugLevel))
	if err != nil {
		t.Fatal("Unexpected error initializing client: err:", err)
	}
	source := &chronograf.Source{
		URL:           ts.URL,
		Type:          chronograf.InfluxDBv3Enterprise,
		DatabaseToken: "test-token-enterprise",
	}

	client.Connect(context.Background(), source)
	query := chronograf.Query{
		Command: "SHOW DATABASES",
	}
	_, err = client.Query(context.Background(), query)
	if err != nil {
		t.Fatal("Expected no error but was", err)
	}
}

func Test_Influx_Authorization_V3Clustered(t *testing.T) {
	t.Parallel()
	ts := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		// V3 Clustered intercepts SHOW DATABASES and calls management API
		if strings.Contains(r.URL.Path, "/api/v0/accounts/") {
			// Management API - expects management token
			auth := r.Header.Get("Authorization")
			if auth != "Bearer test-mgmt-token" {
				t.Errorf("Expected Authorization 'Bearer test-mgmt-token' but was: %v", auth)
			}
			rw.WriteHeader(http.StatusOK)
			rw.Write([]byte(`[{"name":"mydb","maxTables":500,"maxColumnsPerTable":200,"retentionPeriod":0}]`))
		} else {
			// Database query - expects database token
			auth := r.Header.Get("Authorization")
			if auth != "Bearer test-token-clustered" {
				t.Errorf("Expected Authorization 'Bearer test-token-clustered' but was: %v", auth)
			}
			rw.WriteHeader(http.StatusOK)
			rw.Write([]byte(`{"results":[{}]}`))
		}
	}))
	defer ts.Close()

	client, err := NewClient(ts.URL, log.New(log.DebugLevel))
	if err != nil {
		t.Fatal("Unexpected error initializing client: err:", err)
	}
	source := &chronograf.Source{
		URL:             ts.URL,
		Type:            chronograf.InfluxDBv3Clustered,
		DatabaseToken:   "test-token-clustered",
		ManagementToken: "test-mgmt-token",
	}
	client.V3Config = influx.V3Config{
		CloudDedicatedManagementURL: ts.URL,
		ClusteredAccountID:          "test-account-id",
		ClusteredClusterID:          "test-cluster-id",
	}
	client.Connect(context.Background(), source)
	query := chronograf.Query{
		Command: "SHOW DATABASES",
	}
	_, err = client.Query(context.Background(), query)
	if err != nil {
		t.Fatal("Expected no error but was", err)
	}
}

func Test_Influx_Authorization_V3CloudDedicated(t *testing.T) {
	t.Parallel()
	ts := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		// V3 Cloud Dedicated intercepts SHOW DATABASES and calls management API
		if strings.Contains(r.URL.Path, "/api/v0/accounts/") {
			// Management API - expects management token
			auth := r.Header.Get("Authorization")
			if auth != "Bearer test-mgmt-token" {
				t.Errorf("Expected Authorization 'Bearer test-mgmt-token' but was: %v", auth)
			}
			rw.WriteHeader(http.StatusOK)
			rw.Write([]byte(`[{"name":"mydb","maxTables":500,"maxColumnsPerTable":200,"retentionPeriod":0}]`))
		} else {
			// Database query - expects database token
			auth := r.Header.Get("Authorization")
			if auth != "Bearer test-token-cloud-dedicated" {
				t.Errorf("Expected Authorization 'Bearer test-token-cloud-dedicated' but was: %v", auth)
			}
			rw.WriteHeader(http.StatusOK)
			rw.Write([]byte(`{"results":[{}]}`))
		}
	}))
	defer ts.Close()

	client, err := NewClient(ts.URL, log.New(log.DebugLevel))
	if err != nil {
		t.Fatal("Unexpected error initializing client: err:", err)
	}
	source := &chronograf.Source{
		URL:             ts.URL,
		Type:            chronograf.InfluxDBv3CloudDedicated,
		DatabaseToken:   "test-token-cloud-dedicated",
		ManagementToken: "test-mgmt-token",
		AccountID:       "test-account-id",
		ClusterID:       "test-cluster-id",
	}
	client.V3Config = influx.V3Config{
		CloudDedicatedManagementURL: ts.URL,
	}
	client.Connect(context.Background(), source)
	query := chronograf.Query{
		Command: "SHOW DATABASES",
	}
	_, err = client.Query(context.Background(), query)
	if err != nil {
		t.Fatal("Expected no error but was", err)
	}
}
