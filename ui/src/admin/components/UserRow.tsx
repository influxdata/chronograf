import React from 'react'

import UserPermissionsDropdown from 'src/admin/components/UserPermissionsDropdown'
import UserRoleDropdown from 'src/admin/components/UserRoleDropdown'
import {USERS_TABLE} from 'src/admin/constants/tableSizing'

import UserRowEdit from 'src/admin/components/UserRowEdit'
import {Database, User, UserPermission} from 'src/types/influxAdmin'
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

const mapOSSPermission = (allowed: string[]) => {
  let retVal = ''
  for (const x of allowed) {
    if (x === 'WRITE') {
      retVal += 'W'
      continue
    }
    if (x === 'READ') {
      retVal = 'R' + retVal
      continue
    }
  }
  return retVal
}
const OssUserDBPermissions = ({user}: {user: User}) => (
  <>
    {(user.permissions || [])
      .filter(x => x.scope === 'database')
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(x => (
        <>
          <span className="permission--db">{x.name}</span>
          {':'}
          <span className="permission--values">
            {mapOSSPermission(x.allowed)}
          </span>
        </>
      ))}
  </>
)

interface Props {
  databases: Database[]
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

const UserRow = ({
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
      <td>
        {hasRoles ? (
          <UserPermissionsDropdown
            user={user}
            allPermissions={allPermissions}
            onUpdatePermissions={onUpdatePermissions}
          />
        ) : (
          <OssUserDBPermissions user={user} />
        )}
      </td>
    </tr>
  )
}

export default UserRow
