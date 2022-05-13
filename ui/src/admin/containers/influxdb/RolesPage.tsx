import React from 'react'
import {Component} from 'react'
import {connect} from 'react-redux'
import {Action, bindActionCreators, Dispatch} from 'redux'
import {Source, SourceAuthenticationMethod} from 'src/types'
import {InfluxDBPermissions, Permission, Role, User} from 'src/types/auth'
import {notify as notifyAction} from 'src/shared/actions/notifications'
import {NotificationAction} from 'src/types/notifications'
import {
  addRole,
  editRole,
  deleteRole,
  createRoleAsync,
  deleteRoleAsync,
  updateRoleUsersAsync,
  updateRolePermissionsAsync,
  filterRoles as filterRolesAction,
} from 'src/admin/actions/influxdb'
import {notifyRoleNameInvalid} from 'src/shared/copy/notifications'
import RolesTable from 'src/admin/components/RolesTable'

const isValidRole = role => {
  const minLen = 3
  return role.name.length >= minLen
}

interface Props {
  source: Source

  users: User[]
  roles: Role[]
  permissions: Permission[]

  addRole: () => void
  removeRole: (role: Role) => void
  editRole: (role: Role, updates: Partial<Role>) => void
  createRole: (url: string, role: Role) => void
  deleteRole: (role: Role) => void
  filterRoles: () => void
  updateRoleUsers: (role: Role, users: User[]) => void
  updateRolePermissions: (role: Role, permissions: Permission[]) => void

  notify: NotificationAction
}

class RolesPage extends Component<Props> {
  private get hasRoles(): boolean {
    return !!this.props.source.links.roles
  }

  private get isLDAP(): boolean {
    const {source} = this.props
    return source.authentication === SourceAuthenticationMethod.LDAP
  }

  private get allowed(): InfluxDBPermissions[] {
    const {permissions} = this.props
    const globalPermissions = permissions.find(p => p.scope === 'all')
    return globalPermissions ? globalPermissions.allowed : []
  }

  private handleClickCreate = () => () => {
    this.props.addRole()
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
    if (!this.hasRoles) {
      return (
        <div className="container-fluid">
          Roles managemebnt is not available for the currently selected InfluxDB
          Connection.
        </div>
      )
    }
    if (this.isLDAP) {
      return (
        <div className="container-fluid">
          Users are managed via LDAP, roles management not available.
        </div>
      )
    }
    const {users, roles, filterRoles} = this.props
    return (
      <RolesTable
        roles={roles}
        allUsers={users}
        permissions={this.allowed}
        isEditing={roles.some(r => r.isEditing)}
        onClickCreate={this.handleClickCreate}
        onEdit={this.handleEditRole}
        onSave={this.handleSaveRole}
        onCancel={this.handleCancelEditRole}
        onDelete={this.handleDeleteRole}
        onFilter={filterRoles}
        onUpdateRoleUsers={this.handleUpdateRoleUsers}
        onUpdateRolePermissions={this.handleUpdateRolePermissions}
      />
    )
  }
}

const mapStateToProps = ({adminInfluxDB: {users, roles, permissions}}) => ({
  users,
  roles,
  permissions,
})

const mapDispatchToProps = (dispatch: Dispatch<Action>) => ({
  addRole: bindActionCreators(addRole, dispatch),
  removeRole: bindActionCreators(deleteRole, dispatch),
  editRole: bindActionCreators(editRole, dispatch),
  createRole: bindActionCreators(createRoleAsync, dispatch),
  deleteRole: bindActionCreators(deleteRoleAsync, dispatch),
  filterRoles: bindActionCreators(filterRolesAction, dispatch),
  updateRoleUsers: bindActionCreators(updateRoleUsersAsync, dispatch),
  updateRolePermissions: bindActionCreators(
    updateRolePermissionsAsync,
    dispatch
  ),
  notify: bindActionCreators(notifyAction, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(RolesPage)
