import {RouteComponentProps} from 'react-router'

export type RouterSourceID = RouteComponentProps<{sourceID: string}>

export interface Source {
  id: string
  name: string
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
