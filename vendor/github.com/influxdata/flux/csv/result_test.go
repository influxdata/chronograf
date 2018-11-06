package csv_test

import (
	"bytes"
	"io/ioutil"
	"regexp"
	"testing"
	"time"

	"github.com/andreyvit/diff"
	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/flux"
	"github.com/influxdata/flux/csv"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/values"
	"github.com/pkg/errors"
)

type TestCase struct {
	name          string
	skip          bool
	encoded       []byte
	result        *executetest.Result
	decoderConfig csv.ResultDecoderConfig
	encoderConfig csv.ResultEncoderConfig
}

var symetricalTestCases = []TestCase{
	{
		name:          "single table",
		encoderConfig: csv.DefaultEncoderConfig(),
		encoded: toCRLF(`#datatype,string,long,dateTime:RFC3339,dateTime:RFC3339,dateTime:RFC3339,string,string,double
#group,false,false,true,true,false,true,true,false
#default,_result,,,,,,,
,result,table,_start,_stop,_time,_measurement,host,_value
,,0,2018-04-17T00:00:00Z,2018-04-17T00:05:00Z,2018-04-17T00:00:00Z,cpu,A,42
,,0,2018-04-17T00:00:00Z,2018-04-17T00:05:00Z,2018-04-17T00:00:01Z,cpu,A,43
`),
		result: &executetest.Result{
			Nm: "_result",
			Tbls: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop", "_measurement", "host"},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_time", Type: flux.TTime},
					{Label: "_measurement", Type: flux.TString},
					{Label: "host", Type: flux.TString},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{
						values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
						values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
						values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
						"cpu",
						"A",
						42.0,
					},
					{
						values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
						values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
						values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 1, 0, time.UTC)),
						"cpu",
						"A",
						43.0,
					},
				},
			}},
		},
	},
	{
		name:          "single empty table",
		encoderConfig: csv.DefaultEncoderConfig(),
		encoded: toCRLF(`#datatype,string,long,dateTime:RFC3339,dateTime:RFC3339,dateTime:RFC3339,string,string,double
#group,false,false,true,true,false,true,true,false
#default,_result,0,2018-04-17T00:00:00Z,2018-04-17T00:05:00Z,,cpu,A,
,result,table,_start,_stop,_time,_measurement,host,_value
`),
		result: &executetest.Result{
			Nm: "_result",
			Tbls: []*executetest.Table{{
				KeyCols: []string{"_start", "_stop", "_measurement", "host"},
				KeyValues: []interface{}{
					values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
					values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
					"cpu",
					"A",
				},
				ColMeta: []flux.ColMeta{
					{Label: "_start", Type: flux.TTime},
					{Label: "_stop", Type: flux.TTime},
					{Label: "_time", Type: flux.TTime},
					{Label: "_measurement", Type: flux.TString},
					{Label: "host", Type: flux.TString},
					{Label: "_value", Type: flux.TFloat},
				},
			}},
		},
	},
	{
		name:          "multiple tables",
		encoderConfig: csv.DefaultEncoderConfig(),
		encoded: toCRLF(`#datatype,string,long,dateTime:RFC3339,dateTime:RFC3339,dateTime:RFC3339,string,string,double
#group,false,false,true,true,false,true,true,false
#default,_result,,,,,,,
,result,table,_start,_stop,_time,_measurement,host,_value
,,0,2018-04-17T00:00:00Z,2018-04-17T00:05:00Z,2018-04-17T00:00:00Z,cpu,A,42
,,0,2018-04-17T00:00:00Z,2018-04-17T00:05:00Z,2018-04-17T00:00:01Z,cpu,A,43
,,1,2018-04-17T00:05:00Z,2018-04-17T00:10:00Z,2018-04-17T00:06:00Z,mem,A,52
,,1,2018-04-17T00:05:00Z,2018-04-17T00:10:00Z,2018-04-17T00:07:01Z,mem,A,53
`),
		result: &executetest.Result{
			Nm: "_result",
			Tbls: []*executetest.Table{
				{
					KeyCols: []string{"_start", "_stop", "_measurement", "host"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "_time", Type: flux.TTime},
						{Label: "_measurement", Type: flux.TString},
						{Label: "host", Type: flux.TString},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
							"cpu",
							"A",
							42.0,
						},
						{
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 1, 0, time.UTC)),
							"cpu",
							"A",
							43.0,
						},
					},
				},
				{
					KeyCols: []string{"_start", "_stop", "_measurement", "host"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "_time", Type: flux.TTime},
						{Label: "_measurement", Type: flux.TString},
						{Label: "host", Type: flux.TString},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{
							values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 10, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 6, 0, 0, time.UTC)),
							"mem",
							"A",
							52.0,
						},
						{
							values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 10, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 7, 1, 0, time.UTC)),
							"mem",
							"A",
							53.0,
						},
					},
				},
			},
		},
	},
	{
		name:          "multiple tables with differing schemas",
		encoderConfig: csv.DefaultEncoderConfig(),
		encoded: toCRLF(`#datatype,string,long,dateTime:RFC3339,dateTime:RFC3339,dateTime:RFC3339,string,string,double
#group,false,false,true,true,false,true,true,false
#default,_result,,,,,,,
,result,table,_start,_stop,_time,_measurement,host,_value
,,0,2018-04-17T00:00:00Z,2018-04-17T00:05:00Z,2018-04-17T00:00:00Z,cpu,A,42
,,0,2018-04-17T00:00:00Z,2018-04-17T00:05:00Z,2018-04-17T00:00:01Z,cpu,A,43
,,1,2018-04-17T00:05:00Z,2018-04-17T00:10:00Z,2018-04-17T00:06:00Z,mem,A,52
,,1,2018-04-17T00:05:00Z,2018-04-17T00:10:00Z,2018-04-17T00:07:01Z,mem,A,53

#datatype,string,long,dateTime:RFC3339,dateTime:RFC3339,dateTime:RFC3339,string,string,double,double
#group,false,false,true,true,false,true,false,false,false
#default,_result,,,,,,,,
,result,table,_start,_stop,_time,location,device,min,max
,,2,2018-04-17T00:00:00Z,2018-04-17T00:05:00Z,2018-04-17T00:00:00Z,USA,1563,42,67.9
,,2,2018-04-17T00:00:00Z,2018-04-17T00:05:00Z,2018-04-17T00:00:01Z,USA,1414,43,44.7
,,3,2018-04-17T00:05:00Z,2018-04-17T00:10:00Z,2018-04-17T00:06:00Z,Europe,4623,52,89.3
,,3,2018-04-17T00:05:00Z,2018-04-17T00:10:00Z,2018-04-17T00:07:01Z,Europe,3163,53,55.6
`),
		result: &executetest.Result{
			Nm: "_result",
			Tbls: []*executetest.Table{
				{
					KeyCols: []string{"_start", "_stop", "_measurement", "host"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "_time", Type: flux.TTime},
						{Label: "_measurement", Type: flux.TString},
						{Label: "host", Type: flux.TString},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
							"cpu",
							"A",
							42.0,
						},
						{
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 1, 0, time.UTC)),
							"cpu",
							"A",
							43.0,
						},
					},
				},
				{
					KeyCols: []string{"_start", "_stop", "_measurement", "host"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "_time", Type: flux.TTime},
						{Label: "_measurement", Type: flux.TString},
						{Label: "host", Type: flux.TString},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{
							values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 10, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 6, 0, 0, time.UTC)),
							"mem",
							"A",
							52.0,
						},
						{
							values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 10, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 7, 1, 0, time.UTC)),
							"mem",
							"A",
							53.0,
						},
					},
				},
				{
					KeyCols: []string{"_start", "_stop", "location"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "_time", Type: flux.TTime},
						{Label: "location", Type: flux.TString},
						{Label: "device", Type: flux.TString},
						{Label: "min", Type: flux.TFloat},
						{Label: "max", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
							"USA",
							"1563",
							42.0,
							67.9,
						},
						{
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 1, 0, time.UTC)),
							"USA",
							"1414",
							43.0,
							44.7,
						},
					},
				},
				{
					KeyCols: []string{"_start", "_stop", "location"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "_time", Type: flux.TTime},
						{Label: "location", Type: flux.TString},
						{Label: "device", Type: flux.TString},
						{Label: "min", Type: flux.TFloat},
						{Label: "max", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{
							values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 10, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 6, 0, 0, time.UTC)),
							"Europe",
							"4623",
							52.0,
							89.3,
						},
						{
							values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 10, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 7, 1, 0, time.UTC)),
							"Europe",
							"3163",
							53.0,
							55.6,
						},
					},
				},
			},
		},
	},
	{
		name:          "multiple tables with one empty",
		encoderConfig: csv.DefaultEncoderConfig(),
		encoded: toCRLF(`#datatype,string,long,dateTime:RFC3339,dateTime:RFC3339,dateTime:RFC3339,string,string,double
#group,false,false,true,true,false,true,true,false
#default,_result,,,,,,,
,result,table,_start,_stop,_time,_measurement,host,_value
,,0,2018-04-17T00:00:00Z,2018-04-17T00:05:00Z,2018-04-17T00:00:00Z,cpu,A,42
,,0,2018-04-17T00:00:00Z,2018-04-17T00:05:00Z,2018-04-17T00:00:01Z,cpu,A,43
,,1,2018-04-17T00:05:00Z,2018-04-17T00:10:00Z,2018-04-17T00:06:00Z,mem,A,52
,,1,2018-04-17T00:05:00Z,2018-04-17T00:10:00Z,2018-04-17T00:07:01Z,mem,A,53

#datatype,string,long,dateTime:RFC3339,dateTime:RFC3339,dateTime:RFC3339,string,string,double
#group,false,false,true,true,false,true,true,false
#default,_result,2,2018-04-17T00:00:00Z,2018-04-17T00:05:00Z,,cpu,A,
,result,table,_start,_stop,_time,_measurement,host,_value
`),
		result: &executetest.Result{
			Nm: "_result",
			Tbls: []*executetest.Table{
				{
					KeyCols: []string{"_start", "_stop", "_measurement", "host"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "_time", Type: flux.TTime},
						{Label: "_measurement", Type: flux.TString},
						{Label: "host", Type: flux.TString},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
							"cpu",
							"A",
							42.0,
						},
						{
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 1, 0, time.UTC)),
							"cpu",
							"A",
							43.0,
						},
					},
				},
				{
					KeyCols: []string{"_start", "_stop", "_measurement", "host"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "_time", Type: flux.TTime},
						{Label: "_measurement", Type: flux.TString},
						{Label: "host", Type: flux.TString},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{
							values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 10, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 6, 0, 0, time.UTC)),
							"mem",
							"A",
							52.0,
						},
						{
							values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 10, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 7, 1, 0, time.UTC)),
							"mem",
							"A",
							53.0,
						},
					},
				},
				{
					KeyCols: []string{"_start", "_stop", "_measurement", "host"},
					KeyValues: []interface{}{
						values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
						values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
						"cpu",
						"A",
					},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "_time", Type: flux.TTime},
						{Label: "_measurement", Type: flux.TString},
						{Label: "host", Type: flux.TString},
						{Label: "_value", Type: flux.TFloat},
					},
				},
			},
		},
	},
}

func TestResultDecoder(t *testing.T) {
	testCases := []TestCase{
		{
			name:          "single table with defaults",
			encoderConfig: csv.DefaultEncoderConfig(),
			encoded: toCRLF(`#datatype,string,long,dateTime:RFC3339,dateTime:RFC3339,dateTime:RFC3339,string,string,double
#group,false,false,true,true,false,true,true,false
#default,_result,0,2018-04-17T00:00:00Z,2018-04-17T00:05:00Z,,cpu,A,
,result,table,_start,_stop,_time,_measurement,host,_value
,,,,,2018-04-17T00:00:00Z,cpu,A,42.0
,,,,,2018-04-17T00:00:01Z,cpu,A,43.0
`),
			result: &executetest.Result{
				Nm: "_result",
				Tbls: []*executetest.Table{{
					KeyCols: []string{"_start", "_stop", "_measurement", "host"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "_time", Type: flux.TTime},
						{Label: "_measurement", Type: flux.TString},
						{Label: "host", Type: flux.TString},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
							"cpu",
							"A",
							42.0,
						},
						{
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 1, 0, time.UTC)),
							"cpu",
							"A",
							43.0,
						},
					},
				}},
			},
		},
		{
			name:          "simple error message",
			encoderConfig: csv.DefaultEncoderConfig(),
			encoded: toCRLF(`#datatype,string,string
#group,true,true
#default,,
,error,reference
,failed to create physical plan: query must specify explicit yields when there is more than one result.,
`),
			result: &executetest.Result{
				Err: errors.New("failed to create physical plan: query must specify explicit yields when there is more than one result."),
			},
		},
	}
	testCases = append(testCases, symetricalTestCases...)
	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			if tc.skip {
				t.Skip()
			}
			decoder := csv.NewResultDecoder(tc.decoderConfig)
			result, err := decoder.Decode(bytes.NewReader(tc.encoded))
			if err != nil {
				if tc.result.Err != nil {
					if got, want := tc.result.Err.Error(), err.Error(); got != want {
						t.Error("unexpected error -want/+got", cmp.Diff(want, got))
					}
					return
				}
				t.Fatal(err)
			}
			got := &executetest.Result{
				Nm: result.Name(),
			}
			if err := result.Tables().Do(func(tbl flux.Table) error {
				cb, err := executetest.ConvertTable(tbl)
				if err != nil {
					return err
				}
				got.Tbls = append(got.Tbls, cb)
				return nil
			}); err != nil {
				t.Fatal(err)
			}

			got.Normalize()
			tc.result.Normalize()

			if !cmp.Equal(got, tc.result) {
				t.Error("unexpected results -want/+got", cmp.Diff(tc.result, got))
			}
		})
	}
}

func TestResultEncoder(t *testing.T) {
	testCases := []TestCase{
		// Add tests cases specific to encoding here
	}
	testCases = append(testCases, symetricalTestCases...)
	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			if tc.skip {
				t.Skip()
			}
			encoder := csv.NewResultEncoder(tc.encoderConfig)
			var got bytes.Buffer
			n, err := encoder.Encode(&got, tc.result)
			if err != nil {
				t.Fatal(err)
			}

			if g, w := got.String(), string(tc.encoded); g != w {
				t.Errorf("unexpected encoding -want/+got:\n%s", diff.LineDiff(w, g))
			}
			if g, w := n, int64(len(tc.encoded)); g != w {
				t.Errorf("unexpected encoding count -want/+got:\n%s", cmp.Diff(w, g))
			}
		})
	}
}

func TestMultiResultEncoder(t *testing.T) {
	testCases := []struct {
		name    string
		results flux.ResultIterator
		encoded []byte
		err     error
		config  csv.ResultEncoderConfig
	}{
		{
			name:   "single result",
			config: csv.DefaultEncoderConfig(),
			results: flux.NewSliceResultIterator([]flux.Result{&executetest.Result{
				Nm: "_result",
				Tbls: []*executetest.Table{{
					KeyCols: []string{"_start", "_stop", "_measurement", "host"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "_time", Type: flux.TTime},
						{Label: "_measurement", Type: flux.TString},
						{Label: "host", Type: flux.TString},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
							"cpu",
							"A",
							42.0,
						},
						{
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 1, 0, time.UTC)),
							"cpu",
							"A",
							43.0,
						},
					},
				}},
			}}),
			encoded: toCRLF(`#datatype,string,long,dateTime:RFC3339,dateTime:RFC3339,dateTime:RFC3339,string,string,double
#group,false,false,true,true,false,true,true,false
#default,_result,,,,,,,
,result,table,_start,_stop,_time,_measurement,host,_value
,,0,2018-04-17T00:00:00Z,2018-04-17T00:05:00Z,2018-04-17T00:00:00Z,cpu,A,42
,,0,2018-04-17T00:00:00Z,2018-04-17T00:05:00Z,2018-04-17T00:00:01Z,cpu,A,43

`),
		},
		{
			name:   "two results",
			config: csv.DefaultEncoderConfig(),
			results: flux.NewSliceResultIterator([]flux.Result{
				&executetest.Result{
					Nm: "_result",
					Tbls: []*executetest.Table{{
						KeyCols: []string{"_start", "_stop", "_measurement", "host"},
						ColMeta: []flux.ColMeta{
							{Label: "_start", Type: flux.TTime},
							{Label: "_stop", Type: flux.TTime},
							{Label: "_time", Type: flux.TTime},
							{Label: "_measurement", Type: flux.TString},
							{Label: "host", Type: flux.TString},
							{Label: "_value", Type: flux.TFloat},
						},
						Data: [][]interface{}{
							{
								values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
								values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
								values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
								"cpu",
								"A",
								42.0,
							},
							{
								values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
								values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
								values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 1, 0, time.UTC)),
								"cpu",
								"A",
								43.0,
							},
						},
					}},
				},
				&executetest.Result{
					Nm: "mean",
					Tbls: []*executetest.Table{{
						KeyCols: []string{"_start", "_stop", "_measurement", "host"},
						ColMeta: []flux.ColMeta{
							{Label: "_start", Type: flux.TTime},
							{Label: "_stop", Type: flux.TTime},
							{Label: "_time", Type: flux.TTime},
							{Label: "_measurement", Type: flux.TString},
							{Label: "host", Type: flux.TString},
							{Label: "_value", Type: flux.TFloat},
						},
						Data: [][]interface{}{
							{
								values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
								values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
								values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
								"cpu",
								"A",
								40.0,
							},
							{
								values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
								values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
								values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 1, 0, time.UTC)),
								"cpu",
								"A",
								40.1,
							},
						},
					}},
				},
			}),
			encoded: toCRLF(`#datatype,string,long,dateTime:RFC3339,dateTime:RFC3339,dateTime:RFC3339,string,string,double
#group,false,false,true,true,false,true,true,false
#default,_result,,,,,,,
,result,table,_start,_stop,_time,_measurement,host,_value
,,0,2018-04-17T00:00:00Z,2018-04-17T00:05:00Z,2018-04-17T00:00:00Z,cpu,A,42
,,0,2018-04-17T00:00:00Z,2018-04-17T00:05:00Z,2018-04-17T00:00:01Z,cpu,A,43

#datatype,string,long,dateTime:RFC3339,dateTime:RFC3339,dateTime:RFC3339,string,string,double
#group,false,false,true,true,false,true,true,false
#default,mean,,,,,,,
,result,table,_start,_stop,_time,_measurement,host,_value
,,0,2018-04-17T00:00:00Z,2018-04-17T00:05:00Z,2018-04-17T00:00:00Z,cpu,A,40
,,0,2018-04-17T00:00:00Z,2018-04-17T00:05:00Z,2018-04-17T00:00:01Z,cpu,A,40.1

`),
		},
		{
			name:   "error results",
			config: csv.DefaultEncoderConfig(),
			results: errorResultIterator{
				Error: errors.New("test error"),
			},
			encoded: toCRLF(`#datatype,string,string
#group,true,true
#default,,
,error,reference
,test error,
`),
		},
		{
			name:   "returns query errors",
			config: csv.DefaultEncoderConfig(),
			results: flux.NewSliceResultIterator([]flux.Result{
				&executetest.Result{
					Err: errors.New("execution error"),
				},
			}),
			encoded: toCRLF(`#datatype,string,string
#group,true,true
#default,,
,error,reference
,execution error,
`),
		},
		{
			name:   "returns encoding errors",
			config: csv.DefaultEncoderConfig(),
			results: flux.NewSliceResultIterator([]flux.Result{&executetest.Result{
				Nm: "mean",
				Tbls: []*executetest.Table{{
					KeyCols: []string{"_start", "_stop", "_measurement", "host"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "_time", Type: flux.TTime},
						{Label: "_measurement", Type: flux.TString},
						{Label: "host", Type: flux.TString},
						// Deliberately use invalid column type
						{Label: "_value", Type: flux.TInvalid},
					},
					Data: [][]interface{}{
						{
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
							"cpu",
							"A",
							40.0,
						},
					},
				}},
			}}),
			encoded: nil,
			err:     errors.New("csv encoder error: unknown column type invalid"),
		},
	}
	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			encoder := csv.NewMultiResultEncoder(tc.config)
			var got bytes.Buffer
			n, err := encoder.Encode(&got, tc.results)
			if err != nil && tc.err != nil {
				if err.Error() != tc.err.Error() {
					t.Errorf("unexpected error want: %s\n got: %s\n", tc.err.Error(), err.Error())
				}
			} else if err != nil {
				t.Errorf("unexpected error want: none\n got: %s\n", err.Error())
			} else if tc.err != nil {
				t.Errorf("unexpected error want: %s\n got: none", tc.err.Error())
			}

			if g, w := got.String(), string(tc.encoded); g != w {
				t.Errorf("unexpected encoding -want/+got:\n%s", diff.LineDiff(w, g))
			}
			if g, w := n, int64(len(tc.encoded)); g != w {
				t.Errorf("unexpected encoding count -want/+got:\n%s", cmp.Diff(w, g))
			}
		})
	}
}

func TestMultiResultDecoder(t *testing.T) {
	testCases := []struct {
		name    string
		config  csv.ResultDecoderConfig
		encoded []byte
		results []*executetest.Result
		err     error
	}{
		{
			name: "single result",
			encoded: toCRLF(`#datatype,string,long,dateTime:RFC3339,dateTime:RFC3339,dateTime:RFC3339,string,string,double
#group,false,false,true,true,false,true,true,false
#default,_result,0,2018-04-17T00:00:00Z,2018-04-17T00:05:00Z,,cpu,A,
,result,table,_start,_stop,_time,_measurement,host,_value
,,,,,2018-04-17T00:00:00Z,cpu,A,42.0
,,,,,2018-04-17T00:00:01Z,cpu,A,43.0

`),
			results: []*executetest.Result{{
				Nm: "_result",
				Tbls: []*executetest.Table{{
					KeyCols: []string{"_start", "_stop", "_measurement", "host"},
					ColMeta: []flux.ColMeta{
						{Label: "_start", Type: flux.TTime},
						{Label: "_stop", Type: flux.TTime},
						{Label: "_time", Type: flux.TTime},
						{Label: "_measurement", Type: flux.TString},
						{Label: "host", Type: flux.TString},
						{Label: "_value", Type: flux.TFloat},
					},
					Data: [][]interface{}{
						{
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
							"cpu",
							"A",
							42.0,
						},
						{
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
							values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 1, 0, time.UTC)),
							"cpu",
							"A",
							43.0,
						},
					},
				}},
			}},
		},
		{
			name: "two results",
			encoded: toCRLF(`#datatype,string,long,dateTime:RFC3339,dateTime:RFC3339,dateTime:RFC3339,string,string,double
#group,false,false,true,true,false,true,true,false
#default,_result,,,,,,,
,result,table,_start,_stop,_time,_measurement,host,_value
,,0,2018-04-17T00:00:00Z,2018-04-17T00:05:00Z,2018-04-17T00:00:00Z,cpu,A,42
,,0,2018-04-17T00:00:00Z,2018-04-17T00:05:00Z,2018-04-17T00:00:01Z,cpu,A,43

#datatype,string,long,dateTime:RFC3339,dateTime:RFC3339,dateTime:RFC3339,string,string,double
#group,false,false,true,true,false,true,true,false
#default,mean,,,,,,,
,result,table,_start,_stop,_time,_measurement,host,_value
,,0,2018-04-17T00:00:00Z,2018-04-17T00:05:00Z,2018-04-17T00:00:00Z,cpu,A,40
,,0,2018-04-17T00:00:00Z,2018-04-17T00:05:00Z,2018-04-17T00:00:01Z,cpu,A,40.1

`),
			results: []*executetest.Result{
				{
					Nm: "_result",
					Tbls: []*executetest.Table{{
						KeyCols: []string{"_start", "_stop", "_measurement", "host"},
						ColMeta: []flux.ColMeta{
							{Label: "_start", Type: flux.TTime},
							{Label: "_stop", Type: flux.TTime},
							{Label: "_time", Type: flux.TTime},
							{Label: "_measurement", Type: flux.TString},
							{Label: "host", Type: flux.TString},
							{Label: "_value", Type: flux.TFloat},
						},
						Data: [][]interface{}{
							{
								values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
								values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
								values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
								"cpu",
								"A",
								42.0,
							},
							{
								values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
								values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
								values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 1, 0, time.UTC)),
								"cpu",
								"A",
								43.0,
							},
						},
					}},
				},
				{
					Nm: "mean",
					Tbls: []*executetest.Table{{
						KeyCols: []string{"_start", "_stop", "_measurement", "host"},
						ColMeta: []flux.ColMeta{
							{Label: "_start", Type: flux.TTime},
							{Label: "_stop", Type: flux.TTime},
							{Label: "_time", Type: flux.TTime},
							{Label: "_measurement", Type: flux.TString},
							{Label: "host", Type: flux.TString},
							{Label: "_value", Type: flux.TFloat},
						},
						Data: [][]interface{}{
							{
								values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
								values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
								values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
								"cpu",
								"A",
								40.0,
							},
							{
								values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 0, 0, time.UTC)),
								values.ConvertTime(time.Date(2018, 4, 17, 0, 5, 0, 0, time.UTC)),
								values.ConvertTime(time.Date(2018, 4, 17, 0, 0, 1, 0, time.UTC)),
								"cpu",
								"A",
								40.1,
							},
						},
					}},
				},
			},
		},
		{
			name: "decodes errors",
			encoded: toCRLF(`#datatype,string,string
#group,true,true
#default,,
,error,reference
,test error,
`),
			err: errors.New("test error"),
		},
	}
	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			decoder := csv.NewMultiResultDecoder(tc.config)
			results, err := decoder.Decode(ioutil.NopCloser(bytes.NewReader(tc.encoded)))
			if err != nil {
				t.Fatal(err)
			}

			var got []*executetest.Result
			for results.More() {
				result := results.Next()
				res := &executetest.Result{
					Nm: result.Name(),
				}
				if err := result.Tables().Do(func(tbl flux.Table) error {
					cb, err := executetest.ConvertTable(tbl)
					if err != nil {
						return err
					}
					res.Tbls = append(res.Tbls, cb)
					return nil
				}); err != nil {
					t.Fatal(err)
				}
				res.Normalize()
				got = append(got, res)
			}

			if err := results.Err(); err != nil {
				if tc.err == nil {
					t.Errorf("unexpected error: %s", tc.err)
				} else if got, want := err.Error(), tc.err.Error(); got != want {
					t.Error("unexpected error -want/+got", cmp.Diff(want, got))
				}
			} else if tc.err != nil {
				t.Error("expected error")
			}

			// Normalize all of the tables for the test case.
			for _, result := range tc.results {
				result.Normalize()
			}

			if !cmp.Equal(got, tc.results) {
				t.Error("unexpected results -want/+got", cmp.Diff(tc.results, got))
			}
		})
	}
}

var crlfPattern = regexp.MustCompile(`\r?\n`)

func toCRLF(data string) []byte {
	return []byte(crlfPattern.ReplaceAllString(data, "\r\n"))
}

type errorResultIterator struct {
	Error error
}

func (r errorResultIterator) More() bool {
	return false
}

func (r errorResultIterator) Next() flux.Result {
	panic("no results")
}

func (r errorResultIterator) Cancel() {
}

func (r errorResultIterator) Err() error {
	return r.Error
}
