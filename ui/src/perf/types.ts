import {ScaleLinear} from 'd3-scale'

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

export type Scale = ScaleLinear<number, number>

export interface Margins {
  top: number
  right: number
  bottom: number
  left: number
}

export interface VisDimensions {
  margins: Margins
  xDomain: [number, number]
  yDomain: [number, number]
  xScale: Scale
  yScale: Scale
  width: number
  height: number
}
