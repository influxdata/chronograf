package influx

import (
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/influxdata/chronograf"
)

// SortTemplates the templates by size, then type, then value.
func SortTemplates(ts []chronograf.TemplateVar) []chronograf.TemplateVar {
	sort.Slice(ts, func(i, j int) bool {
		if ts[i].Var == ":interval:" {
			return false
		}

		if len(ts[i].Values) != len(ts[j].Values) {
			return len(ts[i].Values) < len(ts[j].Values)
		}

		if len(ts[i].Values) == 0 {
			return i < j
		}

		for k := range ts[i].Values {
			if ts[i].Values[k].Type != ts[j].Values[k].Type {
				return ts[i].Values[k].Type < ts[j].Values[k].Type
			}
			if ts[i].Values[k].Value != ts[j].Values[k].Value {
				return ts[i].Values[k].Value < ts[j].Values[k].Value
			}
		}
		return i < j
	})
	return ts
}

// RenderTemplate converts the template variable into a correct InfluxQL string based
// on its type
func RenderTemplate(query string, t chronograf.TemplateVar, now time.Time) (string, error) {
	if len(t.Values) == 0 {
		return query, nil
	}

	// we only need to render the template if the template exists in the query
	if !strings.Contains(query, t.Var) {
		return query, nil
	}

	var q string

	// First render template variable usages appearing within an InfluxQL regular expression (value should appear unquoted)
	switch t.Values[0].Type {
	case "tagKey", "fieldKey", "measurement", "tagValue":
		r, err := regexp.Compile(`(/[.^/]*)(` + regexp.QuoteMeta(t.Var) + `)([.^/]*/)`)

		if err != nil {
			return "", err
		}

		q = r.ReplaceAllString(query, `${1}`+t.Values[0].Value+`${3}`)
	default:
		q = query
	}

	// Then render template variable usages not appearing in an InfluxQL regular expression (values may be quoted)
	switch t.Values[0].Type {
	case "tagKey", "fieldKey", "measurement", "database":
		return strings.Replace(q, t.Var, `"`+t.Values[0].Value+`"`, -1), nil
	case "tagValue", "timeStamp":
		return strings.Replace(q, t.Var, `'`+t.Values[0].Value+`'`, -1), nil
	case "csv", "constant", "influxql":
		return strings.Replace(q, t.Var, t.Values[0].Value, -1), nil
	}

	tv := map[string]string{}
	for i := range t.Values {
		tv[t.Values[i].Type] = t.Values[i].Value
	}

	if pts, ok := tv["points"]; ok {
		points, err := strconv.ParseInt(pts, 0, 64)
		if err != nil {
			return "", err
		}

		dur, err := ParseTime(query, now)
		if err != nil {
			return "", err
		}
		interval := AutoInterval(points, dur)
		return strings.Replace(query, t.Var, interval, -1), nil
	}

	return query, nil
}

// AutoInterval uses the number of points and duration to define the group by time.
func AutoInterval(points int64, duration time.Duration) string {
	// The function is: ((total_seconds * millisecond_converstion) / group_by) = pixels / 3
	// Number of points given the pixels
	pixels := float64(points)
	msPerPixel := float64(duration/time.Millisecond) / pixels
	secPerPixel := float64(duration/time.Second) / pixels
	if secPerPixel < 1.0 {
		if msPerPixel < 1.0 {
			msPerPixel = 1.0
		}
		return strconv.FormatInt(int64(msPerPixel), 10) + "ms"
	}
	// If groupby is more than 1 second round to the second
	return strconv.FormatInt(int64(secPerPixel), 10) + "s"
}

// TemplateReplace replaces templates with values within the query string
func TemplateReplace(query string, templates []chronograf.TemplateVar, now time.Time) (string, error) {
	templates = SortTemplates(templates)
	for i := range templates {
		var err error
		query, err = RenderTemplate(query, templates[i], now)
		if err != nil {
			return "", err
		}
	}
	return query, nil
}
