import {User, UserPermission} from 'src/types/influxAdmin'

/**
 * Create a record of user's database permissions, separated by every database that
 * has some granted permissions. Enteprises
 * @param user infludb user
 * @param isEnterprise signalize enteprise InfluxDB, where <ALL> databases is mapped to an extra `''` database.
 */
export function computeUserPermissions(
  user: User,
  isEnterprise: boolean
): Record<string, Record<string, boolean>> {
  return user.permissions.reduce((acc, perm) => {
    if (!isEnterprise && perm.scope !== 'database') {
      return acc // do not include all permissions in OSS, they have separate administration
    }
    const dbName = perm.name || ''
    const dbPerms = acc[dbName] || (acc[dbName] = {})
    perm.allowed.forEach(x => (dbPerms[x] = true))
    return acc
  }, {})
}

/**
 * Computes changes in user permissions for a specific db and permission,
 * having original permission and a set of changes, return a new set of changes.
 */
export function computeUserPermissionsChange(
  db: string,
  perm: string,
  userPermissions: Record<string, Record<string, boolean>>,
  changedPermissions: Record<string, Record<string, boolean>>
): Record<string, Record<string, boolean>> | undefined {
  const origState = userPermissions[db]?.[perm]
  const {[db]: changedDB, ...otherDBs} = changedPermissions
  if (changedDB === undefined) {
    // no change for the database yet
    return {[db]: {[perm]: !origState}, ...otherDBs}
  }
  const {[perm]: changedPerm, ...otherPerms} = changedDB
  if (changedPerm === undefined) {
    // no change for the permission yet
    return {
      [db]: {[perm]: !origState, ...otherPerms},
      ...otherDBs,
    }
  }
  if (Object.keys(otherPerms).length) {
    // we are reverting what has been already changed,
    // return other changed permissions for this database
    return {
      [db]: otherPerms,
      ...otherDBs,
    }
  }
  // the current database is not changed as a result
  return otherDBs
}

export function toUserPermissions(
  user: User,
  userPermissions: Record<string, Record<string, boolean>>,
  changedPermissions: Record<string, Record<string, boolean>>,
  isEnterprise: boolean
): UserPermission[] {
  const newUserPermisssions = {...userPermissions}
  Object.entries(changedPermissions).forEach(([db, perms]) => {
    if (newUserPermisssions[db]) {
      newUserPermisssions[db] = {
        ...newUserPermisssions[db],
        ...perms,
      }
    } else {
      newUserPermisssions[db] = {...perms}
    }
  })
  return Object.entries(newUserPermisssions).reduce(
    (acc, [db, permRecord]) => {
      const allowed = Object.entries(permRecord).reduce(
        (allowedAcc, [perm, use]) => {
          if (use) {
            allowedAcc.push(perm)
          }
          return allowedAcc
        },
        []
      )
      if (allowed.length) {
        acc.push({
          scope: db ? 'database' : 'all',
          name: db || undefined,
          allowed,
        })
      }
      return acc
    },
    isEnterprise
      ? []
      : (user.permissions || []).filter(x => x.scope !== 'database')
  )
}
