package server

import (
	"bytes"
	"context"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"

	"github.com/bouk/httprouter"
	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/log"
	"github.com/influxdata/chronograf/mocks"
)

func Test_ValidSourceRequest(t *testing.T) {
	type args struct {
		source       *chronograf.Source
		defaultOrgID string
	}
	type wants struct {
		err    error
		source *chronograf.Source
	}
	tests := []struct {
		name  string
		args  args
		wants wants
	}{
		{
			name: "nil source",
			args: args{},
			wants: wants{
				err: fmt.Errorf("source must be non-nil"),
			},
		},
		{
			name: "missing url",
			args: args{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv1,
					Username:           "fancy",
					Password:           "i'm so",
					SharedSecret:       "supersecret",
					MetaURL:            "http://www.so.meta.com",
					InsecureSkipVerify: true,
					Default:            true,
					Telegraf:           "telegraf",
					Organization:       "0",
				},
			},
			wants: wants{
				err: fmt.Errorf("url required"),
			},
		},
		{
			name: "invalid source type",
			args: args{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               "non-existent-type",
					Username:           "fancy",
					Password:           "i'm so",
					SharedSecret:       "supersecret",
					URL:                "http://www.any.url.com",
					MetaURL:            "http://www.so.meta.com",
					InsecureSkipVerify: true,
					Default:            true,
					Telegraf:           "telegraf",
					Organization:       "0",
				},
			},
			wants: wants{
				err: fmt.Errorf("invalid source type non-existent-type"),
			},
		},
		{
			name: "set organization to be default org if not specified",
			args: args{
				defaultOrgID: "2",
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv1,
					Username:           "fancy",
					Password:           "i'm so",
					SharedSecret:       "supersecret",
					URL:                "http://www.any.url.com",
					MetaURL:            "http://www.so.meta.com",
					InsecureSkipVerify: true,
					Default:            true,
					Telegraf:           "telegraf",
				},
			},
			wants: wants{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv1,
					Username:           "fancy",
					Password:           "i'm so",
					SharedSecret:       "supersecret",
					URL:                "http://www.any.url.com",
					MetaURL:            "http://www.so.meta.com",
					InsecureSkipVerify: true,
					Default:            true,
					Organization:       "2",
					Telegraf:           "telegraf",
				},
			},
		},
		{
			name: "support InfluxDBv2 type",
			args: args{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv2,
					Username:           "organization",
					Password:           "pwd",
					SharedSecret:       "supersecret",
					URL:                "http://www.any.url.com",
					MetaURL:            "http://www.so.meta.com",
					InsecureSkipVerify: true,
					Default:            true,
					Telegraf:           "telegraf",
				},
			},
			wants: wants{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv2,
					Username:           "organization",
					Password:           "pwd",
					SharedSecret:       "supersecret",
					URL:                "http://www.any.url.com",
					MetaURL:            "http://www.so.meta.com",
					InsecureSkipVerify: true,
					Default:            true,
					Telegraf:           "telegraf",
				},
			},
		},
		{
			name: "InfluxDB Cloud Dedicated - supported",
			args: args{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv3CloudDedicated,
					Username:           "",
					Password:           "",
					SharedSecret:       "supersecret",
					ClusterID:          "3F762A1F-B609-4E7A-9657-8F0A39C27A58",
					AccountID:          "27F924B3-FF40-47B1-B587-3AB980B87EF4",
					ManagementToken:    "mgmt-token",
					DatabaseToken:      "database-token",
					URL:                "http://www.any.url.com",
					MetaURL:            "http://www.so.meta.com",
					InsecureSkipVerify: true,
					Default:            true,
					Telegraf:           "telegraf",
				},
			},
			wants: wants{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv3CloudDedicated,
					Username:           "",
					Password:           "",
					SharedSecret:       "supersecret",
					ClusterID:          "3F762A1F-B609-4E7A-9657-8F0A39C27A58",
					AccountID:          "27F924B3-FF40-47B1-B587-3AB980B87EF4",
					ManagementToken:    "mgmt-token",
					DatabaseToken:      "database-token",
					URL:                "http://www.any.url.com",
					MetaURL:            "http://www.so.meta.com",
					InsecureSkipVerify: true,
					Default:            true,
					Telegraf:           "telegraf",
				},
			},
		},
		{
			name: "InfluxDB Cloud Dedicated - without cluster/account IDs and management token",
			args: args{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv3CloudDedicated,
					Username:           "",
					Password:           "",
					SharedSecret:       "supersecret",
					ClusterID:          "",
					AccountID:          "",
					ManagementToken:    "",
					DatabaseToken:      "database-token",
					URL:                "http://www.any.url.com",
					MetaURL:            "http://www.so.meta.com",
					InsecureSkipVerify: true,
					Default:            true,
					Telegraf:           "telegraf",
					DefaultDB:          "defaultDB",
				},
			},
			wants: wants{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv3CloudDedicated,
					Username:           "",
					Password:           "",
					SharedSecret:       "supersecret",
					ClusterID:          "",
					AccountID:          "",
					ManagementToken:    "",
					DatabaseToken:      "database-token",
					URL:                "http://www.any.url.com",
					MetaURL:            "http://www.so.meta.com",
					InsecureSkipVerify: true,
					Default:            true,
					Telegraf:           "telegraf",
					DefaultDB:          "defaultDB",
				},
			},
		},
		{
			name: "InfluxDB Cloud Dedicated - missing cluster ID",
			args: args{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv3CloudDedicated,
					Username:           "",
					Password:           "",
					SharedSecret:       "supersecret",
					AccountID:          "27F924B3-FF40-47B1-B587-3AB980B87EF4",
					ManagementToken:    "mgmt-token",
					DatabaseToken:      "database-token",
					URL:                "http://www.any.url.com",
					MetaURL:            "http://www.so.meta.com",
					InsecureSkipVerify: true,
					Default:            true,
					Telegraf:           "telegraf",
				},
			},
			wants: wants{
				err: fmt.Errorf("cluster ID required"),
			},
		},
		{
			name: "InfluxDB Cloud Dedicated - invalid cluster ID",
			args: args{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv3CloudDedicated,
					Username:           "",
					Password:           "",
					SharedSecret:       "supersecret",
					ClusterID:          "not-a-uuid",
					AccountID:          "27F924B3-FF40-47B1-B587-3AB980B87EF4",
					ManagementToken:    "mgmt-token",
					DatabaseToken:      "database-token",
					URL:                "http://www.any.url.com",
					MetaURL:            "http://www.so.meta.com",
					InsecureSkipVerify: true,
					Default:            true,
					Telegraf:           "telegraf",
				},
			},
			wants: wants{
				err: fmt.Errorf("cluster ID is not a valid UUID"),
			},
		},
		{
			name: "InfluxDB Cloud Dedicated - missing account ID",
			args: args{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv3CloudDedicated,
					Username:           "",
					Password:           "",
					SharedSecret:       "supersecret",
					ClusterID:          "3F762A1F-B609-4E7A-9657-8F0A39C27A58",
					ManagementToken:    "mgmt-token",
					DatabaseToken:      "database-token",
					URL:                "http://www.any.url.com",
					MetaURL:            "http://www.so.meta.com",
					InsecureSkipVerify: true,
					Default:            true,
					Telegraf:           "telegraf",
				},
			},
			wants: wants{
				err: fmt.Errorf("account ID required"),
			},
		},
		{
			name: "InfluxDB Cloud Dedicated - invalid account ID",
			args: args{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv3CloudDedicated,
					Username:           "",
					Password:           "",
					SharedSecret:       "supersecret",
					ClusterID:          "3F762A1F-B609-4E7A-9657-8F0A39C27A58",
					AccountID:          "not-a-uuid",
					ManagementToken:    "mgmt-token",
					DatabaseToken:      "database-token",
					URL:                "http://www.any.url.com",
					MetaURL:            "http://www.so.meta.com",
					InsecureSkipVerify: true,
					Default:            true,
					Telegraf:           "telegraf",
				},
			},
			wants: wants{
				err: fmt.Errorf("account ID is not a valid UUID"),
			},
		},
		{
			name: "InfluxDB Cloud Dedicated - missing management token",
			args: args{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv3CloudDedicated,
					Username:           "",
					Password:           "",
					SharedSecret:       "supersecret",
					ClusterID:          "3F762A1F-B609-4E7A-9657-8F0A39C27A58",
					AccountID:          "27F924B3-FF40-47B1-B587-3AB980B87EF4",
					DatabaseToken:      "database-token",
					URL:                "http://www.any.url.com",
					MetaURL:            "http://www.so.meta.com",
					InsecureSkipVerify: true,
					Default:            true,
					Telegraf:           "telegraf",
				},
			},
			wants: wants{
				err: fmt.Errorf("management token required"),
			},
		},
		{
			name: "InfluxDB Cloud Dedicated - missing database token",
			args: args{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv3CloudDedicated,
					Username:           "",
					Password:           "",
					SharedSecret:       "supersecret",
					ClusterID:          "3F762A1F-B609-4E7A-9657-8F0A39C27A58",
					AccountID:          "27F924B3-FF40-47B1-B587-3AB980B87EF4",
					ManagementToken:    "mgmt-token",
					URL:                "http://www.any.url.com",
					MetaURL:            "http://www.so.meta.com",
					InsecureSkipVerify: true,
					Default:            true,
					Telegraf:           "telegraf",
				},
			},
			wants: wants{
				err: fmt.Errorf("database token required"),
			},
		},
		{
			name: "InfluxDB Cloud Dedicated - missing default DB",
			args: args{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv3CloudDedicated,
					Username:           "",
					Password:           "",
					SharedSecret:       "supersecret",
					AccountID:          "",
					ManagementToken:    "",
					DatabaseToken:      "database-token",
					URL:                "http://www.any.url.com",
					MetaURL:            "http://www.so.meta.com",
					InsecureSkipVerify: true,
					Default:            true,
					Telegraf:           "telegraf",
				},
			},
			wants: wants{
				err: fmt.Errorf("default database is required for queries"),
			},
		},
		{
			name: "InfluxDB 3 Core - supported",
			args: args{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv3Core,
					DatabaseToken:      "database-token",
					URL:                "http://www.any.url.com",
					InsecureSkipVerify: true,
					Default:            true,
					Telegraf:           "telegraf",
				},
			},
			wants: wants{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv3Core,
					DatabaseToken:      "database-token",
					URL:                "http://www.any.url.com",
					InsecureSkipVerify: true,
					Default:            true,
					Telegraf:           "telegraf",
				},
			},
		},
		{
			name: "InfluxDB 3 Core - missing database token",
			args: args{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv3Core,
					URL:                "http://www.any.url.com",
					InsecureSkipVerify: true,
					Default:            true,
					Telegraf:           "telegraf",
				},
			},
			wants: wants{
				err: fmt.Errorf("database token required"),
			},
		},
		{
			name: "InfluxDB 3 Enterprise - supported",
			args: args{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv3Enterprise,
					DatabaseToken:      "database-token",
					URL:                "http://www.any.url.com",
					InsecureSkipVerify: true,
					Default:            true,
					Telegraf:           "telegraf",
				},
			},
			wants: wants{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv3Enterprise,
					DatabaseToken:      "database-token",
					URL:                "http://www.any.url.com",
					InsecureSkipVerify: true,
					Default:            true,
					Telegraf:           "telegraf",
				},
			},
		},
		{
			name: "InfluxDB 3 Enterprise - missing database token",
			args: args{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv3Enterprise,
					URL:                "http://www.any.url.com",
					InsecureSkipVerify: true,
					Default:            true,
					Telegraf:           "telegraf",
				},
			},
			wants: wants{
				err: fmt.Errorf("database token required"),
			},
		},
		{
			name: "InfluxDB 3 Clustered - supported",
			args: args{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv3Clustered,
					ManagementToken:    "mgmt-token",
					DatabaseToken:      "database-token",
					URL:                "http://www.any.url.com",
					InsecureSkipVerify: true,
					Default:            true,
					Telegraf:           "telegraf",
				},
			},
			wants: wants{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv3Clustered,
					ManagementToken:    "mgmt-token",
					DatabaseToken:      "database-token",
					URL:                "http://www.any.url.com",
					InsecureSkipVerify: true,
					Default:            true,
					Telegraf:           "telegraf",
				},
			},
		},
		{
			name: "InfluxDB 3 Clustered - missing management token",
			args: args{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv3Clustered,
					DatabaseToken:      "database-token",
					URL:                "http://www.any.url.com",
					InsecureSkipVerify: true,
					Default:            true,
					Telegraf:           "telegraf",
				},
			},
			wants: wants{
				err: fmt.Errorf("management token required"),
			},
		},
		{
			name: "InfluxDB 3 Clustered - missing database token",
			args: args{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv3Clustered,
					ManagementToken:    "mgmt-token",
					URL:                "http://www.any.url.com",
					InsecureSkipVerify: true,
					Default:            true,
					Telegraf:           "telegraf",
				},
			},
			wants: wants{
				err: fmt.Errorf("database token required"),
			},
		},
		{
			name: "bad url",
			args: args{
				source: &chronograf.Source{
					ID:                 1,
					Name:               "I'm a really great source",
					Type:               chronograf.InfluxDBv1,
					Username:           "fancy",
					Password:           "i'm so",
					SharedSecret:       "supersecret",
					URL:                "im a bad url",
					MetaURL:            "http://www.so.meta.com",
					InsecureSkipVerify: true,
					Organization:       "0",
					Default:            true,
					Telegraf:           "telegraf",
				},
			},
			wants: wants{
				err: fmt.Errorf("invalid source URI: parse"), // im a bad url: invalid URI for request
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidSourceRequest(tt.args.source, tt.args.defaultOrgID)
			if err == nil && tt.wants.err == nil {
				if diff := cmp.Diff(tt.args.source, tt.wants.source); diff != "" {
					t.Errorf("%q. ValidSourceRequest():\n-got/+want\ndiff %s", tt.name, diff)
				}
				return
			}
			if err != nil && tt.wants.err == nil {
				t.Errorf("%q. ValidSourceRequest() = %q", tt.name, err)
			} else if err.Error() != tt.wants.err.Error() {
				if err != nil && tt.wants.err != nil {
					if strings.HasPrefix(err.Error(), tt.wants.err.Error()) {
						// error messages vary between go versions, but they have the same prefixes
						return
					}
				}
				t.Errorf("%q. ValidSourceRequest() = %q, want %q", tt.name, err, tt.wants.err)
			}
		})
	}
}

func Test_newSourceResponse(t *testing.T) {
	tests := []struct {
		name string
		src  chronograf.Source
		want sourceResponse
	}{
		{
			name: "Test empty telegraf",
			src: chronograf.Source{
				ID:       1,
				Telegraf: "",
			},
			want: sourceResponse{
				Source: chronograf.Source{
					ID:       1,
					Telegraf: "telegraf",
				},
				AuthenticationMethod: "unknown",
				Links: sourceLinks{
					Self:        "/chronograf/v1/sources/1",
					Services:    "/chronograf/v1/sources/1/services",
					Proxy:       "/chronograf/v1/sources/1/proxy",
					Queries:     "/chronograf/v1/sources/1/queries",
					Write:       "/chronograf/v1/sources/1/write",
					Kapacitors:  "/chronograf/v1/sources/1/kapacitors",
					Users:       "/chronograf/v1/sources/1/users",
					Permissions: "/chronograf/v1/sources/1/permissions",
					Databases:   "/chronograf/v1/sources/1/dbs",
					Annotations: "/chronograf/v1/sources/1/annotations",
					Health:      "/chronograf/v1/sources/1/health",
				},
			},
		},
		{
			name: "Test non-default telegraf",
			src: chronograf.Source{
				ID:       1,
				Telegraf: "howdy",
			},
			want: sourceResponse{
				Source: chronograf.Source{
					ID:       1,
					Telegraf: "howdy",
				},
				AuthenticationMethod: "unknown",
				Links: sourceLinks{
					Self:        "/chronograf/v1/sources/1",
					Proxy:       "/chronograf/v1/sources/1/proxy",
					Services:    "/chronograf/v1/sources/1/services",
					Queries:     "/chronograf/v1/sources/1/queries",
					Write:       "/chronograf/v1/sources/1/write",
					Kapacitors:  "/chronograf/v1/sources/1/kapacitors",
					Users:       "/chronograf/v1/sources/1/users",
					Permissions: "/chronograf/v1/sources/1/permissions",
					Databases:   "/chronograf/v1/sources/1/dbs",
					Annotations: "/chronograf/v1/sources/1/annotations",
					Health:      "/chronograf/v1/sources/1/health",
				},
			},
		},
	}
	for _, tt := range tests {
		if got := newSourceResponse(context.Background(), tt.src); !reflect.DeepEqual(got, tt.want) {
			t.Errorf("%q. newSourceResponse() = %v, want %v", tt.name, got, tt.want)
		}
	}
}

func TestService_SourcesID(t *testing.T) {
	type fields struct {
		SourcesStore chronograf.SourcesStore
		Logger       chronograf.Logger
	}
	type args struct {
		w *httptest.ResponseRecorder
		r *http.Request
	}
	tests := []struct {
		name            string
		args            args
		fields          fields
		ID              string
		wantStatusCode  int
		wantContentType string
		wantBody        string
	}{
		{
			name: "Get source without defaultRP includes empty defaultRP in response",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"GET",
					"http://any.url",
					nil,
				),
			},
			fields: fields{
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID: 1,
						}, nil
					},
				},
				Logger: log.New(log.DebugLevel),
			},
			ID:              "1",
			wantStatusCode:  200,
			wantContentType: "application/json",
			wantBody: `{"id":"1","name":"","url":"","default":false,"telegraf":"telegraf","organization":"","defaultRP":"","version":"Unknown","authentication":"unknown","links":{"self":"/chronograf/v1/sources/1","kapacitors":"/chronograf/v1/sources/1/kapacitors","services":"/chronograf/v1/sources/1/services","proxy":"/chronograf/v1/sources/1/proxy","queries":"/chronograf/v1/sources/1/queries","write":"/chronograf/v1/sources/1/write","permissions":"/chronograf/v1/sources/1/permissions","users":"/chronograf/v1/sources/1/users","databases":"/chronograf/v1/sources/1/dbs","annotations":"/chronograf/v1/sources/1/annotations","health":"/chronograf/v1/sources/1/health"}}
`,
		},
	}
	for _, tt := range tests {
		tt.args.r = tt.args.r.WithContext(httprouter.WithParams(
			context.Background(),
			httprouter.Params{
				{
					Key:   "id",
					Value: tt.ID,
				},
			}))
		h := &Service{
			Store: &mocks.Store{
				SourcesStore: tt.fields.SourcesStore,
			},
			Logger: tt.fields.Logger,
		}
		h.SourcesID(tt.args.w, tt.args.r)

		resp := tt.args.w.Result()
		contentType := resp.Header.Get("Content-Type")
		body, _ := ioutil.ReadAll(resp.Body)

		if resp.StatusCode != tt.wantStatusCode {
			t.Errorf("%q. SourcesID() = got %v, want %v", tt.name, resp.StatusCode, tt.wantStatusCode)
		}
		if tt.wantContentType != "" && contentType != tt.wantContentType {
			t.Errorf("%q. SourcesID() = got %v, want %v", tt.name, contentType, tt.wantContentType)
		}
		if tt.wantBody != "" && string(body) != tt.wantBody {
			t.Errorf("%q. SourcesID() =\ngot  ***%v***\nwant ***%v***\n", tt.name, string(body), tt.wantBody)
		}

	}
}
func TestService_UpdateSource(t *testing.T) {
	type fields struct {
		SourcesStore       chronograf.SourcesStore
		OrganizationsStore chronograf.OrganizationsStore
		Logger             chronograf.Logger
	}
	type args struct {
		w *httptest.ResponseRecorder
		r *http.Request
	}
	tests := []struct {
		name              string
		args              args
		fields            fields
		ID                string
		requestBody       func(string) string
		mockServerHandler http.HandlerFunc
		wantStatusCode    int
		wantContentType   string
		wantBody          func(string) string
	}{
		{
			name: "Update source updates fields",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"PATCH",
					"http://any.url",
					nil),
			},
			fields: fields{
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID: 1,
						}, nil
					},
					UpdateF: func(ctx context.Context, upd chronograf.Source) error {
						return nil
					},
				},
				OrganizationsStore: &mocks.OrganizationsStore{
					DefaultOrganizationF: func(context.Context) (*chronograf.Organization, error) {
						return &chronograf.Organization{
							ID:   "1337",
							Name: "pineapple_kingdom",
						}, nil
					},
				},
				Logger: log.New(log.DebugLevel),
			},
			ID: "1",
			requestBody: func(url string) string {
				return fmt.Sprintf(`{"name":"marty","password":"the_lake","username":"bob","type":"influx","telegraf":"murlin","defaultRP":"pineapple","url":"%s","metaUrl":"http://murl"}`, url)
			},
			wantStatusCode:  200,
			wantContentType: "application/json",
			wantBody: func(url string) string {
				return fmt.Sprintf(`{"id":"1","name":"marty","type":"influx","username":"bob","url":"%s","metaUrl":"http://murl","default":false,"telegraf":"murlin","organization":"1337","defaultRP":"pineapple","authentication":"basic","links":{"self":"/chronograf/v1/sources/1","kapacitors":"/chronograf/v1/sources/1/kapacitors","services":"/chronograf/v1/sources/1/services","proxy":"/chronograf/v1/sources/1/proxy","queries":"/chronograf/v1/sources/1/queries","write":"/chronograf/v1/sources/1/write","permissions":"/chronograf/v1/sources/1/permissions","users":"/chronograf/v1/sources/1/users","databases":"/chronograf/v1/sources/1/dbs","annotations":"/chronograf/v1/sources/1/annotations","health":"/chronograf/v1/sources/1/health"}}
`, url)
			},
		},
		{
			name: "Update InfluxDB v3 Core source",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"PATCH",
					"http://any.url",
					nil),
			},
			fields: fields{
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID:            2,
							URL:           "http://old.url",
							Type:          chronograf.InfluxDBv3Core,
							DatabaseToken: "old-token",
						}, nil
					},
					UpdateF: func(ctx context.Context, upd chronograf.Source) error {
						return nil
					},
				},
				OrganizationsStore: &mocks.OrganizationsStore{
					DefaultOrganizationF: func(context.Context) (*chronograf.Organization, error) {
						return &chronograf.Organization{
							ID:   "1337",
							Name: "pineapple_kingdom",
						}, nil
					},
				},
				Logger: log.New(log.DebugLevel),
			},
			ID: "2",
			requestBody: func(url string) string {
				return fmt.Sprintf(`{"name":"v3-core","type":"influx-v3-core","url":"%s","databaseToken":"test-token-123","defaultDB":"mydb","telegraf":"telegraf"}`, url)
			},
			mockServerHandler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				// v3 Core sources validate by querying /api/v3/query_influxql
				if r.URL.Path == "/api/v3/query_influxql" {
					w.WriteHeader(http.StatusOK)
					w.Write([]byte(`[]`))
				} else {
					w.WriteHeader(http.StatusOK)
					w.Write([]byte(`{}`))
				}
			}),
			wantStatusCode:  200,
			wantContentType: "application/json",
			wantBody: func(url string) string {
				return fmt.Sprintf(`{"id":"2","name":"v3-core","type":"influx-v3-core","databaseToken":"test-token-123","url":"%s","default":false,"telegraf":"telegraf","organization":"1337","defaultRP":"","defaultDB":"mydb","version":"Unknown","authentication":"unknown","links":{"self":"/chronograf/v1/sources/2","kapacitors":"/chronograf/v1/sources/2/kapacitors","services":"/chronograf/v1/sources/2/services","proxy":"/chronograf/v1/sources/2/proxy","queries":"/chronograf/v1/sources/2/queries","write":"/chronograf/v1/sources/2/write","permissions":"/chronograf/v1/sources/2/permissions","users":"/chronograf/v1/sources/2/users","databases":"/chronograf/v1/sources/2/dbs","annotations":"/chronograf/v1/sources/2/annotations","health":"/chronograf/v1/sources/2/health"}}
`, url)
			},
		},
		{
			name: "Update InfluxDB v3 Enterprise source",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"PATCH",
					"http://any.url",
					nil),
			},
			fields: fields{
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID:            3,
							Type:          chronograf.InfluxDBv3Enterprise,
							DatabaseToken: "old-enterprise-token",
						}, nil
					},
					UpdateF: func(ctx context.Context, upd chronograf.Source) error {
						return nil
					},
				},
				OrganizationsStore: &mocks.OrganizationsStore{
					DefaultOrganizationF: func(context.Context) (*chronograf.Organization, error) {
						return &chronograf.Organization{
							ID:   "1337",
							Name: "pineapple_kingdom",
						}, nil
					},
				},
				Logger: log.New(log.DebugLevel),
			},
			ID: "3",
			requestBody: func(url string) string {
				return fmt.Sprintf(`{"name":"v3-enterprise","type":"influx-v3-enterprise","url":"%s","databaseToken":"enterprise-token-456","defaultDB":"enterprise_db","telegraf":"telegraf"}`, url)
			},
			mockServerHandler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				// v3 Enterprise sources validate by querying /api/v3/query_influxql
				if r.URL.Path == "/api/v3/query_influxql" {
					w.WriteHeader(http.StatusOK)
					w.Write([]byte(`[]`))
				} else {
					w.WriteHeader(http.StatusOK)
					w.Write([]byte(`{}`))
				}
			}),
			wantStatusCode:  200,
			wantContentType: "application/json",
			wantBody: func(url string) string {
				return fmt.Sprintf(`{"id":"3","name":"v3-enterprise","type":"influx-v3-enterprise","databaseToken":"enterprise-token-456","url":"%s","default":false,"telegraf":"telegraf","organization":"1337","defaultRP":"","defaultDB":"enterprise_db","version":"Unknown","authentication":"unknown","links":{"self":"/chronograf/v1/sources/3","kapacitors":"/chronograf/v1/sources/3/kapacitors","services":"/chronograf/v1/sources/3/services","proxy":"/chronograf/v1/sources/3/proxy","queries":"/chronograf/v1/sources/3/queries","write":"/chronograf/v1/sources/3/write","permissions":"/chronograf/v1/sources/3/permissions","users":"/chronograf/v1/sources/3/users","databases":"/chronograf/v1/sources/3/dbs","annotations":"/chronograf/v1/sources/3/annotations","health":"/chronograf/v1/sources/3/health"}}
`, url)
			},
		},
		{
			name: "Update InfluxDB v3 Clustered source",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"PATCH",
					"http://any.url",
					nil),
			},
			fields: fields{
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID:              4,
							Type:            chronograf.InfluxDBv3Clustered,
							DatabaseToken:   "old-db-token",
							ManagementToken: "old-mgmt-token",
						}, nil
					},
					UpdateF: func(ctx context.Context, upd chronograf.Source) error {
						return nil
					},
				},
				OrganizationsStore: &mocks.OrganizationsStore{
					DefaultOrganizationF: func(context.Context) (*chronograf.Organization, error) {
						return &chronograf.Organization{
							ID:   "1337",
							Name: "pineapple_kingdom",
						}, nil
					},
				},
				Logger: log.New(log.DebugLevel),
			},
			ID: "4",
			requestBody: func(url string) string {
				return fmt.Sprintf(`{"name":"v3-clustered","type":"influx-v3-clustered","url":"%s","databaseToken":"db-token-789","managementToken":"mgmt-token-789","clusterId":"a1b2c3d4-e5f6-7890-abcd-ef1234567890","accountId":"f1e2d3c4-b5a6-9870-dcba-fe9876543210","defaultDB":"clustered_db","telegraf":"telegraf"}`, url)
			},
			mockServerHandler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				// v3 Clustered sources validate by accessing the management API
				if strings.Contains(r.URL.Path, "/api/v0/accounts/") || r.URL.Path == "/api/v3/query_influxql" {
					w.WriteHeader(http.StatusOK)
					w.Write([]byte(`{"databases":[]}`))
				} else {
					w.WriteHeader(http.StatusOK)
					w.Write([]byte(`{}`))
				}
			}),
			wantStatusCode:  200,
			wantContentType: "application/json",
			wantBody: func(url string) string {
				return fmt.Sprintf(`{"id":"4","name":"v3-clustered","type":"influx-v3-clustered","clusterId":"a1b2c3d4-e5f6-7890-abcd-ef1234567890","accountId":"f1e2d3c4-b5a6-9870-dcba-fe9876543210","managementToken":"mgmt-token-789","databaseToken":"db-token-789","url":"%s","default":false,"telegraf":"telegraf","organization":"1337","defaultRP":"","defaultDB":"clustered_db","authentication":"unknown","links":{"self":"/chronograf/v1/sources/4","kapacitors":"/chronograf/v1/sources/4/kapacitors","services":"/chronograf/v1/sources/4/services","proxy":"/chronograf/v1/sources/4/proxy","queries":"/chronograf/v1/sources/4/queries","write":"/chronograf/v1/sources/4/write","permissions":"/chronograf/v1/sources/4/permissions","users":"/chronograf/v1/sources/4/users","databases":"/chronograf/v1/sources/4/dbs","annotations":"/chronograf/v1/sources/4/annotations","health":"/chronograf/v1/sources/4/health"}}
`, url)
			},
		},
		{
			name: "Update InfluxDB v3 Cloud Dedicated source",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"PATCH",
					"http://any.url",
					nil),
			},
			fields: fields{
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID:              5,
							Type:            chronograf.InfluxDBv3CloudDedicated,
							DatabaseToken:   "old-cloud-token",
							ManagementToken: "old-cloud-mgmt",
							ClusterID:       "11111111-1111-1111-1111-111111111111",
							AccountID:       "22222222-2222-2222-2222-222222222222",
						}, nil
					},
					UpdateF: func(ctx context.Context, upd chronograf.Source) error {
						return nil
					},
				},
				OrganizationsStore: &mocks.OrganizationsStore{
					DefaultOrganizationF: func(context.Context) (*chronograf.Organization, error) {
						return &chronograf.Organization{
							ID:   "1337",
							Name: "pineapple_kingdom",
						}, nil
					},
				},
				Logger: log.New(log.DebugLevel),
			},
			ID: "5",
			requestBody: func(url string) string {
				return fmt.Sprintf(`{"name":"v3-cloud-dedicated","type":"influx-v3-cloud-dedicated","url":"%s","databaseToken":"cloud-token-abc","managementToken":"cloud-mgmt-abc","clusterId":"12345678-1234-5678-1234-567812345678","accountId":"87654321-4321-8765-4321-876543218765","defaultDB":"cloud_db","telegraf":"telegraf"}`, url)
			},
			mockServerHandler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				// v3 Cloud Dedicated sources validate by accessing the management API
				if strings.Contains(r.URL.Path, "/api/v0/accounts/") || r.URL.Path == "/api/v3/query_influxql" {
					w.WriteHeader(http.StatusOK)
					w.Write([]byte(`{"databases":[]}`))
				} else {
					w.WriteHeader(http.StatusOK)
					w.Write([]byte(`{}`))
				}
			}),
			wantStatusCode:  200,
			wantContentType: "application/json",
			wantBody: func(url string) string {
				return fmt.Sprintf(`{"id":"5","name":"v3-cloud-dedicated","type":"influx-v3-cloud-dedicated","clusterId":"12345678-1234-5678-1234-567812345678","accountId":"87654321-4321-8765-4321-876543218765","managementToken":"cloud-mgmt-abc","databaseToken":"cloud-token-abc","url":"%s","default":false,"telegraf":"telegraf","organization":"1337","defaultRP":"","defaultDB":"cloud_db","authentication":"unknown","links":{"self":"/chronograf/v1/sources/5","kapacitors":"/chronograf/v1/sources/5/kapacitors","services":"/chronograf/v1/sources/5/services","proxy":"/chronograf/v1/sources/5/proxy","queries":"/chronograf/v1/sources/5/queries","write":"/chronograf/v1/sources/5/write","permissions":"/chronograf/v1/sources/5/permissions","users":"/chronograf/v1/sources/5/users","databases":"/chronograf/v1/sources/5/dbs","annotations":"/chronograf/v1/sources/5/annotations","health":"/chronograf/v1/sources/5/health"}}
`, url)
			},
		},
		{
			name: "Update InfluxDB v3 Cloud Dedicated source to default DB",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"PATCH",
					"http://any.url",
					nil),
			},
			fields: fields{
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID:              6,
							Type:            chronograf.InfluxDBv3CloudDedicated,
							DatabaseToken:   "old-cloud-token",
							ManagementToken: "old-cloud-mgmt",
							ClusterID:       "11111111-1111-1111-1111-111111111111",
							AccountID:       "22222222-2222-2222-2222-222222222222",
						}, nil
					},
					UpdateF: func(ctx context.Context, upd chronograf.Source) error {
						return nil
					},
				},
				OrganizationsStore: &mocks.OrganizationsStore{
					DefaultOrganizationF: func(context.Context) (*chronograf.Organization, error) {
						return &chronograf.Organization{
							ID:   "1337",
							Name: "pineapple_kingdom",
						}, nil
					},
				},
				Logger: log.New(log.DebugLevel),
			},
			ID: "6",
			requestBody: func(url string) string {
				return fmt.Sprintf(`{"name":"v3-cloud-dedicated","type":"influx-v3-cloud-dedicated","url":"%s","databaseToken":"old-cloud-token","managementToken":"","clusterId":"","accountId":"","defaultDB":"my-db","telegraf":"my-db"}`, url)
			},
			mockServerHandler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				// v3 Cloud Dedicated sources validate by accessing the management API
				if strings.Contains(r.URL.Path, "/api/v0/accounts/") || r.URL.Path == "/api/v3/query_influxql" {
					w.WriteHeader(http.StatusOK)
					w.Write([]byte(`{"databases":[]}`))
				} else {
					w.WriteHeader(http.StatusOK)
					w.Write([]byte(`{}`))
				}
			}),
			wantStatusCode:  200,
			wantContentType: "application/json",
			wantBody: func(url string) string {
				return fmt.Sprintf(`{"id":"6","name":"v3-cloud-dedicated","type":"influx-v3-cloud-dedicated","databaseToken":"old-cloud-token","url":"%s","default":false,"telegraf":"my-db","organization":"1337","defaultRP":"","defaultDB":"my-db","authentication":"unknown","links":{"self":"/chronograf/v1/sources/6","kapacitors":"/chronograf/v1/sources/6/kapacitors","services":"/chronograf/v1/sources/6/services","proxy":"/chronograf/v1/sources/6/proxy","queries":"/chronograf/v1/sources/6/queries","write":"/chronograf/v1/sources/6/write","permissions":"/chronograf/v1/sources/6/permissions","users":"/chronograf/v1/sources/6/users","databases":"/chronograf/v1/sources/6/dbs","annotations":"/chronograf/v1/sources/6/annotations","health":"/chronograf/v1/sources/6/health"}}
`, url)
			},
		},
		{
			name: "Update InfluxDB v3 Serverless source",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"PATCH",
					"http://any.url",
					nil),
			},
			fields: fields{
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID:            7,
							Type:          chronograf.InfluxDBv3Serverless,
							DatabaseToken: "old-serverless-token",
						}, nil
					},
					UpdateF: func(ctx context.Context, upd chronograf.Source) error {
						return nil
					},
				},
				OrganizationsStore: &mocks.OrganizationsStore{
					DefaultOrganizationF: func(context.Context) (*chronograf.Organization, error) {
						return &chronograf.Organization{
							ID:   "1337",
							Name: "pineapple_kingdom",
						}, nil
					},
				},
				Logger: log.New(log.DebugLevel),
			},
			ID: "7",
			requestBody: func(url string) string {
				return fmt.Sprintf(`{"name":"v3-serverless","type":"influx-v3-serverless","url":"%s","databaseToken":"serverless-token-xyz","defaultDB":"serverless_db","telegraf":"telegraf"}`, url)
			},
			mockServerHandler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				// v3 Serverless uses /query endpoint like v1
				if r.URL.Path == "/query" {
					w.WriteHeader(http.StatusOK)
					w.Write([]byte(`{"results":[{"statement_id":0,"series":[{"name":"databases","columns":["name"],"values":[["_internal"]]}]}]}`))
				} else {
					w.WriteHeader(http.StatusOK)
					w.Write([]byte(`{}`))
				}
			}),
			wantStatusCode:  200,
			wantContentType: "application/json",
			wantBody: func(url string) string {
				return fmt.Sprintf(`{"id":"7","name":"v3-serverless","type":"influx-v3-serverless","databaseToken":"serverless-token-xyz","url":"%s","default":false,"telegraf":"telegraf","organization":"1337","defaultRP":"","defaultDB":"serverless_db","authentication":"token","links":{"self":"/chronograf/v1/sources/7","kapacitors":"/chronograf/v1/sources/7/kapacitors","services":"/chronograf/v1/sources/7/services","proxy":"/chronograf/v1/sources/7/proxy","queries":"/chronograf/v1/sources/7/queries","write":"/chronograf/v1/sources/7/write","permissions":"/chronograf/v1/sources/7/permissions","users":"/chronograf/v1/sources/7/users","databases":"/chronograf/v1/sources/7/dbs","annotations":"/chronograf/v1/sources/7/annotations","health":"/chronograf/v1/sources/7/health"}}
`, url)
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockHandler := tt.mockServerHandler
			if mockHandler == nil {
				mockHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					if r.URL.Path == "/query" {
						w.WriteHeader(http.StatusOK) // credentials
					} else {
						w.WriteHeader(http.StatusNoContent)
						w.Header().Set("X-Influxdb-Build", "ENT")
					}
					w.Write(([]byte)("{}"))
				})
			}
			ts := httptest.NewServer(mockHandler)
			defer ts.Close()

			h := &Service{
				Store: &mocks.Store{
					SourcesStore:       tt.fields.SourcesStore,
					OrganizationsStore: tt.fields.OrganizationsStore,
				},
				Logger: tt.fields.Logger,
				V3Config: chronograf.V3Config{
					CloudDedicatedManagementURL: ts.URL,
				},
			}

			tt.args.r = tt.args.r.WithContext(httprouter.WithParams(
				context.Background(),
				httprouter.Params{
					{
						Key:   "id",
						Value: tt.ID,
					},
				}))
			tt.args.r.Body = ioutil.NopCloser(
				bytes.NewReader([]byte(tt.requestBody(ts.URL))),
			)
			h.UpdateSource(tt.args.w, tt.args.r)

			resp := tt.args.w.Result()
			contentType := resp.Header.Get("Content-Type")
			body, _ := ioutil.ReadAll(resp.Body)

			if resp.StatusCode != tt.wantStatusCode {
				t.Errorf("%q. UpdateSource() = got %v, want %v", tt.name, resp.StatusCode, tt.wantStatusCode)
			}
			if contentType != tt.wantContentType {
				t.Errorf("%q. UpdateSource() = got %v, want %v", tt.name, contentType, tt.wantContentType)
			}
			wantBody := tt.wantBody(ts.URL)
			if string(body) != wantBody {
				t.Errorf("%q. UpdateSource() =\ngot  ***%v***\nwant ***%v***\n", tt.name, string(body), wantBody)
			}
		})
	}

}

func TestService_NewSourceUser(t *testing.T) {
	type fields struct {
		SourcesStore chronograf.SourcesStore
		TimeSeries   TimeSeriesClient
		Logger       chronograf.Logger
		UseAuth      bool
	}
	type args struct {
		w *httptest.ResponseRecorder
		r *http.Request
	}
	tests := []struct {
		name            string
		fields          fields
		args            args
		ID              string
		wantStatus      int
		wantContentType string
		wantBody        string
	}{
		{
			name: "New user for data source",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"POST",
					"http://local/chronograf/v1/sources/1",
					ioutil.NopCloser(
						bytes.NewReader([]byte(`{"name": "marty", "password": "the_lake"}`)))),
			},
			fields: fields{
				UseAuth: true,
				Logger:  log.New(log.DebugLevel),
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID:       1,
							Name:     "muh source",
							Username: "name",
							Password: "hunter2",
							URL:      "http://localhost:8086",
						}, nil
					},
				},
				TimeSeries: &mocks.TimeSeries{
					ConnectF: func(ctx context.Context, src *chronograf.Source) error {
						return nil
					},
					UsersF: func(ctx context.Context) chronograf.UsersStore {
						return &mocks.UsersStore{
							AddF: func(ctx context.Context, u *chronograf.User) (*chronograf.User, error) {
								return u, nil
							},
						}
					},
					RolesF: func(ctx context.Context) (chronograf.RolesStore, error) {
						return nil, fmt.Errorf("no roles")
					},
				},
			},
			ID:              "1",
			wantStatus:      http.StatusCreated,
			wantContentType: "application/json",
			wantBody: `{"links":{"self":"/chronograf/v1/sources/1/users/marty"},"name":"marty","permissions":[]}
`,
		},
		{
			name: "New user for data source with roles",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"POST",
					"http://local/chronograf/v1/sources/1",
					ioutil.NopCloser(
						bytes.NewReader([]byte(`{"name": "marty", "password": "the_lake"}`)))),
			},
			fields: fields{
				UseAuth: true,
				Logger:  log.New(log.DebugLevel),
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID:       1,
							Name:     "muh source",
							Username: "name",
							Password: "hunter2",
							URL:      "http://localhost:8086",
						}, nil
					},
				},
				TimeSeries: &mocks.TimeSeries{
					ConnectF: func(ctx context.Context, src *chronograf.Source) error {
						return nil
					},
					UsersF: func(ctx context.Context) chronograf.UsersStore {
						return &mocks.UsersStore{
							AddF: func(ctx context.Context, u *chronograf.User) (*chronograf.User, error) {
								return u, nil
							},
						}
					},
					RolesF: func(ctx context.Context) (chronograf.RolesStore, error) {
						return nil, nil
					},
				},
			},
			ID:              "1",
			wantStatus:      http.StatusCreated,
			wantContentType: "application/json",
			wantBody: `{"links":{"self":"/chronograf/v1/sources/1/users/marty"},"name":"marty","permissions":[],"roles":[]}
`,
		},
		{
			name: "Error adding user",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"POST",
					"http://local/chronograf/v1/sources/1",
					ioutil.NopCloser(
						bytes.NewReader([]byte(`{"name": "marty", "password": "the_lake"}`)))),
			},
			fields: fields{
				UseAuth: true,
				Logger:  log.New(log.DebugLevel),
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID:       1,
							Name:     "muh source",
							Username: "name",
							Password: "hunter2",
							URL:      "http://localhost:8086",
						}, nil
					},
				},
				TimeSeries: &mocks.TimeSeries{
					ConnectF: func(ctx context.Context, src *chronograf.Source) error {
						return nil
					},
					UsersF: func(ctx context.Context) chronograf.UsersStore {
						return &mocks.UsersStore{
							AddF: func(ctx context.Context, u *chronograf.User) (*chronograf.User, error) {
								return nil, fmt.Errorf("Weight Has Nothing to Do With It")
							},
						}
					},
				},
			},
			ID:              "1",
			wantStatus:      http.StatusBadRequest,
			wantContentType: "application/json",
			wantBody:        `{"code":400,"message":"Weight Has Nothing to Do With It"}`,
		},
		{
			name: "Failure connecting to user store",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"POST",
					"http://local/chronograf/v1/sources/1",
					ioutil.NopCloser(
						bytes.NewReader([]byte(`{"name": "marty", "password": "the_lake"}`)))),
			},
			fields: fields{
				UseAuth: true,
				Logger:  log.New(log.DebugLevel),
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID:       1,
							Name:     "muh source",
							Username: "name",
							Password: "hunter2",
							URL:      "http://localhost:8086",
						}, nil
					},
				},
				TimeSeries: &mocks.TimeSeries{
					ConnectF: func(ctx context.Context, src *chronograf.Source) error {
						return fmt.Errorf("Biff just happens to be my supervisor")
					},
				},
			},
			ID:              "1",
			wantStatus:      http.StatusBadRequest,
			wantContentType: "application/json",
			wantBody:        `{"code":400,"message":"Unable to connect to source 1: Biff just happens to be my supervisor"}`,
		},
		{
			name: "Failure getting source",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"POST",
					"http://local/chronograf/v1/sources/1",
					ioutil.NopCloser(
						bytes.NewReader([]byte(`{"name": "marty", "password": "the_lake"}`)))),
			},
			fields: fields{
				UseAuth: true,
				Logger:  log.New(log.DebugLevel),
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{}, fmt.Errorf("No McFly ever amounted to anything in the history of Hill Valley")
					},
				},
			},
			ID:              "1",
			wantStatus:      http.StatusNotFound,
			wantContentType: "application/json",
			wantBody:        `{"code":404,"message":"ID 1 not found"}`,
		},
		{
			name: "Bad ID",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"POST",
					"http://local/chronograf/v1/sources/1",
					ioutil.NopCloser(
						bytes.NewReader([]byte(`{"name": "marty", "password": "the_lake"}`)))),
			},
			fields: fields{
				UseAuth: true,
				Logger:  log.New(log.DebugLevel),
			},
			ID:              "BAD",
			wantStatus:      http.StatusUnprocessableEntity,
			wantContentType: "application/json",
			wantBody:        `{"code":422,"message":"Error converting ID BAD"}`,
		},
		{
			name: "Bad name",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"POST",
					"http://local/chronograf/v1/sources/1",
					ioutil.NopCloser(
						bytes.NewReader([]byte(`{"password": "the_lake"}`)))),
			},
			fields: fields{
				UseAuth: true,
				Logger:  log.New(log.DebugLevel),
			},
			ID:              "BAD",
			wantStatus:      http.StatusUnprocessableEntity,
			wantContentType: "application/json",
			wantBody:        `{"code":422,"message":"username required"}`,
		},
		{
			name: "Bad JSON",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"POST",
					"http://local/chronograf/v1/sources/1",
					ioutil.NopCloser(
						bytes.NewReader([]byte(`{password}`)))),
			},
			fields: fields{
				UseAuth: true,
				Logger:  log.New(log.DebugLevel),
			},
			ID:              "BAD",
			wantStatus:      http.StatusBadRequest,
			wantContentType: "application/json",
			wantBody:        `{"code":400,"message":"Unparsable JSON"}`,
		},
	}
	for _, tt := range tests {
		tt.args.r = tt.args.r.WithContext(httprouter.WithParams(
			context.Background(),
			httprouter.Params{
				{
					Key:   "id",
					Value: tt.ID,
				},
			}))

		h := &Service{
			Store: &mocks.Store{
				SourcesStore: tt.fields.SourcesStore,
			},
			TimeSeriesClient: tt.fields.TimeSeries,
			Logger:           tt.fields.Logger,
			UseAuth:          tt.fields.UseAuth,
		}

		h.NewSourceUser(tt.args.w, tt.args.r)

		resp := tt.args.w.Result()
		content := resp.Header.Get("Content-Type")
		body, _ := ioutil.ReadAll(resp.Body)

		if resp.StatusCode != tt.wantStatus {
			t.Errorf("%q. NewSourceUser() = %v, want %v", tt.name, resp.StatusCode, tt.wantStatus)
		}
		if tt.wantContentType != "" && content != tt.wantContentType {
			t.Errorf("%q. NewSourceUser() = %v, want %v", tt.name, content, tt.wantContentType)
		}
		if tt.wantBody != "" && string(body) != tt.wantBody {
			t.Errorf("%q. NewSourceUser() = \n***%v***\n,\nwant\n***%v***", tt.name, string(body), tt.wantBody)
		}
	}
}

func TestService_SourceUsers(t *testing.T) {
	type fields struct {
		SourcesStore chronograf.SourcesStore
		TimeSeries   TimeSeriesClient
		Logger       chronograf.Logger
		UseAuth      bool
	}
	type args struct {
		w *httptest.ResponseRecorder
		r *http.Request
	}
	tests := []struct {
		name            string
		fields          fields
		args            args
		ID              string
		wantStatus      int
		wantContentType string
		wantBody        string
	}{
		{
			name: "All users for data source",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"GET",
					"http://local/chronograf/v1/sources/1",
					nil),
			},
			fields: fields{
				UseAuth: true,
				Logger:  log.New(log.DebugLevel),
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID:       1,
							Name:     "muh source",
							Username: "name",
							Password: "hunter2",
							URL:      "http://localhost:8086",
						}, nil
					},
				},
				TimeSeries: &mocks.TimeSeries{
					ConnectF: func(ctx context.Context, src *chronograf.Source) error {
						return nil
					},
					RolesF: func(ctx context.Context) (chronograf.RolesStore, error) {
						return nil, fmt.Errorf("no roles")
					},
					UsersF: func(ctx context.Context) chronograf.UsersStore {
						return &mocks.UsersStore{
							AllF: func(ctx context.Context) ([]chronograf.User, error) {
								return []chronograf.User{
									{
										Name:   "strickland",
										Passwd: "discipline",
										Permissions: chronograf.Permissions{
											{
												Scope:   chronograf.AllScope,
												Allowed: chronograf.Allowances{"READ"},
											},
										},
									},
								}, nil
							},
						}
					},
				},
			},
			ID:              "1",
			wantStatus:      http.StatusOK,
			wantContentType: "application/json",
			wantBody: `{"users":[{"links":{"self":"/chronograf/v1/sources/1/users/strickland"},"name":"strickland","permissions":[{"scope":"all","allowed":["READ"]}]}]}
`,
		},
		{
			name: "All users for data source with roles",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"GET",
					"http://local/chronograf/v1/sources/1",
					nil),
			},
			fields: fields{
				UseAuth: true,
				Logger:  log.New(log.DebugLevel),
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID:       1,
							Name:     "muh source",
							Username: "name",
							Password: "hunter2",
							URL:      "http://localhost:8086",
						}, nil
					},
				},
				TimeSeries: &mocks.TimeSeries{
					ConnectF: func(ctx context.Context, src *chronograf.Source) error {
						return nil
					},
					RolesF: func(ctx context.Context) (chronograf.RolesStore, error) {
						return nil, nil
					},
					UsersF: func(ctx context.Context) chronograf.UsersStore {
						return &mocks.UsersStore{
							AllF: func(ctx context.Context) ([]chronograf.User, error) {
								return []chronograf.User{
									{
										Name:   "strickland",
										Passwd: "discipline",
										Permissions: chronograf.Permissions{
											{
												Scope:   chronograf.AllScope,
												Allowed: chronograf.Allowances{"READ"},
											},
										},
									},
								}, nil
							},
						}
					},
				},
			},
			ID:              "1",
			wantStatus:      http.StatusOK,
			wantContentType: "application/json",
			wantBody: `{"users":[{"links":{"self":"/chronograf/v1/sources/1/users/strickland"},"name":"strickland","permissions":[{"scope":"all","allowed":["READ"]}],"roles":[]}]}
`,
		},
	}
	for _, tt := range tests {
		tt.args.r = tt.args.r.WithContext(httprouter.WithParams(
			context.Background(),
			httprouter.Params{
				{
					Key:   "id",
					Value: tt.ID,
				},
			}))
		h := &Service{
			Store: &mocks.Store{
				SourcesStore: tt.fields.SourcesStore,
			},
			TimeSeriesClient: tt.fields.TimeSeries,
			Logger:           tt.fields.Logger,
			UseAuth:          tt.fields.UseAuth,
		}

		h.SourceUsers(tt.args.w, tt.args.r)
		resp := tt.args.w.Result()
		content := resp.Header.Get("Content-Type")
		body, _ := ioutil.ReadAll(resp.Body)

		if resp.StatusCode != tt.wantStatus {
			t.Errorf("%q. SourceUsers() = %v, want %v", tt.name, resp.StatusCode, tt.wantStatus)
		}
		if tt.wantContentType != "" && content != tt.wantContentType {
			t.Errorf("%q. SourceUsers() = %v, want %v", tt.name, content, tt.wantContentType)
		}
		if tt.wantBody != "" && string(body) != tt.wantBody {
			t.Errorf("%q. SourceUsers() = \n***%v***\n,\nwant\n***%v***", tt.name, string(body), tt.wantBody)
		}
	}
}

func TestService_SourceUserID(t *testing.T) {
	type fields struct {
		SourcesStore chronograf.SourcesStore
		TimeSeries   TimeSeriesClient
		Logger       chronograf.Logger
		UseAuth      bool
	}
	type args struct {
		w *httptest.ResponseRecorder
		r *http.Request
	}
	tests := []struct {
		name            string
		fields          fields
		args            args
		ID              string
		UID             string
		wantStatus      int
		wantContentType string
		wantBody        string
	}{
		{
			name: "Single user for data source",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"GET",
					"http://local/chronograf/v1/sources/1",
					nil),
			},
			fields: fields{
				UseAuth: true,
				Logger:  log.New(log.DebugLevel),
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID:       1,
							Name:     "muh source",
							Username: "name",
							Password: "hunter2",
							URL:      "http://localhost:8086",
						}, nil
					},
				},
				TimeSeries: &mocks.TimeSeries{
					ConnectF: func(ctx context.Context, src *chronograf.Source) error {
						return nil
					},
					RolesF: func(ctx context.Context) (chronograf.RolesStore, error) {
						return nil, fmt.Errorf("no roles")
					},
					UsersF: func(ctx context.Context) chronograf.UsersStore {
						return &mocks.UsersStore{
							GetF: func(ctx context.Context, q chronograf.UserQuery) (*chronograf.User, error) {
								return &chronograf.User{
									Name:   "strickland",
									Passwd: "discipline",
									Permissions: chronograf.Permissions{
										{
											Scope:   chronograf.AllScope,
											Allowed: chronograf.Allowances{"READ"},
										},
									},
								}, nil
							},
						}
					},
				},
			},
			ID:              "1",
			UID:             "strickland",
			wantStatus:      http.StatusOK,
			wantContentType: "application/json",
			wantBody: `{"links":{"self":"/chronograf/v1/sources/1/users/strickland"},"name":"strickland","permissions":[{"scope":"all","allowed":["READ"]}]}
`,
		},
		{
			name: "Single user for data source",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"GET",
					"http://local/chronograf/v1/sources/1",
					nil),
			},
			fields: fields{
				UseAuth: true,
				Logger:  log.New(log.DebugLevel),
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID:       1,
							Name:     "muh source",
							Username: "name",
							Password: "hunter2",
							URL:      "http://localhost:8086",
						}, nil
					},
				},
				TimeSeries: &mocks.TimeSeries{
					ConnectF: func(ctx context.Context, src *chronograf.Source) error {
						return nil
					},
					RolesF: func(ctx context.Context) (chronograf.RolesStore, error) {
						return nil, nil
					},
					UsersF: func(ctx context.Context) chronograf.UsersStore {
						return &mocks.UsersStore{
							GetF: func(ctx context.Context, q chronograf.UserQuery) (*chronograf.User, error) {
								return &chronograf.User{
									Name:   "strickland",
									Passwd: "discipline",
									Permissions: chronograf.Permissions{
										{
											Scope:   chronograf.AllScope,
											Allowed: chronograf.Allowances{"READ"},
										},
									},
								}, nil
							},
						}
					},
				},
			},
			ID:              "1",
			UID:             "strickland",
			wantStatus:      http.StatusOK,
			wantContentType: "application/json",
			wantBody: `{"links":{"self":"/chronograf/v1/sources/1/users/strickland"},"name":"strickland","permissions":[{"scope":"all","allowed":["READ"]}],"roles":[]}
`,
		},
	}
	for _, tt := range tests {
		tt.args.r = tt.args.r.WithContext(httprouter.WithParams(
			context.Background(),
			httprouter.Params{
				{
					Key:   "id",
					Value: tt.ID,
				},
			}))
		h := &Service{
			Store: &mocks.Store{
				SourcesStore: tt.fields.SourcesStore,
			},
			TimeSeriesClient: tt.fields.TimeSeries,
			Logger:           tt.fields.Logger,
			UseAuth:          tt.fields.UseAuth,
		}

		h.SourceUserID(tt.args.w, tt.args.r)
		resp := tt.args.w.Result()
		content := resp.Header.Get("Content-Type")
		body, _ := ioutil.ReadAll(resp.Body)

		if resp.StatusCode != tt.wantStatus {
			t.Errorf("%q. SourceUserID() = %v, want %v", tt.name, resp.StatusCode, tt.wantStatus)
		}
		if tt.wantContentType != "" && content != tt.wantContentType {
			t.Errorf("%q. SourceUserID() = %v, want %v", tt.name, content, tt.wantContentType)
		}
		if tt.wantBody != "" && string(body) != tt.wantBody {
			t.Errorf("%q. SourceUserID() = \n***%v***\n,\nwant\n***%v***", tt.name, string(body), tt.wantBody)
		}
	}
}

func TestService_RemoveSourceUser(t *testing.T) {
	type fields struct {
		SourcesStore chronograf.SourcesStore
		TimeSeries   TimeSeriesClient
		Logger       chronograf.Logger
		UseAuth      bool
	}
	type args struct {
		w *httptest.ResponseRecorder
		r *http.Request
	}
	tests := []struct {
		name            string
		fields          fields
		args            args
		ID              string
		UID             string
		wantStatus      int
		wantContentType string
		wantBody        string
	}{
		{
			name: "Delete user for data source",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"GET",
					"http://local/chronograf/v1/sources/1",
					nil),
			},
			fields: fields{
				UseAuth: true,
				Logger:  log.New(log.DebugLevel),
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID:       1,
							Name:     "muh source",
							Username: "name",
							Password: "hunter2",
							URL:      "http://localhost:8086",
						}, nil
					},
				},
				TimeSeries: &mocks.TimeSeries{
					ConnectF: func(ctx context.Context, src *chronograf.Source) error {
						return nil
					},
					UsersF: func(ctx context.Context) chronograf.UsersStore {
						return &mocks.UsersStore{
							DeleteF: func(ctx context.Context, u *chronograf.User) error {
								return nil
							},
						}
					},
				},
			},
			ID:         "1",
			UID:        "strickland",
			wantStatus: http.StatusNoContent,
		},
	}
	for _, tt := range tests {
		tt.args.r = tt.args.r.WithContext(httprouter.WithParams(
			context.Background(),
			httprouter.Params{
				{
					Key:   "id",
					Value: tt.ID,
				},
			}))
		h := &Service{
			Store: &mocks.Store{
				SourcesStore: tt.fields.SourcesStore,
			},
			TimeSeriesClient: tt.fields.TimeSeries,
			Logger:           tt.fields.Logger,
			UseAuth:          tt.fields.UseAuth,
		}
		h.RemoveSourceUser(tt.args.w, tt.args.r)
		resp := tt.args.w.Result()
		content := resp.Header.Get("Content-Type")
		body, _ := ioutil.ReadAll(resp.Body)

		if resp.StatusCode != tt.wantStatus {
			t.Errorf("%q. RemoveSourceUser() = %v, want %v", tt.name, resp.StatusCode, tt.wantStatus)
		}
		if tt.wantContentType != "" && content != tt.wantContentType {
			t.Errorf("%q. RemoveSourceUser() = %v, want %v", tt.name, content, tt.wantContentType)
		}
		if tt.wantBody != "" && string(body) != tt.wantBody {
			t.Errorf("%q. RemoveSourceUser() = \n***%v***\n,\nwant\n***%v***", tt.name, string(body), tt.wantBody)
		}
	}
}

func TestService_UpdateSourceUser(t *testing.T) {
	type fields struct {
		SourcesStore chronograf.SourcesStore
		TimeSeries   TimeSeriesClient
		Logger       chronograf.Logger
		UseAuth      bool
	}
	type args struct {
		w *httptest.ResponseRecorder
		r *http.Request
	}
	tests := []struct {
		name            string
		fields          fields
		args            args
		ID              string
		UID             string
		wantStatus      int
		wantContentType string
		wantBody        string
	}{
		{
			name: "Update user password for data source",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"POST",
					"http://local/chronograf/v1/sources/1",
					ioutil.NopCloser(
						bytes.NewReader([]byte(`{"name": "marty", "password": "the_lake"}`)))),
			},
			fields: fields{
				UseAuth: true,
				Logger:  log.New(log.DebugLevel),
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID:       1,
							Name:     "muh source",
							Username: "name",
							Password: "hunter2",
							URL:      "http://localhost:8086",
						}, nil
					},
				},
				TimeSeries: &mocks.TimeSeries{
					ConnectF: func(ctx context.Context, src *chronograf.Source) error {
						return nil
					},
					RolesF: func(ctx context.Context) (chronograf.RolesStore, error) {
						return nil, fmt.Errorf("no roles")
					},
					UsersF: func(ctx context.Context) chronograf.UsersStore {
						return &mocks.UsersStore{
							UpdateF: func(ctx context.Context, u *chronograf.User) error {
								return nil
							},
							GetF: func(ctx context.Context, q chronograf.UserQuery) (*chronograf.User, error) {
								return &chronograf.User{
									Name: "marty",
								}, nil
							},
						}
					},
				},
			},
			ID:              "1",
			UID:             "marty",
			wantStatus:      http.StatusOK,
			wantContentType: "application/json",
			wantBody: `{"links":{"self":"/chronograf/v1/sources/1/users/marty"},"name":"marty","permissions":[]}
`,
		},
		{
			name: "Update user password for data source with roles",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"POST",
					"http://local/chronograf/v1/sources/1",
					ioutil.NopCloser(
						bytes.NewReader([]byte(`{"name": "marty", "password": "the_lake"}`)))),
			},
			fields: fields{
				UseAuth: true,
				Logger:  log.New(log.DebugLevel),
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID:       1,
							Name:     "muh source",
							Username: "name",
							Password: "hunter2",
							URL:      "http://localhost:8086",
						}, nil
					},
				},
				TimeSeries: &mocks.TimeSeries{
					ConnectF: func(ctx context.Context, src *chronograf.Source) error {
						return nil
					},
					RolesF: func(ctx context.Context) (chronograf.RolesStore, error) {
						return nil, nil
					},
					UsersF: func(ctx context.Context) chronograf.UsersStore {
						return &mocks.UsersStore{
							UpdateF: func(ctx context.Context, u *chronograf.User) error {
								return nil
							},
							GetF: func(ctx context.Context, q chronograf.UserQuery) (*chronograf.User, error) {
								return &chronograf.User{
									Name: "marty",
								}, nil
							},
						}
					},
				},
			},
			ID:              "1",
			UID:             "marty",
			wantStatus:      http.StatusOK,
			wantContentType: "application/json",
			wantBody: `{"links":{"self":"/chronograf/v1/sources/1/users/marty"},"name":"marty","permissions":[],"roles":[]}
`,
		},
		{
			name: "Invalid update JSON",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"POST",
					"http://local/chronograf/v1/sources/1",
					ioutil.NopCloser(
						bytes.NewReader([]byte(`{"name": "marty"}`)))),
			},
			fields: fields{
				UseAuth: true,
				Logger:  log.New(log.DebugLevel),
			},
			ID:              "1",
			UID:             "marty",
			wantStatus:      http.StatusUnprocessableEntity,
			wantContentType: "application/json",
			wantBody:        `{"code":422,"message":"no fields to update"}`,
		},
	}
	for _, tt := range tests {
		tt.args.r = tt.args.r.WithContext(httprouter.WithParams(
			context.Background(),
			httprouter.Params{
				{
					Key:   "id",
					Value: tt.ID,
				},
				{
					Key:   "uid",
					Value: tt.UID,
				},
			}))
		h := &Service{
			Store: &mocks.Store{
				SourcesStore: tt.fields.SourcesStore,
			},
			TimeSeriesClient: tt.fields.TimeSeries,
			Logger:           tt.fields.Logger,
			UseAuth:          tt.fields.UseAuth,
		}
		h.UpdateSourceUser(tt.args.w, tt.args.r)
		resp := tt.args.w.Result()
		content := resp.Header.Get("Content-Type")
		body, _ := ioutil.ReadAll(resp.Body)

		if resp.StatusCode != tt.wantStatus {
			t.Errorf("%q. UpdateSourceUser() = %v, want %v", tt.name, resp.StatusCode, tt.wantStatus)
		}
		if tt.wantContentType != "" && content != tt.wantContentType {
			t.Errorf("%q. UpdateSourceUser() = %v, want %v", tt.name, content, tt.wantContentType)
		}
		if tt.wantBody != "" && string(body) != tt.wantBody {
			t.Errorf("%q. UpdateSourceUser() = \n***%v***\n,\nwant\n***%v***", tt.name, string(body), tt.wantBody)
		}
	}
}

func TestService_NewSourceRole(t *testing.T) {
	type fields struct {
		SourcesStore chronograf.SourcesStore
		TimeSeries   TimeSeriesClient
		Logger       chronograf.Logger
	}
	type args struct {
		w *httptest.ResponseRecorder
		r *http.Request
	}
	tests := []struct {
		name            string
		fields          fields
		args            args
		ID              string
		wantStatus      int
		wantContentType string
		wantBody        string
	}{
		{
			name: "Bad JSON",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"POST",
					"http://server.local/chronograf/v1/sources/1/roles",
					ioutil.NopCloser(
						bytes.NewReader([]byte(`{BAD}`)))),
			},
			fields: fields{
				Logger: log.New(log.DebugLevel),
			},
			wantStatus:      http.StatusBadRequest,
			wantContentType: "application/json",
			wantBody:        `{"code":400,"message":"Unparsable JSON"}`,
		},
		{
			name: "Invalid request",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"POST",
					"http://server.local/chronograf/v1/sources/1/roles",
					ioutil.NopCloser(
						bytes.NewReader([]byte(`{"name": ""}`)))),
			},
			fields: fields{
				Logger: log.New(log.DebugLevel),
			},
			ID:              "1",
			wantStatus:      http.StatusUnprocessableEntity,
			wantContentType: "application/json",
			wantBody:        `{"code":422,"message":"Name is required for a role"}`,
		},
		{
			name: "Invalid source ID",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"POST",
					"http://server.local/chronograf/v1/sources/1/roles",
					ioutil.NopCloser(
						bytes.NewReader([]byte(`{"name": "newrole"}`)))),
			},
			fields: fields{
				Logger: log.New(log.DebugLevel),
			},
			ID:              "BADROLE",
			wantStatus:      http.StatusUnprocessableEntity,
			wantContentType: "application/json",
			wantBody:        `{"code":422,"message":"Error converting ID BADROLE"}`,
		},
		{
			name: "Source doesn't support roles",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"POST",
					"http://server.local/chronograf/v1/sources/1/roles",
					ioutil.NopCloser(
						bytes.NewReader([]byte(`{"name": "role"}`)))),
			},
			fields: fields{
				Logger: log.New(log.DebugLevel),
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID:       1,
							Name:     "muh source",
							Username: "name",
							Password: "hunter2",
							URL:      "http://localhost:8086",
						}, nil
					},
				},
				TimeSeries: &mocks.TimeSeries{
					ConnectF: func(ctx context.Context, src *chronograf.Source) error {
						return nil
					},
					RolesF: func(ctx context.Context) (chronograf.RolesStore, error) {
						return nil, fmt.Errorf("roles not supported")
					},
				},
			},
			ID:              "1",
			wantStatus:      http.StatusNotFound,
			wantContentType: "application/json",
			wantBody:        `{"code":404,"message":"Source 1 does not have role capability"}`,
		},
		{
			name: "Unable to add role to server",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"POST",
					"http://server.local/chronograf/v1/sources/1/roles",
					ioutil.NopCloser(
						bytes.NewReader([]byte(`{"name": "role"}`)))),
			},
			fields: fields{
				Logger: log.New(log.DebugLevel),
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID:       1,
							Name:     "muh source",
							Username: "name",
							Password: "hunter2",
							URL:      "http://localhost:8086",
						}, nil
					},
				},
				TimeSeries: &mocks.TimeSeries{
					ConnectF: func(ctx context.Context, src *chronograf.Source) error {
						return nil
					},
					RolesF: func(ctx context.Context) (chronograf.RolesStore, error) {
						return &mocks.RolesStore{
							AddF: func(ctx context.Context, u *chronograf.Role) (*chronograf.Role, error) {
								return nil, fmt.Errorf("server had and issue")
							},
							GetF: func(ctx context.Context, name string) (*chronograf.Role, error) {
								return nil, fmt.Errorf("No such role")
							},
						}, nil
					},
				},
			},
			ID:              "1",
			wantStatus:      http.StatusBadRequest,
			wantContentType: "application/json",
			wantBody:        `{"code":400,"message":"server had and issue"}`,
		},
		{
			name: "New role for data source",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"POST",
					"http://server.local/chronograf/v1/sources/1/roles",
					ioutil.NopCloser(
						bytes.NewReader([]byte(`{"name": "biffsgang","users": [{"name": "match"},{"name": "skinhead"},{"name": "3-d"}]}`)))),
			},
			fields: fields{
				Logger: log.New(log.DebugLevel),
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID:       1,
							Name:     "muh source",
							Username: "name",
							Password: "hunter2",
							URL:      "http://localhost:8086",
						}, nil
					},
				},
				TimeSeries: &mocks.TimeSeries{
					ConnectF: func(ctx context.Context, src *chronograf.Source) error {
						return nil
					},
					RolesF: func(ctx context.Context) (chronograf.RolesStore, error) {
						return &mocks.RolesStore{
							AddF: func(ctx context.Context, u *chronograf.Role) (*chronograf.Role, error) {
								return u, nil
							},
							GetF: func(ctx context.Context, name string) (*chronograf.Role, error) {
								return nil, fmt.Errorf("no such role")
							},
						}, nil
					},
				},
			},
			ID:              "1",
			wantStatus:      http.StatusCreated,
			wantContentType: "application/json",
			wantBody: `{"users":[{"links":{"self":"/chronograf/v1/sources/1/users/match"},"name":"match"},{"links":{"self":"/chronograf/v1/sources/1/users/skinhead"},"name":"skinhead"},{"links":{"self":"/chronograf/v1/sources/1/users/3-d"},"name":"3-d"}],"name":"biffsgang","permissions":[],"links":{"self":"/chronograf/v1/sources/1/roles/biffsgang"}}
`,
		},
	}
	for _, tt := range tests {
		h := &Service{
			Store: &mocks.Store{
				SourcesStore: tt.fields.SourcesStore,
			},
			TimeSeriesClient: tt.fields.TimeSeries,
			Logger:           tt.fields.Logger,
		}
		tt.args.r = tt.args.r.WithContext(httprouter.WithParams(
			context.Background(),
			httprouter.Params{
				{
					Key:   "id",
					Value: tt.ID,
				},
			}))

		h.NewSourceRole(tt.args.w, tt.args.r)

		resp := tt.args.w.Result()
		content := resp.Header.Get("Content-Type")
		body, _ := ioutil.ReadAll(resp.Body)

		if resp.StatusCode != tt.wantStatus {
			t.Errorf("%q. NewSourceRole() = %v, want %v", tt.name, resp.StatusCode, tt.wantStatus)
		}
		if tt.wantContentType != "" && content != tt.wantContentType {
			t.Errorf("%q. NewSourceRole() = %v, want %v", tt.name, content, tt.wantContentType)
		}
		if tt.wantBody != "" && string(body) != tt.wantBody {
			t.Errorf("%q. NewSourceRole() = \n***%v***\n,\nwant\n***%v***", tt.name, string(body), tt.wantBody)
		}
	}
}

func TestService_UpdateSourceRole(t *testing.T) {
	type fields struct {
		SourcesStore chronograf.SourcesStore
		TimeSeries   TimeSeriesClient
		Logger       chronograf.Logger
	}
	type args struct {
		w *httptest.ResponseRecorder
		r *http.Request
	}
	tests := []struct {
		name            string
		fields          fields
		args            args
		ID              string
		RoleID          string
		wantStatus      int
		wantContentType string
		wantBody        string
	}{
		{
			name: "Update role for data source",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"POST",
					"http://server.local/chronograf/v1/sources/1/roles",
					ioutil.NopCloser(
						bytes.NewReader([]byte(`{"name": "biffsgang","users": [{"name": "match"},{"name": "skinhead"},{"name": "3-d"}]}`)))),
			},
			fields: fields{
				Logger: log.New(log.DebugLevel),
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID:       1,
							Name:     "muh source",
							Username: "name",
							Password: "hunter2",
							URL:      "http://localhost:8086",
						}, nil
					},
				},
				TimeSeries: &mocks.TimeSeries{
					ConnectF: func(ctx context.Context, src *chronograf.Source) error {
						return nil
					},
					RolesF: func(ctx context.Context) (chronograf.RolesStore, error) {
						return &mocks.RolesStore{
							UpdateF: func(ctx context.Context, u *chronograf.Role) error {
								return nil
							},
							GetF: func(ctx context.Context, name string) (*chronograf.Role, error) {
								return &chronograf.Role{
									Name: "biffsgang",
									Users: []chronograf.User{
										{
											Name: "match",
										},
										{
											Name: "skinhead",
										},
										{
											Name: "3-d",
										},
									},
								}, nil
							},
						}, nil
					},
				},
			},
			ID:              "1",
			RoleID:          "biffsgang",
			wantStatus:      http.StatusOK,
			wantContentType: "application/json",
			wantBody: `{"users":[{"links":{"self":"/chronograf/v1/sources/1/users/match"},"name":"match"},{"links":{"self":"/chronograf/v1/sources/1/users/skinhead"},"name":"skinhead"},{"links":{"self":"/chronograf/v1/sources/1/users/3-d"},"name":"3-d"}],"name":"biffsgang","permissions":[],"links":{"self":"/chronograf/v1/sources/1/roles/biffsgang"}}
`,
		},
	}
	for _, tt := range tests {
		h := &Service{
			Store: &mocks.Store{
				SourcesStore: tt.fields.SourcesStore,
			},
			TimeSeriesClient: tt.fields.TimeSeries,
			Logger:           tt.fields.Logger,
		}

		tt.args.r = tt.args.r.WithContext(httprouter.WithParams(
			context.Background(),
			httprouter.Params{
				{
					Key:   "id",
					Value: tt.ID,
				},
				{
					Key:   "rid",
					Value: tt.RoleID,
				},
			}))

		h.UpdateSourceRole(tt.args.w, tt.args.r)

		resp := tt.args.w.Result()
		content := resp.Header.Get("Content-Type")
		body, _ := ioutil.ReadAll(resp.Body)

		if resp.StatusCode != tt.wantStatus {
			t.Errorf("%q. UpdateSourceRole() = %v, want %v", tt.name, resp.StatusCode, tt.wantStatus)
		}
		if tt.wantContentType != "" && content != tt.wantContentType {
			t.Errorf("%q. UpdateSourceRole() = %v, want %v", tt.name, content, tt.wantContentType)
		}
		if tt.wantBody != "" && string(body) != tt.wantBody {
			t.Errorf("%q. UpdateSourceRole() = \n***%v***\n,\nwant\n***%v***", tt.name, string(body), tt.wantBody)
		}
	}
}

func TestService_SourceRoleID(t *testing.T) {
	type fields struct {
		SourcesStore chronograf.SourcesStore
		TimeSeries   TimeSeriesClient
		Logger       chronograf.Logger
	}
	type args struct {
		w *httptest.ResponseRecorder
		r *http.Request
	}
	tests := []struct {
		name            string
		fields          fields
		args            args
		ID              string
		RoleID          string
		wantStatus      int
		wantContentType string
		wantBody        string
	}{
		{
			name: "Get role for data source",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"GET",
					"http://server.local/chronograf/v1/sources/1/roles/biffsgang",
					nil),
			},
			fields: fields{
				Logger: log.New(log.DebugLevel),
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID:       1,
							Name:     "muh source",
							Username: "name",
							Password: "hunter2",
							URL:      "http://localhost:8086",
						}, nil
					},
				},
				TimeSeries: &mocks.TimeSeries{
					ConnectF: func(ctx context.Context, src *chronograf.Source) error {
						return nil
					},
					RolesF: func(ctx context.Context) (chronograf.RolesStore, error) {
						return &mocks.RolesStore{
							GetF: func(ctx context.Context, name string) (*chronograf.Role, error) {
								return &chronograf.Role{
									Name: "biffsgang",
									Permissions: chronograf.Permissions{
										{
											Name:  "grays_sports_almanac",
											Scope: "DBScope",
											Allowed: chronograf.Allowances{
												"ReadData",
											},
										},
									},
									Users: []chronograf.User{
										{
											Name: "match",
										},
										{
											Name: "skinhead",
										},
										{
											Name: "3-d",
										},
									},
								}, nil
							},
						}, nil
					},
				},
			},
			ID:              "1",
			RoleID:          "biffsgang",
			wantStatus:      http.StatusOK,
			wantContentType: "application/json",
			wantBody: `{"users":[{"links":{"self":"/chronograf/v1/sources/1/users/match"},"name":"match"},{"links":{"self":"/chronograf/v1/sources/1/users/skinhead"},"name":"skinhead"},{"links":{"self":"/chronograf/v1/sources/1/users/3-d"},"name":"3-d"}],"name":"biffsgang","permissions":[{"scope":"DBScope","name":"grays_sports_almanac","allowed":["ReadData"]}],"links":{"self":"/chronograf/v1/sources/1/roles/biffsgang"}}
`,
		},
	}
	for _, tt := range tests {
		h := &Service{
			Store: &mocks.Store{
				SourcesStore: tt.fields.SourcesStore,
			},
			TimeSeriesClient: tt.fields.TimeSeries,
			Logger:           tt.fields.Logger,
		}

		tt.args.r = tt.args.r.WithContext(httprouter.WithParams(
			context.Background(),
			httprouter.Params{
				{
					Key:   "id",
					Value: tt.ID,
				},
				{
					Key:   "rid",
					Value: tt.RoleID,
				},
			}))

		h.SourceRoleID(tt.args.w, tt.args.r)

		resp := tt.args.w.Result()
		content := resp.Header.Get("Content-Type")
		body, _ := ioutil.ReadAll(resp.Body)

		if resp.StatusCode != tt.wantStatus {
			t.Errorf("%q. SourceRoleID() = %v, want %v", tt.name, resp.StatusCode, tt.wantStatus)
		}
		if tt.wantContentType != "" && content != tt.wantContentType {
			t.Errorf("%q. SourceRoleID() = %v, want %v", tt.name, content, tt.wantContentType)
		}
		if tt.wantBody != "" && string(body) != tt.wantBody {
			t.Errorf("%q. SourceRoleID() = \n***%v***\n,\nwant\n***%v***", tt.name, string(body), tt.wantBody)
		}
	}
}

func TestService_RemoveSourceRole(t *testing.T) {
	type fields struct {
		SourcesStore chronograf.SourcesStore
		TimeSeries   TimeSeriesClient
		Logger       chronograf.Logger
	}
	type args struct {
		w *httptest.ResponseRecorder
		r *http.Request
	}
	tests := []struct {
		name       string
		fields     fields
		args       args
		ID         string
		RoleID     string
		wantStatus int
	}{
		{
			name: "remove role for data source",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"GET",
					"http://server.local/chronograf/v1/sources/1/roles/biffsgang",
					nil),
			},
			fields: fields{
				Logger: log.New(log.DebugLevel),
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID:       1,
							Name:     "muh source",
							Username: "name",
							Password: "hunter2",
							URL:      "http://localhost:8086",
						}, nil
					},
				},
				TimeSeries: &mocks.TimeSeries{
					ConnectF: func(ctx context.Context, src *chronograf.Source) error {
						return nil
					},
					RolesF: func(ctx context.Context) (chronograf.RolesStore, error) {
						return &mocks.RolesStore{
							DeleteF: func(context.Context, *chronograf.Role) error {
								return nil
							},
						}, nil
					},
				},
			},
			ID:         "1",
			RoleID:     "biffsgang",
			wantStatus: http.StatusNoContent,
		},
	}
	for _, tt := range tests {
		h := &Service{
			Store: &mocks.Store{
				SourcesStore: tt.fields.SourcesStore,
			},
			TimeSeriesClient: tt.fields.TimeSeries,
			Logger:           tt.fields.Logger,
		}

		tt.args.r = tt.args.r.WithContext(httprouter.WithParams(
			context.Background(),
			httprouter.Params{
				{
					Key:   "id",
					Value: tt.ID,
				},
				{
					Key:   "rid",
					Value: tt.RoleID,
				},
			}))

		h.RemoveSourceRole(tt.args.w, tt.args.r)

		resp := tt.args.w.Result()
		if resp.StatusCode != tt.wantStatus {
			t.Errorf("%q. RemoveSourceRole() = %v, want %v", tt.name, resp.StatusCode, tt.wantStatus)
		}
	}
}

func TestService_SourceRoles(t *testing.T) {
	type fields struct {
		SourcesStore chronograf.SourcesStore
		TimeSeries   TimeSeriesClient
		Logger       chronograf.Logger
	}
	type args struct {
		w *httptest.ResponseRecorder
		r *http.Request
	}
	tests := []struct {
		name            string
		fields          fields
		args            args
		ID              string
		RoleID          string
		wantStatus      int
		wantContentType string
		wantBody        string
	}{
		{
			name: "Get roles for data source",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"GET",
					"http://server.local/chronograf/v1/sources/1/roles",
					nil),
			},
			fields: fields{
				Logger: log.New(log.DebugLevel),
				SourcesStore: &mocks.SourcesStore{
					GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
						return chronograf.Source{
							ID: 1,
						}, nil
					},
				},
				TimeSeries: &mocks.TimeSeries{
					ConnectF: func(ctx context.Context, src *chronograf.Source) error {
						return nil
					},
					RolesF: func(ctx context.Context) (chronograf.RolesStore, error) {
						return &mocks.RolesStore{
							AllF: func(ctx context.Context) ([]chronograf.Role, error) {
								return []chronograf.Role{
									{
										Name: "biffsgang",
										Permissions: chronograf.Permissions{
											{
												Name:  "grays_sports_almanac",
												Scope: "DBScope",
												Allowed: chronograf.Allowances{
													"ReadData",
												},
											},
										},
										Users: []chronograf.User{
											{
												Name: "match",
											},
											{
												Name: "skinhead",
											},
											{
												Name: "3-d",
											},
										},
									},
								}, nil
							},
						}, nil
					},
				},
			},
			ID:              "1",
			RoleID:          "biffsgang",
			wantStatus:      http.StatusOK,
			wantContentType: "application/json",
			wantBody: `{"roles":[{"users":[{"links":{"self":"/chronograf/v1/sources/1/users/match"},"name":"match"},{"links":{"self":"/chronograf/v1/sources/1/users/skinhead"},"name":"skinhead"},{"links":{"self":"/chronograf/v1/sources/1/users/3-d"},"name":"3-d"}],"name":"biffsgang","permissions":[{"scope":"DBScope","name":"grays_sports_almanac","allowed":["ReadData"]}],"links":{"self":"/chronograf/v1/sources/1/roles/biffsgang"}}]}
`,
		},
	}
	for _, tt := range tests {
		h := &Service{
			Store: &mocks.Store{
				SourcesStore: tt.fields.SourcesStore,
			},
			TimeSeriesClient: tt.fields.TimeSeries,
			Logger:           tt.fields.Logger,
		}

		tt.args.r = tt.args.r.WithContext(httprouter.WithParams(
			context.Background(),
			httprouter.Params{
				{
					Key:   "id",
					Value: tt.ID,
				},
				{
					Key:   "rid",
					Value: tt.RoleID,
				},
			}))

		h.SourceRoles(tt.args.w, tt.args.r)

		resp := tt.args.w.Result()
		content := resp.Header.Get("Content-Type")
		body, _ := ioutil.ReadAll(resp.Body)

		if resp.StatusCode != tt.wantStatus {
			t.Errorf("%q. SourceRoles() = %v, want %v", tt.name, resp.StatusCode, tt.wantStatus)
		}
		if tt.wantContentType != "" && content != tt.wantContentType {
			t.Errorf("%q. SourceRoles() = %v, want %v", tt.name, content, tt.wantContentType)
		}
		if tt.wantBody != "" && string(body) != tt.wantBody {
			t.Errorf("%q. SourceRoles() = \n***%v***\n,\nwant\n***%v***", tt.name, string(body), tt.wantBody)
		}
	}
}
