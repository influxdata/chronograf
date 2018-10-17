export type TimeSeriesValue = string | number | null

export interface TimeSeriesSeries {
  name?: string
  columns: string[]
  values: TimeSeriesValue[][]
  tags?: [{[x: string]: string}]
}

export type TimeSeriesResult =
  | TimeSeriesSuccessfulResult
  | TimeSeriesErrorResult

export interface TimeSeriesSuccessfulResult {
  statement_id: number
  series: TimeSeriesSeries[]
}

export interface TimeSeriesErrorResult {
  statement_id: number
  error: string
}

export interface TimeSeriesResponse {
  results: TimeSeriesResult[]
}

export interface TimeSeriesServerResponse {
  response: TimeSeriesResponse
}

export interface TimeSeries {
  time: TimeSeriesValue
  values: TimeSeriesValue[]
}

export enum InfluxQLQueryType {
  MetaQuery = 'MetaQuery',
  DataQuery = 'DataQuery',
  ComboQuery = 'CombinationQuery',
}

export interface Label {
  label: string
  seriesIndex: number
  responseIndex: number
}

export interface TimeSeriesToTableGraphReturnType {
  data: TimeSeriesValue[][]
  sortedLabels: Label[]
  influxQLQueryType: InfluxQLQueryType
}
