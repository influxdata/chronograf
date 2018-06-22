package bolt_test

import (
	"context"
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/chronograf"
)

func TestSettings_Get(t *testing.T) {
	type wants struct {
		settings *chronograf.Settings
		err      error
	}
	tests := []struct {
		name  string
		wants wants
	}{
		{
			name: "Get UI settings",
			wants: wants{
				settings: &chronograf.Settings{
					LogViewer: chronograf.LogViewerSettings{
						Columns: []chronograf.RenamableField{
							{
								InternalName: "time",
								DisplayName:  "",
								Visible:      true,
							},
							{
								InternalName: "severity",
								DisplayName:  "",
								Visible:      true,
							},
							{
								InternalName: "timestamp",
								DisplayName:  "",
								Visible:      true,
							},
							{
								InternalName: "facility",
								DisplayName:  "",
								Visible:      true,
							},
							{
								InternalName: "procid",
								DisplayName:  "",
								Visible:      true,
							},
							{
								InternalName: "application",
								DisplayName:  "",
								Visible:      true,
							},
							{
								InternalName: "host",
								DisplayName:  "",
								Visible:      true,
							},
							{
								InternalName: "message",
								DisplayName:  "",
								Visible:      true,
							},
						},
						SeverityColors: []chronograf.SeverityColor{
							{
								Type: "emergency",
								Default: chronograf.HexColor{
									Hex:  "#BF3D5E",
									Name: "ruby",
								},
								Override: chronograf.HexColor{},
							},
							{
								Type: "alert",
								Default: chronograf.HexColor{
									Hex:  "#DC4E58",
									Name: "fire",
								},
								Override: chronograf.HexColor{},
							},
							{
								Type: "critical",
								Default: chronograf.HexColor{
									Hex:  "#F95F53",
									Name: "curacao",
								},
								Override: chronograf.HexColor{},
							},
							{
								Type: "error",
								Default: chronograf.HexColor{
									Hex:  "#F48D38",
									Name: "tiger",
								},
								Override: chronograf.HexColor{},
							},
							{
								Type: "warning",
								Default: chronograf.HexColor{
									Hex:  "#FFB94A",
									Name: "pineapple",
								},
								Override: chronograf.HexColor{},
							},
							{
								Type: "notice",
								Default: chronograf.HexColor{
									Hex:  "#4ED8A0",
									Name: "rainforest",
								},
								Override: chronograf.HexColor{},
							},
							{
								Type: "info",
								Default: chronograf.HexColor{
									Hex:  "#7A65F2",
									Name: "star",
								},
								Override: chronograf.HexColor{},
							},
							{
								Type: "debug",
								Default: chronograf.HexColor{
									Hex:  "#8E91A1",
									Name: "wolf",
								},
								Override: chronograf.HexColor{},
							},
						},
						SeverityColumnFormat: "dot",
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

		s := client.SettingsStore
		got, err := s.Get(context.Background())
		if (tt.wants.err != nil) != (err != nil) {
			t.Errorf("%q. SettingsStore.Get() error = %v, wantErr %v", tt.name, err, tt.wants.err)
			continue
		}
		if diff := cmp.Diff(got, tt.wants.settings); diff != "" {
			t.Errorf("%q. SettingsStore.Get():\n-got/+want\ndiff %s", tt.name, diff)
		}
	}
}

func TestSettings_Update(t *testing.T) {
	type args struct {
		settings *chronograf.Settings
	}
	type wants struct {
		settings *chronograf.Settings
		err      error
	}
	tests := []struct {
		name  string
		args  args
		wants wants
	}{
		{
			name: "Set UI settings",
			args: args{
				settings: &chronograf.Settings{},
			},
			wants: wants{
				settings: &chronograf.Settings{},
			},
		},
	}
	for _, tt := range tests {
		client, err := NewTestClient()
		if err != nil {
			t.Fatal(err)
		}
		defer client.Close()

		s := client.SettingsStore
		err = s.Update(context.Background(), tt.args.settings)
		if (tt.wants.err != nil) != (err != nil) {
			t.Errorf("%q. SettingsStore.Get() error = %v, wantErr %v", tt.name, err, tt.wants.err)
			continue
		}

		got, _ := s.Get(context.Background())
		if (tt.wants.err != nil) != (err != nil) {
			t.Errorf("%q. SettingsStore.Get() error = %v, wantErr %v", tt.name, err, tt.wants.err)
			continue
		}

		if diff := cmp.Diff(got, tt.wants.settings); diff != "" {
			t.Errorf("%q. SettingsStore.Get():\n-got/+want\ndiff %s", tt.name, diff)
		}
	}
}
