import React, {PureComponent} from 'react'

import UserPermissionsDropdown from 'src/admin/components/UserPermissionsDropdown'
import UserRoleDropdown from 'src/admin/components/UserRoleDropdown'
import {USERS_TABLE} from 'src/admin/constants/tableSizing'

import UserRowEdit from 'src/admin/components/UserRowEdit'
import {User, UserPermission} from 'src/types/influxAdmin'
import {ErrorHandling} from 'src/shared/decorators/errors'
import UserAdminDropdown from './UserAdminDropdown'
import {Link} from 'react-router'

interface UserRowProps {
  user: User
  allRoles: any[]
  allPermissions: string[]
  hasRoles: boolean
  isNew: boolean
  isEditing: boolean
  page: string
  onCancel: (user: User) => void
  onEdit: (User: User, updates: Partial<User>) => void
  onSave: (user: User) => Promise<void>
  onUpdatePermissions: (user: User, permissions: UserPermission[]) => void
  onUpdateRoles: (user: User, roles: any[]) => void
}

@ErrorHandling
class UserRow extends PureComponent<UserRowProps> {
  public render() {
    const {
      user,
      allRoles,
      allPermissions,
      hasRoles,
      isNew,
      isEditing,
      page,
      onEdit,
      onSave,
      onCancel,
      onUpdatePermissions,
      onUpdateRoles,
    } = this.props

    if (isEditing) {
      return (
        <UserRowEdit
          user={user}
          isNew={isNew}
          onEdit={onEdit}
          onSave={onSave}
          onCancel={onCancel}
          hasRoles={hasRoles}
        />
      )
    }

    return (
      <tr>
        <td style={{width: `${USERS_TABLE.colUsername}px`}}>
          <Link to={page}>{user.name}</Link>
        </td>
        {hasRoles && (
          <td>
            <UserRoleDropdown
              user={user}
              allRoles={allRoles}
              onUpdateRoles={onUpdateRoles}
            />
          </td>
        )}
        <td>
          {this.hasPermissions ? (
            <UserPermissionsDropdown
              user={user}
              allPermissions={allPermissions}
              onUpdatePermissions={onUpdatePermissions}
            />
          ) : (
            <UserAdminDropdown
              user={user}
              onUpdatePermissions={onUpdatePermissions}
            />
          )}
        </td>
      </tr>
    )
  }

  private get hasPermissions() {
    const {allPermissions, hasRoles} = this.props
    return hasRoles && allPermissions && !!allPermissions.length
  }
}

export default UserRow
