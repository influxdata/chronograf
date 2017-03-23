package server

import (
	"reflect"
	"testing"

	"github.com/influxdata/chronograf"
)

func TestCorrectWidthHeight(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name string
		cell chronograf.DashboardCell
		want chronograf.DashboardCell
	}{
		{
			name: "updates width",
			cell: chronograf.DashboardCell{
				W: 0,
				H: 4,
			},
			want: chronograf.DashboardCell{
				W: 4,
				H: 4,
			},
		},
		{
			name: "updates height",
			cell: chronograf.DashboardCell{
				W: 4,
				H: 0,
			},
			want: chronograf.DashboardCell{
				W: 4,
				H: 4,
			},
		},
		{
			name: "updates both",
			cell: chronograf.DashboardCell{
				W: 0,
				H: 0,
			},
			want: chronograf.DashboardCell{
				W: 4,
				H: 4,
			},
		},
		{
			name: "updates neither",
			cell: chronograf.DashboardCell{
				W: 4,
				H: 4,
			},
			want: chronograf.DashboardCell{
				W: 4,
				H: 4,
			},
		},
	}
	for _, tt := range tests {
		if CorrectWidthHeight(&tt.cell); !reflect.DeepEqual(tt.cell, tt.want) {
			t.Errorf("%q. CorrectWidthHeight() = %v, want %v", tt.name, tt.cell, tt.want)
		}
	}
}

func TestDashboardDefaults(t *testing.T) {
	tests := []struct {
		name string
		d    chronograf.Dashboard
		want chronograf.Dashboard
	}{
		{
			name: "Updates all cell widths/heights",
			d: chronograf.Dashboard{
				Cells: []chronograf.DashboardCell{
					{
						W: 0,
						H: 0,
					},
					{
						W: 2,
						H: 2,
					},
				},
			},
			want: chronograf.Dashboard{
				Cells: []chronograf.DashboardCell{
					{
						W: 4,
						H: 4,
					},
					{
						W: 2,
						H: 2,
					},
				},
			},
		},
		{
			name: "Updates no cell",
			d: chronograf.Dashboard{
				Cells: []chronograf.DashboardCell{
					{
						W: 4,
						H: 4,
					}, {
						W: 2,
						H: 2,
					},
				},
			},
			want: chronograf.Dashboard{
				Cells: []chronograf.DashboardCell{
					{
						W: 4,
						H: 4,
					},
					{
						W: 2,
						H: 2,
					},
				},
			},
		},
	}
	for _, tt := range tests {
		if DashboardDefaults(&tt.d); !reflect.DeepEqual(tt.d, tt.want) {
			t.Errorf("%q. DashboardDefaults() = %v, want %v", tt.name, tt.d, tt.want)
		}
	}
}

func TestValidDashboardRequest(t *testing.T) {
	tests := []struct {
		name    string
		d       chronograf.Dashboard
		want    chronograf.Dashboard
		wantErr bool
	}{
		{
			name: "Updates all cell widths/heights",
			d: chronograf.Dashboard{
				Cells: []chronograf.DashboardCell{
					{
						W: 0,
						H: 0,
						Queries: []chronograf.DashboardQuery{
							{
								Command: "SELECT donors from hill_valley_preservation_society where time > 1985-10-25T08:00:00",
							},
						},
					},
					{
						W: 2,
						H: 2,
						Queries: []chronograf.DashboardQuery{
							{
								Command: "SELECT winning_horses from grays_sports_alamanc where time > 1955-11-1T00:00:00",
							},
						},
					},
				},
			},
			want: chronograf.Dashboard{
				Cells: []chronograf.DashboardCell{
					{
						W: 4,
						H: 4,
						Queries: []chronograf.DashboardQuery{
							{
								Command: "SELECT donors from hill_valley_preservation_society where time > 1985-10-25T08:00:00",
							},
						},
					},
					{
						W: 2,
						H: 2,
						Queries: []chronograf.DashboardQuery{
							{
								Command: "SELECT winning_horses from grays_sports_alamanc where time > 1955-11-1T00:00:00",
							},
						},
					},
				},
			},
		},
		{
			name: "No queries",
			d: chronograf.Dashboard{
				Cells: []chronograf.DashboardCell{
					{
						W:       2,
						H:       2,
						Queries: []chronograf.DashboardQuery{},
					},
				},
			},
			want: chronograf.Dashboard{
				Cells: []chronograf.DashboardCell{
					{
						W:       2,
						H:       2,
						Queries: []chronograf.DashboardQuery{},
					},
				},
			},
			wantErr: true,
		},
		{
			name: "Empty Cells",
			d: chronograf.Dashboard{
				Cells: []chronograf.DashboardCell{},
			},
			want: chronograf.Dashboard{
				Cells: []chronograf.DashboardCell{},
			},
			wantErr: true,
		},
	}
	for _, tt := range tests {
		err := ValidDashboardRequest(&tt.d)
		if (err != nil) != tt.wantErr {
			t.Errorf("%q. ValidDashboardRequest() error = %v, wantErr %v", tt.name, err, tt.wantErr)
			continue
		}
		if !reflect.DeepEqual(tt.d, tt.want) {
			t.Errorf("%q. ValidDashboardRequest() = %v, want %v", tt.name, tt.d, tt.want)
		}
	}
}

func Test_newDashboardResponse(t *testing.T) {
	tests := []struct {
		name string
		d    chronograf.Dashboard
		want *dashboardResponse
	}{
		{
			name: "creates a dashboard response",
			d: chronograf.Dashboard{
				Cells: []chronograf.DashboardCell{
					{
						ID: "a",
						W:  0,
						H:  0,
						Queries: []chronograf.DashboardQuery{
							{
								Command: "SELECT donors from hill_valley_preservation_society where time > '1985-10-25 08:00:00'",
							},
						},
					},
					{
						ID: "b",
						W:  0,
						H:  0,
						Queries: []chronograf.DashboardQuery{
							{
								Command: "SELECT winning_horses from grays_sports_alamanc where time > now() - 15m",
							},
						},
					},
				},
			},
			want: &dashboardResponse{
				Cells: []dashboardCellResponse{
					dashboardCellResponse{
						Links: dashboardCellLinks{
							Self: "/chronograf/v1/dashboards/0/cells/a",
						},
						DashboardCell: chronograf.DashboardCell{
							ID: "a",
							W:  4,
							H:  4,
							Queries: []chronograf.DashboardQuery{
								{
									Command: "SELECT donors from hill_valley_preservation_society where time > '1985-10-25 08:00:00'",
									QueryConfig: chronograf.QueryConfig{
										RawText: "SELECT donors FROM hill_valley_preservation_society WHERE time > '1985-10-25 08:00:00'",
										Fields:  []chronograf.Field{},
										GroupBy: chronograf.GroupBy{
											Tags: []string{},
										},
										Tags:            make(map[string][]string, 0),
										AreTagsAccepted: false,
									},
								},
							},
						},
					},
					dashboardCellResponse{
						Links: dashboardCellLinks{
							Self: "/chronograf/v1/dashboards/0/cells/b",
						},
						DashboardCell: chronograf.DashboardCell{
							ID: "b",
							W:  4,
							H:  4,
							Queries: []chronograf.DashboardQuery{
								{
									Command: "SELECT winning_horses from grays_sports_alamanc where time > now() - 15m",
									QueryConfig: chronograf.QueryConfig{
										Measurement: "grays_sports_alamanc",
										Fields: []chronograf.Field{
											{
												Field: "winning_horses",
												Funcs: []string{},
											},
										},
										GroupBy: chronograf.GroupBy{
											Tags: []string{},
										},
										Tags:            make(map[string][]string, 0),
										AreTagsAccepted: false,
									},
								},
							},
						},
					},
				},
				Links: dashboardLinks{
					Self:  "/chronograf/v1/dashboards/0",
					Cells: "/chronograf/v1/dashboards/0/cells",
				},
			},
		},
	}
	for _, tt := range tests {
		if got := newDashboardResponse(tt.d); !reflect.DeepEqual(got, tt.want) {
			t.Errorf("%q. newDashboardResponse() = \n%+v\n\n, want\n\n%+v", tt.name, got, tt.want)
		}
	}
}
