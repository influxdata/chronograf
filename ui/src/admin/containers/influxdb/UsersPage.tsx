import React from 'react'
import {Component} from 'react'
import {connect, ResolveThunks} from 'react-redux'
import {withSource} from 'src/CheckSources'
import {Source} from 'src/types'
import {UserPermission, UserRole, User} from 'src/types/influxAdmin'
import {notify as notifyAction} from 'src/shared/actions/notifications'
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
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import EmptyRow from 'src/admin/components/EmptyRow'
import UserRow from 'src/admin/components/UserRow'
import FilterBar from 'src/admin/components/FilterBar'

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
  roles: UserRole[]
  permissions: UserPermission[]
}

type ReduxDispatchProps = ResolveThunks<typeof mapDispatchToProps>
type Props = OwnProps & ConnectedProps & ReduxDispatchProps

class UsersPage extends Component<Props> {
  private get allowed(): string[] {
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
      addUser,
      removeUser,
      editUser,
      updateUserPermissions,
      updateUserRoles,
    } = this.props
    const hasRoles = hasRoleManagement(source)
    const usersPage = `/sources/${source.id}/admin-influxdb/users`
    return (
      <AdminInfluxDBTab activeTab="users" source={source}>
        <div className="panel panel-solid influxdb-admin">
          <FilterBar
            type="users"
            onFilter={filterUsers}
            isEditing={users.some(u => u.isEditing)}
            onClickCreate={addUser}
          />
          <div className="panel-body">
            <FancyScrollbar>
              <table className="table v-center admin-table table-highlight">
                <thead>
                  <tr>
                    <th>User</th>
                    <th className="admin-table--left-offset">
                      {hasRoles ? 'Roles' : 'Admin'}
                    </th>
                    <th>Permissions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length ? (
                    users
                      .filter(u => !u.hidden)
                      .map(user => (
                        <UserRow
                          key={user.name}
                          user={user}
                          page={`${usersPage}/${encodeURIComponent(
                            user.name || ''
                          )}`}
                          onEdit={editUser}
                          onSave={this.handleSaveUser}
                          onCancel={removeUser}
                          isEditing={user.isEditing}
                          isNew={user.isNew}
                          allRoles={roles}
                          hasRoles={hasRoles}
                          allPermissions={this.allowed}
                          onUpdatePermissions={updateUserPermissions}
                          onUpdateRoles={updateUserRoles}
                        />
                      ))
                  ) : (
                    <EmptyRow tableName={'Users'} colSpan={3} />
                  )}
                </tbody>
              </table>
            </FancyScrollbar>
          </div>
        </div>
      </AdminInfluxDBTab>
    )
  }
}

export default withSource(
  connect(mapStateToProps, mapDispatchToProps)(UsersPage)
)
