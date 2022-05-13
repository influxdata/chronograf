import React from 'react'
import {Component} from 'react'
import {connect} from 'react-redux'
import {Action, bindActionCreators, Dispatch} from 'redux'
import UsersTable from 'src/admin/components/UsersTable'
import {Source, SourceAuthenticationMethod} from 'src/types'
import {InfluxDBPermissions, Permission, Role, User} from 'src/types/auth'
import {notify as notifyAction} from 'src/shared/actions/notifications'
import {NotificationAction} from 'src/types/notifications'
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

const isValidUser = (user: User) => {
  const minLen = 3
  return user.name.length >= minLen && user.password.length >= minLen
}

interface Props {
  source: Source

  users: User[]
  roles: Role[]
  permissions: Permission[]

  filterUsers: () => void
  createUser: (url: string, user: User) => void
  removeUser: (user: User) => void
  addUser: () => void
  editUser: (user: User, updates: Partial<User>) => void
  deleteUser: (user: User) => void
  updateUserPermissions: (user: User, permissions: Permission[]) => void
  updateUserRoles: (user: User, roles: Role[]) => void
  updateUserPassword: (user: User, password: string) => void

  notify: NotificationAction
}

class UsersPage extends Component<Props> {
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

  private handleSaveUser = async (user: User) => {
    const {notify} = this.props
    if (!isValidUser(user)) {
      notify(notifyDBUserNamePasswordInvalid())
      return
    }
    if (user.isNew) {
      return this.props.createUser(this.props.source.links.users, user)
    }
  }
  private handleClickCreate = () => () => {
    this.props.addUser()
  }

  public render() {
    if (this.isLDAP) {
      return <div className="container-fluid">Users are managed via LDAP.</div>
    }
    const {
      users,
      roles,
      filterUsers,
      removeUser,
      editUser,
      deleteUser,
      updateUserPermissions,
      updateUserRoles,
      updateUserPassword,
    } = this.props
    return (
      <UsersTable
        users={users}
        allRoles={roles}
        hasRoles={this.hasRoles}
        permissions={this.allowed}
        isEditing={users.some(u => u.isEditing)}
        onSave={this.handleSaveUser}
        onCancel={removeUser}
        onClickCreate={this.handleClickCreate}
        onEdit={editUser}
        onDelete={deleteUser}
        onFilter={filterUsers}
        onUpdatePermissions={updateUserPermissions}
        onUpdateRoles={updateUserRoles}
        onUpdatePassword={updateUserPassword}
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
  filterUsers: bindActionCreators(filterUsersAction, dispatch),
  createUser: bindActionCreators(createUserAsync, dispatch),
  removeUser: bindActionCreators(deleteUserActionCreator, dispatch),
  addUser: bindActionCreators(addUserActionCreator, dispatch),
  editUser: bindActionCreators(editUserActionCreator, dispatch),
  deleteUser: bindActionCreators(deleteUserAsync, dispatch),
  updateUserPermissions: bindActionCreators(
    updateUserPermissionsAsync,
    dispatch
  ),
  updateUserRoles: bindActionCreators(updateUserRolesAsync, dispatch),
  updateUserPassword: bindActionCreators(updateUserPasswordAsync, dispatch),
  notify: bindActionCreators(notifyAction, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(UsersPage)
