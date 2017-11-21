export interface InfluxDBAdminQuery {
  id: string
  database: string
  query: string
  duration: string
}

export interface DatabaseLinks {
  self: string
  retentionPolicies: string
}

export interface RPLinks {
  self: string
}

export interface RetentionPolicy {
  name: string
  duration: string
  replication: number
  shardDuration: string
  default: boolean
  links: RPLinks
  isNew?: boolean
  isDefault?: boolean
  isEditing?: boolean
}

export interface Database {
  name: string
  duration: string
  replication: number
  shardDuration: string
  retentionPolicies: RetentionPolicy[]
  links: DatabaseLinks
  deleteCode?: string
  isEditing?: boolean
}

export interface InfluxDBUserLinks {
  self: string
}

export interface InfluxDBRoleLinks {
  self: string
}

export interface InfluxDBPermission {
  scope: string
  name: string
  allowed: string[]
}

export interface InfluxDBUser {
  name: string
  permissions: InfluxDBPermission[]
  links: InfluxDBUserLinks
  isNew?: boolean
  hidden?: boolean
  password?: string
  isEditing: boolean
}

export interface InfluxDBRole {
  name: string
  users: InfluxDBUser[]
  permissions: InfluxDBPermission[]
  links: InfluxDBRoleLinks
  isEditing: boolean
}
