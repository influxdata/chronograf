export type Value = number | string | null

export interface Series {
  name: string
  columns: string[]
  values: Value[][]
}

export type Serieses = Series & {
  index: number
  responseIndex: number
  tags: string[]
}

export interface Result {
  series: Series[]
}

export interface RawResponse {
  results: Result[]
}

export type Time = Date | Value

export type TimeSeries = Time[]

export interface DygraphSeries {
  [key: string]: {
    axis: number
  }
}

export interface Dygraph {
  labels: string[]
  timeSeries: TimeSeries
  dygraphSeries: DygraphSeries
}
