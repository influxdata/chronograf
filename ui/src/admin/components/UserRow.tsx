import React from 'react'

import {USERS_TABLE} from 'src/admin/constants/tableSizing'

import UserRowEdit from 'src/admin/components/UserRowEdit'
import {User} from 'src/types/influxAdmin'
import {Link} from 'react-router'
import {PERMISSIONS} from 'src/shared/constants'

const ADMIN_STYLES = [
  {
    style: 'admin--not-admin',
    text: 'No',
  },
  {
    style: 'admin--is-admin',
    text: 'Yes',
  },
]

interface Props {
  user: User
  allRoles: any[]
  hasRoles: boolean
  isNew: boolean
  isEditing: boolean
  page: string
  userDBPermissions: Array<Record<string, boolean>>
  showRoles: boolean
  onCancel: (user: User) => void
  onEdit: (User: User, updates: Partial<User>) => void
  onSave: (user: User) => Promise<void>
}

const UserRow = ({
  user,
  allRoles,
  hasRoles,
  isNew,
  isEditing,
  page,
  userDBPermissions,
  showRoles,
  onEdit,
  onSave,
  onCancel,
}: Props) => {
  if (isEditing) {
    return (
      <UserRowEdit
        user={user}
        isNew={isNew}
        onEdit={onEdit}
        onSave={onSave}
        onCancel={onCancel}
        colSpan={1 + +showRoles + userDBPermissions.length}
      />
    )
  }

  const adminStyle =
    ADMIN_STYLES[
      +!!user.permissions.find(
        x => x.scope === 'all' && (x.allowed || []).includes('ALL')
      )
    ]

  return (
    <tr data-test={'user-row--' + user.name}>
      <td style={{width: `${USERS_TABLE.colUsername}px`}}>
        <Link to={page}>{user.name}</Link>
      </td>
      {hasRoles && showRoles && (
        <td
          className="admin-table--left-offset"
          title={!allRoles.length ? 'No roles are defined' : ''}
        >
          {user.roles.map((role, i) => (
            <span key={i} className="role-value granted">
              {role.name}
            </span>
          ))}
        </td>
      )}
      {!hasRoles && (
        <td style={{width: `${USERS_TABLE.colAdministrator}px`}}>
          <span className={adminStyle.style}>{adminStyle.text}</span>
        </td>
      )}
      {userDBPermissions.map((perms, i) => (
        <td className="admin-table__dbperm" key={i} data-test="permissions--values">
          <span
            className={`permission-value ${
              perms.READ || perms.ReadData ? 'granted' : 'denied'
            }`}
            title={PERMISSIONS.ReadData.description}
            data-test="read-permission"
          >
            {PERMISSIONS.ReadData.displayName}
          </span>
          <span
            className={`permission-value ${
              perms.WRITE || perms.WriteData ? 'granted' : 'denied'
            }`}
            title={PERMISSIONS.WriteData.description}
            data-test="write-permission"
          >
            {PERMISSIONS.WriteData.displayName}
          </span>
        </td>
      ))}
    </tr>
  )
}

export default UserRow
