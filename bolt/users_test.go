package bolt_test

import (
	"context"
	"reflect"
	"testing"

	"github.com/influxdata/chronograf"
)

func TestUsersStore_Get(t *testing.T) {
	type args struct {
		ctx  context.Context
		name string
	}
	tests := []struct {
		name    string
		args    args
		want    *chronograf.User
		wantErr bool
	}{
		{
			name: "User not found",
			args: args{
				ctx:  context.Background(),
				name: "unknown",
			},
			wantErr: true,
		},
	}
	for _, tt := range tests {
		client, err := NewTestClient()
		if err != nil {
			t.Fatal(err)
		}
		if err := client.Open(context.TODO()); err != nil {
			t.Fatal(err)
		}
		defer client.Close()

		s := client.UsersStore
		got, err := s.Get(tt.args.ctx, tt.args.name)
		if (err != nil) != tt.wantErr {
			t.Errorf("%q. UsersStore.Get() error = %v, wantErr %v", tt.name, err, tt.wantErr)
			continue
		}
		if !reflect.DeepEqual(got, tt.want) {
			t.Errorf("%q. UsersStore.Get() = %v, want %v", tt.name, got, tt.want)
		}
	}
}

func TestUsersStore_Add(t *testing.T) {
	type args struct {
		ctx context.Context
		u   *chronograf.User
	}
	tests := []struct {
		name    string
		args    args
		want    *chronograf.User
		wantErr bool
	}{
		{
			name: "Add new user",
			args: args{
				ctx: context.Background(),
				u: &chronograf.User{
					Name: "docbrown",
				},
			},
			want: &chronograf.User{
				Name: "docbrown",
			},
		},
	}
	for _, tt := range tests {
		client, err := NewTestClient()
		if err != nil {
			t.Fatal(err)
		}
		if err := client.Open(context.TODO()); err != nil {
			t.Fatal(err)
		}
		defer client.Close()
		s := client.UsersStore
		got, err := s.Add(tt.args.ctx, tt.args.u)
		if (err != nil) != tt.wantErr {
			t.Errorf("%q. UsersStore.Add() error = %v, wantErr %v", tt.name, err, tt.wantErr)
			continue
		}
		if !reflect.DeepEqual(got, tt.want) {
			t.Errorf("%q. UsersStore.Add() = %v, want %v", tt.name, got, tt.want)
		}

		got, _ = s.Get(tt.args.ctx, got.Name)
		if !reflect.DeepEqual(got, tt.want) {
			t.Errorf("%q. UsersStore.Add() = %v, want %v", tt.name, got, tt.want)
		}
	}
}

func TestUsersStore_Delete(t *testing.T) {
	type args struct {
		ctx  context.Context
		user *chronograf.User
	}
	tests := []struct {
		name     string
		args     args
		addFirst bool
		wantErr  bool
	}{
		{
			name: "No such user",
			args: args{
				ctx: context.Background(),
				user: &chronograf.User{
					Name: "noone",
				},
			},
			wantErr: true,
		},
		{
			name: "Delete new user",
			args: args{
				ctx: context.Background(),
				user: &chronograf.User{
					Name: "noone",
				},
			},
			addFirst: true,
		},
	}
	for _, tt := range tests {
		client, err := NewTestClient()
		if err != nil {
			t.Fatal(err)
		}
		if err := client.Open(context.TODO()); err != nil {
			t.Fatal(err)
		}
		defer client.Close()
		s := client.UsersStore

		if tt.addFirst {
			s.Add(tt.args.ctx, tt.args.user)
		}
		if err := s.Delete(tt.args.ctx, tt.args.user); (err != nil) != tt.wantErr {
			t.Errorf("%q. UsersStore.Delete() error = %v, wantErr %v", tt.name, err, tt.wantErr)
		}
	}
}

func TestUsersStore_Update(t *testing.T) {
	type args struct {
		ctx context.Context
		usr *chronograf.User
	}
	tests := []struct {
		name     string
		args     args
		addFirst bool
		wantErr  bool
	}{
		{
			name: "No such user",
			args: args{
				ctx: context.Background(),
				usr: &chronograf.User{
					Name: "noone",
				},
			},
			wantErr: true,
		},
		{
			name: "Update new user",
			args: args{
				ctx: context.Background(),
				usr: &chronograf.User{
					Name: "noone",
				},
			},
			addFirst: true,
		},
	}
	for _, tt := range tests {
		client, err := NewTestClient()
		if err != nil {
			t.Fatal(err)
		}
		if err := client.Open(context.TODO()); err != nil {
			t.Fatal(err)
		}
		defer client.Close()
		s := client.UsersStore

		if tt.addFirst {
			s.Add(tt.args.ctx, tt.args.usr)
		}

		if err := s.Update(tt.args.ctx, tt.args.usr); (err != nil) != tt.wantErr {
			t.Errorf("%q. UsersStore.Update() error = %v, wantErr %v", tt.name, err, tt.wantErr)
		}
	}
}

func TestUsersStore_All(t *testing.T) {
	tests := []struct {
		name     string
		ctx      context.Context
		want     []chronograf.User
		addFirst bool
		wantErr  bool
	}{
		{
			name: "No users",
		},
		{
			name: "Update new user",
			want: []chronograf.User{
				{
					Name: "howdy",
				},
				{
					Name: "doody",
				},
			},
			addFirst: true,
		},
	}
	for _, tt := range tests {
		client, err := NewTestClient()
		if err != nil {
			t.Fatal(err)
		}
		if err := client.Open(context.TODO()); err != nil {
			t.Fatal(err)
		}
		defer client.Close()
		s := client.UsersStore

		if tt.addFirst {
			for _, u := range tt.want {
				s.Add(tt.ctx, &u)
			}
		}
		got, err := s.All(tt.ctx)
		if (err != nil) != tt.wantErr {
			t.Errorf("%q. UsersStore.All() error = %v, wantErr %v", tt.name, err, tt.wantErr)
			continue
		}
		if !reflect.DeepEqual(got, tt.want) {
			t.Errorf("%q. UsersStore.All() = %v, want %v", tt.name, got, tt.want)
		}
	}
}
