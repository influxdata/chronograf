import * as React from 'react'
import * as PropTypes from 'prop-types'

import {ROLES_TABLE} from 'admin/constants/tableSizing'

class RoleEditingRow extends React.Component {
  handleKeyPress = role => {
    return e => {
      if (e.key === 'Enter') {
        this.props.onSave(role)
      }
    }
  }

  handleEdit = role => {
    return e => {
      this.props.onEdit(role, {[e.target.name]: e.target.value})
    }
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
          onChange={this.handleEdit(role)}
          onKeyPress={this.handleKeyPress(role)}
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
