package grafana

type DashboardResults []DashboardResult

// DashboardResult describes a result from using the dashboard search API.
type DashboardResult struct {
	ID        int      `json:"id"`
	Title     string   `json:"title"`
	URI       string   `json:"uri"`
	Type      string   `json:"type"`
	Tags      []string `json:"tags"`
	IsStarred bool     `json:"is_starred"`
}

type Dashboard struct {
	Rows       []Row      `json:"rows"`
	Templating Templating `json:"templating"`
	Range      Range      `json:"time"`
	Title      string     `json:"title"`
}

type Row struct {
	Height string  `json:"250px"`
	Panels []Panel `json:"panels"`
}

type Panel struct {
	Interval    string   `json:"interval"`
	Bars        bool     `json:"bars"`
	Lines       bool     `json:"lines"`
	Stepped     bool     `json:"steppedLines"`
	Stacked     bool     `json:"stack"`
	Span        int      `json:"span"`
	SpaceLength int      `json:"spaceLength"`
	Title       string   `json:"title"`
	Type        string   `json:"graph"`
	X           XAxis    `json:"xaxis"`
	Ys          []YAxis  `json:"yaxes"`
	Targets     []Target `json:"targets"`
}

type Target struct {
	Selects     [][]Select `json:"select,omitempty"`
	RP          string     `json:"policy,omitempty"`
	Measurement string     `json:"measurement,omitempty"`
	Tags        []Tag      `json:"tags,omitempty"`
	GroupBys    []GroupBy  `json:"groupBy,omitempty"`

	Alias      string `json:"alias,omitempty"`
	SourceType string `json:"dsType,omitempty"`
	RawQuery   bool   `json:"rawQuery"`
	Query      string `json:"query"`
}

func (t *Target) InfluxQL() string {
	if t.RawQuery {
		return t.Query
	}

	query := "SELECT "

	return query
}

type GroupBy struct {
	Params []string `json:"params,omitempty"`
	Type   string   `json:"type,omitempty"`
}

type Select struct {
	Params []string `json:"params,omitempty"`
	Type   string   `json:"type,omitempty"`
}

type Tag struct {
	Key      string `json:"key,omitempty"`
	Operator string `json:"operator,omitempty"`
	Value    string `json:"value,omitempty"`
}

type XAxis struct {
}

type YAxis struct {
	Format  string `json:"format"`
	Label   string `json:"label"`
	LogBase int    `json:"logBase"`
	Max     int    `json:"max"`
	Min     int    `json:"min"`
}

type Templating struct {
	Templates []Template `json:"list"`
}

type Template struct {
	Query string `json:"query"`
	Type  string `json:"type"`
}

type Range struct {
	From string `json:"from"`
	To   string `json:"to"`
}
