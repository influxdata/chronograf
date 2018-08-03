export interface NewService {
  url: string
  name: string
  type: string
  username?: string
  password?: string
  insecureSkipVerify: boolean
  metadata?: {
    [x: string]: any
  }
}

export interface ServiceLinks {
  source: string
  self: string
  proxy: string
}

export interface Service {
  id?: string
  sourceID: string
  url: string
  name: string
  type: string
  username?: string
  password?: string
  insecureSkipVerify: boolean
  metadata: {
    [x: string]: any
  }
  links: ServiceLinks
}
