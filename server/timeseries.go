package server

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	"github.com/influxdata/influxdb/client/v2"
)

const proxyURL = "http://localhost:8888/chronograf/v1/sources/1/proxy"

var influxClient client.Client

type columnData = map[string][]byte

type toColumnsResult struct {
	columns      columnData
	isNormalized bool
	startTime    float64
	timeDelta    float64
	timeCount    int
}

func toColumns(resp *client.Response) (*toColumnsResult, error) {
	s := resp.Results[0].Series[0]

	buffers := map[string]*bytes.Buffer{}
	columnForIndex := map[int]string{}

	for i, column := range s.Columns {
		buffers[column] = &bytes.Buffer{}
		columnForIndex[i] = column
	}

	var startTime float64
	var lastTime float64
	var lastDelta float64
	isNormalized := true

	for i, value := range s.Values {
		for j, innerValue := range value {
			n, _ := innerValue.(json.Number).Float64() // yolo
			columnName := columnForIndex[j]
			buf := buffers[columnName]
			err := binary.Write(buf, binary.LittleEndian, n)

			if err != nil {
				return &toColumnsResult{}, err
			}

			if !isNormalized || columnName != "time" {
				continue
			}

			if i == 0 {
				startTime = n
				lastTime = n
			} else if i == 1 {
				lastTime = n
				lastDelta = n - startTime
			} else {
				timeDelta := n - lastTime

				if timeDelta != lastDelta {
					isNormalized = false
					continue
				}

				lastDelta = timeDelta
				lastTime = n
			}
		}
	}

	columns := map[string][]byte{}

	for k, v := range buffers {
		columns[k] = v.Bytes()
	}

	result := &toColumnsResult{
		columns:      columns,
		isNormalized: isNormalized,
		startTime:    startTime,
		timeDelta:    lastDelta,
		timeCount:    len(s.Values),
	}

	return result, nil
}

type queryResult struct {
	id   string
	data *toColumnsResult
	err  error
}

func performQuery(id string, query string, done chan<- queryResult) {
	start := time.Now()

	q := client.NewQuery(query, "stress", "ns")
	resp, err := influxClient.Query(q)

	if err != nil {
		done <- queryResult{id: id, err: err}
		return
	}

	fmt.Printf("Fetched data in %s\n", time.Since(start))

	start = time.Now()

	columns, err := toColumns(resp)

	fmt.Printf("Columnized data in %s\n", time.Since(start))

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
	Column       string  `json:"column"`
	IsNormalized bool    `json:"isNormalized,omitempty"`
	StartTime    float64 `json:"startTime,omitempty"`
	TimeDelta    float64 `json:"timeDelta,omitempty"`
	TimeCount    int     `json:"timeCount,omitempty"`
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
			}

			continue
		}

		i := 0

		for column, data := range result.data.columns {
			respData := queryResponseData{
				Column: column,
			}

			useRunLengthEncoding := result.data.isNormalized && column == "time"

			if useRunLengthEncoding {
				respData.IsNormalized = true
				respData.StartTime = result.data.startTime
				respData.TimeDelta = result.data.timeDelta
				respData.TimeCount = result.data.timeCount
			}

			resp := queryResponse{
				ID:           result.id,
				Done:         i == len(result.data.columns)-1,
				ResponseType: "QUERY_RESULT",
				Data:         respData,
			}

			err := conn.WriteJSON(resp)

			if err != nil {
				log.Fatalln(err)
			}

			if !useRunLengthEncoding {
				err = conn.WriteMessage(websocket.BinaryMessage, data)

				if err != nil {
					log.Fatalln(err)
				}
			}

			i++
		}
	}
}

// Timeseries returns InfluxDB query results over a WebSocket
func Timeseries(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)

	if err != nil {
		log.Fatalln(err)
	}

	influxClient, err = client.NewHTTPClient(client.HTTPConfig{
		Addr: "http://localhost:8086",
	})

	if err != nil {
		log.Fatalln(err)
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
