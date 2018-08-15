package server

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"io"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

const proxyURL = "http://localhost:8888/chronograf/v1/sources/1/proxy"

type series struct {
	Columns []string    `json:"columns"`
	Values  [][]float64 `json:"values"`
}

type influxResponse struct {
	Results []struct {
		Series []series `json:"series"`
	} `json:"results"`
}

func (r *influxResponse) series() *series {
	return &r.Results[0].Series[0]
}

type columnData = map[string]*bytes.Buffer

func (s *series) columns() (columnData, error) {
	result := map[string]*bytes.Buffer{}
	columnForIndex := map[int]string{}

	for i, column := range s.Columns {
		result[column] = &bytes.Buffer{}
		columnForIndex[i] = column
	}

	for _, value := range s.Values {
		for j, innerValue := range value {
			buf := result[columnForIndex[j]]
			err := binary.Write(buf, binary.LittleEndian, innerValue)

			if err != nil {
				return nil, err
			}
		}
	}

	return result, nil
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

type queryResult struct {
	id   string
	data columnData
	err  error
}

func performQuery(id string, query string, done chan<- queryResult) {
	resp, err := proxy(query)

	if err != nil {
		done <- queryResult{id: id, err: err}
		return
	}

	columns, err := resp.series().columns()

	if err != nil {
		done <- queryResult{id: id, err: err}
		return
	}

	result := queryResult{
		id:   id,
		err:  nil,
		data: columns,
	}

	done <- result
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:    1024,
	WriteBufferSize:   1024,
	CheckOrigin:       func(r *http.Request) bool { return true },
	EnableCompression: true,
}

type queryRequest struct {
	ID          string `json:"id"`
	RequestType string `json:"type"` // QUERY
	Data        struct {
		Query string `json:"query"`
	} `json:"data"`
}

func receiveMessages(conn *websocket.Conn, messages chan<- queryResult) {
	defer Close(conn)

	for {
		var req queryRequest
		err := conn.ReadJSON(&req)

		if err != nil {
			log.Println(err)
			return
		}

		go performQuery(req.ID, req.Data.Query, messages)
	}
}

type queryResponseData struct {
	Column string `json:"column"`
}

type queryResponse struct {
	ID           string            `json:"id"`
	ResponseType string            `json:"type"` // 'QUERY_RESULT'
	Done         bool              `json:"done"`
	Data         queryResponseData `json:"data"`
}

type errResponseData struct {
	Message string `json:"message"`
}

type errResponse struct {
	ID           string          `json:"id"`
	ResponseType string          `json:"type"` // 'ERROR'
	Done         bool            `json:"bool"`
	Data         errResponseData `json:"data"`
}

func sendMessages(conn *websocket.Conn, messages <-chan queryResult) {
	defer Close(conn)

	for {
		result := <-messages

		if result.err != nil {
			resp := errResponse{
				ID:           result.id,
				ResponseType: "ERROR",
				Done:         true,
				Data: errResponseData{
					Message: result.err.Error(),
				},
			}

			err := conn.WriteJSON(resp)

			if err != nil {
				log.Fatalln(err)
				return
			}

			continue
		}

		i := 0

		for column, data := range result.data {
			resp := queryResponse{
				ID:           result.id,
				Done:         i == len(result.data)-1,
				ResponseType: "QUERY_RESULT",
				Data: queryResponseData{
					Column: column,
				},
			}

			conn.WriteJSON(resp)
			conn.WriteMessage(websocket.BinaryMessage, data.Bytes())

			i++
		}
	}
}

// Timeseries returns InfluxDB query results over a WebSocket
func Timeseries(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)

	if err != nil {
		log.Fatalln(err)
		return
	}

	conn.EnableWriteCompression(true)

	messages := make(chan queryResult)

	go receiveMessages(conn, messages)
	go sendMessages(conn, messages)
}

// Close closes a closer, and will panic if an error is encountered
func Close(c io.Closer) {
	err := c.Close()

	if err != nil {
		log.Fatalln(err)
	}
}
