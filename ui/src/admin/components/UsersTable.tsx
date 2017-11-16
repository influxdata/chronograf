import * as React from 'react'

import UserRow from 'admin/components/UserRow'
import EmptyRow from 'admin/components/EmptyRow'
import FilterBar from 'admin/components/FilterBar'
import {
  InfluxDBUser as User,
  InfluxDBRole as Role,
  InfluxDBPermission as Permission,
} from 'src/types/influxdbAdmin'
import {eReturnFunc} from 'src/types/funcs'

export interface UsersTableProps {
  users: User[]
  onEdit: (user: User, updates: {}) => void
  onSave: (user: User) => void
  onCancel: (user: User) => void
  onDelete: (user: User) => void
  onFilter: (text: string) => {}
  allRoles: Role[]
  hasRoles: boolean
  isEditing: boolean
  permissions: string[]
  onClickCreate: eReturnFunc
  onUpdateRoles: (user: User, roles: Role[]) => void
  onUpdatePassword: (user: User, password: string) => void
  onUpdatePermissions: (user: User, permissions: Permission[]) => void
}

const UsersTable: React.SFC<UsersTableProps> = ({
  users,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onFilter,
  allRoles,
  hasRoles,
  isEditing,
  permissions,
  onClickCreate,
  onUpdateRoles,
  onUpdatePassword,
  onUpdatePermissions,
}) => (
  <div className="panel panel-default">
    <FilterBar
      type="users"
      onFilter={onFilter}
      isEditing={isEditing}
      onClickCreate={onClickCreate}
    />
    <div className="panel-body">
      <table className="table v-center admin-table table-highlight">
        <thead>
          <tr>
            <th>User</th>
            <th>Password</th>
            {hasRoles && <th className="admin-table--left-offset">Roles</th>}
            <th className="admin-table--left-offset">Permissions</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {users.length ? (
            users
              .filter(u => !u.hidden)
              .map(user => (
                <UserRow
                  key={user.links.self}
                  user={user}
                  onEdit={onEdit}
                  onSave={onSave}
                  onCancel={onCancel}
                  onDelete={onDelete}
                  isNew={user.isNew}
                  allRoles={allRoles}
                  hasRoles={hasRoles}
                  isEditing={user.isEditing}
                  allPermissions={permissions}
                  onUpdatePermissions={onUpdatePermissions}
                  onUpdateRoles={onUpdateRoles}
                  onUpdatePassword={onUpdatePassword}
                />
              ))
          ) : (
            <EmptyRow tableName={'Users'} />
          )}
        </tbody>
      </table>
    </div>
  </div>
)

export default UsersTable
