import uuid from 'uuid'

import QueryManager from 'src/perf/QueryManager'
import WebSocketConnection from 'src/perf/WebSocketConnection'

import {JSONResponse, DataResponse} from 'src/perf/types'

class QueriesManager {
  private ws: WebSocketConnection
  private requests: {[id: string]: QueryManager}

  private lastMetadata?: {
    requestID: string
    requestDone: boolean
    column: string
  }

  constructor(wsURL) {
    this.ws = new WebSocketConnection(wsURL, this.handleMessage, 'arraybuffer')
    this.requests = {}
  }

  public addQuery(query: string): QueryManager {
    return new QueryManager(query, this)
  }

  public send(queryManager: QueryManager) {
    const requestID = uuid.v4()

    this.requests[requestID] = queryManager

    this.ws.send(
      JSON.stringify({
        id: requestID,
        type: 'QUERY',
        data: {query: queryManager.query},
      })
    )
  }

  private handleMessage = (msg: MessageEvent) => {
    if (typeof msg.data === 'string') {
      this.handleJSONMessage(JSON.parse(msg.data))
    } else {
      this.handleDataMessage(new Float64Array(msg.data))
    }
  }

  private handleJSONMessage = (msg: JSONResponse) => {
    if (msg.type === 'ERROR') {
      throw new Error(msg.data.message)
    }

    this.lastMetadata = {
      requestID: msg.id,
      column: msg.data.column,
      requestDone: msg.done,
    }
  }

  private handleDataMessage = (data: DataResponse) => {
    const {column, requestID, requestDone} = this.lastMetadata
    const queryManager = this.requests[requestID]

    queryManager.addColumnData(column, data, requestDone)
  }
}

export default QueriesManager
