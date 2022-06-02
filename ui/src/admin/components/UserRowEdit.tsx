import React, {FunctionComponent} from 'react'
import ConfirmOrCancel from 'src/shared/components/ConfirmOrCancel'
import {User} from 'src/types/influxAdmin'

interface UserRowEditProps {
  user: User
  onEdit: (user: User, updates: Partial<User>) => void
  onSave: (user: User) => Promise<void>
  onCancel: (user: User) => void
  isNew: boolean
  colSpan: number
}

const UserRowEdit: FunctionComponent<UserRowEditProps> = ({
  user,
  onEdit,
  onSave,
  onCancel,
  colSpan,
}) => {
  const onKeyPress: React.KeyboardEventHandler = e => {
    if (e.key === 'Enter') {
      onSave(user)
    }
  }
  return (
    <tr className="admin-table--edit-row">
      <td colSpan={colSpan} style={{padding: '5px 0 5px 5px'}}>
        <div style={{display: 'flex', flexDirection: 'row'}}>
          <div>
            <input
              className="form-control input-xs"
              name="name"
              type="text"
              value={user.name || ''}
              placeholder="Username"
              onChange={e => onEdit(user, {name: e.target.value})}
              onKeyPress={onKeyPress}
              autoFocus={true}
              spellCheck={false}
              autoComplete="false"
            />
          </div>
          <div style={{padding: '0 5px 0 5px'}}>
            <input
              className="form-control input-xs"
              name="password"
              type="password"
              value={user.password || ''}
              placeholder="Password"
              onChange={e => onEdit(user, {password: e.target.value})}
              onKeyPress={onKeyPress}
              spellCheck={false}
              autoComplete="false"
            />
          </div>
          <ConfirmOrCancel
            item={user}
            onConfirm={onSave}
            onCancel={onCancel}
            buttonSize="btn-xs"
          />
        </div>
      </td>
    </tr>
  )
}

export default UserRowEdit
