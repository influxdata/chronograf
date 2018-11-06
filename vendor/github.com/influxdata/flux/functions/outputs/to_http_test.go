package outputs_test

import (
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/functions/inputs"
	"github.com/influxdata/flux/functions/outputs"
	"github.com/influxdata/flux/querytest"
)

func TestToHTTP_NewQuery(t *testing.T) {
	tests := []querytest.NewQueryTestCase{
		{
			Name: "from with database with range",
			Raw:  `from(bucket:"mybucket") |> toHTTP(url: "https://localhost:8081", name:"series1", method:"POST",  timeout: 50s)`,
			Want: &flux.Spec{
				Operations: []*flux.Operation{
					{
						ID: "from0",
						Spec: &inputs.FromOpSpec{
							Bucket: "mybucket",
						},
					},
					{
						ID: "toHTTP1",
						Spec: &outputs.ToHTTPOpSpec{
							URL:          "https://localhost:8081",
							Name:         "series1",
							Method:       "POST",
							Timeout:      50 * time.Second,
							TimeColumn:   execute.DefaultTimeColLabel,
							ValueColumns: []string{execute.DefaultValueColLabel},
							Headers: map[string]string{
								"Content-Type": "application/vnd.influx",
								"User-Agent":   "fluxd/dev",
							},
						},
					},
				},
				Edges: []flux.Edge{
					{Parent: "from0", Child: "toHTTP1"},
				},
			},
		},
	}
	for _, tc := range tests {
		tc := tc
		t.Run(tc.Name, func(t *testing.T) {
			t.Parallel()
			querytest.NewQueryTestHelper(t, tc)
		})
	}
}

func TestToHTTPOpSpec_UnmarshalJSON(t *testing.T) {
	type fields struct {
		URL         string
		Method      string
		Headers     map[string]string
		URLParams   map[string]string
		Timeout     time.Duration
		NoKeepAlive bool
	}
	tests := []struct {
		name    string
		fields  fields
		bytes   []byte
		wantErr bool
	}{
		{
			name: "happy path",
			bytes: []byte(`
			{
				"id": "toHTTP",
				"kind": "toHTTP",
				"spec": {
				  "url": "https://localhost:8081",
				  "method" :"POST"
				}
			}`),
			fields: fields{
				URL:    "https://localhost:8081",
				Method: "POST",
			},
		}, {
			name: "bad address",
			bytes: []byte(`
		{
			"id": "toHTTP",
			"kind": "toHTTP",
			"spec": {
			  "url": "https://loc	alhost:8081",
			  "method" :"POST"
			}
		}`),
			fields: fields{
				URL:    "https://localhost:8081",
				Method: "POST",
			},
			wantErr: true,
		}}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			o := &outputs.ToHTTPOpSpec{
				URL:         tt.fields.URL,
				Method:      tt.fields.Method,
				Headers:     tt.fields.Headers,
				URLParams:   tt.fields.URLParams,
				Timeout:     tt.fields.Timeout,
				NoKeepAlive: tt.fields.NoKeepAlive,
			}
			op := &flux.Operation{
				ID:   "toHTTP",
				Spec: o,
			}
			if !tt.wantErr {
				querytest.OperationMarshalingTestHelper(t, tt.bytes, op)
			} else if err := o.UnmarshalJSON(tt.bytes); err == nil {
				t.Errorf("ToHTTPOpSpec.UnmarshalJSON() error = %v, wantErr %v for test %s", err, tt.wantErr, tt.name)
			}
		})
	}
}

func TestToHTTP_Process(t *testing.T) {
	data := []byte{}
	wg := sync.WaitGroup{}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer wg.Done()
		serverData, err := ioutil.ReadAll(r.Body)
		if err != nil {
			t.Log(err)
			t.FailNow()
		}
		data = append(data, serverData...)
	}))
	type wanted struct {
		Table  []*executetest.Table
		Result []byte
	}
	testCases := []struct {
		name string
		spec *outputs.ToHTTPProcedureSpec
		data []flux.Table
		want wanted
	}{
		{
			name: "coltable with name in _measurement",
			spec: &outputs.ToHTTPProcedureSpec{
				Spec: &outputs.ToHTTPOpSpec{
					URL:          server.URL,
					Method:       "GET",
					Timeout:      50 * time.Second,
					TimeColumn:   execute.DefaultTimeColLabel,
					ValueColumns: []string{"_value"},
					NameColumn:   "_measurement",
				},
			},
			data: []flux.Table{executetest.MustCopyTable(&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_measurement", Type: flux.TString},
					{Label: "_value", Type: flux.TFloat},
					{Label: "fred", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(11), "a", 2.0, "one"},
					{execute.Time(21), "a", 2.0, "one"},
					{execute.Time(21), "b", 1.0, "seven"},
					{execute.Time(31), "a", 3.0, "nine"},
					{execute.Time(41), "c", 4.0, "elevendyone"},
				},
			})},
			want: wanted{
				Table: []*executetest.Table{{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_measurement", Type: flux.TString},
						{Label: "_value", Type: flux.TFloat},
						{Label: "fred", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(11), "a", 2.0, "one"},
						{execute.Time(21), "a", 2.0, "one"},
						{execute.Time(21), "b", 1.0, "seven"},
						{execute.Time(31), "a", 3.0, "nine"},
						{execute.Time(41), "c", 4.0, "elevendyone"},
					},
				}},
				Result: []byte("a _value=2 11\na _value=2 21\nb _value=1 21\na _value=3 31\nc _value=4 41\n")},
		},
		{
			name: "one table with measurement name in _measurement",
			spec: &outputs.ToHTTPProcedureSpec{
				Spec: &outputs.ToHTTPOpSpec{
					URL:          server.URL,
					Method:       "GET",
					Timeout:      50 * time.Second,
					TimeColumn:   execute.DefaultTimeColLabel,
					ValueColumns: []string{"_value"},
					NameColumn:   "_measurement",
				},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_measurement", Type: flux.TString},
					{Label: "_value", Type: flux.TFloat},
					{Label: "fred", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(11), "a", 2.0, "one"},
					{execute.Time(21), "a", 2.0, "one"},
					{execute.Time(21), "b", 1.0, "seven"},
					{execute.Time(31), "a", 3.0, "nine"},
					{execute.Time(41), "c", 4.0, "elevendyone"},
				},
			}},
			want: wanted{
				Table: []*executetest.Table{{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_measurement", Type: flux.TString},
						{Label: "_value", Type: flux.TFloat},
						{Label: "fred", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(11), "a", 2.0, "one"},
						{execute.Time(21), "a", 2.0, "one"},
						{execute.Time(21), "b", 1.0, "seven"},
						{execute.Time(31), "a", 3.0, "nine"},
						{execute.Time(41), "c", 4.0, "elevendyone"},
					},
				}},
				Result: []byte("a _value=2 11\na _value=2 21\nb _value=1 21\na _value=3 31\nc _value=4 41\n")},
		},
		{
			name: "one table with measurement name in _measurement and tag",
			spec: &outputs.ToHTTPProcedureSpec{
				Spec: &outputs.ToHTTPOpSpec{
					URL:          server.URL,
					Method:       "GET",
					Timeout:      50 * time.Second,
					TimeColumn:   execute.DefaultTimeColLabel,
					ValueColumns: []string{"_value"},
					TagColumns:   []string{"fred"},
					NameColumn:   "_measurement",
				},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_measurement", Type: flux.TString},
					{Label: "_value", Type: flux.TFloat},
					{Label: "fred", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(11), "a", 2.0, "one"},
					{execute.Time(21), "a", 2.0, "one"},
					{execute.Time(21), "b", 1.0, "seven"},
					{execute.Time(31), "a", 3.0, "nine"},
					{execute.Time(41), "c", 4.0, "elevendyone"},
				},
			}},
			want: wanted{
				Table: []*executetest.Table{{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_measurement", Type: flux.TString},
						{Label: "_value", Type: flux.TFloat},
						{Label: "fred", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(11), "a", 2.0, "one"},
						{execute.Time(21), "a", 2.0, "one"},
						{execute.Time(21), "b", 1.0, "seven"},
						{execute.Time(31), "a", 3.0, "nine"},
						{execute.Time(41), "c", 4.0, "elevendyone"},
					},
				}},
				Result: []byte("a,fred=one _value=2 11\na,fred=one _value=2 21\nb,fred=seven _value=1 21\na,fred=nine _value=3 31\nc,fred=elevendyone _value=4 41\n")},
		},
		{
			name: "one table",
			spec: &outputs.ToHTTPProcedureSpec{
				Spec: &outputs.ToHTTPOpSpec{
					URL:          server.URL,
					Method:       "POST",
					Timeout:      50 * time.Second,
					TimeColumn:   execute.DefaultTimeColLabel,
					ValueColumns: []string{"_value"},
					Name:         "one_table",
				},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(11), 2.0},
					{execute.Time(21), 1.0},
					{execute.Time(31), 3.0},
					{execute.Time(41), 4.0},
				},
			}},
			want: wanted{
				Table: []*executetest.Table{{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{execute.Time(11), 2.0},
						{execute.Time(21), 1.0},
						{execute.Time(31), 3.0},
						{execute.Time(41), 4.0},
					},
				}},
				Result: []byte("one_table _value=2 11\none_table _value=1 21\none_table _value=3 31\none_table _value=4 41\n"),
			},
		},
		{
			name: "one table with unused tag",
			spec: &outputs.ToHTTPProcedureSpec{
				Spec: &outputs.ToHTTPOpSpec{
					URL:          server.URL,
					Method:       "GET",
					Timeout:      50 * time.Second,
					TimeColumn:   execute.DefaultTimeColLabel,
					ValueColumns: []string{"_value"},
					Name:         "one_table_w_unused_tag",
				},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "fred", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(11), 2.0, "one"},
					{execute.Time(21), 1.0, "seven"},
					{execute.Time(31), 3.0, "nine"},
					{execute.Time(41), 4.0, "elevendyone"},
				},
			}},
			want: wanted{
				Table: []*executetest.Table{{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "fred", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(11), 2.0, "one"},
						{execute.Time(21), 1.0, "seven"},
						{execute.Time(31), 3.0, "nine"},
						{execute.Time(41), 4.0, "elevendyone"},
					},
				}},
				Result: []byte(`one_table_w_unused_tag _value=2 11
one_table_w_unused_tag _value=1 21
one_table_w_unused_tag _value=3 31
one_table_w_unused_tag _value=4 41
`),
			},
		},
		{
			name: "one table with tag",
			spec: &outputs.ToHTTPProcedureSpec{
				Spec: &outputs.ToHTTPOpSpec{
					URL:          server.URL,
					Method:       "GET",
					Timeout:      50 * time.Second,
					TimeColumn:   execute.DefaultTimeColLabel,
					ValueColumns: []string{"_value"},
					TagColumns:   []string{"fred"},
					Name:         "one_table_w_tag",
				},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "fred", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(11), 2.0, "one"},
					{execute.Time(21), 1.0, "seven"},
					{execute.Time(31), 3.0, "nine"},
					{execute.Time(41), 4.0, "elevendyone"},
				},
			}},
			want: wanted{
				Table: []*executetest.Table{{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "fred", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(11), 2.0, "one"},
						{execute.Time(21), 1.0, "seven"},
						{execute.Time(31), 3.0, "nine"},
						{execute.Time(41), 4.0, "elevendyone"},
					},
				}},
				Result: []byte(`one_table_w_tag,fred=one _value=2 11
one_table_w_tag,fred=seven _value=1 21
one_table_w_tag,fred=nine _value=3 31
one_table_w_tag,fred=elevendyone _value=4 41
`),
			},
		},
		{
			name: "multi table",
			spec: &outputs.ToHTTPProcedureSpec{
				Spec: &outputs.ToHTTPOpSpec{
					URL:          server.URL,
					Method:       "GET",
					Timeout:      50 * time.Second,
					TimeColumn:   execute.DefaultTimeColLabel,
					ValueColumns: []string{"_value"},
					TagColumns:   []string{"fred"},
					Name:         "multi_table",
				},
			},
			data: []flux.Table{
				&executetest.Table{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "fred", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(11), 2.0, "one"},
						{execute.Time(21), 1.0, "seven"},
						{execute.Time(31), 3.0, "nine"},
					},
				},
				&executetest.Table{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "fred", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(51), 2.0, "one"},
						{execute.Time(61), 1.0, "seven"},
						{execute.Time(71), 3.0, "nine"},
					},
				},
			},
			want: wanted{
				Table: []*executetest.Table{
					&executetest.Table{
						ColMeta: []flux.ColMeta{
							{Label: "_time", Type: flux.TTime},
							{Label: "_value", Type: flux.TFloat},
							{Label: "fred", Type: flux.TString},
						},
						Data: [][]interface{}{
							{execute.Time(11), 2.0, "one"},
							{execute.Time(21), 1.0, "seven"},
							{execute.Time(31), 3.0, "nine"},
							{execute.Time(51), 2.0, "one"},
							{execute.Time(61), 1.0, "seven"},
							{execute.Time(71), 3.0, "nine"},
						},
					},
				},
				Result: []byte("multi_table,fred=one _value=2 11\nmulti_table,fred=seven _value=1 21\nmulti_table,fred=nine _value=3 31\n" +
					"multi_table,fred=one _value=2 51\nmulti_table,fred=seven _value=1 61\nmulti_table,fred=nine _value=3 71\n"),
			},
		},
		{
			name: "multi collist tables",
			spec: &outputs.ToHTTPProcedureSpec{
				Spec: &outputs.ToHTTPOpSpec{
					URL:          server.URL,
					Method:       "GET",
					Timeout:      50 * time.Second,
					TimeColumn:   execute.DefaultTimeColLabel,
					ValueColumns: []string{"_value"},
					TagColumns:   []string{"fred"},
					Name:         "multi_collist_tables",
				},
			},
			data: []flux.Table{
				executetest.MustCopyTable(
					&executetest.Table{
						ColMeta: []flux.ColMeta{
							{Label: "_time", Type: flux.TTime},
							{Label: "_value", Type: flux.TFloat},
							{Label: "fred", Type: flux.TString},
						},
						Data: [][]interface{}{
							{execute.Time(11), 2.0, "one"},
							{execute.Time(21), 1.0, "seven"},
							{execute.Time(31), 3.0, "nine"},
						},
					}),
				&executetest.Table{
					ColMeta: []flux.ColMeta{
						{Label: "_time", Type: flux.TTime},
						{Label: "_value", Type: flux.TFloat},
						{Label: "fred", Type: flux.TString},
					},
					Data: [][]interface{}{
						{execute.Time(51), 2.0, "one"},
						{execute.Time(61), 1.0, "seven"},
						{execute.Time(71), 3.0, "nine"},
					},
				},
			},
			want: wanted{
				Table: []*executetest.Table{
					&executetest.Table{
						ColMeta: []flux.ColMeta{
							{Label: "_time", Type: flux.TTime},
							{Label: "_value", Type: flux.TFloat},
							{Label: "fred", Type: flux.TString},
						},
						Data: [][]interface{}{
							{execute.Time(11), 2.0, "one"},
							{execute.Time(21), 1.0, "seven"},
							{execute.Time(31), 3.0, "nine"},
							{execute.Time(51), 2.0, "one"},
							{execute.Time(61), 1.0, "seven"},
							{execute.Time(71), 3.0, "nine"},
						},
					},
				},
				Result: []byte("multi_collist_tables,fred=one _value=2 11\nmulti_collist_tables,fred=seven _value=1 21\nmulti_collist_tables,fred=nine _value=3 31\n" +
					"multi_collist_tables,fred=one _value=2 51\nmulti_collist_tables,fred=seven _value=1 61\nmulti_collist_tables,fred=nine _value=3 71\n"),
			},
		},
	}

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			wg.Add(len(tc.data))

			executetest.ProcessTestHelper(
				t,
				tc.data,
				tc.want.Table,
				nil,
				func(d execute.Dataset, c execute.TableBuilderCache) execute.Transformation {
					return outputs.NewToHTTPTransformation(d, c, tc.spec)
				},
			)
			wg.Wait() // wait till we are done getting the data back
			if string(data) != string(tc.want.Result) {
				t.Logf("expected %s, got %s", tc.want.Result, data)
				t.Fail()
			}
			data = data[:0]
		})
	}
}
