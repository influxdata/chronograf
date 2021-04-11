package kv_test

import (
	"context"
	"fmt"
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/hws522/chronograf"
)

func TestConfig_Get(t *testing.T) {
	type wants struct {
		config *chronograf.Config
		err    error
	}
	tests := []struct {
		name  string
		wants wants
	}{
		{
			name: "Get config",
			wants: wants{
				config: &chronograf.Config{
					Auth: chronograf.AuthConfig{
						SuperAdminNewUsers: false,
					},
				},
			},
		},
	}
	for _, tt := range tests {
		client, err := NewTestClient()
		if err != nil {
			t.Fatal(err)
		}
		defer client.Close()

		got, err := client.ConfigStore().Get(context.Background())
		if (tt.wants.err != nil) != (err != nil) {
			fmt.Println(got, err)
			t.Errorf("%q. ConfigStore.Get() error = %v, wantErr %v", tt.name, err, tt.wants.err)
			continue
		}
		if diff := cmp.Diff(got, tt.wants.config); diff != "" {
			t.Errorf("%q. ConfigStore.Get():\n-got/+want\ndiff %s", tt.name, diff)
		}
	}
}

func TestConfig_Update(t *testing.T) {
	type args struct {
		config *chronograf.Config
	}
	type wants struct {
		config *chronograf.Config
		err    error
	}
	tests := []struct {
		name  string
		args  args
		wants wants
	}{
		{
			name: "Set config",
			args: args{
				config: &chronograf.Config{
					Auth: chronograf.AuthConfig{
						SuperAdminNewUsers: false,
					},
				},
			},
			wants: wants{
				config: &chronograf.Config{
					Auth: chronograf.AuthConfig{
						SuperAdminNewUsers: false,
					},
				},
			},
		},
	}
	for _, tt := range tests {
		client, err := NewTestClient()
		if err != nil {
			t.Fatal(err)
		}
		defer client.Close()

		err = client.ConfigStore().Update(context.Background(), tt.args.config)
		if (tt.wants.err != nil) != (err != nil) {
			t.Errorf("%q. ConfigStore.Get() error = %v, wantErr %v", tt.name, err, tt.wants.err)
			continue
		}

		got, _ := client.ConfigStore().Get(context.Background())
		if (tt.wants.err != nil) != (err != nil) {
			t.Errorf("%q. ConfigStore.Get() error = %v, wantErr %v", tt.name, err, tt.wants.err)
			continue
		}

		if diff := cmp.Diff(got, tt.wants.config); diff != "" {
			t.Errorf("%q. ConfigStore.Get():\n-got/+want\ndiff %s", tt.name, diff)
		}
	}
}
