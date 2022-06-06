import React, {useCallback, useMemo, useState} from 'react'
import {connect, ResolveThunks} from 'react-redux'
import {withSource} from 'src/CheckSources'
import {Source, NotificationAction} from 'src/types'
import {UserRole, User, Database} from 'src/types/influxAdmin'
import {notify as notifyAction} from 'src/shared/actions/notifications'
import {
  createUserAsync,
  filterUsers as filterUsersAction,
} from 'src/admin/actions/influxdb'
import {
  notifyDBUserNameInvalid,
  notifyDBPasswordInvalid,
  notifyDBUserNameExists,
} from 'src/shared/copy/notifications'
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
import computeEffectiveDBPermissions from './util/computeEffectiveDBPermissions'
import allOrParticularSelection from './util/allOrParticularSelection'
import CreateUserDialog from '../../components/influxdb/CreateUserDialog'
import {withRouter, WithRouterProps} from 'react-router'

const minLen = 3
const validateUser = (
  user: Pick<User, 'name' | 'password'>,
  notify: NotificationAction
) => {
  if (user.name.length < minLen) {
    notify(notifyDBUserNameInvalid())
    return false
  }
  if (user.password.length < minLen) {
    notify(notifyDBPasswordInvalid())
    return false
  }
  return true
}

const mapStateToProps = ({adminInfluxDB: {databases, users, roles}}) => ({
  databases,
  users,
  roles,
})

const mapDispatchToProps = {
  filterUsers: filterUsersAction,
  createUser: createUserAsync,
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
type Props = WithRouterProps & OwnProps & ConnectedProps & ReduxDispatchProps

const UsersPage = ({
  router,
  source,
  databases,
  users,
  roles,
  notify,
  createUser,
  filterUsers,
}: Props) => {
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
        return allOrParticularSelection(oldDBs, newDBs)
      }),
    [setSelectedDBs]
  )

  // effective permissions
  const visibleUsers = useMemo(() => users.filter(x => !x.hidden), [users])
  const userDBPermissions = useMemo(
    () => computeEffectiveDBPermissions(visibleUsers, visibleDBNames),
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

  const [createVisible, setCreateVisible] = useState(false)
  const createNew = useCallback(
    async (user: {name: string; password: string}) => {
      if (users.some(x => x.name === user.name)) {
        notify(notifyDBUserNameExists())
        return
      }
      if (!validateUser(user, notify)) {
        return
      }
      await createUser(source.links.users, user)
      router.push(
        `/sources/${source.id}/admin-influxdb/users/${encodeURIComponent(
          user.name
        )}`
      )
    },
    [users, router, source, notify]
  )

  return (
    <AdminInfluxDBTabbedPage activeTab="users" source={source}>
      <CreateUserDialog
        visible={createVisible}
        setVisible={setCreateVisible}
        create={createNew}
      />
      <div className="panel panel-solid influxdb-admin">
        <div className="panel-heading">
          <div className="search-widget">
            <input
              type="text"
              className="form-control input-sm"
              placeholder={`Filter Users...`}
              value={filterText}
              onChange={changeFilterText}
              data-test="user-filter--input"
            />
            <span className="icon search" />
          </div>
          <div className="db-selector" data-test="db-selector">
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
              onClick={() => setCreateVisible(true)}
              data-test="create-user--button"
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
                          title={`role's effective permissions for db: ${name}`}
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
const UsersPageAvailable = (props: Props) => {
  if (isConnectedToLDAP(props.source)) {
    return (
      <AdminInfluxDBTabbedPage activeTab="users" source={props.source}>
        <div className="container-fluid">
          Users are managed in LDAP directory.
        </div>
      </AdminInfluxDBTabbedPage>
    )
  }
  return <UsersPage {...props} />
}

export default withSource(
  withRouter(connect(mapStateToProps, mapDispatchToProps)(UsersPageAvailable))
)
