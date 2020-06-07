package server_test

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"

	"github.com/bouk/httprouter"
	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/mocks"
	"github.com/influxdata/chronograf/server"
)

const tickScript = `
stream
	|from()
		.measurement('cpu')
	|alert()
		.crit(lambda: "usage_idle" < 10)
		.log('/tmp/alert')
`

func TestValidRuleRequest(t *testing.T) {
	tests := []struct {
		name    string
		rule    chronograf.AlertRule
		wantErr bool
	}{
		{
			name: "No every with functions",
			rule: chronograf.AlertRule{
				Query: &chronograf.QueryConfig{
					Fields: []chronograf.Field{
						{
							Value: "max",
							Type:  "func",
							Args: []chronograf.Field{
								{
									Value: "oldmanpeabody",
									Type:  "field",
								},
							},
						},
					},
				},
			},
			wantErr: true,
		},
		{
			name: "With every",
			rule: chronograf.AlertRule{
				Every: "10s",
				Query: &chronograf.QueryConfig{
					Fields: []chronograf.Field{
						{
							Value: "max",
							Type:  "func",
							Args: []chronograf.Field{
								{
									Value: "oldmanpeabody",
									Type:  "field",
								},
							},
						},
					},
				},
			},
		},
		{
			name:    "No query config",
			rule:    chronograf.AlertRule{},
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if err := server.ValidRuleRequest(tt.rule); (err != nil) != tt.wantErr {
				t.Errorf("ValidRuleRequest() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func Test_KapacitorRulesGet(t *testing.T) {
	kapaTests := []struct {
		name        string
		requestPath string
		mockAlerts  []chronograf.AlertRule
		expected    []chronograf.AlertRule
	}{
		{
			name:        "basic",
			requestPath: "/chronograf/v1/sources/1/kapacitors/1/rules",
			mockAlerts: []chronograf.AlertRule{
				{
					ID:         "cpu_alert",
					Name:       "cpu_alert",
					Status:     "enabled",
					Type:       "stream",
					DBRPs:      []chronograf.DBRP{{DB: "telegraf", RP: "autogen"}},
					TICKScript: tickScript,
				},
			},
			expected: []chronograf.AlertRule{
				{
					ID:         "cpu_alert",
					Name:       "cpu_alert",
					Status:     "enabled",
					Type:       "stream",
					DBRPs:      []chronograf.DBRP{{DB: "telegraf", RP: "autogen"}},
					TICKScript: tickScript,
					AlertNodes: chronograf.AlertNodes{
						Posts:      []*chronograf.Post{},
						TCPs:       []*chronograf.TCP{},
						Email:      []*chronograf.Email{},
						Exec:       []*chronograf.Exec{},
						Log:        []*chronograf.Log{},
						VictorOps:  []*chronograf.VictorOps{},
						PagerDuty:  []*chronograf.PagerDuty{},
						PagerDuty2: []*chronograf.PagerDuty{},
						Pushover:   []*chronograf.Pushover{},
						Sensu:      []*chronograf.Sensu{},
						Slack:      []*chronograf.Slack{},
						Telegram:   []*chronograf.Telegram{},
						HipChat:    []*chronograf.HipChat{},
						Alerta:     []*chronograf.Alerta{},
						OpsGenie:   []*chronograf.OpsGenie{},
						OpsGenie2:  []*chronograf.OpsGenie{},
						Talk:       []*chronograf.Talk{},
						Kafka:      []*chronograf.Kafka{},
					},
				},
			},
		},
	}

	for _, test := range kapaTests {
		test := test // needed to avoid data race
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			// setup mock kapa API
			kapaSrv := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
				params := r.URL.Query()
				limit, err := strconv.Atoi(params.Get("limit"))
				if err != nil {
					rw.WriteHeader(http.StatusBadRequest)
					return
				}
				offset, err := strconv.Atoi(params.Get("offset"))
				if err != nil {
					rw.WriteHeader(http.StatusBadRequest)
					return
				}

				tsks := []map[string]interface{}{}
				for _, task := range test.mockAlerts {
					tsks = append(tsks, map[string]interface{}{
						"id":     task.ID,
						"script": tickScript,
						"status": "enabled",
						"type":   "stream",
						"dbrps": []chronograf.DBRP{
							{
								DB: "telegraf",
								RP: "autogen",
							},
						},
						"link": map[string]interface{}{
							"rel":  "self",
							"href": "/kapacitor/v1/tasks/cpu_alert",
						},
					})
				}

				var tasks map[string]interface{}

				if offset >= len(tsks) {
					tasks = map[string]interface{}{
						"tasks": []map[string]interface{}{},
					}
				} else if limit+offset > len(tsks) {
					tasks = map[string]interface{}{
						"tasks": tsks[offset:],
					}
				}
				//} else {
				//tasks = map[string]interface{}{
				//"tasks": tsks[offset : offset+limit],
				//}
				//}

				err = json.NewEncoder(rw).Encode(&tasks)
				if err != nil {
					t.Error("Failed to encode JSON. err:", err)
				}
			}))
			defer kapaSrv.Close()

			// setup mock service and test logger
			testLogger := mocks.TestLogger{}
			svc := &server.Service{
				Store: &mocks.Store{
					SourcesStore: &mocks.SourcesStore{
						GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
							return chronograf.Source{
								ID:                 ID,
								InsecureSkipVerify: true,
							}, nil
						},
					},
					ServersStore: &mocks.ServersStore{
						GetF: func(ctx context.Context, ID int) (chronograf.Server, error) {
							return chronograf.Server{
								SrcID: ID,
								URL:   kapaSrv.URL,
							}, nil
						},
					},
				},
				Logger: &testLogger,
			}

			// setup request and response recorder
			req := httptest.NewRequest("GET", test.requestPath, strings.NewReader(""))
			rr := httptest.NewRecorder()

			// setup context and request params
			bg := context.Background()
			params := httprouter.Params{
				{
					Key:   "id",
					Value: "1",
				},
				{
					Key:   "kid",
					Value: "1",
				},
			}
			ctx := httprouter.WithParams(bg, params)
			req = req.WithContext(ctx)

			// invoke KapacitorRulesGet endpoint
			svc.KapacitorRulesGet(rr, req)

			// destructure response
			frame := struct {
				Rules []struct {
					chronograf.AlertRule
					Links json.RawMessage `json:"links"`
				} `json:"rules"`
			}{}

			resp := rr.Result()

			err := json.NewDecoder(resp.Body).Decode(&frame)
			if err != nil {
				t.Fatal("Err decoding kapa rule response: err:", err)
			}

			actual := make([]chronograf.AlertRule, len(frame.Rules))

			for i := range frame.Rules {
				actual[i] = frame.Rules[i].AlertRule
			}

			if resp.StatusCode != http.StatusOK {
				t.Fatal("Expected HTTP 200 OK but got", resp.Status)
			}

			if !cmp.Equal(test.expected, actual) {
				t.Fatalf("%q - Alert rules differ! diff:\n%s\n", test.name, cmp.Diff(test.expected, actual))
			}
		})
	}
}

// Test_KapacitorActivation tests that activation of one kapacitor make other kapacitors inactive
func Test_KapacitorActivation(t *testing.T) {
	// setup mock service and test logger
	sourceId := 1
	sourceIdStr := strconv.FormatInt(int64(sourceId), 10)
	kapacitors := make([]chronograf.Server, 0, 5)
	testLogger := mocks.TestLogger{}
	svc := &server.Service{
		Store: &mocks.Store{
			SourcesStore: &mocks.SourcesStore{
				GetF: func(ctx context.Context, ID int) (chronograf.Source, error) {
					return chronograf.Source{
						ID:                 sourceId,
						InsecureSkipVerify: true,
					}, nil
				},
			},
			ServersStore: &mocks.ServersStore{
				GetF: func(ctx context.Context, ID int) (chronograf.Server, error) {
					for _, item := range kapacitors {
						if item.ID == ID {
							return item, nil
						}
					}
					return chronograf.Server{}, errors.New("Not Found")
				},
				AllF: func(ctx context.Context) ([]chronograf.Server, error) {
					return kapacitors, nil
				},
				AddF: func(ctx context.Context, svr chronograf.Server) (chronograf.Server, error) {
					for _, item := range kapacitors {
						if item.ID == svr.ID {
							return chronograf.Server{}, errors.New("Already Exists")
						}
					}
					svr.ID = len(kapacitors) + 1
					kapacitors = append(kapacitors, svr)
					return svr, nil
				},
				UpdateF: func(ctx context.Context, svr chronograf.Server) error {
					for i, item := range kapacitors {
						if item.ID == svr.ID {
							kapacitors[i] = svr
							return nil
						}
					}
					return errors.New("Not Found")
				},
			},
			OrganizationsStore: &mocks.OrganizationsStore{
				AllF: func(ctx context.Context) ([]chronograf.Organization, error) {
					return nil, errors.New("No Organizations")
				},
				DefaultOrganizationF: func(ctx context.Context) (*chronograf.Organization, error) {
					return &chronograf.Organization{
						ID:   "0",
						Name: "Default",
					}, nil
				},
			},
		},
		Logger: &testLogger,
	}

	newKapacitor := func(t *testing.T, active bool) int {
		// setup request and response recorder
		id := len(kapacitors) + 1
		kapacitor := chronograf.Server{
			ID:     id,
			Active: active,
			SrcID:  sourceId,
			Name:   strconv.Itoa(id),
			URL:    "http://test/" + strconv.Itoa(id),
		}
		requestBody, _ := json.Marshal(kapacitor)
		req := httptest.NewRequest("POST", "/chronograf/v1/sources/"+sourceIdStr+"/kapacitors", bytes.NewReader(requestBody))
		rr := httptest.NewRecorder()
		// setup context and request params
		bg := context.Background()
		params := httprouter.Params{
			{
				Key:   "id",
				Value: sourceIdStr,
			},
		}
		ctx := httprouter.WithParams(bg, params)
		req = req.WithContext(ctx)

		svc.NewKapacitor(rr, req)
		if rr.Result().StatusCode/100 != 2 {
			t.Fatalf("unable to create kapacitor #%d", id)
		}
		return id
	}
	updateKapacitor := func(t *testing.T, id int, active bool) {
		// setup request and response recorder
		kapacitor := chronograf.Server{
			ID:     id,
			Active: active,
			SrcID:  sourceId,
			Name:   strconv.Itoa(id),
			URL:    "http://test/" + strconv.Itoa(id),
		}
		requestBody, _ := json.Marshal(kapacitor)
		kid := strconv.Itoa(id)
		req := httptest.NewRequest("PATCH", "/chronograf/v1/sources/"+sourceIdStr+"/kapacitors/"+kid, bytes.NewReader(requestBody))
		rr := httptest.NewRecorder()
		// setup context and request params
		bg := context.Background()
		params := httprouter.Params{
			{
				Key:   "id",
				Value: sourceIdStr,
			},
			{
				Key:   "kid",
				Value: kid,
			},
		}
		ctx := httprouter.WithParams(bg, params)
		req = req.WithContext(ctx)

		svc.UpdateKapacitor(rr, req)
		if rr.Result().StatusCode/100 != 2 {
			t.Fatalf("unable to update kapacitor #%d", id)
		}
	}
	// checks that the expected kapacitor (ID) is active , -1 if there is none, -2 if there are more
	assertActiveKapacitor := func(t *testing.T, name string, expected int) {
		// setup request and response recorder
		req := httptest.NewRequest("GET", "/chronograf/v1/sources/"+sourceIdStr+"/kapacitors", strings.NewReader(""))
		rr := httptest.NewRecorder()
		// setup context and request params
		bg := context.Background()
		params := httprouter.Params{
			{
				Key:   "id",
				Value: sourceIdStr,
			},
		}
		ctx := httprouter.WithParams(bg, params)
		req = req.WithContext(ctx)

		// invoke KapacitorRulesGet endpoint
		svc.Kapacitors(rr, req)
		type kapacitor struct {
			ID     int  `json:"id,string"` // Unique identifier representing a kapacitor instance.
			Active bool `json:"active"`
		}
		type kapacitors struct {
			Kapacitors []kapacitor `json:"kapacitors"`
		}
		responseData := kapacitors{}
		resp := rr.Result()
		err := json.NewDecoder(resp.Body).Decode(&responseData)
		retVal := -1

		if err == nil {
			for _, kapacitor := range responseData.Kapacitors {
				if kapacitor.Active {
					if retVal != -1 {
						t.Fatalf("%s - more active kapacitors detected!", name)
						return
					}
					retVal = kapacitor.ID
				}
			}
		}
		if expected != retVal {
			t.Fatalf("%s - expected active kapacitor %d, received %d", name, expected, retVal)
		}
	}

	// test expectation when creating/activating/deactivating kapacitors
	newKapacitor(t, false)
	assertActiveKapacitor(t, "create inactive #1", -1) // no kapacitor is now active
	id2 := newKapacitor(t, true)
	assertActiveKapacitor(t, "create active #2", id2)
	id3 := newKapacitor(t, false)
	assertActiveKapacitor(t, "create inactive #3", id2)
	updateKapacitor(t, id2, false)
	assertActiveKapacitor(t, "deactivate current #2", -1) // no kapacitor is now active
	id4 := newKapacitor(t, true)
	assertActiveKapacitor(t, "create active #4", id4)
	updateKapacitor(t, id3, true)
	assertActiveKapacitor(t, "activate #3", id3)

}
