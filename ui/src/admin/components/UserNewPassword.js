import React, {Component, PropTypes} from 'react'

import {USERS_TABLE} from 'src/admin/constants/tableSizing'

class UserNewPassword extends Component {
  handleKeyPress = e => {
    const {onSave, user} = this.props
    if (e.key === 'Enter') {
      onSave(user)
    }
  }

  handleEdit = e => {
    const {onEdit, user} = this.props
    onEdit(user, {[e.target.name]: e.target.value})
  }

  render() {
    const {user, isNew} = this.props
    return (
      <td style={{width: `${USERS_TABLE.colPassword}px`}}>
        {isNew
          ? <input
              className="form-control input-xs"
              name="password"
              type="password"
              value={user.password || ''}
              placeholder="Password"
              onChange={this.handleEdit}
              onKeyPress={this.handleKeyPress}
              spellCheck={false}
              autoComplete={false}
            />
          : '--'}
      </td>
    )
  }
}

const {bool, func, shape} = PropTypes

UserNewPassword.propTypes = {
  user: shape().isRequired,
  isNew: bool,
  onEdit: func.isRequired,
  onSave: func.isRequired,
}

export default UserNewPassword
