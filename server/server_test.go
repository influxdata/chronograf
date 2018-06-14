package server

import (
	"context"
	"net/http"
	"testing"

	"github.com/bouk/httprouter"
)

// WithContext is a helper function to cut down on boilerplate in server test files
func WithContext(ctx context.Context, r *http.Request, kv map[string]string) *http.Request {
	params := make(httprouter.Params, 0, len(kv))
	for k, v := range kv {
		params = append(params, httprouter.Param{
			Key:   k,
			Value: v,
		})
	}
	return r.WithContext(httprouter.WithParams(ctx, params))
}

func Test_validBasepath(t *testing.T) {
	type args struct {
		basepath string
	}
	tests := []struct {
		name    string
		args    args
		wantErr bool
		want    string
	}{
		{
			name: "Basepath can be empty",
			args: args{
				basepath: "",
			},
			want: "/",
		},
		{
			name: "Basepath is not empty and valid",
			args: args{
				basepath: "/russ",
			},
			want: "/russ/",
		},
		{
			name: "Basepath is not empty and no slashes",
			args: args{
				basepath: "russ",
			},
			want: "russ/",
		},
		{
			name: "Basepath is valid with multiple dirs",
			args: args{
				basepath: "/howdy/doody/",
			},
			want: "/howdy/doody",
		},
		{
			name: "Basepath is valid with a slash at the end",
			args: args{
				basepath: "/howdy//",
			},
			want: "/howdy/",
		},
		{
			name: "Basepath is RFC-3960 compliant",
			args: args{
				basepath: `/a1@:~%FF_.-!$&'()*+,;=howdy/`,
			},
			want: `/a1@:~%FF_.-!$&'()*+,;=howdy/`,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validBasepath(&tt.args.basepath)
			if err != nil && !tt.wantErr {
				t.Errorf("Unexpected error validating basepath: %s, err: %s", tt.args.basepath, err.Error())
			} else if err == nil && tt.wantErr {
				t.Errorf("Expected error validating basepath: %s", tt.args.basepath)
			}

			if tt.args.basepath != tt.want {
				t.Errorf("Expected basepath: %s actual basepath: %s", tt.want, tt.args.basepath)
			}
		})
	}
}
