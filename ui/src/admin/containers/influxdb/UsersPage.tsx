import React, {useCallback, useMemo, useState} from 'react'
import {connect, ResolveThunks} from 'react-redux'
import {withSource} from 'src/CheckSources'
import {Source} from 'src/types'
import {UserRole, User, Database} from 'src/types/influxAdmin'
import {notify as notifyAction} from 'src/shared/actions/notifications'
import {
  addUser as addUserActionCreator,
  editUser as editUserActionCreator,
  deleteUser as deleteUserActionCreator,
  createUserAsync,
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
import MultiSelectDropdown from 'src/reusable_ui/components/dropdowns/MultiSelectDropdown'
import {ComponentSize, SlideToggle} from 'src/reusable_ui'

const isValidUser = (user: User) => {
  const minLen = 3
  return user.name.length >= minLen && user.password.length >= minLen
}

const mapStateToProps = ({adminInfluxDB: {databases, users, roles}}) => ({
  databases,
  users,
  roles,
})

const mapDispatchToProps = {
  filterUsers: filterUsersAction,
  createUser: createUserAsync,
  removeUser: deleteUserActionCreator,
  addUser: addUserActionCreator,
  editUser: editUserActionCreator,
  notify: notifyAction,
}

interface OwnProps {
  source: Source
}
interface ConnectedProps {
  databases: Database[]
  users: User[]
  roles: UserRole[]
}

type ReduxDispatchProps = ResolveThunks<typeof mapDispatchToProps>
type Props = OwnProps & ConnectedProps & ReduxDispatchProps

const UsersPage = ({
  source,
  databases,
  users,
  roles,
  notify,
  createUser,
  filterUsers,
  addUser,
  removeUser,
  editUser,
}: Props) => {
  if (isConnectedToLDAP(source)) {
    return (
      <AdminInfluxDBTabbedPage activeTab="users" source={source}>
        <div className="container-fluid">Users are managed via LDAP.</div>
      </AdminInfluxDBTabbedPage>
    )
  }
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

  const [isEnterprise, usersPage] = useMemo(
    () => [
      hasRoleManagement(source),
      `/sources/${source.id}/admin-influxdb/users`,
    ],
    [source]
  )
  // filter databases
  const [selectedDBs, setSelectedDBs] = useState<string[]>(['*'])
  const visibleDBNames = useMemo<string[]>(() => {
    if (selectedDBs.includes('*')) {
      return databases.map(db => db.name)
    }
    return selectedDBs
  }, [databases, selectedDBs])
  const changeSelectedDBs = useCallback(
    (newDBs: string[]) =>
      setSelectedDBs((oldDBs: string[]) => {
        if (newDBs.length <= 1) {
          return newDBs
        }
        const isAll = newDBs.includes('*')
        const wasAll = oldDBs.includes('*')
        if (wasAll && isAll) {
          return newDBs.filter(x => x !== '*')
        }
        if (!wasAll && isAll) {
          return ['*']
        }
        return newDBs
      }),
    [setSelectedDBs]
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
            visibleDBNames.forEach(
              name => (acc[name] = {...allowed, ...acc[name]})
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
        return visibleDBNames.map(name => permRecord[name] || {})
      }),
    [visibleDBNames, visibleUsers]
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

  // hide role
  const [showRoles, setShowRoles] = useState(true)
  const changeHideRoles = useCallback(() => setShowRoles(!showRoles), [
    showRoles,
    setShowRoles,
  ])
  return (
    <AdminInfluxDBTabbedPage activeTab="users" source={source}>
      <div className="panel panel-solid influxdb-admin">
        <div className="panel-heading">
          <div className="search-widget">
            <input
              type="text"
              className="form-control input-sm"
              placeholder={`Filter Users...`}
              value={filterText}
              onChange={changeFilterText}
            />
            <span className="icon search" />
          </div>
          <div className="db-selector">
            <MultiSelectDropdown
              onChange={changeSelectedDBs}
              selectedIDs={selectedDBs}
              emptyText="<no database>"
            >
              {databases.reduce(
                (acc, db) => {
                  acc.push(
                    <MultiSelectDropdown.Item
                      key={db.name}
                      id={db.name}
                      value={{id: db.name}}
                    >
                      {db.name}
                    </MultiSelectDropdown.Item>
                  )
                  return acc
                },
                [
                  <MultiSelectDropdown.Item id="*" key="*" value={{id: '*'}}>
                    All Databases
                  </MultiSelectDropdown.Item>,
                  <MultiSelectDropdown.Divider id="" key="" />,
                ]
              )}
            </MultiSelectDropdown>
          </div>
          {isEnterprise && (
            <div className="hide-roles-toggle">
              <SlideToggle
                active={showRoles}
                onChange={changeHideRoles}
                size={ComponentSize.ExtraSmall}
              />
              Show Roles
            </div>
          )}
          <div className="panel-heading--right">
            <button
              className="btn btn-sm btn-primary"
              disabled={users.some(u => u.isEditing)}
              onClick={addUser}
            >
              <span className="icon plus" /> Create User
            </button>
          </div>
        </div>
        <div className="panel-body">
          <FancyScrollbar>
            <table className="table v-center admin-table table-highlight admin-table--compact">
              <thead>
                <tr>
                  <th>User</th>
                  {showRoles && (
                    <th className="admin-table--left-offset">
                      {isEnterprise ? 'Roles' : 'Admin'}
                    </th>
                  )}
                  {visibleUsers.length && visibleDBNames.length
                    ? visibleDBNames.map(name => (
                        <th
                          className="admin-table__dbheader"
                          title={`effective permissions for db: ${name}`}
                          key={name}
                        >
                          {name}
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
                      showRoles={showRoles}
                      hasRoles={isEnterprise}
                      onEdit={editUser}
                      onSave={handleSaveUser}
                      onCancel={removeUser}
                      isEditing={user.isEditing}
                      isNew={user.isNew}
                    />
                  ))
                ) : (
                  <EmptyRow
                    entities="Users"
                    colSpan={1 + +showRoles}
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
