import {User, UserPermission, UserRole} from 'src/types/influxAdmin'

/** Array of corresponding users/roles with Arrays of corresponding databases containing granted permission records */
type EntitiesDBPermissions = Array<Array<Record<string, boolean>>>
/** record with database names and their permissions */
type DBPermRecords = Record<string, Record<string, boolean>>

type GetDBPermRecords<E extends User | UserRole> = (e: E) => DBPermRecords
const getEmptyDBPermRecords: GetDBPermRecords<any> = () => ({})

/**
 * ComputeDBPermRecords computes EntitiesDBPermissions for
 * a suplied user/role and database names.
 */
export function computeDBPermRecords<E extends User | UserRole>(
  e: E,
  dbNames: string[],
  initialDBPermRecords: DBPermRecords = {}
): DBPermRecords {
  return e.permissions.reduce((acc: DBPermRecords, perm: UserPermission) => {
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
  }, initialDBPermRecords)
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
export function computeEntitiesDBPermissions<E extends User | UserRole>(
  entities: E[],
  dbNames: string[],
  getInitialDBRecords: GetDBPermRecords<E> = getEmptyDBPermRecords
): EntitiesDBPermissions {
  return entities.map((e: E) => {
    const dbPermRecords = computeDBPermRecords(
      e,
      dbNames,
      getInitialDBRecords(e)
    )
    return dbNames.map(dbName => dbPermRecords[dbName] || {})
  })
}

/**
 * ComputeEffectiveUserDBPermissions computes effective DB permissions for all supplied
 * users from their permissions and their roles.
 */
export function computeEffectiveUserDBPermissions(
  users: User[],
  roles: UserRole[],
  dbNames: string[]
): EntitiesDBPermissions {
  const rolesDBPermRecords = roles.reduce((acc, role) => {
    acc[role.name] = [role, undefined]
    return acc
  }, {} as Record<string, [UserRole, DBPermRecords | undefined]>)
  const getInitialPermRecord: GetDBPermRecords<User> = (u: User) => {
    if (u.roles?.length) {
      return u.roles.reduce((acc, {name: roleName}) => {
        const pair = rolesDBPermRecords[roleName]
        let rolePerms = pair[1]
        if (!rolePerms) {
          rolePerms = computeDBPermRecords(pair[0], dbNames)
          pair[1] = rolePerms
        }
        return mergeDBPermRecords(acc, rolePerms)
      }, {} as DBPermRecords)
    }
    return {}
  }

  return computeEntitiesDBPermissions(users, dbNames, getInitialPermRecord)
}
