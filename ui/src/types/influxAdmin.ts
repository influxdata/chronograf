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
