import {User, UserPermission, UserRole} from 'src/types/influxAdmin'

/** Array of corresponding users/roles with Arrays of corresponding databases containing granted permission records */
type EntitiesDBPermissions = Array<Array<Record<string, boolean>>>
/** record with database names and their permissions */
type DBPermRecords = Record<string, Record<string, boolean>>

/**
 * ComputeDBPermRecords computes EntitiesDBPermissions for
 * a suplied user/role and database names.
 */
export function computeDBPermRecords(
  u: User | UserRole,
  dbNames: string[]
): DBPermRecords {
  return u.permissions.reduce((acc: DBPermRecords, perm: UserPermission) => {
    if (perm.scope === 'all') {
      const allowed = perm.allowed.includes('ALL')
        ? {READ: true, WRITE: true}
        : perm.allowed.reduce((obj, x) => {
            obj[x] = true
            return obj
          }, {})
      dbNames.forEach(name => (acc[name] = {...allowed, ...acc[name]}))
    } else if (perm.scope === 'database') {
      acc[perm.name] = perm.allowed.reduce<Record<string, boolean>>(
        (obj, permValue) => {
          obj[permValue] = true
          return obj
        },
        acc[perm.name] || {}
      )
    }
    return acc
  }, {} as DBPermRecords)
}

/**
 * MergeDBPermRecords merges supplied DBPermRecords in to a new DBPermRecords instance.
 */
export function mergeDBPermRecords(...records: DBPermRecords[]): DBPermRecords {
  return records.reduce((acc: DBPermRecords, record: DBPermRecords) => {
    Object.entries(record).forEach(([db, perms]) => {
      const dbPerms = acc[db] || (acc[db] = {})
      Object.entries(perms).forEach(([perm, val]) => (dbPerms[perm] = val))
    })
    return acc
  }, {} as DBPermRecords)
}

/**
 * ComputeEntitiesDBPermissions computes EntitiesDBPermissions for
 * suplied users/roles and database names.
 */
export function computeEntitiesDBPermissions(
  entities: User[] | UserRole[],
  dbNames: string[]
): EntitiesDBPermissions {
  return entities.map((u: User | UserRole) => {
    const dbPermRecords = computeDBPermRecords(u, dbNames)
    return dbNames.map(dbName => dbPermRecords[dbName] || {})
  })
}
