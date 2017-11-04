export interface Location {
  pathname: string
}

export interface Router {
  push: (route: string) => void
}

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
