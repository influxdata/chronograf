package integrations

// This was intentionally added under the integrations package and not the integrations test package
// so that changes in other parts of the code base that may have an effect on these test will not
// compile until they are fixed.

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"testing"
	"time"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/bolt"
	"github.com/influxdata/chronograf/oauth2"
	"github.com/influxdata/chronograf/server"
)

func TestServer(t *testing.T) {
	type fields struct {
		Organizations []chronograf.Organization
		Users         []chronograf.User
		Sources       []chronograf.Source
		Servers       []chronograf.Server
		Layouts       []chronograf.Layout
		Dashboards    []chronograf.Dashboard
	}
	type args struct {
		server    *server.Server
		method    string
		path      string
		payload   interface{} // Expects this to be a json serializable struct
		principal oauth2.Principal
	}
	type wants struct {
		statusCode  int
		contentType string
		body        string
	}

	tests := []struct {
		name    string
		subName string
		fields  fields
		args    args
		wants   wants
	}{
		{
			name:    "GET /users",
			subName: "User Not Found in the Default Organization",
			fields: fields{
				Users: []chronograf.User{},
			},
			args: args{
				server: &server.Server{
					GithubClientID:     "not empty",
					GithubClientSecret: "not empty",
				},
				method: "GET",
				path:   "/chronograf/v1/users",
				principal: oauth2.Principal{
					Organization: "0",
					Subject:      "billibob",
					Issuer:       "github",
				},
			},
			wants: wants{
				statusCode: 403,
				body:       `{"code":403,"message":"User is not authorized"}`,
			},
		},
		{
			name:    "GET /users",
			subName: "Single User in the Default Organization as SuperAdmin",
			fields: fields{
				Users: []chronograf.User{
					{
						ID:         1, // This is artificial, but should be reflective of the users actual ID
						Name:       "billibob",
						Provider:   "github",
						Scheme:     "oauth2",
						SuperAdmin: true,
						Roles: []chronograf.Role{
							{
								Name:         "admin",
								Organization: "0",
							},
						},
					},
				},
			},
			args: args{
				server: &server.Server{
					GithubClientID:     "not empty",
					GithubClientSecret: "not empty",
				},
				method: "GET",
				path:   "/chronograf/v1/users",
				principal: oauth2.Principal{
					Organization: "0",
					Subject:      "billibob",
					Issuer:       "github",
				},
			},
			wants: wants{
				statusCode: 200,
				body: `
					{
					  "links": {
					    "self": "/chronograf/v1/users"
					  },
					  "users": [
					    {
					      "links": {
					        "self": "/chronograf/v1/users/1"
					      },
					      "id": "1",
					      "name": "billibob",
					      "provider": "github",
					      "scheme": "oauth2",
					      "superAdmin": true,
					      "roles": [
					        {
					          "name": "admin",
					          "organization": "0"
					        }
					      ]
					    }
					  ]
					}`,
			},
		},
	}

	for _, tt := range tests {
		testName := fmt.Sprintf("%s: %s", tt.name, tt.subName)
		t.Run(testName, func(t *testing.T) {
			ctx := context.TODO()
			// Create Test Server
			host, port := hostAndPort()
			tt.args.server.Host = host
			tt.args.server.Port = port

			// This is so that we can use staticly generate jwts
			tt.args.server.TokenSecret = "secret"

			boltFile := newBoltFile()
			tt.args.server.BoltPath = boltFile

			// Prepopulate BoltDB Database for Server
			boltdb := bolt.NewClient()
			boltdb.Path = boltFile
			_ = boltdb.Open(ctx)

			// Populate Organizations
			for i, organization := range tt.fields.Organizations {
				o, err := boltdb.OrganizationsStore.Add(ctx, &organization)
				if err != nil {
					t.Fatalf("failed to add organization: %v", err)
					return
				}
				tt.fields.Organizations[i] = *o
			}

			// Populate Users
			for i, user := range tt.fields.Users {
				u, err := boltdb.UsersStore.Add(ctx, &user)
				if err != nil {
					t.Fatalf("failed to add user: %v", err)
					return
				}
				tt.fields.Users[i] = *u
			}

			// Populate Sources
			for i, source := range tt.fields.Sources {
				s, err := boltdb.SourcesStore.Add(ctx, source)
				if err != nil {
					t.Fatalf("failed to add source: %v", err)
					return
				}
				tt.fields.Sources[i] = s
			}

			// Populate Servers
			for i, server := range tt.fields.Servers {
				s, err := boltdb.ServersStore.Add(ctx, server)
				if err != nil {
					t.Fatalf("failed to add server: %v", err)
					return
				}
				tt.fields.Servers[i] = s
			}

			// Populate Layouts
			for i, layout := range tt.fields.Layouts {
				l, err := boltdb.LayoutsStore.Add(ctx, layout)
				if err != nil {
					t.Fatalf("failed to add layout: %v", err)
					return
				}
				tt.fields.Layouts[i] = l
			}

			// Populate Dashboards
			for i, dashboard := range tt.fields.Dashboards {
				d, err := boltdb.DashboardsStore.Add(ctx, dashboard)
				if err != nil {
					t.Fatalf("failed to add dashboard: %v", err)
					return
				}
				tt.fields.Dashboards[i] = d
			}

			_ = boltdb.Close()

			go tt.args.server.Serve(ctx)
			serverURL := fmt.Sprintf("http://%v:%v%v", host, port, tt.args.path)

			// Wait for the server to come online
			timeout := time.Now().Add(100 * time.Millisecond)
			for {
				_, err := http.Get(serverURL + "/swagger.json")
				if err == nil {
					break
				}
				if time.Now().After(timeout) {
					t.Fatalf("failed to start server")
					return
				}
			}

			// Set the Expiry time on the principal
			tt.args.principal.IssuedAt = time.Now()
			tt.args.principal.ExpiresAt = time.Now().Add(10 * time.Second)

			// Construct HTTP Request
			buf, _ := json.Marshal(tt.args.payload)
			reqBody := ioutil.NopCloser(bytes.NewReader(buf))
			req, _ := http.NewRequest(tt.args.method, serverURL, reqBody)
			token, _ := oauth2.NewJWT(tt.args.server.TokenSecret).Create(ctx, tt.args.principal)
			req.AddCookie(&http.Cookie{
				Name:     "session",
				Value:    string(token),
				HttpOnly: true,
				Path:     "/",
			})

			// Make actual http request
			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				t.Fatalf("failed to make httprequest: %v", err)
				return
			}

			content := resp.Header.Get("Content-Type")
			body, _ := ioutil.ReadAll(resp.Body)

			if resp.StatusCode != tt.wants.statusCode {
				t.Errorf(
					"%s %s Status Code = %v, want %v",
					tt.args.method,
					tt.args.path,
					resp.StatusCode,
					tt.wants.statusCode,
				)
			}

			if tt.wants.contentType != "" && content != tt.wants.contentType {
				t.Errorf(
					"%s %s Content Type = %v, want %v",
					tt.args.method,
					tt.args.path,
					content,
					tt.wants.contentType,
				)
			}

			if eq, err := jsonEqual(tt.wants.body, string(body)); err != nil || !eq {
				t.Errorf(
					"%s %s Body = %v, want %v",
					tt.args.method,
					tt.args.path,
					string(body),
					tt.wants.body,
				)
			}

			tt.args.server.Listener.Close()
		})
	}
}
