import React, {Component, PropTypes} from 'react'

import {ROLES_TABLE} from 'src/admin/constants/tableSizing'

class RoleEditingRow extends Component {
  handleKeyPress = e => {
    const {onSave, role} = this.props
    if (e.key === 'Enter') {
      onSave(role)
    }
  }

  handleEdit = e => {
    const {onEdit, role} = this.props
    onEdit(role, {[e.target.name]: e.target.value})
  }

  render() {
    const {role} = this.props
    return (
      <td style={{width: `${ROLES_TABLE.colName}px`}}>
        <input
          className="form-control input-xs"
          name="name"
          type="text"
          value={role.name || ''}
          placeholder="Role name"
          onChange={this.handleEdit}
          onKeyPress={this.handleKeyPress}
          autoFocus={true}
          spellCheck={false}
          autoComplete={false}
        />
      </td>
    )
  }
}

const {bool, func, shape} = PropTypes

RoleEditingRow.propTypes = {
  role: shape().isRequired,
  isNew: bool,
  onEdit: func.isRequired,
  onSave: func.isRequired,
}

export default RoleEditingRow
