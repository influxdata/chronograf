import React, {useCallback, useMemo} from 'react'

import RoleRowEdit from 'src/admin/components/RoleRowEdit'
import MultiSelectDropdown from 'src/shared/components/MultiSelectDropdown'
import ConfirmButton from 'src/shared/components/ConfirmButton'
import {ROLES_TABLE} from 'src/admin/constants/tableSizing'
import {UserPermission, UserRole, User} from 'src/types/influxAdmin'
import classnames from 'classnames'

interface Props {
  role: UserRole
  allUsers: User[]
  allPermissions: string[]
  onCancel: (role: UserRole) => void
  onEdit: (role: UserRole, updates: Partial<UserRole>) => void
  onSave: (role: UserRole) => Promise<void>
  onDelete: (role: UserRole) => Promise<void>
  onUpdateRoleUsers: (role: UserRole, users: User[]) => void
  onUpdateRolePermissions: (
    role: UserRole,
    permissions: UserPermission[]
  ) => void
}

const RoleRow = ({
  role: {name: roleName, permissions, users = [], isEditing},
  role,
  allUsers,
  allPermissions,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onUpdateRoleUsers,
  onUpdateRolePermissions,
}: Props) => {
  const handleUpdateUsers = useCallback(
    (usrs: User[]) => onUpdateRoleUsers(role, usrs),
    [role]
  )
  const handleUpdatePermissions = useCallback(
    (allowed: Array<{name: string}>) =>
      onUpdateRolePermissions(role, [
        {scope: 'all', allowed: allowed.map(({name}) => name)},
      ]),
    [role]
  )
  const selectedPerms = useMemo(() => {
    const allPerm = permissions?.find(x => x.scope === 'all')
    return allPerm?.allowed.map((name: string) => ({name})) || []
  }, [permissions])

  if (isEditing) {
    return (
      <RoleRowEdit
        role={role}
        onEdit={onEdit}
        onSave={onSave}
        onCancel={onCancel}
        colSpan={3}
      />
    )
  }

  const wrappedDelete = () => {
    onDelete(role)
  }

  return (
    <tr data-test={`role-${roleName}--row`}>
      <td style={{width: `${ROLES_TABLE.colName}px`}}>{roleName}</td>
      <td>
        {allPermissions && allPermissions.length ? (
          <MultiSelectDropdown
            items={allPermissions.map(name => ({name}))}
            selectedItems={selectedPerms}
            label={selectedPerms.length ? '' : 'Select Permissions'}
            onApply={handleUpdatePermissions}
            buttonSize="btn-xs"
            buttonColor="btn-primary"
            customClass={classnames(`dropdown-${ROLES_TABLE.colPermissions}`, {
              'admin-table--multi-select-empty': !permissions.length,
            })}
            resetStateOnReceiveProps={false}
          />
        ) : null}
      </td>
      <td>
        {allUsers && allUsers.length ? (
          <MultiSelectDropdown
            items={allUsers}
            selectedItems={users}
            label={users.length ? '' : 'Select Users'}
            onApply={handleUpdateUsers}
            buttonSize="btn-xs"
            buttonColor="btn-primary"
            customClass={classnames(`dropdown-${ROLES_TABLE.colUsers}`, {
              'admin-table--multi-select-empty': !users.length,
            })}
            resetStateOnReceiveProps={false}
          />
        ) : null}
      </td>
      <td className="text-right">
        <ConfirmButton
          customClass="table--show-on-row-hover"
          size="btn-xs"
          type="btn-danger"
          text="Delete Role"
          confirmAction={wrappedDelete}
        />
      </td>
    </tr>
  )
}

export default RoleRow
