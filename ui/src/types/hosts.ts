import {Axes} from 'src/types'

export interface HostNames {
  [index: string]: HostName
}

export interface HostName {
  name: string
}

export interface Host {
  name: string
  cpu: number
  load?: number
  apps?: string[]
  tags?: {[x: string]: string}
  deltaUptime?: number
  winDeltaUptime?: number
}

export interface Layout {
  id: string
  app: string
  measurement: string
  cells: LayoutCell[]
  link: LayoutLink
  autoflow: boolean
}

interface LayoutLink {
  herf: string
  rel: string
}

export interface LayoutCell {
  x: number
  y: number
  w: number
  h: number
  i: string
  name: string
  type: string
  queries: LayoutQuery[]
  axes: Axes
  colors: string[]
}

export interface LayoutQuery {
  label: string
  query: string
}
