import {User} from 'src/types/influxAdmin'

type UserDBPermissions = Array<Array<Record<string, boolean>>>
/**
 * Creates aeffective permissions in array for every supplied user
 * contains an array for every supplied database with a record
 * that contains permission names as keys and `true` values
 * for every assigned permission.
 *
 * @param dbNames
 * @param users
 * @returns
 */
export default function computeUsersEffectiveDBPermissions(
  users: User[],
  dbNames: string[]
): UserDBPermissions {
  return users.map(u => {
    const permRecord = u.permissions.reduce((acc, userPerm) => {
      if (userPerm.scope === 'all') {
        const allowed = userPerm.allowed.includes('ALL')
          ? {READ: true, WRITE: true}
          : userPerm.allowed.reduce((obj, x) => {
              obj[x] = true
              return obj
            }, {})
        dbNames.forEach(name => (acc[name] = {...allowed, ...acc[name]}))
      } else if (userPerm.scope === 'database') {
        acc[userPerm.name] = userPerm.allowed.reduce<Record<string, boolean>>(
          (obj, perm) => {
            obj[perm] = true
            return obj
          },
          acc[userPerm.name] || {}
        )
      }
      return acc
    }, {})
    return dbNames.map(name => permRecord[name] || {})
  })
}
