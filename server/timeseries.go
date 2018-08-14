package server

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/gorilla/websocket"
	"io"
	"io/ioutil"
	"log"
	"net/http"
)

const proxyURL = "http://localhost:8888/chronograf/v1/sources/1/proxy"

type series struct {
	Columns []string        `json:"columns"`
	Values  [][]interface{} `json:"values"`
}

type influxResponse struct {
	Results []struct {
		Series []series `json:"series"`
	} `json:"results"`
}

func (r *influxResponse) Series() *series {
	return &r.Results[0].Series[0]
}

type columnData = map[string][]interface{}

func (s *series) AsColumns() columnData {
	result := map[string][]interface{}{}
	columnForIndex := map[int]string{}

	for i, column := range s.Columns {
		result[column] = make([]interface{}, len(s.Values))
		columnForIndex[i] = column
	}

	for i, value := range s.Values {
		for j, innerValue := range value {
			result[columnForIndex[j]][i] = innerValue
		}
	}

	return result
}

func proxy(query string) (resp influxResponse, err error) {
	client := http.Client{}

	reqBody, err := json.Marshal(map[string]string{
		"query": query,
	})

	if err != nil {
		return
	}

	req, err := http.NewRequest("POST", proxyURL, bytes.NewBuffer(reqBody))

	if err != nil {
		return
	}

	req.Header.Set("Content-Type", "application/json")

	proxyResp, err := client.Do(req)

	if err != nil {
		return
	}

	defer Close(proxyResp.Body)

	body, err := ioutil.ReadAll(proxyResp.Body)

	if err != nil {
		return
	}

	_ = json.Unmarshal(body, &resp)

	return
}

type wsRequest struct {
	ID   string                 `json:"string"`
	Type string                 `json:"type"`
	Data map[string]interface{} `json:"data"`
}

type wsResponse struct {
	ID   string                 `json:"string"`
	Type string                 `json:"type"`
	Data map[string]interface{} `json:"data"`
	Done bool                   `json:"done"`
}

func poll(conn *websocket.Conn) {
	defer Close(conn)

	msg, err := proxy(`SELECT mean("value") FROM "stress"."autogen"."cpu" WHERE time > '2010-01-01' AND time < '2010-01-12' AND "host"='server-3' GROUP BY time(1m), host`)

	if err != nil {
		fmt.Println(err)
	}

	_ = conn.WriteJSON(msg.Series().AsColumns())
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

// Timeseries returns InfluxDB query results over a WebSocket
func Timeseries(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)

	if err != nil {
		fmt.Println(err)
		return
	}

	go poll(conn)
}

// Close closes a closer, and will panic if an error is encountered
func Close(c io.Closer) {
	err := c.Close()

	if err != nil {
		log.Fatalln(err)
	}
}
