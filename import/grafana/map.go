package grafana

import (
	"encoding/json"

	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/tsdb"
	"github.com/influxdata/chronograf"
)

func InitialMap(base *Dashboard) *chronograf.Dashboard {
	o := `{
				"tempVar": ":field:",
				"values": [
					{
						"value": "diskBytes",
						"type": "fieldKey",
						"selected": true
					}
				],
				"id": "3d4521c5-ea3d-4529-bbdf-2416ac21dfb8",
				"type": "fieldKeys",
				"label": "",
				"query": {
					"influxql": "SHOW FIELD KEYS ON :database: FROM :measurement:",
					"db": "_internal",
					"measurement": "shard",
					"tagKey": "",
					"fieldKey": ""
				},
				"links": {
					"self": "/chronograf/v1/dashboards/1/templates/3d4521c5-ea3d-4529-bbdf-2416ac21dfb8"
				}
			}`
	var tmpp chronograf.Template
	json.Unmarshal([]byte(o), &tmpp)
	to := &chronograf.Dashboard{Templates: []chronograf.Template{tmpp}}

	to.Name = base.Title

	height := 4
	for y, row := range base.Rows {
		width := 12 / len(row.Panels)
		for x, panel := range row.Panels {
			cell := chronograf.DashboardCell{
				X:    int32(x * width),
				Y:    int32(y * height),
				Name: panel.Title,
			}

			// Line = 'line',
			// Stacked = 'line-stacked',
			// StepPlot = 'line-stepplot',
			// Bar = 'bar',
			// LinePlusSingleStat = 'line-plus-single-stat',
			// SingleStat = 'single-stat',
			// Gauge = 'gauge',
			// Table = 'table',
			// Alerts = 'alerts',
			// News = 'news',
			// Guide = 'guide',
			// Note = 'note',
			if panel.Bars {
				cell.Type = "bar"
			} else {
				cell.Type = "line"
			}
			datasource := panel.Datassource
			for _, gq := range panel.Targets {
				qc := &tsdb.TsdbQuery{
					TimeRange: &tsdb.TimeRange{
						From: "a",
						To:   "a",
					},
					Queries: []*tsdb.Query{
						&tsdb.Query{
							DataSource: &models.DataSource{
								Database: datasource,
							},
						},
					},
				}
				q, err := gq.Build(qc)
				if err != nil {
					panic(err)
				}

				query := chronograf.DashboardQuery{
					Source:  datasource,
					Command: q,
				}
				cell.Queries = append(cell.Queries, query)
			}
			to.Cells = append(to.Cells, cell)
		}
	}
	return to
}
