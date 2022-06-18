import React, {useCallback, useMemo, useState} from 'react'
import {connect, ResolveThunks} from 'react-redux'
import {withSource} from 'src/CheckSources'
import {Source, NotificationAction} from 'src/types'
import {UserRole, User, Database} from 'src/types/influxAdmin'
import {notify as notifyAction} from 'src/shared/actions/notifications'
import {
  changeShowRoles,
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
import NoEntities from 'src/admin/components/influxdb/NoEntities'
import UserRow from 'src/admin/components/UserRow'
import useDebounce from 'src/utils/useDebounce'
import useChangeEffect from 'src/utils/useChangeEffect'
import {ComponentSize, SlideToggle} from 'src/reusable_ui'
import {computeEffectiveUserDBPermissions} from '../../util/computeEffectiveDBPermissions'
import CreateUserDialog, {
  validatePassword,
  validateUserName,
} from '../../components/influxdb/CreateUserDialog'
import {withRouter, WithRouterProps} from 'react-router'
import MultiDBSelector from 'src/admin/components/influxdb/MultiDBSelector'

const validateUser = (
  user: Pick<User, 'name' | 'password'>,
  notify: NotificationAction
) => {
  if (!validateUserName(user.name)) {
    notify(notifyDBUserNameInvalid())
    return false
  }
  if (!validatePassword(user.password)) {
    notify(notifyDBPasswordInvalid())
    return false
  }
  return true
}

const mapStateToProps = ({
  adminInfluxDB: {databases, users, roles, selectedDBs, showRoles, usersFilter},
}) => ({
  databases,
  users,
  roles,
  selectedDBs,
  showRoles,
  usersFilter,
})

const mapDispatchToProps = {
  filterUsers: filterUsersAction,
  createUser: createUserAsync,
  toggleShowRoles: changeShowRoles,
  notify: notifyAction,
}

interface OwnProps {
  source: Source
}
interface ConnectedProps {
  databases: Database[]
  users: User[]
  roles: UserRole[]
  selectedDBs: string[]
  showRoles: boolean
  usersFilter: string
}

type ReduxDispatchProps = ResolveThunks<typeof mapDispatchToProps>
type Props = WithRouterProps & OwnProps & ConnectedProps & ReduxDispatchProps

const UsersPage = ({
  router,
  source,
  databases,
  users,
  roles,
  selectedDBs,
  showRoles,
  usersFilter,
  notify,
  createUser,
  filterUsers,
  toggleShowRoles,
}: Props) => {
  const [isEnterprise, usersPage] = useMemo(
    () => [
      hasRoleManagement(source),
      `/sources/${source.id}/admin-influxdb/users`,
    ],
    [source]
  )
  // database columns
  const visibleDBNames = useMemo<string[]>(() => {
    if (selectedDBs.includes('*')) {
      return databases.map(db => db.name)
    }
    return selectedDBs
  }, [databases, selectedDBs])

  // effective permissions
  const visibleUsers = useMemo(() => users.filter(x => !x.hidden), [users])
  const userDBPermissions = useMemo(
    () =>
      computeEffectiveUserDBPermissions(visibleUsers, roles, visibleDBNames),
    [visibleDBNames, visibleUsers, roles]
  )

  // filter users
  const [filterText, setFilterText] = useState(usersFilter)
  const changeFilterText = useCallback(e => setFilterText(e.target.value), [])
  const debouncedFilterText = useDebounce(filterText, 200)
  useChangeEffect(() => {
    filterUsers(debouncedFilterText)
  }, [debouncedFilterText])

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
          <MultiDBSelector />
          {isEnterprise && (
            <div className="hide-roles-toggle">
              <SlideToggle
                active={showRoles}
                onChange={toggleShowRoles}
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
          {visibleUsers.length ? (
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
                    {visibleDBNames.length
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
                  {visibleUsers.map((user, userIndex) => (
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
                  ))}
                </tbody>
              </table>
            </FancyScrollbar>
          ) : (
            <NoEntities entities="Users" filtered={!!debouncedFilterText} />
          )}
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
