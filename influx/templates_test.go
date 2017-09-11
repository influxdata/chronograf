package influx

import (
	"encoding/json"
	"reflect"
	"testing"
	"time"

	"github.com/influxdata/chronograf"
)

func TestTemplateReplace(t *testing.T) {
	tests := []struct {
		name  string
		query string
		vars  chronograf.TemplateVars
		want  string
	}{
		{
			name:  "select with parameters",
			query: "$METHOD field1, $field FROM $measurement WHERE temperature > $temperature",
			vars: chronograf.TemplateVars{
				chronograf.BasicTemplateVar{
					Var: "$temperature",
					Values: []chronograf.BasicTemplateValue{
						{
							Type:  "csv",
							Value: "10",
						},
					},
				},
				chronograf.BasicTemplateVar{
					Var: "$field",
					Values: []chronograf.BasicTemplateValue{
						{
							Type:  "fieldKey",
							Value: "field2",
						},
					},
				},
				chronograf.BasicTemplateVar{
					Var: "$METHOD",
					Values: []chronograf.BasicTemplateValue{
						{
							Type:  "csv",
							Value: "SELECT",
						},
					},
				},
				chronograf.BasicTemplateVar{
					Var: "$measurement",
					Values: []chronograf.BasicTemplateValue{
						{
							Type:  "csv",
							Value: `"cpu"`,
						},
					},
				},
			},
			want: `SELECT field1, "field2" FROM "cpu" WHERE temperature > 10`,
		},
		{
			name:  "select with parameters and aggregates",
			query: `SELECT mean($field) FROM "cpu" WHERE $tag = $value GROUP BY $tag`,
			vars: chronograf.TemplateVars{
				chronograf.BasicTemplateVar{
					Var: "$value",
					Values: []chronograf.BasicTemplateValue{
						{
							Type:  "tagValue",
							Value: "howdy.com",
						},
					},
				},
				chronograf.BasicTemplateVar{
					Var: "$tag",
					Values: []chronograf.BasicTemplateValue{
						{
							Type:  "tagKey",
							Value: "host",
						},
					},
				},
				chronograf.BasicTemplateVar{
					Var: "$field",
					Values: []chronograf.BasicTemplateValue{
						{
							Type:  "fieldKey",
							Value: "field",
						},
					},
				},
			},
			want: `SELECT mean("field") FROM "cpu" WHERE "host" = 'howdy.com' GROUP BY "host"`,
		},
		{
			name:  "Non-existant parameters",
			query: `SELECT $field FROM "cpu"`,
			want:  `SELECT $field FROM "cpu"`,
		},
		{
			name:  "var without a value",
			query: `SELECT $field FROM "cpu"`,
			vars: chronograf.TemplateVars{
				chronograf.BasicTemplateVar{
					Var: "$field",
				},
			},
			want: `SELECT $field FROM "cpu"`,
		},
		{
			name:  "var with unknown type",
			query: `SELECT $field FROM "cpu"`,
			vars: chronograf.TemplateVars{
				chronograf.BasicTemplateVar{
					Var: "$field",
					Values: []chronograf.BasicTemplateValue{
						{
							Type:  "who knows?",
							Value: "field",
						},
					},
				},
			},
			want: `SELECT $field FROM "cpu"`,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := TemplateReplace(tt.query, tt.vars)
			if got != tt.want {
				t.Errorf("TestParse %s =\n%s\nwant\n%s", tt.name, got, tt.want)
			}
		})
	}
}

func Test_TemplateVarsUnmarshalling(t *testing.T) {
	req := `[
	{
		"tempVar": ":interval:",
		"resolution": 1000,
		"reportingInterval": 10
	},
	{
		"tempVar": ":cpu:",
		"values": [
			{
				"type": "tagValue",
				"value": "cpu-total",
				"selected": false
			}
		]
	}
	]`

	expected := []chronograf.TemplateVariable{
		&chronograf.GroupByVar{
			Var:               ":interval:",
			Resolution:        1000,
			ReportingInterval: 10 * time.Nanosecond,
		},
		chronograf.BasicTemplateVar{
			Var: ":cpu:",
			Values: []chronograf.BasicTemplateValue{
				{
					Value:    "cpu-total",
					Type:     "tagValue",
					Selected: false,
				},
			},
		},
	}

	var tvars chronograf.TemplateVars
	err := json.Unmarshal([]byte(req), &tvars)
	if err != nil {
		t.Fatal("Err unmarshaling:", err)
	}

	if len(tvars) != len(expected) {
		t.Fatal("Expected", len(expected), "vars but found", len(tvars))
	}

	if !reflect.DeepEqual(*(tvars[0].(*chronograf.GroupByVar)), *(expected[0].(*chronograf.GroupByVar))) {
		t.Errorf("UnmarshalJSON() = \n%#v\n want \n%#v\n", *(tvars[0].(*chronograf.GroupByVar)), *(expected[0].(*chronograf.GroupByVar)))
	}

	if !reflect.DeepEqual(tvars[1].(chronograf.BasicTemplateVar), expected[1].(chronograf.BasicTemplateVar)) {
		t.Errorf("UnmarshalJSON() = \n%#v\n want \n%#v\n", tvars[1].(chronograf.BasicTemplateVar), expected[1].(chronograf.BasicTemplateVar))
	}
}
