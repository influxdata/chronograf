import React, {useMemo} from 'react'
import {connect, ResolveThunks} from 'react-redux'
import {withSource} from 'src/CheckSources'
import {Source} from 'src/types'
import {UserPermission, UserRole, User} from 'src/types/influxAdmin'
import {notify as notifyAction} from 'src/shared/actions/notifications'
import {
  addRole as addRoleActionCreator,
  editRole as editRoleActionCreator,
  deleteRole as deleteRoleAction,
  createRoleAsync,
  deleteRoleAsync,
  updateRoleUsersAsync,
  updateRolePermissionsAsync,
  filterRoles as filterRolesAction,
} from 'src/admin/actions/influxdb'
import {notifyRoleNameInvalid} from 'src/shared/copy/notifications'
import AdminInfluxDBTabbedPage, {
  hasRoleManagement,
  isConnectedToLDAP,
} from './AdminInfluxDBTabbedPage'
import FilterBar from 'src/admin/components/FilterBar'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import EmptyRow from 'src/admin/components/EmptyRow'
import RoleRow from 'src/admin/components/RoleRow'
import {useCallback} from 'react'

const isValidRole = (role: UserRole): boolean => {
  const minLen = 3
  return role.name.length >= minLen
}

const mapStateToProps = ({adminInfluxDB: {users, roles, permissions}}) => ({
  users,
  roles,
  permissions,
})

const mapDispatchToProps = {
  addRole: addRoleActionCreator,
  removeRole: deleteRoleAction,
  editRole: editRoleActionCreator,
  createRole: createRoleAsync,
  deleteRole: deleteRoleAsync,
  filterRoles: filterRolesAction,
  updateRoleUsers: updateRoleUsersAsync,
  updateRolePermissions: updateRolePermissionsAsync,
  notify: notifyAction,
}

interface OwnProps {
  source: Source
}
interface ConnectedProps {
  users: User[]
  roles: UserRole[]
  permissions: UserPermission[]
}

type ReduxDispatchProps = ResolveThunks<typeof mapDispatchToProps>

type Props = OwnProps & ConnectedProps & ReduxDispatchProps

const RolesPage = ({
  source,
  permissions,
  users,
  roles,
  addRole,
  filterRoles,
  editRole,
  removeRole,
  deleteRole,
  updateRoleUsers,
  updateRolePermissions,
  createRole,
  notify,
}: Props) => {
  const allPermissions = useMemo(() => {
    const globalPermissions = permissions.find(p => p.scope === 'all')
    return globalPermissions ? globalPermissions.allowed : []
  }, [permissions])
  const handleSaveRole = useCallback(
    async (role: UserRole) => {
      if (!isValidRole(role)) {
        notify(notifyRoleNameInvalid())
        return
      }
      if (role.isNew) {
        createRole(source.links.roles, role)
      }
    },
    [source, createRole]
  )
  const isEditing = useMemo(() => roles.some(r => r.isEditing), [roles])

  if (!hasRoleManagement(source)) {
    return (
      <AdminInfluxDBTabbedPage activeTab="roles" source={source}>
        <div className="container-fluid">
          Roles management is not available for the currently selected InfluxDB
          Connection.
        </div>
      </AdminInfluxDBTabbedPage>
    )
  }
  if (isConnectedToLDAP(source)) {
    return (
      <AdminInfluxDBTabbedPage activeTab="roles" source={source}>
        <div className="container-fluid">
          Users are managed via LDAP, roles management is not available.
        </div>
      </AdminInfluxDBTabbedPage>
    )
  }
  return (
    <AdminInfluxDBTabbedPage activeTab="roles" source={source}>
      <div className="panel panel-solid influxdb-admin">
        <FilterBar
          type="roles"
          onFilter={filterRoles}
          isEditing={isEditing}
          onClickCreate={addRole}
        />
        <div className="panel-body">
          <FancyScrollbar>
            <table className="table v-center admin-table table-highlight">
              <thead>
                <tr>
                  <th>Name</th>
                  <th className="admin-table--left-offset">Permissions</th>
                  <th className="admin-table--left-offset">Users</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {roles.length ? (
                  roles
                    .filter(r => !r.hidden)
                    .map(role => (
                      <RoleRow
                        key={role.links.self}
                        allUsers={users}
                        allPermissions={allPermissions}
                        role={role}
                        onEdit={editRole}
                        onSave={handleSaveRole}
                        onCancel={removeRole}
                        onDelete={deleteRole}
                        onUpdateRoleUsers={updateRoleUsers}
                        onUpdateRolePermissions={updateRolePermissions}
                      />
                    ))
                ) : (
                  <EmptyRow entities="Roles" colSpan={4} />
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
  connect(mapStateToProps, mapDispatchToProps)(RolesPage)
)
