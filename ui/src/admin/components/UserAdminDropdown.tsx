import React, {PureComponent} from 'react'
import classnames from 'classnames'

import MultiSelectDropdown from 'src/shared/components/MultiSelectDropdown'

import {USERS_TABLE} from 'src/admin/constants/tableSizing'
import {User, UserPermission} from 'src/types/influxAdmin'
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  user: User
  onUpdatePermissions: (user: User, permissions: UserPermission[]) => void
}

const ADMIN_YES_OPTION = 'YES'
const ALL_PERMISSIONS = [{name: ADMIN_YES_OPTION}]

@ErrorHandling
class UserAdminDropdown extends PureComponent<Props> {
  public render() {
    return (
      <MultiSelectDropdown
        buttonSize="btn-xs"
        buttonColor="btn-primary"
        resetStateOnReceiveProps={false}
        items={ALL_PERMISSIONS}
        label={this.permissionsLabel}
        customClass={this.permissionsClass}
        selectedItems={this.selectedPermissions}
        onApply={this.handleApply}
      />
    )
  }

  private handleApply = (items): void => {
    const {onUpdatePermissions, user} = this.props
    let permissions = (user.permissions || []).filter(x => x.scope !== 'all')
    if (items && items.length) {
      permissions = [{scope: 'all', allowed: ['ALL']}, ...permissions]
    }
    onUpdatePermissions(user, permissions)
  }

  private get admin() {
    return (
      (this.props.user.permissions || []).filter(
        x => x.scope === 'all' && (x.allowed || []).includes('ALL')
      ).length > 0
    )
  }
  private get selectedPermissions() {
    return this.admin ? [{name: ADMIN_YES_OPTION}] : []
  }

  private get permissionsLabel() {
    return this.admin ? 'YES' : 'NO'
  }

  private get permissionsClass() {
    return classnames(`dropdown-${USERS_TABLE.colPermissions}`, {
      'admin-table--multi-select-empty': !this.admin,
    })
  }
}

export default UserAdminDropdown
