import {QueryConfig} from 'src/types'

export interface DashboardLinks {
  self: string
  cells: string
  templates: string
}

export interface DashboardCellQuery {
  query: string
  queryConfig: QueryConfig
  source: string
}

export interface Axis {
  bounds: string[]
  label: string
  prefix: string
  suffix: string
  base: string
  scale: string
}

export interface Cell {
  i: string
  name: string
  x: number
  y: number
  w: number
  h: number
  queries: DashboardCellQuery[]
  axes: {
    x: Axis
    y: Axis
    y2: Axis
  }
}

export interface TemplateValue {
  value: string
  type: string
  selected: boolean
}

export interface DashboardTemplate {
  tempVar: string
  values: TemplateValue[]
}

export interface Dashboard {
  id: string
  name: string
  links: DashboardLinks
  cells: Cell[]
  templates: DashboardTemplate[]
}
