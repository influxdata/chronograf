import React from 'react'

import {ROLES_TABLE} from 'src/admin/constants/tableSizing'
import {UserRole} from 'src/types/influxAdmin'
import {Link} from 'react-router'
import {PERMISSIONS} from 'src/shared/constants'

interface Props {
  role: UserRole
  allUsers: any[]
  page: string
  perDBPermissions: Array<Record<string, boolean>>
  showUsers: boolean
}

const RoleRow = ({
  role,
  allUsers,
  page,
  perDBPermissions,
  showUsers,
}: Props) => {
  return (
    <tr data-test={`role-${role.name}--row`}>
      <td style={{width: `${ROLES_TABLE.colName}px`}}>
        <Link to={page}>{role.name}</Link>
      </td>
      {showUsers && (
        <td
          className="admin-table--left-offset"
          title={!allUsers.length ? 'No users are defined' : ''}
        >
          {role.users.map((user, i) => (
            <span key={i} className="user-value granted">
              {user.name}
            </span>
          ))}
        </td>
      )}
      {perDBPermissions.map((perms, i) => (
        <td className="admin-table__dbperm" key={i}>
          <span
            className={`permission-value ${
              perms.ReadData ? 'granted' : 'denied'
            }`}
            title={PERMISSIONS.ReadData.description}
          >
            {PERMISSIONS.ReadData.displayName}
          </span>
          <span
            className={`permission-value ${
              perms.WriteData ? 'granted' : 'denied'
            }`}
            title={PERMISSIONS.WriteData.description}
          >
            {PERMISSIONS.WriteData.displayName}
          </span>
        </td>
      ))}
    </tr>
  )
}

export default RoleRow
