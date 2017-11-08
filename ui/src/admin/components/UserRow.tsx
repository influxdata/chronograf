import * as React from 'react'
import * as PropTypes from 'prop-types'

import * as _ from 'lodash'
import * as classnames from 'classnames'

import UserEditName from 'admin/components/UserEditName'
import UserNewPassword from 'admin/components/UserNewPassword'
import MultiSelectDropdown from 'shared/components/MultiSelectDropdown'
import ConfirmButtons from 'shared/components/ConfirmButtons'
import DeleteConfirmTableCell from 'shared/components/DeleteConfirmTableCell'
import ChangePassRow from 'admin/components/ChangePassRow'
import {USERS_TABLE} from 'admin/constants/tableSizing'

const UserRow = ({
  user: {name, roles = [], permissions, password},
  user,
  allRoles,
  allPermissions,
  hasRoles,
  isNew,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onUpdatePermissions,
  onUpdateRoles,
  onUpdatePassword,
}) => {
  const handleUpdatePermissions = perms => {
    const allowed = perms.map(p => p.name)
    onUpdatePermissions(user, [{scope: 'all', allowed}])
  }

  const handleUpdateRoles = roleNames => {
    onUpdateRoles(
      user,
      allRoles.filter(r => roleNames.find(rn => rn.name === r.name))
    )
  }

  const handleUpdatePassword = () => {
    onUpdatePassword(user, password)
  }

  const perms = _.get(permissions, ['0', 'allowed'], [])

  if (isEditing) {
    return (
      <tr className="admin-table--edit-row">
        <UserEditName user={user} onEdit={onEdit} onSave={onSave} />
        <UserNewPassword
          user={user}
          onEdit={onEdit}
          onSave={onSave}
          isNew={isNew}
        />
        {hasRoles ? <td className="admin-table--left-offset">--</td> : null}
        <td className="admin-table--left-offset">--</td>
        <td
          className="text-right"
          style={{width: `${USERS_TABLE.colDelete}px`}}
        >
          <ConfirmButtons
            item={user}
            onConfirm={onSave}
            onCancel={onCancel}
            buttonSize="btn-xs"
          />
        </td>
      </tr>
    )
  }

  return (
    <tr>
      <td style={{width: `${USERS_TABLE.colUsername}px`}}>
        {name}
      </td>
      <td style={{width: `${USERS_TABLE.colPassword}px`}}>
        <ChangePassRow
          onEdit={onEdit}
          onApply={handleUpdatePassword}
          user={user}
          buttonSize="btn-xs"
        />
      </td>
      {hasRoles
        ? <td>
            <MultiSelectDropdown
              items={allRoles}
              selectedItems={roles.map(r => ({name: r.name}))}
              label={roles.length ? '' : 'Select Roles'}
              onApply={handleUpdateRoles}
              buttonSize="btn-xs"
              buttonColor="btn-primary"
              customClass={classnames(`dropdown-${USERS_TABLE.colRoles}`, {
                'admin-table--multi-select-empty': !roles.length,
              })}
            />
          </td>
        : null}
      <td>
        {allPermissions && allPermissions.length
          ? <MultiSelectDropdown
              items={allPermissions.map(p => ({name: p}))}
              selectedItems={perms.map(p => ({name: p}))}
              label={
                permissions && permissions.length ? '' : 'Select Permissions'
              }
              onApply={handleUpdatePermissions}
              buttonSize="btn-xs"
              buttonColor="btn-primary"
              customClass={classnames(
                `dropdown-${USERS_TABLE.colPermissions}`,
                {
                  'admin-table--multi-select-empty': !permissions.length,
                }
              )}
            />
          : null}
      </td>
      <DeleteConfirmTableCell
        onDelete={onDelete}
        item={user}
        buttonSize="btn-xs"
      />
    </tr>
  )
}

const {arrayOf, bool, func, shape, string} = PropTypes

UserRow.propTypes = {
  user: shape({
    name: string,
    roles: arrayOf(
      shape({
        name: string,
      })
    ),
    permissions: arrayOf(
      shape({
        name: string,
      })
    ),
    password: string,
  }).isRequired,
  allRoles: arrayOf(shape()),
  allPermissions: arrayOf(string),
  hasRoles: bool,
  isNew: bool,
  isEditing: bool,
  onCancel: func,
  onEdit: func,
  onSave: func,
  onDelete: func.isRequired,
  onUpdatePermissions: func,
  onUpdateRoles: func,
  onUpdatePassword: func,
}

export default UserRow
