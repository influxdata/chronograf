import React, {useCallback, useMemo, useState} from 'react'
import {connect, ResolveThunks} from 'react-redux'
import {withSource} from 'src/CheckSources'
import {Source} from 'src/types'
import {UserPermission, UserRole, User, Database} from 'src/types/influxAdmin'
import {notify as notifyAction} from 'src/shared/actions/notifications'
import {
  addUser as addUserActionCreator,
  editUser as editUserActionCreator,
  deleteUser as deleteUserActionCreator,
  createUserAsync,
  deleteUserAsync,
  updateUserRolesAsync,
  updateUserPasswordAsync,
  updateUserPermissionsAsync,
  filterUsers as filterUsersAction,
} from 'src/admin/actions/influxdb'
import {notifyDBUserNamePasswordInvalid} from 'src/shared/copy/notifications'
import AdminInfluxDBTabbedPage, {
  hasRoleManagement,
  isConnectedToLDAP,
} from './AdminInfluxDBTabbedPage'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import EmptyRow from 'src/admin/components/EmptyRow'
import UserRow from 'src/admin/components/UserRow'
import useDebounce from 'src/utils/useDebounce'
import useChangeEffect from 'src/utils/useChangeEffect'

const isValidUser = (user: User) => {
  const minLen = 3
  return user.name.length >= minLen && user.password.length >= minLen
}

const mapStateToProps = ({
  adminInfluxDB: {databases, users, roles, permissions},
}) => ({
  databases,
  users,
  roles,
  permissions,
})

const mapDispatchToProps = {
  filterUsers: filterUsersAction,
  createUser: createUserAsync,
  removeUser: deleteUserActionCreator,
  addUser: addUserActionCreator,
  editUser: editUserActionCreator,
  deleteUser: deleteUserAsync,
  updateUserPermissions: updateUserPermissionsAsync,
  updateUserRoles: updateUserRolesAsync,
  updateUserPassword: updateUserPasswordAsync,
  notify: notifyAction,
}

interface OwnProps {
  source: Source
}
interface ConnectedProps {
  databases: Database[]
  users: User[]
  roles: UserRole[]
  permissions: UserPermission[]
}

type ReduxDispatchProps = ResolveThunks<typeof mapDispatchToProps>
type Props = OwnProps & ConnectedProps & ReduxDispatchProps

const UsersPage = ({
  source,
  databases,
  users,
  roles,
  permissions,
  notify,
  createUser,
  filterUsers,
  addUser,
  removeUser,
  editUser,
  updateUserPermissions,
  updateUserRoles,
}: Props) => {
  if (isConnectedToLDAP(source)) {
    return (
      <AdminInfluxDBTabbedPage activeTab="users" source={source}>
        <div className="container-fluid">Users are managed via LDAP.</div>
      </AdminInfluxDBTabbedPage>
    )
  }
  const allAllowedPermissions = useMemo(() => {
    const globalPermissions = permissions.find(p => p.scope === 'all')
    return globalPermissions ? globalPermissions.allowed : []
  }, [permissions])

  const handleSaveUser = useCallback(
    async (user: User) => {
      if (!isValidUser(user)) {
        notify(notifyDBUserNamePasswordInvalid())
        return
      }
      if (user.isNew) {
        return createUser(source.links.users, user)
      }
    },
    [notify, source]
  )

  const [hasRoles, usersPage] = useMemo(
    () => [
      hasRoleManagement(source),
      `/sources/${source.id}/admin-influxdb/users`,
    ],
    [source]
  )

  // effective permissions
  const visibleUsers = useMemo(() => users.filter(x => !x.hidden), [users])
  const userDBPermissions = useMemo<Array<Array<Record<string, boolean>>>>(
    () =>
      visibleUsers.map(u => {
        const permRecord = u.permissions.reduce((acc, userPerm) => {
          if (userPerm.scope === 'all') {
            const allowed = userPerm.allowed.includes('ALL')
              ? {READ: true, WRITE: true}
              : userPerm.allowed.reduce((obj, x) => {
                  obj[x] = true
                  return obj
                }, {})
            databases.forEach(
              db => (acc[db.name] = {...allowed, ...acc[db.name]})
            )
          } else if (userPerm.scope === 'database') {
            acc[userPerm.name] = userPerm.allowed.reduce<
              Record<string, boolean>
            >((obj, perm) => {
              obj[perm] = true
              return obj
            }, acc[userPerm.name] || {})
          }
          return acc
        }, {})
        return databases.map(db => permRecord[db.name] || {})
      }),
    [databases, visibleUsers]
  )

  // filter users
  const [filterText, setFilterText] = useState('')
  const changeFilterText = useCallback(e => setFilterText(e.target.value), [
    setFilterText,
  ])
  const debouncedFilterText = useDebounce(filterText, 200)
  useChangeEffect(() => {
    filterUsers(debouncedFilterText)
  }, [debouncedFilterText])

  return (
    <AdminInfluxDBTabbedPage activeTab="users" source={source}>
      <div className="panel panel-solid influxdb-admin">
        <div className="panel-heading">
          <div>
            <div className="search-widget" style={{width: '250px'}}>
              <input
                type="text"
                className="form-control input-sm"
                placeholder={`Filter Users...`}
                value={filterText}
                onChange={changeFilterText}
              />
              <span className="icon search" />
            </div>
          </div>
          <button
            className="btn btn-sm btn-primary"
            disabled={users.some(u => u.isEditing)}
            onClick={addUser}
          >
            <span className="icon plus" /> Create User
          </button>
        </div>
        <div className="panel-body">
          <FancyScrollbar>
            <table className="table v-center admin-table table-highlight admin-table--compact">
              <thead>
                <tr>
                  <th>User</th>
                  <th className="admin-table--left-offset">
                    {hasRoles ? 'Roles' : 'Admin'}
                  </th>
                  {visibleUsers.length && hasRoles ? (
                    <th>Permissions</th>
                  ) : null}
                  {visibleUsers.length && databases.length
                    ? databases.map(db => (
                        <th
                          className="admin-table__dbheader"
                          title={`Database ${db.name}`}
                          key={db.name}
                        >
                          {db.name}
                        </th>
                      ))
                    : null}
                </tr>
              </thead>
              <tbody>
                {visibleUsers.length ? (
                  visibleUsers.map((user, userIndex) => (
                    <UserRow
                      key={user.name}
                      user={user}
                      page={`${usersPage}/${encodeURIComponent(
                        user.name || ''
                      )}`}
                      userDBPermissions={userDBPermissions[userIndex]}
                      allRoles={roles}
                      hasRoles={hasRoles}
                      onEdit={editUser}
                      onSave={handleSaveUser}
                      onCancel={removeUser}
                      isEditing={user.isEditing}
                      isNew={user.isNew}
                      allPermissions={allAllowedPermissions}
                      onUpdatePermissions={updateUserPermissions}
                      onUpdateRoles={updateUserRoles}
                    />
                  ))
                ) : (
                  <EmptyRow
                    tableName={'Users'}
                    colSpan={2}
                    filtered={!!filterText}
                  />
                )}
              </tbody>
            </table>
          </FancyScrollbar>
        </div>
      </div>
    </AdminInfluxDBTabbedPage>
  )
}

export default withSource(
  connect(mapStateToProps, mapDispatchToProps)(UsersPage)
)
