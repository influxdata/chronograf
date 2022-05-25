import React from 'react'

import UserRoleDropdown from 'src/admin/components/UserRoleDropdown'
import {USERS_TABLE} from 'src/admin/constants/tableSizing'

import UserRowEdit from 'src/admin/components/UserRowEdit'
import {User} from 'src/types/influxAdmin'
import {Link} from 'react-router'

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
  onCancel: (user: User) => void
  onEdit: (User: User, updates: Partial<User>) => void
  onSave: (user: User) => Promise<void>
  onUpdateRoles: (user: User, roles: any[]) => void
}

const UserRow = ({
  user,
  allRoles,
  hasRoles,
  isNew,
  isEditing,
  page,
  userDBPermissions,
  onEdit,
  onSave,
  onCancel,
  onUpdateRoles,
}: Props) => {
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

  const adminStyle =
    ADMIN_STYLES[
      +!!user.permissions.find(
        x => x.scope === 'all' && (x.allowed || []).includes('ALL')
      )
    ]

  return (
    <tr>
      <td style={{width: `${USERS_TABLE.colUsername}px`}}>
        <Link to={page}>{user.name}</Link>
      </td>
      {hasRoles ? (
        <td>
          <UserRoleDropdown
            user={user}
            allRoles={allRoles}
            onUpdateRoles={onUpdateRoles}
          />
        </td>
      ) : (
        <td style={{width: `${USERS_TABLE.colAdministrator}px`}}>
          <span className={adminStyle.style}>{adminStyle.text}</span>
        </td>
      )}
      {userDBPermissions.map((perms, i) => (
        <td className="admin-table__dbperm" key={i}>
          <span
            className={`permission-value ${
              perms.READ || perms.ReadData ? 'granted' : 'denied'
            }`}
          >
            Read
          </span>
          <span
            className={`permission-value ${
              perms.WRITE || perms.WriteData ? 'granted' : 'denied'
            }`}
          >
            Write
          </span>
        </td>
      ))}
    </tr>
  )
}

export default UserRow
