import {User} from 'src/types/influxAdmin'

/**
 * Create a record of user's database permissions, separated by every database that
 * has some granted permissions. Enteprises
 * @param user infludb user
 * @param isEnterprise signalize enteprise InfluxDB, where <ALL> databases is mapped to an extra `''` database.
 */
export function computeUserDBPermissions(
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
