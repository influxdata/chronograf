import React, {useMemo, useState} from 'react'
import {connect, ResolveThunks} from 'react-redux'
import {withSource} from 'src/CheckSources'
import {withRouter, WithRouterProps} from 'react-router'
import {Source, NotificationAction} from 'src/types'
import {UserRole, User, Database} from 'src/types/influxAdmin'
import {notify as notifyAction} from 'src/shared/actions/notifications'
import {
  createRoleAsync,
  filterRoles as filterRolesAction,
} from 'src/admin/actions/influxdb'
import {
  notifyRoleNameExists,
  notifyRoleNameInvalid,
} from 'src/shared/copy/notifications'
import AdminInfluxDBTabbedPage, {
  hasRoleManagement,
  isConnectedToLDAP,
} from './AdminInfluxDBTabbedPage'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import EmptyRow from 'src/admin/components/EmptyRow'
import RoleRow from 'src/admin/components/RoleRow'
import {useCallback} from 'react'
import allOrParticularSelection from './util/allOrParticularSelection'
import computeEffectiveDBPermissions from './util/computeEffectiveDBPermissions'
import useDebounce from 'src/utils/useDebounce'
import useChangeEffect from 'src/utils/useChangeEffect'
import {ComponentSize, MultiSelectDropdown, SlideToggle} from 'src/reusable_ui'
import CreateRoleDialog from 'src/admin/components/influxdb/CreateRoleDialog'

const minLen = 3
const validateRole = (
  user: Pick<UserRole, 'name'>,
  notify: NotificationAction
) => {
  if (user.name.length < minLen) {
    notify(notifyRoleNameInvalid())
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
  filterRoles: filterRolesAction,
  createRole: createRoleAsync,
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

const RolesPage = ({
  source,
  users,
  roles,
  databases,
  router,
  filterRoles,
  createRole,
  notify,
}: Props) => {
  const rolesPage = useMemo(
    () => `/sources/${source.id}/admin-influxdb/roles`,
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
  const visibleRoles = useMemo(() => roles.filter(x => !x.hidden), [roles])
  const perDBPermissions = useMemo(
    () => computeEffectiveDBPermissions(visibleRoles, visibleDBNames),
    [visibleDBNames, visibleRoles]
  )

  // filter users
  const [filterText, setFilterText] = useState('')
  const changeFilterText = useCallback(e => setFilterText(e.target.value), [
    setFilterText,
  ])
  const debouncedFilterText = useDebounce(filterText, 200)
  useChangeEffect(() => {
    filterRoles(debouncedFilterText)
  }, [debouncedFilterText])

  // hide users
  const [showUsers, setShowUsers] = useState(true)
  const changeHideUsers = useCallback(() => setShowUsers(!showUsers), [
    showUsers,
    setShowUsers,
  ])

  const [createVisible, setCreateVisible] = useState(false)
  const createNew = useCallback(
    async (role: {name: string}) => {
      if (roles.some(x => x.name === role.name)) {
        notify(notifyRoleNameExists())
        return
      }
      if (!validateRole(role, notify)) {
        return
      }
      await createRole(source.links.roles, role)
      router.push(
        `/sources/${source.id}/admin-influxdb/roles/${encodeURIComponent(
          role.name
        )}`
      )
    },
    [roles, router, source, notify]
  )

  return (
    <AdminInfluxDBTabbedPage activeTab="roles" source={source}>
      <CreateRoleDialog
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
              placeholder={`Filter Roles...`}
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
          <div className="hide-roles-toggle">
            <SlideToggle
              active={showUsers}
              onChange={changeHideUsers}
              size={ComponentSize.ExtraSmall}
            />
            Show Users
          </div>
          <div className="panel-heading--right">
            <button
              className="btn btn-sm btn-primary"
              onClick={() => setCreateVisible(true)}
              data-test="create-role--button"
            >
              <span className="icon plus" /> Create Role
            </button>
          </div>
        </div>
        <div className="panel-body">
          <FancyScrollbar>
            <table className="table v-center admin-table table-highlight admin-table--compact">
              <thead>
                <tr>
                  <th>Role</th>
                  {showUsers && (
                    <th className="admin-table--left-offset">Users</th>
                  )}
                  {visibleRoles.length && visibleDBNames.length
                    ? visibleDBNames.map(name => (
                        <th
                          className="admin-table__dbheader"
                          title={`user's effective permissions for db: ${name}`}
                          key={name}
                        >
                          {name}
                        </th>
                      ))
                    : null}
                </tr>
              </thead>
              <tbody>
                {visibleRoles.length ? (
                  visibleRoles.map((role, roleIndex) => (
                    <RoleRow
                      key={role.name}
                      role={role}
                      page={`${rolesPage}/${encodeURIComponent(
                        role.name || ''
                      )}`}
                      perDBPermissions={perDBPermissions[roleIndex]}
                      allUsers={users}
                      showUsers={showUsers}
                    />
                  ))
                ) : (
                  <EmptyRow
                    entities="Roles"
                    colSpan={1 + +showUsers}
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

const RolesPageAvailable = (props: Props) => {
  if (!hasRoleManagement(props.source)) {
    return (
      <AdminInfluxDBTabbedPage activeTab="roles" source={props.source}>
        <div className="container-fluid">
          Roles management is not available for the currently selected InfluxDB
          Connection.
        </div>
      </AdminInfluxDBTabbedPage>
    )
  }
  if (isConnectedToLDAP(props.source)) {
    return (
      <AdminInfluxDBTabbedPage activeTab="roles" source={props.source}>
        <div className="container-fluid">
          Users are managed via LDAP, roles management is not available.
        </div>
      </AdminInfluxDBTabbedPage>
    )
  }
  return <RolesPage {...props} />
}

export default withSource(
  withRouter(connect(mapStateToProps, mapDispatchToProps)(RolesPageAvailable))
)
