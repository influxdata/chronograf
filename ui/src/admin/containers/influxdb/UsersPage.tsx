import React from 'react'
import {Component} from 'react'
import {connect, ResolveThunks} from 'react-redux'
import {withSource} from 'src/CheckSources'
import {Source} from 'src/types'
import {InfluxDBPermissions, Permission, Role, User} from 'src/types/auth'
import {notify as notifyAction} from 'src/shared/actions/notifications'
import UsersTable from 'src/admin/components/UsersTable'
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
import AdminInfluxDBTab, {
  hasRoleManagement,
  isConnectedToLDAP,
} from './AdminInfluxDBTab'

const isValidUser = (user: User) => {
  const minLen = 3
  return user.name.length >= minLen && user.password.length >= minLen
}

const mapStateToProps = ({adminInfluxDB: {users, roles, permissions}}) => ({
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
  users: User[]
  roles: Role[]
  permissions: Permission[]
}

type ReduxDispatchProps = ResolveThunks<typeof mapDispatchToProps>
type Props = OwnProps & ConnectedProps & ReduxDispatchProps

class UsersPage extends Component<Props> {
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
    const source = this.props.source
    if (isConnectedToLDAP(source)) {
      return (
        <AdminInfluxDBTab activeTab="users" source={source}>
          <div className="container-fluid">Users are managed via LDAP.</div>
        </AdminInfluxDBTab>
      )
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
      <AdminInfluxDBTab activeTab="users" source={source}>
        <UsersTable
          users={users}
          allRoles={roles}
          hasRoles={hasRoleManagement(source)}
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
      </AdminInfluxDBTab>
    )
  }
}

export default withSource(
  connect(mapStateToProps, mapDispatchToProps)(UsersPage)
)
