package server

import (
	"bytes"
	"context"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/log"
	"github.com/influxdata/chronograf/mocks"
)

func TestService_UserID(t *testing.T) {
	type fields struct {
		UsersStore chronograf.UsersStore
		Logger     chronograf.Logger
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
			name: "Get Single Chronograf User",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"GET",
					"http://server.local/chronograf/v1/users",
					nil,
				),
			},
			fields: fields{
				Logger: log.New(log.DebugLevel),
				UsersStore: &mocks.UsersStore{
					GetF: func(ctx context.Context, ID string) (*chronograf.User, error) {
						return &chronograf.User{
							ID: "bob",
						}, nil
					},
				},
			},
			ID:              "bob",
			wantStatus:      http.StatusOK,
			wantContentType: "application/json",
			wantBody:        `{"id":"bob","links":{"self":"/chronograf/v1/users/bob"}}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := &Service{
				UsersStore: tt.fields.UsersStore,
				Logger:     tt.fields.Logger,
			}

			tt.args.r = tt.args.r.WithContext(context.WithValue(context.Background(), "id", tt.ID))

			h.UserID(tt.args.w, tt.args.r)

			resp := tt.args.w.Result()
			content := resp.Header.Get("Content-Type")
			body, _ := ioutil.ReadAll(resp.Body)
			if resp.StatusCode != tt.wantStatus {
				t.Errorf("%q. UserID() = %v, want %v", tt.name, resp.StatusCode, tt.wantStatus)
			}
			if tt.wantContentType != "" && content != tt.wantContentType {
				t.Errorf("%q. UserID() = %v, want %v", tt.name, content, tt.wantContentType)
			}
			if eq, _ := jsonEqual(string(body), tt.wantBody); tt.wantBody != "" && !eq {
				t.Errorf("%q. UserID() = \n***%v***\n,\nwant\n***%v***", tt.name, string(body), tt.wantBody)
			}
		})
	}
}

func TestService_NewUser(t *testing.T) {
	type fields struct {
		UsersStore chronograf.UsersStore
		Logger     chronograf.Logger
	}
	type args struct {
		w    *httptest.ResponseRecorder
		r    *http.Request
		user chronograf.User
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
			name: "Create a new Chronograf User",
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"POST",
					"http://server.local/chronograf/v1/users",
					ioutil.NopCloser(
						bytes.NewReader([]byte(`{"username": "bob", "provider": "GitHub", "scheme": "OAuth2"}`)))),
			},
			fields: fields{
				Logger: log.New(log.DebugLevel),
				UsersStore: &mocks.UsersStore{
					AddF: func(ctx context.Context, user *chronograf.User) (*chronograf.User, error) {
						return &chronograf.User{
							ID:       "OAuth2-GitHub-bob",
							Username: "bob",
							Provider: "GitHub",
							Scheme:   "OAuth2",
						}, nil
					},
				},
			},
			ID:              "2",
			wantStatus:      http.StatusCreated,
			wantContentType: "application/json",
			wantBody:        `{"id":"OAuth2-GitHub-bob","username":"bob","provider":"GitHub","scheme":"OAuth2","links":{"self":"/chronograf/v1/users/OAuth2-GitHub-bob"}}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := &Service{
				UsersStore: tt.fields.UsersStore,
				Logger:     tt.fields.Logger,
			}

			tt.args.r = tt.args.r.WithContext(context.WithValue(context.Background(), "id", tt.ID))

			h.NewUser(tt.args.w, tt.args.r)

			resp := tt.args.w.Result()
			content := resp.Header.Get("Content-Type")
			body, _ := ioutil.ReadAll(resp.Body)

			if resp.StatusCode != tt.wantStatus {
				t.Errorf("%q. UserID() = %v, want %v", tt.name, resp.StatusCode, tt.wantStatus)
			}
			if tt.wantContentType != "" && content != tt.wantContentType {
				t.Errorf("%q. UserID() = %v, want %v", tt.name, content, tt.wantContentType)
			}
			if eq, _ := jsonEqual(string(body), tt.wantBody); tt.wantBody != "" && !eq {
				t.Errorf("%q. UserID() = \n***%v***\n,\nwant\n***%v***", tt.name, string(body), tt.wantBody)
			}
		})
	}
}

func jsonEqual(s1, s2 string) (eq bool, err error) {
	var o1, o2 interface{}

	if err = json.Unmarshal([]byte(s1), &o1); err != nil {
		return
	}
	if err = json.Unmarshal([]byte(s2), &o2); err != nil {
		return
	}

	return cmp.Equal(o1, o2), nil
}
