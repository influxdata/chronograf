export interface QueryRequest {
  id: string
  type: 'QUERY'
  data: {
    query: string
  }
}

export interface QueryResponse {
  id: string
  type: 'QUERY_RESULT'
  done: boolean
  data: {
    column: string
    isNormalized?: boolean
    startTime?: number
    timeDelta?: number
    timeCount?: number
  }
}

export interface ErrorResponse {
  id: string
  type: 'ERROR'
  done: boolean
  data: {
    message: string
  }
}

export type JSONResponse = QueryResponse | ErrorResponse

export type Timeseries = [Float64Array, Float32Array]
