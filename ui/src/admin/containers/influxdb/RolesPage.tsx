import React, {useMemo, useState} from 'react'
import {connect, ResolveThunks} from 'react-redux'
import {withSource} from 'src/CheckSources'
import {withRouter, WithRouterProps} from 'react-router'
import {Source, NotificationAction} from 'src/types'
import {UserRole, User, Database} from 'src/types/influxAdmin'
import {notify as notifyAction} from 'src/shared/actions/notifications'
import {
  changeShowUsers,
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
import NoEntities from 'src/admin/components/influxdb/NoEntities'
import RoleRow from 'src/admin/components/RoleRow'
import {useCallback} from 'react'
import {computeEntitiesDBPermissions} from '../../util/computeEffectiveDBPermissions'
import useDebounce from 'src/utils/useDebounce'
import useChangeEffect from 'src/utils/useChangeEffect'
import {ComponentSize, SlideToggle} from 'src/reusable_ui'
import CreateRoleDialog, {
  validateRoleName,
} from 'src/admin/components/influxdb/CreateRoleDialog'
import MultiDBSelector from 'src/admin/components/influxdb/MultiDBSelector'

const validateRole = (
  role: Pick<UserRole, 'name'>,
  notify: NotificationAction
) => {
  if (!validateRoleName(role.name)) {
    notify(notifyRoleNameInvalid())
    return false
  }
  return true
}

const mapStateToProps = ({
  adminInfluxDB: {databases, users, roles, selectedDBs, showUsers},
}) => ({
  databases,
  users,
  roles,
  selectedDBs,
  showUsers,
})

const mapDispatchToProps = {
  filterRoles: filterRolesAction,
  createRole: createRoleAsync,
  notify: notifyAction,
  toggleShowUsers: changeShowUsers,
}

interface OwnProps {
  source: Source
}
interface ConnectedProps {
  databases: Database[]
  users: User[]
  roles: UserRole[]
  selectedDBs: string[]
  showUsers: boolean
}

type ReduxDispatchProps = ResolveThunks<typeof mapDispatchToProps>

type Props = WithRouterProps & OwnProps & ConnectedProps & ReduxDispatchProps

const RolesPage = ({
  source,
  users,
  roles,
  databases,
  selectedDBs,
  showUsers,
  router,
  filterRoles,
  createRole,
  toggleShowUsers,
  notify,
}: Props) => {
  const rolesPage = useMemo(
    () => `/sources/${source.id}/admin-influxdb/roles`,
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
  const visibleRoles = useMemo(() => roles.filter(x => !x.hidden), [roles])
  const perDBPermissions = useMemo(
    () => computeEntitiesDBPermissions(visibleRoles, visibleDBNames),
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
          <MultiDBSelector />
          <div className="hide-roles-toggle">
            <SlideToggle
              active={showUsers}
              onChange={toggleShowUsers}
              size={ComponentSize.ExtraSmall}
              dataTest="show-users--toggle"
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
          {visibleRoles.length ? (
            <FancyScrollbar>
              <table className="table v-center admin-table table-highlight admin-table--compact">
                <thead data-test="admin-table--head">
                  <tr>
                    <th>Role</th>
                    {showUsers && (
                      <th className="admin-table--left-offset">Users</th>
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
                <tbody data-test="admin-table--body">
                  {visibleRoles.map((role, roleIndex) => (
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
                  ))}
                </tbody>
              </table>
            </FancyScrollbar>
          ) : (
            <NoEntities entities="Roles" filtered={!!debouncedFilterText} />
          )}
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
