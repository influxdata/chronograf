import React from 'react'

import ConfirmOrCancel from 'src/shared/components/ConfirmOrCancel'
import {UserRole} from 'src/types/influxAdmin'

interface UserRowEditProps {
  role: UserRole
  onEdit: (role: UserRole, updates: Partial<UserRole>) => void
  onSave: (role: UserRole) => Promise<void>
  onCancel: (role: UserRole) => void
  colSpan: number
}

const RoleRowEdit = ({
  role,
  onEdit,
  onSave,
  onCancel,
  colSpan,
}: UserRowEditProps) => {
  const onKeyPress: React.KeyboardEventHandler = e => {
    if (e.key === 'Enter') {
      onSave(role)
    }
  }

  return (
    <tr className="admin-table--edit-row">
      <td colSpan={colSpan} style={{padding: '5px 0 5px 5px'}}>
        <div style={{display: 'flex', flexDirection: 'row', columnGap: '5px'}}>
          <input
            className="form-control input-xs"
            name="name"
            type="text"
            value={role.name || ''}
            placeholder="Role name"
            onChange={e => onEdit(role, {name: e.target.value})}
            onKeyPress={onKeyPress}
            autoFocus={true}
            spellCheck={false}
            autoComplete="false"
          />
          <ConfirmOrCancel
            item={role}
            onConfirm={onSave}
            onCancel={onCancel}
            buttonSize="btn-xs"
          />
        </div>
      </td>
    </tr>
  )
}

export default RoleRowEdit
