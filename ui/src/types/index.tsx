import {RouteComponentProps} from 'react-router'

import {DISPLAY_OPTIONS} from 'src/dashboards/constants'

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
  database: string
  measurement: string
  retentionPolicy: string
  fields: QueryConfigField[]
  tags: QueryConfigTags
  groupBy: QueryConfigGroupBy
  areTagsAccepted: boolean
  rawText: string | null
  range: string | null
}

export interface CellQuery {
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
}

export interface Axes {
  y: Axis
  y2?: Axis
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
  type: string
  links?: {
    self: string
  }
  axes?: Axes
}

export interface Template {}

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
  synchronizer: () => void
  onCancelEditCell: () => void
  onZoom: () => void
  isStatusPage: boolean
  isEditable: boolean
}
