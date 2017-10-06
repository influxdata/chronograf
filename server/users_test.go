package server

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/bouk/httprouter"
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
					"http://any.url", // can be any valid URL as we are bypassing mux
					nil,
				),
			},
			fields: fields{
				Logger: log.New(log.DebugLevel),
				UsersStore: &mocks.UsersStore{
					GetF: func(ctx context.Context, ID string) (*chronograf.User, error) {
						switch ID {
						case "OAuth2-Google-billysteve":
							return &chronograf.User{
								ID:       "OAuth2-Google-billysteve",
								Username: "billysteve",
								Provider: "Google",
								Scheme:   "OAuth2",
							}, nil
						default:
							return nil, fmt.Errorf("User with ID %v not found", ID)
						}
					},
				},
			},
			ID:              "OAuth2-Google-billysteve",
			wantStatus:      http.StatusOK,
			wantContentType: "application/json",
			wantBody:        `{"id":"OAuth2-Google-billysteve","username":"billysteve","provider":"Google","scheme":"OAuth2","links":{"self":"/chronograf/v1/users/OAuth2-Google-billysteve"}}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := &Service{
				UsersStore: tt.fields.UsersStore,
				Logger:     tt.fields.Logger,
			}

			tt.args.r = tt.args.r.WithContext(httprouter.WithParams(
				context.Background(),
				httprouter.Params{
					{
						Key:   "id",
						Value: tt.ID,
					},
				}))

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
					"http://any.url",
					nil,
				),
				user: chronograf.User{
					Username: "bob",
					Provider: "GitHub",
					Scheme:   "OAuth2",
				},
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

			buf, _ := json.Marshal(tt.args.user)
			tt.args.r.Body = ioutil.NopCloser(bytes.NewReader(buf))

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

func TestService_RemoveUser(t *testing.T) {
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
		name       string
		fields     fields
		args       args
		user       *chronograf.User
		id         string
		wantStatus int
	}{
		{
			name: "Delete a Chronograf User",
			fields: fields{
				Logger: log.New(log.DebugLevel),
				UsersStore: &mocks.UsersStore{
					DeleteF: func(ctx context.Context, user *chronograf.User) error {
						return nil
					},
				},
			},
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"DELETE",
					"http://any.url",
					nil,
				),
				user: chronograf.User{
					ID:       "LDAP-Heroku-helena",
					Username: "helena",
					Provider: "Heroku",
					Scheme:   "LDAP",
				},
			},
			id:         "LDAP-Heroku-Helena",
			wantStatus: http.StatusNoContent,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := &Service{
				UsersStore: tt.fields.UsersStore,
				Logger:     tt.fields.Logger,
			}

			tt.args.r = tt.args.r.WithContext(httprouter.WithParams(
				context.Background(),
				httprouter.Params{
					{
						Key:   "id",
						Value: tt.args.user.ID,
					},
				},
			))

			s.RemoveUser(tt.args.w, tt.args.r)

			resp := tt.args.w.Result()

			if resp.StatusCode != tt.wantStatus {
				t.Errorf("%q. RemoveUser() = %v, want %v", tt.name, resp.StatusCode, tt.wantStatus)
			}
		})
	}
}

func TestService_UpdateUser(t *testing.T) {
	type fields struct {
		UsersStore chronograf.UsersStore
		Logger     chronograf.Logger
	}
	type args struct {
		w    *httptest.ResponseRecorder
		r    *http.Request
		user *chronograf.User
	}
	tests := []struct {
		name            string
		fields          fields
		args            args
		userID          string
		wantStatus      int
		wantContentType string
		wantBody        string
	}{
		{
			name: "Update a Chronograf user",
			fields: fields{
				Logger: log.New(log.DebugLevel),
				UsersStore: &mocks.UsersStore{
					UpdateF: func(ctx context.Context, user *chronograf.User) error {
						return nil
					},
					GetF: func(ctx context.Context, ID string) (*chronograf.User, error) {
						return &chronograf.User{
							ID:       "OAuth2-GitHub-bobbetta",
							Username: "bobbetta2",
							Provider: "GitHub",
							Scheme:   "OAuth2",
						}, nil
					},
				},
			},
			args: args{
				w: httptest.NewRecorder(),
				r: httptest.NewRequest(
					"PATCH",
					"http://any.url",
					nil,
				),
				user: &chronograf.User{
					ID:       "OAuth2-GitHub-bobbetta",
					Username: "bobbetta2",
					Provider: "GitHub",
					Scheme:   "OAuth2",
				},
			},
			userID:          "OAuth2-GitHub-bobbetta",
			wantStatus:      http.StatusOK,
			wantContentType: "application/json",
			wantBody:        `{"id":"OAuth2-GitHub-bobbetta","username":"bobbetta2","provider":"GitHub","scheme":"OAuth2","links":{"self":"/chronograf/v1/users/OAuth2-GitHub-bobbetta"}}`,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := &Service{
				UsersStore: tt.fields.UsersStore,
				Logger:     tt.fields.Logger,
			}

			buf, _ := json.Marshal(tt.args.user)
			tt.args.r.Body = ioutil.NopCloser(bytes.NewReader(buf))

			s.UpdateUser(tt.args.w, tt.args.r)

			resp := tt.args.w.Result()
			content := resp.Header.Get("Content-Type")
			body, _ := ioutil.ReadAll(resp.Body)

			if resp.StatusCode != tt.wantStatus {
				t.Errorf("%q. UpdateUser() = %v, want %v", tt.name, resp.StatusCode, tt.wantStatus)
			}
			if tt.wantContentType != "" && content != tt.wantContentType {
				t.Errorf("%q. UpdateUser() = %v, want %v", tt.name, content, tt.wantContentType)
			}
			if eq, _ := jsonEqual(string(body), tt.wantBody); tt.wantBody != "" && !eq {
				t.Errorf("%q. UpdateUser() = \n***%v***\n,\nwant\n***%v***", tt.name, string(body), tt.wantBody)
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
