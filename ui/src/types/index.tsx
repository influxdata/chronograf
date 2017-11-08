import {RouteComponentProps} from 'react-router'

import {DISPLAY_OPTIONS} from 'src/dashboards/constants'

import * as FuncTypes from 'src/types/funcs'

export type RouterSourceID = RouteComponentProps<{sourceID: string}>

export interface Source {
  id: string
  name: string
  url: string
  links: {
    proxy: string
    self: string
    kapacitors: string
    queries: string
    permissions: string
    users: string
    databases: string
  }
  default: boolean
}

export interface Alert {
  name: string
  time: string
  value: string
  host: string
  level: string
}

export interface CustomLink {
  name: string
  url: string
}

export type AutoRefresh = number
export type ManualRefresh = number

export interface TimeRange {
  lower: string
  upper?: string
}

export interface Args {
  value: string
  type: string
}

export interface QueryConfigField {
  value: string
  type: string
  alias: string
  args: Args[]
}

export interface QueryConfigTags {}

export interface QueryConfigGroupBy {}

export interface QueryConfig {
  id: QueryID
  database: string
  measurement: string
  retentionPolicy: string
  fields: QueryConfigField[]
  tags: QueryConfigTags
  groupBy: QueryConfigGroupBy
  areTagsAccepted: boolean
  rawText: string | null
  range?: string | null
  source?: string
}

export interface CellQuery {
  id?: QueryID
  query: string
  label?: string
  queryConfig: QueryConfig
}

export interface Axis {
  bounds: string[]
  prefix: string
  suffix: string
  base: DISPLAY_OPTIONS
  scale: DISPLAY_OPTIONS
  defaultYLabel: string
  label?: string
}

export interface Axes {
  y: Axis
  y2?: Axis
}

export interface AxesBounds {
  bounds: Axes
}

export interface Cell {
  i: string
  isWidget: boolean
  x: number
  y: number
  w: number
  h: number
  name: string
  queries: CellQuery[]
  type: GraphType
  links?: {
    self: string
  }
  axes?: Axes
}

export interface Query {
  id?: string
  query: TextQuery
  source?: string
  db?: string
  rp?: string
  tempVars?: Template[]
  resolution?: number
}

export interface TemplateQuery {
  db: string
  rp: string
  influxql: string
}

export interface TemplateValue {
  type: string
  value: string
  selected?: boolean
}

export interface Template {
  type: string
  tempVar: string
  query?: TemplateQuery
  values: TemplateValue[]
}

export interface ResizeCoords {
  x: number
  y: number
}

export interface LayoutProps {
  autoRefresh: AutoRefresh
  manualRefresh?: ManualRefresh
  timeRange: TimeRange
  cell: Cell
  templates: Template[]
  host: string
  source: Source
  sources: Source[]
  onPositionChange: (newCells: Cell[]) => void
  onEditCell: () => void
  onDeleteCell: () => void
  onSummonOverlayTechnologies: () => void
  onCancelEditCell: () => void
  synchronizer: FuncTypes.synchronizer
  onZoom: FuncTypes.onZoom
  isStatusPage: boolean
  isEditable: boolean
}

export enum GraphType {
  Line = 'line',
  LineStacked = 'line-stacked',
  LineStepplot = 'line-stepplot',
  SingleStat = 'single-stat',
  Bar = 'bar',
  LinePlusSingleStat = 'line-plus-single-stat',
}

export interface TextQuery {
  host: string | string[]
  // database?: string
  // rp?: string
  text: string
}

export type Color = string

export interface RuleValues {
  value: string | null
  rangeValue: string | null
  operator: string
}

export interface DygraphOptions {
  plotter: () => void
}

export interface LegendSeries {}

export type QueryID = string

export type DashboardID = string

export interface QueryStatus {
  queryID: QueryID
  status: {
    error?: string
    success?: string
    warn?: string
  }
}

export enum OptInType {
  text = 'text',
  number = 'number',
}
