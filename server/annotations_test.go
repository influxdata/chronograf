package server

import (
	"bytes"
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/bouk/httprouter"
	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/mocks"
)

var mockStore = &mocks.Store{
	SourcesStore: &mocks.SourcesStore{
		GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
			return chronograf.Source{
				ID: ID,
			}, nil
		},
	},
}

func TestService_Annotations(t *testing.T) {
	type fields struct {
		Store            DataStore
		TimeSeriesClient TimeSeriesClient
	}

	tests := []struct {
		name   string
		fields fields
		w      *httptest.ResponseRecorder
		r      *http.Request
		ID     string
		want   string
	}{
		{
			name: "error no id",
			w:    httptest.NewRecorder(),
			r:    httptest.NewRequest("GET", "/chronograf/v1/sources/1/annotations", bytes.NewReader([]byte(`howdy`))),
			want: `{"code":422,"message":"Error converting ID "}`,
		},
		{
			name: "no since parameter",
			ID:   "1",
			w:    httptest.NewRecorder(),
			r:    httptest.NewRequest("GET", "/chronograf/v1/sources/1/annotations", bytes.NewReader([]byte(`howdy`))),
			want: `{"code":422,"message":"since parameter is required"}`,
		},
		{
			name: "invalid since parameter",
			ID:   "1",
			w:    httptest.NewRecorder(),
			r:    httptest.NewRequest("GET", "/chronograf/v1/sources/1/annotations?since=howdy", bytes.NewReader([]byte(`howdy`))),
			want: `{"code":422,"message":"parsing time \"howdy\" as \"2006-01-02T15:04:05.999Z07:00\": cannot parse \"howdy\" as \"2006\""}`,
		},
		{
			name: "invalid tag parameter",
			ID:   "1",
			w:    httptest.NewRecorder(),
			r:    httptest.NewRequest("GET", "/chronograf/v1/sources/1/annotations?since=2018-08-04T00:00:00.000Z&tag=nonsense", bytes.NewReader([]byte(`howdy`))),
			want: `{"code":422,"message":"Invalid tag query param"}`,
		},
		{
			name: "error is returned when get is an error",
			fields: fields{
				Store: &mocks.Store{
					SourcesStore: &mocks.SourcesStore{
						GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
							return chronograf.Source{}, fmt.Errorf("error")
						},
					},
				},
			},
			ID:   "1",
			w:    httptest.NewRecorder(),
			r:    httptest.NewRequest("GET", "/chronograf/v1/sources/1/annotations?since=1985-04-12T23:20:50.52Z", bytes.NewReader([]byte(`howdy`))),
			want: `{"code":404,"message":"ID 1 not found"}`,
		},
		{
			name: "error is returned connect is an error",
			fields: fields{
				Store: mockStore,
				TimeSeriesClient: &mocks.TimeSeries{
					ConnectF: func(context.Context, *chronograf.Source) error {
						return fmt.Errorf("error)")
					},
				},
			},
			ID:   "1",
			w:    httptest.NewRecorder(),
			r:    httptest.NewRequest("GET", "/chronograf/v1/sources/1/annotations?since=1985-04-12T23:20:50.52Z", bytes.NewReader([]byte(`howdy`))),
			want: `{"code":400,"message":"Unable to connect to source 1: error)"}`,
		},
		{
			name: "error returned when annotations are invalid",
			fields: fields{
				Store: mockStore,
				TimeSeriesClient: &mocks.TimeSeries{
					ConnectF: func(context.Context, *chronograf.Source) error {
						return nil
					},
					QueryF: func(context.Context, chronograf.Query) (chronograf.Response, error) {
						return mocks.NewResponse(`{[]}`, nil), nil
					},
				},
			},
			ID:   "1",
			w:    httptest.NewRecorder(),
			r:    httptest.NewRequest("GET", "/chronograf/v1/sources/1/annotations?since=1985-04-12T23:20:50.52Z", bytes.NewReader([]byte(`howdy`))),
			want: `{"code":500,"message":"Unknown error: Error loading annotations: invalid character '[' looking for beginning of object key string"}`,
		},
		{
			name: "returns annotations in store",
			fields: fields{
				Store: mockStore,
				TimeSeriesClient: &mocks.TimeSeries{
					ConnectF: func(context.Context, *chronograf.Source) error {
						return nil
					},
					QueryF: func(context.Context, chronograf.Query) (chronograf.Response, error) {
						return mocks.NewResponse(`[
							{
								"series": [
									{
										"name": "annotations",
										"columns": [
											"time",
											"start_time",
											"modified_time_ns",
											"text",
											"id"
										],
										"values": [
											[
												1516920177345000000,
												0,
												1516989242129417403,
												"mytext",
												"ea0aa94b-969a-4cd5-912a-5db61d502268"
											]
										]
									}
								]
							}
						]`, nil), nil
					},
				},
			},
			ID: "1",
			w:  httptest.NewRecorder(),
			r:  httptest.NewRequest("GET", "/chronograf/v1/sources/1/annotations?since=1985-04-12T23:20:50.52Z", bytes.NewReader([]byte(`howdy`))),
			want: `{"annotations":[{"id":"ea0aa94b-969a-4cd5-912a-5db61d502268","startTime":"1970-01-01T00:00:00Z","endTime":"2018-01-25T22:42:57.345Z","text":"mytext","tags":{},"links":{"self":"/chronograf/v1/sources/1/annotations/ea0aa94b-969a-4cd5-912a-5db61d502268"}}]}
`,
		},
		{
			name: "returns annotations in store with valid tag query parameter",
			fields: fields{
				Store: mockStore,
				TimeSeriesClient: &mocks.TimeSeries{
					ConnectF: func(context.Context, *chronograf.Source) error {
						return nil
					},
					QueryF: func(context.Context, chronograf.Query) (chronograf.Response, error) {
						return mocks.NewResponse(`[]`, nil), nil
					},
				},
			},
			ID: "1",
			w:  httptest.NewRecorder(),
			r:  httptest.NewRequest("GET", "/chronograf/v1/sources/1/annotations?since=1985-04-12T23:20:50.52Z&tag=foo%20%3D~%20%2Fbar%2F", bytes.NewReader([]byte(`howdy`))),
			want: `{"annotations":[]}
`,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.r = tt.r.WithContext(httprouter.WithParams(
				context.Background(),
				httprouter.Params{
					{
						Key:   "id",
						Value: tt.ID,
					},
				}))
			s := &Service{
				Store:            tt.fields.Store,
				TimeSeriesClient: tt.fields.TimeSeriesClient,
				Logger:           mocks.NewLogger(),
			}
			s.Annotations(tt.w, tt.r)
			got := tt.w.Body.String()
			if got != tt.want {
				t.Errorf("Annotations() got != want:\n%s\n%s", got, tt.want)
			}
		})
	}
}

func TestService_UpdateAnnotation(t *testing.T) {
	url := "/chronograf/v1/sources/1/annotations/1"

	timeSeriesClient := &mocks.TimeSeries{
		ConnectF: func(context.Context, *chronograf.Source) error {
			return nil
		},
		QueryF: func(context.Context, chronograf.Query) (chronograf.Response, error) {
			return mocks.NewResponse(`[
							{
								"series": [
									{
										"name": "annotations",
										"columns": [
											"time",
											"start_time",
											"modified_time_ns",
											"text",
											"id"
										],
										"values": [
											[
												1516920177345000000,
												0,
												1516989242129417403,
												"mytext",
												"1"
											]
										]
									}
								]
							}
						]`, nil), nil
		},
		WriteF: func(context.Context, []chronograf.Point) error {
			return nil
		},
	}

	s := &Service{
		Store:            mockStore,
		TimeSeriesClient: timeSeriesClient,
		Logger:           mocks.NewLogger(),
	}

	tests := []struct {
		body string
		want string
	}{
		{
			body: `{"id":"1","text":"newtext","tags":{"foo":"bar"}}`,
			want: `{"id":"1","startTime":"1970-01-01T00:00:00Z","endTime":"2018-01-25T22:42:57.345Z","text":"newtext","tags":{"foo":"bar"},"links":{"self":"/chronograf/v1/sources/1/annotations/1"}}
`,
		},
		{
			body: `{"id":"1","text":"newtext","tags":{"start_time":"0"}}`,
			want: `{"code":400,"message":"Cannot use \"start_time\" as tag key"}`,
		},
	}

	for _, tt := range tests {
		r := httptest.NewRequest("PATCH", url, bytes.NewReader([]byte(tt.body))).WithContext(httprouter.WithParams(
			context.Background(),
			httprouter.Params{
				{
					Key:   "id",
					Value: "1",
				},
			}))

		w := httptest.NewRecorder()
		s.UpdateAnnotation(w, r)
		got := w.Body.String()

		if got != tt.want {
			t.Errorf("UpdateAnnotation() got != want:\n%s\n%s", got, tt.want)
		}
	}
}
