import * as React from 'react'
import * as PropTypes from 'prop-types'

import {USERS_TABLE} from 'admin/constants/tableSizing'

class UserEditName extends React.Component {
  handleKeyPress = user => {
    return e => {
      if (e.key === 'Enter') {
        this.props.onSave(user)
      }
    }
  }

  handleEdit = user => {
    return e => {
      this.props.onEdit(user, {[e.target.name]: e.target.value})
    }
  }

  render() {
    const {user} = this.props
    return (
      <td style={{width: `${USERS_TABLE.colUsername}px`}}>
        <input
          className="form-control input-xs"
          name="name"
          type="text"
          value={user.name || ''}
          placeholder="Username"
          onChange={this.handleEdit(user)}
          onKeyPress={this.handleKeyPress(user)}
          autoFocus={true}
          spellCheck={false}
          autoComplete={false}
        />
      </td>
    )
  }
}

const {func, shape} = PropTypes

UserEditName.propTypes = {
  user: shape().isRequired,
  onEdit: func.isRequired,
  onSave: func.isRequired,
}

export default UserEditName
