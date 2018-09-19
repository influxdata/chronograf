package grafana

import "github.com/influxdata/chronograf"

func InitialMap(base *Dashboard) *chronograf.Dashboard {
	to := &chronograf.Dashboard{}

	to.Name = base.Title

	width, height := 3, 4
	for y, row := range base.Rows {
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
				// TODO(edd/goller) setup cell.queries[].source
				_ = gq
				query := chronograf.DashboardQuery{
					Source: datasource,
				}
				cell.Queries = append(cell.Queries, query)
			}
			to.Cells = append(to.Cells, cell)
		}
	}
	return to
}
