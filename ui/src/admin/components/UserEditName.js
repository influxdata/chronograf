import React, {Component, PropTypes} from 'react'

import {USERS_TABLE} from 'src/admin/constants/tableSizing'

class UserEditName extends Component {
  constructor(props) {
    super(props)
  }

  handleKeyPress = e => {
    const {user, onSave} = this.props
    if (e.key === 'Enter') {
      onSave(user)
    }
  }

  handleEdit = e => {
    const {user, onEdit} = this.props
    onEdit(user, {[e.target.name]: e.target.value})
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

const {func, shape} = PropTypes

UserEditName.propTypes = {
  user: shape().isRequired,
  onEdit: func.isRequired,
  onSave: func.isRequired,
}

export default UserEditName
