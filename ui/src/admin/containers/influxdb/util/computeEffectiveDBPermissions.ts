import {User, UserPermission, UserRole} from 'src/types/influxAdmin'

/** Array of users with Arrays of databases containing granted permission records */
type EntitiesDBPermissions = Array<Array<Record<string, boolean>>>
/**
 * Creates effective user permissions as a record
 * that contains permission names as keys and `true` values
 * for every assigned permission.
 */
export default function computeEffectiveDBPermissions(
  users: User[] | UserRole[],
  dbNames: string[]
): EntitiesDBPermissions {
  return users.map((u: User | UserRole) => {
    const permRecord = u.permissions.reduce(
      (acc: EntitiesDBPermissions, perm: UserPermission) => {
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
      },
      {} as EntitiesDBPermissions
    )
    return dbNames.map(name => permRecord[name] || {})
  })
}
