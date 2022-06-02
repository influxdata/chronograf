import React from 'react'
import {Component} from 'react'
import {connect, ResolveThunks} from 'react-redux'
import {withSource} from 'src/CheckSources'
import {Source} from 'src/types'
import {UserPermission, UserRole, User} from 'src/types/influxAdmin'
import {notify as notifyAction} from 'src/shared/actions/notifications'
import {
  addRole as addRoleActionCreator,
  editRole as editRoleActionCreator,
  deleteRole,
  createRoleAsync,
  deleteRoleAsync,
  updateRoleUsersAsync,
  updateRolePermissionsAsync,
  filterRoles as filterRolesAction,
} from 'src/admin/actions/influxdb'
import {notifyRoleNameInvalid} from 'src/shared/copy/notifications'
import RolesTable from 'src/admin/components/RolesTable'
import AdminInfluxDBTabbedPage, {
  hasRoleManagement,
  isConnectedToLDAP,
} from './AdminInfluxDBTabbedPage'

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
  removeRole: deleteRole,
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

class RolesPage extends Component<Props> {
  private get allowed(): string[] {
    const {permissions} = this.props
    const globalPermissions = permissions.find(p => p.scope === 'all')
    return globalPermissions ? globalPermissions.allowed : []
  }

  private handleEditRole = (role, updates) => {
    this.props.editRole(role, updates)
  }
  private handleSaveRole = async role => {
    const {notify} = this.props
    if (!isValidRole(role)) {
      notify(notifyRoleNameInvalid())
      return
    }
    if (role.isNew) {
      this.props.createRole(this.props.source.links.roles, role)
    }
  }

  private handleCancelEditRole = role => {
    this.props.removeRole(role)
  }

  private handleDeleteRole = role => {
    this.props.deleteRole(role)
  }

  private handleUpdateRoleUsers = (role, users) => {
    this.props.updateRoleUsers(role, users)
  }

  private handleUpdateRolePermissions = (role, permissions) => {
    this.props.updateRolePermissions(role, permissions)
  }

  public render() {
    const source = this.props.source
    if (!hasRoleManagement(source)) {
      return (
        <AdminInfluxDBTabbedPage activeTab="roles" source={source}>
          <div className="container-fluid">
            Roles management is not available for the currently selected
            InfluxDB Connection.
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
    const {users, roles, addRole, filterRoles} = this.props
    return (
      <AdminInfluxDBTabbedPage activeTab="roles" source={source}>
        <RolesTable
          roles={roles}
          allUsers={users}
          permissions={this.allowed}
          isEditing={roles.some(r => r.isEditing)}
          onClickCreate={addRole}
          onEdit={this.handleEditRole}
          onSave={this.handleSaveRole}
          onCancel={this.handleCancelEditRole}
          onDelete={this.handleDeleteRole}
          onFilter={filterRoles}
          onUpdateRoleUsers={this.handleUpdateRoleUsers}
          onUpdateRolePermissions={this.handleUpdateRolePermissions}
        />
      </AdminInfluxDBTabbedPage>
    )
  }
}

export default withSource(
  connect(mapStateToProps, mapDispatchToProps)(RolesPage)
)
