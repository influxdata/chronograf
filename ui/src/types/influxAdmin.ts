export interface UserRole {
  name: string
}

export interface UserPermission {
  scope: string
  name?: string
  allowed: string[]
}

export interface User {
  name: string
  roles: UserRole[]
  permissions: UserPermission[]
  password: string
}

export interface RetentionPolicy {
  /** a unique string identifier for the retention policy */
  name: string
  /** the duration (when creating a default retention policy) */
  duration?: string
  /** the replication factor (when creating a default retention policy)*/
  replication?: number
  /** the shard duration (when creating a default retention policy)*/
  shardDuration: string
  /** whether the RP should be the default */
  isDefault: boolean
  /** Links are URI locations related to the retention policy */
  links: {
    self: string
  }
}

export interface Database {
  /** a unique string identifier for the database */
  name: string
  /** the duration (when creating a default retention policy) */
  duration?: string
  /** the replication factor (when creating a default retention policy)*/
  replication?: number
  /** the shard duration (when creating a default retention policy)*/
  shardDuration: string
  /** RPs are the retention policies for a database */
  retentionPolicies: RetentionPolicy[]
  /** Links are URI locations related to the database */
  links: {
    self: string
    retentionPolicies: string
    measurements: string
  }
  /** ui markers  */
  isEditing?: boolean
  deleteCode?: string
}
