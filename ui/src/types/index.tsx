export interface Source {
  id: string
  name: string
}

export interface Alert {
  name: string
  time: string
  value: string
  host: string
  level: string
}
