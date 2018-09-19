package grafana

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/grafana/grafana/pkg/tsdb/influxdb"
	"github.com/influxdata/chronograf"
)

var (
	regexpOperatorPattern    = regexp.MustCompile(`^\/.*\/$`)
	regexpMeasurementPattern = regexp.MustCompile(`^\/.*\/$`)
)

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

type IR struct {
	Base *Dashboard
	To   *chronograf.Dashboard
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
	Interval    string           `json:"interval"`
	Datassource string           `json:"datasource"`
	Bars        bool             `json:"bars"`
	Lines       bool             `json:"lines"`
	Stepped     bool             `json:"steppedLines"`
	Stacked     bool             `json:"stack"`
	Span        int              `json:"span"`
	SpaceLength int              `json:"spaceLength"`
	Title       string           `json:"title"`
	Type        string           `json:"graph"`
	X           XAxis            `json:"xaxis"`
	Ys          []YAxis          `json:"yaxes"`
	Targets     []influxdb.Query `json:"targets"`
}

/*
type Target struct {
	Selects     [][]Select `json:"select,omitempty"`
	RP          string     `json:"policy,omitempty"`
	Measurement string     `json:"measurement,omitempty"`
	Tags        Tags       `json:"tags,omitempty"`
	GroupBys    GroupBys   `json:"groupBy,omitempty"`

	Alias      string `json:"alias,omitempty"`
	SourceType string `json:"dsType,omitempty"`
	RawQuery   bool   `json:"rawQuery"`
	Query      string `json:"query"`
}*/

/*
func (t *Target) InfluxQL(rng Range, interval string) string {
	if t.RawQuery {
		return t.Query
	}

	query := t.selectors()
	query += t.measurement()
	query += t.Tags.InfluxQL()
	query += rng.InfluxQL()
	query += t.GroupBys.InfluxQL()

	calculator := tsdb.NewIntervalCalculator(&tsdb.IntervalOptions{})
	interval := calculator.Calculate(queryContext.TimeRange, interval)
	to := timerange.MustGetTo().UnixNano()
	if rng.To == "now" {
		return tr.Now, nil
	} else if strings.HasPrefix(tr.To, "now-") {
		withoutNow := strings.Replace(tr.To, "now-", "", 1)

		diff, err := time.ParseDuration("-" + withoutNow)
		if err != nil {
			return time.Time{}, nil
		}

		return tr.Now.Add(diff), nil
	}

	if res, ok := tryParseUnixMsEpoch(tr.To); ok {
		return res, nil
	}

	return time.Time{}, fmt.Errorf("cannot parse to value %s", tr.To)
	from := timerange.MustGetFrom().UnixNano()
	interval := time.Duration((to - from) / defaultRes)

	if interval < minInterval {
		return Interval{Text: formatDuration(minInterval), Value: minInterval}
	}

	rounded := roundInterval(interval)
	return Interval{Text: formatDuration(rounded), Value: rounded}

	query = strings.Replace(query, "$timeFilter", rng.InfluxQL(), -1)
	query = strings.Replace(query, "$interval", ":interval:", -1)
	query = strings.Replace(query, "$__interval_ms", strconv.FormatInt(interval.Value.Nanoseconds()/int64(time.Millisecond), 10), -1)
	query = strings.Replace(query, "$__interval", ":interval:", -1)

	return query
}
func (t *Target) selectors() string {
	query := "SELECT "
	var selectors []string
	for _, sel := range t.Selects {
		stk := ""
		for _, s := range sel {
			stk = render(s.Type, s.Params, stk)
		}
		selectors = append(selectors, stk)
	}

	return query + strings.Join(selectors, ", ")
}

func (t *Target) measurement() string {
	rp := `"` + t.RP + `".`
	if t.RP == "" || t.RP == "default" {
		rp = ""
	}

	measurement := t.Measurement
	if !regexpMeasurementPattern.Match([]byte(t.Measurement)) {
		measurement = fmt.Sprintf(`"%s"`, measurement)
	}

	return fmt.Sprintf(` FROM %s%s`, rp, measurement)
}*/

type GroupBys []GroupBy

func (gs GroupBys) InfluxQL() string {
	groupBy := ""
	for i, group := range gs {
		if i == 0 {
			groupBy += " GROUP BY"
		}

		if i > 0 && group.Type != "fill" {
			groupBy += ", " //fill is so very special. fill is a creep, fill is a weirdo
		} else {
			groupBy += " "
		}

		groupBy += group.InfluxQL()
	}

	return groupBy
}

type GroupBy struct {
	Params []string `json:"params,omitempty"`
	Type   string   `json:"type,omitempty"`
}

func (g GroupBy) InfluxQL() string {
	return render(g.Type, g.Params, "")
}

type Select struct {
	Params []string `json:"params,omitempty"`
	Type   string   `json:"type,omitempty"`
}

type Tags []Tag

func (ts Tags) InfluxQL() string {
	res := " WHERE "
	conditions := ts.tags()
	if len(conditions) > 0 {
		if len(conditions) > 1 {
			res += "(" + strings.Join(conditions, " ") + ")"
		} else {
			res += conditions[0]
		}
		res += " AND "
	}

	return res
}

func (ts Tags) tags() []string {
	var res []string
	for i, tag := range ts {
		str := ""

		if i > 0 {
			if tag.Condition == "" {
				str += "AND"
			} else {
				str += tag.Condition
			}
			str += " "
		}

		//If the operator is missing we fall back to sensible defaults
		if tag.Operator == "" {
			if regexpOperatorPattern.Match([]byte(tag.Value)) {
				tag.Operator = "=~"
			} else {
				tag.Operator = "="
			}
		}

		// quote value unless regex or number
		var textValue string
		if tag.Operator == "=~" || tag.Operator == "!~" {
			textValue = tag.Value
		} else if tag.Operator == "<" || tag.Operator == ">" {
			textValue = tag.Value
		} else {
			textValue = fmt.Sprintf("'%s'", strings.Replace(tag.Value, `\`, `\\`, -1))
		}

		res = append(res, fmt.Sprintf(`%s"%s" %s %s`, str, tag.Key, tag.Operator, textValue))
	}

	return res
}

type Tag struct {
	Key       string `json:"key,omitempty"`
	Operator  string `json:"operator,omitempty"`
	Value     string `json:"value,omitempty"`
	Condition string `json:"condition,omitempty"`
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

func (r Range) InfluxQL() string {
	from := "now() - " + r.From
	to := ""

	if r.To != "now" && r.To != "" {
		to = " and time < now() - " + strings.Replace(r.To, "now-", "", 1)
	}

	return fmt.Sprintf("time > %s%s", from, to)
}

func field(params []string) string {
	if len(params) == 0 {
		return ""
	}

	if params[0] == "*" {
		return "*"
	}

	return fmt.Sprintf(`"%s"`, params[0])
}

func function(typ string, params []string, inner string) string {
	for i, param := range params {
		if typ == "time" && param == "auto" {
			params[i] = "$__interval"
		}
	}

	if inner != "" {
		params = append([]string{inner}, params...)
	}

	p := strings.Join(params, ", ")
	return fmt.Sprintf("%s(%s)", typ, p)
}

func alias(params []string, innerExpr string) string {
	return fmt.Sprintf(`%s AS "%s"`, innerExpr, params[0])
}

func math(params []string, inner string) string {
	return fmt.Sprintf("%s %s", inner, params[0])
}

func render(typ string, params []string, inner string) string {
	switch typ {
	case "field", "tag":
		return field(params)
	case "math":
		return math(params, inner)
	case "alias":
		return alias(params, inner)
	default:
		return function(typ, params, inner)
	}
}
