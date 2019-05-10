import {Template, TimeRange, QueryConfig, Status} from 'src/types'
import {ColorString} from 'src/types/colors'

export interface Axis {
  label: string
  prefix: string
  suffix: string
  base: string
  scale: string
  // sup test
  tradingHours1?: [string, string]
  tradingHours2?: [string, string]
  bounds?: [string, string]
}

export type TimeSeriesValue = string | number | null | undefined

export interface FieldOption {
  internalName: string
  displayName: string
  visible: boolean
}

export interface TableOptions {
  verticalTimeAxis: boolean
  sortBy: FieldOption
  wrapping?: string
  fixFirstColumn: boolean
}

export interface Sort {
  field: string
  direction: string
}

export interface Axes {
  x: Axis
  y: Axis
}

interface CellLinks {
  self?: string
}

export enum QueryType {
  Flux = 'flux',
  InfluxQL = 'influxql',
}

// corresponds to DashboardQuery on the backend
export interface CellQuery {
  query: string
  queryConfig: QueryConfig
  source: string
  text?: string // doesn't come from server
  id?: string
  type: string // flux or influxql
}

export interface Legend {
  type?: string
  orientation?: string
}

export interface DecimalPlaces {
  isEnforced: boolean
  digits: number
}

export enum NoteVisibility {
  Default = 'default',
  ShowWhenNoData = 'showWhenNoData',
}

export interface Cell {
  i: string
  x: number
  y: number
  w: number
  h: number
  name: string
  queries: CellQuery[]
  type: CellType
  axes: Axes
  colors: ColorString[]
  tableOptions: TableOptions
  fieldOptions: FieldOption[]
  timeFormat: string
  decimalPlaces: DecimalPlaces
  links: CellLinks
  legend: Legend
  isWidget?: boolean
  inView: boolean
  note: string
  noteVisibility: NoteVisibility
}

export enum CellType {
  Line = 'line',
  Stacked = 'line-stacked',
  StepPlot = 'line-stepplot',
  Bar = 'bar',
  LinePlusSingleStat = 'line-plus-single-stat',
  SingleStat = 'single-stat',
  Gauge = 'gauge',
  Table = 'table',
  Alerts = 'alerts',
  News = 'news',
  Guide = 'guide',
  Note = 'note',
}

interface DashboardLinks {
  self: string
  cells: string
  templates: string
}

export interface Dashboard {
  id: number
  cells: Cell[]
  templates: Template[]
  name: string
  organization: string
  links?: DashboardLinks
}

export interface DashboardName {
  id: number
  name: string
  link: string
}

export enum ThresholdType {
  Text = 'text',
  BG = 'background',
  Base = 'base',
}

export interface DashboardSwitcherLink {
  key: string
  text: string
  to: string
}

export interface TemplateSelections {
  // e.g. {':my-db:': 'telegraf'}
  [tempVar: string]: string
}

export interface DashboardUIState {
  dashboards: Dashboard[]
  timeRange: TimeRange
  zoomedTimeRange: TimeRange
  isEditMode: boolean
  cellQueryStatus: {
    queryID: string | null
    status: Status
  }
  hoverTime: string
  activeCellID: string
}

export interface DashboardSwitcherLinks {
  active?: DashboardSwitcherLink
  links: DashboardSwitcherLink[]
}

// Dashboards Imports
interface DashboardFileMetaSection {
  chronografVersion?: string
  sources?: ImportedSources
}

export interface ImportedSources {
  [x: string]: ImportedSourceInfo
}

export interface ImportedSourceInfo {
  name: string
  link: string
}

export interface CellInfo {
  id: string
  name: string
}

export interface SourcesCells {
  [x: string]: CellInfo[]
}

export interface SourceInfo {
  name: string
  id: string
  link: string
}

export interface SourceMappings {
  [x: string]: SourceInfo
}

export interface SourceItemValue {
  importedSourceID: string
  sourceInfo: SourceInfo
  text?: string
}

export interface DashboardFile {
  meta?: DashboardFileMetaSection
  dashboard: Dashboard
}

export type NewDefaultCell = Pick<
  Cell,
  Exclude<keyof Cell, 'i' | 'axes' | 'colors' | 'links' | 'legend'>
>

export interface ProtoboardMetadata {
  name: string
  icon: string
  measurements: string[]
  version: string
  dashboardVersion: string
  description: string
  author: string
  license: string
  url: string
}

export interface PBCell extends Cell {
  measurement: string
}

export interface ProtoboardData {
  cells: Array<Partial<PBCell>>
  templates: Template[]
}

export interface Protoboard {
  id: string
  meta: ProtoboardMetadata
  data: ProtoboardData
}
