package influx

import (
	"testing"
	"time"
)

func TestJWT(t *testing.T) {
	type args struct {
		username     string
		sharedSecret string
		now          Now
	}
	tests := []struct {
		name    string
		args    args
		want    string
		wantErr bool
	}{
		{
			name: "",
			args: args{
				username:     "AzureDiamond",
				sharedSecret: "hunter2",
				now: func() time.Time {
					return time.Unix(0, 0)
				},
			},
			want: "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjYwLCJ1c2VybmFtZSI6IkF6dXJlRGlhbW9uZCJ9.kUWGwcpCPwV7MEk7luO1rt8036LyvG4bRL_CfseQGmz4b0S34gATx30g4xvqVAV6bwwYE0YU3P8FjG8ij4kc5g",
		},
		{
			name: "",
			args: args{
				username:     "Pepa",
				sharedSecret: "hunter2",
				now: func() time.Time {
					return time.Date(2022, time.July, 1, 20, 0, 0, 0, time.UTC)
				},
			},
			want: "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2NTY3MDU2NjAsInVzZXJuYW1lIjoiUGVwYSJ9.zrY8LHP4jjZ-MaNOLEeN5dPC8SdA132DjhHv83dHF48lHV25u6OfFKEW11hZlVdI7f6z_bGxTMMezKHnf04jYQ",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := JWT(tt.args.username, tt.args.sharedSecret, tt.args.now)
			if (err != nil) != tt.wantErr {
				t.Errorf("JWT() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("JWT() = %v, want %v", got, tt.want)
			}
		})
	}
}
