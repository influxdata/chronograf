import {Index} from 'react-virtualized'

import {
  SeverityFormatOptions,
  SeverityColorOptions,
  SeverityLevelOptions,
} from 'src/logs/constants'
import {QueryConfig, Namespace, Source} from 'src/types'
import {FieldOption} from 'src/types/dashboards'
import {TimeSeriesValue} from 'src/types/series'
import {TimeRange} from 'src/types/logs'

export enum SearchStatus {
  None = 'None',
  Loading = 'Loading',
  NoResults = 'NoResults',
  UpdatingTimeBounds = 'UpdatingTimeBounds',
  UpdatingFilters = 'UpdatingFilters',
  UpdatingSource = 'UpdatingSource',
  UpdatingNamespace = 'UpdatingNamespace',
  MeasurementMissing = 'MeasurementMissing',
  Loaded = 'Loaded',
  Clearing = 'Clearing',
  Cleared = 'Cleared',
}

export interface Filter {
  id: string
  key: string
  value: string
  operator: string
}

export interface TableData {
  columns: string[]
  values: TimeSeriesValue[][]
}

export interface LogsState {
  currentSource: Source | null
  currentNamespaces: Namespace[]
  currentNamespace: Namespace | null
  timeRange: TimeRange
  histogramQueryConfig: QueryConfig | null
  histogramData: object[]
  tableQueryConfig: QueryConfig | null
  tableData: TableData
  filters: Filter[]
  queryCount: number
  logConfig: LogConfig
  tableInfiniteData: {
    forward: TableData
    backward: TableData
  }
  tableTime: {
    custom?: string
    relative?: number
  }
  newRowsAdded: number
  searchStatus: SearchStatus
  nextOlderUpperBound: number | undefined
  nextOlderLowerBound: number | undefined
  nextNewerUpperBound: number | undefined
  nextNewerLowerBound: number | undefined
  currentTailUpperBound: number | undefined
  nextTailLowerBound: number | undefined
  tailChunkDurationMs: number
  olderChunkDurationMs: number
  newerChunkDurationMs: number
}

export interface LogConfig {
  tableColumns: LogsTableColumn[]
  severityFormat: SeverityFormat
  severityLevelColors: SeverityLevelColor[]
  isTruncated: boolean
}

export interface SeverityLevelColor {
  level: SeverityLevelOptions
  color: SeverityColorOptions
}

export interface SeverityColor {
  hex: string
  name: SeverityColorOptions
}

export type SeverityFormat = SeverityFormatOptions

export type LogsTableColumn = FieldOption

export interface ServerLogConfig {
  columns: ServerColumn[]
}

export interface ServerColumn {
  name: string
  position: number
  encodings: ServerEncoding[]
}

export interface ServerEncoding {
  type: string
  value: string
  name?: string
}

export interface TimeRange {
  upper?: string
  lower: string
  seconds?: number
  windowOption: string
  timeOption: string
}

export interface TimeBounds {
  upper: string | null
  lower: string
}

export interface TimeWindow {
  seconds: number
  windowOption: string
}

export interface TimeMarker {
  timeOption: string
}

export interface TimeRange {
  upper?: string
  lower: string
  seconds?: number
  windowOption: string
  timeOption: string
}

export interface TimeBounds {
  upper: string | null
  lower: string
}

export interface TimeWindow {
  seconds: number
  windowOption: string
}

export interface TimeMarker {
  timeOption: string
}

export type RowHeightHandler = (index: Index) => number

export interface Term {
  type: TermType
  term: string
  attribute: string
}

export interface TokenLiteralMatch {
  literal: string
  nextText: string
  rule: TermRule
  attribute: string
}

export interface TermRule {
  type: TermType
  pattern: RegExp
}

export enum TermType {
  EXCLUDE,
  INCLUDE,
}

export enum TermPart {
  EXCLUSION = '-',
  SINGLE_QUOTED = "'([^']+)'",
  DOUBLE_QUOTED = '"([^"]+)"',
  ATTRIBUTE = '(\\w+(?=\\:))',
  COLON = '(?::)',
  UNQUOTED_WORD = '([\\S]+)',
}

export enum Operator {
  NOT_LIKE = '!~',
  LIKE = '=~',
  EQUAL = '==',
  NOT_EQUAL = '!=',
}

export enum MatchType {
  NONE = 'no-match',
  MATCH = 'match',
}

export interface MatchSection {
  id: string
  type: MatchType
  text: string
}

export interface FetchLoop {
  promise: Promise<void>
  cancel: () => void
  isCanceled: boolean
}
