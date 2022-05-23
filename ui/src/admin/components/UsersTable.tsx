import React from 'react'

import UserRow from 'src/admin/components/UserRow'
import EmptyRow from 'src/admin/components/EmptyRow'
import FilterBar from 'src/admin/components/FilterBar'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import {User, UserPermission, UserRole} from 'src/types/influxAdmin'

interface Props {
  users: User[]
  allRoles: any[]
  hasRoles: boolean
  permissions: string[]
  isEditing: boolean
  onSave: (user: User) => Promise<void>
  onCancel: (user: User) => void
  onClickCreate: () => () => void
  onEdit: (user: User, updates: Partial<User>) => void
  onDelete: (user: User) => Promise<void>
  onFilter: (text: string) => void
  onUpdatePermissions: (
    user: User,
    permissions: UserPermission[]
  ) => Promise<void>
  onUpdateRoles: (user: User, roles: UserRole[]) => Promise<void>
  onUpdatePassword: (user: User, password: string) => Promise<void>
}
const UsersTable = ({
  users,
  allRoles,
  hasRoles,
  permissions,
  isEditing,
  onSave,
  onCancel,
  onClickCreate,
  onEdit,
  onDelete,
  onFilter,
  onUpdatePermissions,
  onUpdateRoles,
  onUpdatePassword,
}: Props) => (
  <div className="panel panel-solid influxdb-admin">
    <FilterBar
      type="users"
      onFilter={onFilter}
      isEditing={isEditing}
      onClickCreate={onClickCreate}
    />
    <div className="panel-body">
      <FancyScrollbar>
        <table className="table v-center admin-table table-highlight">
          <thead>
            <tr>
              <th>User</th>
              <th>Password</th>
              {hasRoles && <th className="admin-table--left-offset">Roles</th>}
              <th className="admin-table--left-offset">
                {hasRoles ? 'Permissions' : 'Administrator'}
              </th>
              <th />
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
                    onEdit={onEdit}
                    onSave={onSave}
                    onCancel={onCancel}
                    onDelete={onDelete}
                    isEditing={user.isEditing}
                    isNew={user.isNew}
                    allRoles={allRoles}
                    hasRoles={hasRoles}
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
      </FancyScrollbar>
    </div>
  </div>
)

export default UsersTable
