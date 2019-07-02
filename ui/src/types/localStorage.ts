import {TimeRange, TimeZones} from 'src/types'
import {LogsState} from 'src/types/logs'

export interface LocalStorage {
  VERSION: VERSION
  app: App
  dashTimeV1: DashTimeV1
  timeRange: TimeRange
  script: string
  logs: LogsState
}

export type VERSION = string
export type timeRange = TimeRange

export interface App {
  persisted: Persisted
}

export interface DashTimeV1 {
  ranges: DashboardTimeRange[]
}

interface DashboardTimeRange {
  dashboardID: number
  defaultGroupBy: string
  format: string
  inputValue: string
  lower: string
  menuOption: string
  seconds: number
  upper: string | null
}

interface Persisted {
  autoRefresh: number
  timeZones: TimeZones
}
