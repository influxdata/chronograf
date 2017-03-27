import React, {Component, PropTypes} from 'react'

import OnClickOutside from 'shared/components/OnClickOutside'
import ConfirmButtons from 'src/admin/components/ConfirmButtons'

class ChangePassRow extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showForm: false,
    }
    this.showForm = ::this.showForm
    this.handleCancel = ::this.handleCancel
    this.handleKeyPress = ::this.handleKeyPress
    this.handleEdit = ::this.handleEdit
  }

  showForm() {
    this.setState({showForm: true})
  }

  handleCancel() {
    this.setState({showForm: false})
  }

  handleClickOutside() {
    this.setState({showForm: false})
  }

  handleKeyPress(user) {
    return (e) => {
      if (e.key === 'Enter') {
        this.props.onSave(user)
        this.setState({showForm: false})
      }
    }
  }

  handleEdit(user) {
    return (e) => {
      this.props.onEdit(user, {[e.target.name]: e.target.value})
    }
  }

  render() {
    const {user, onSave} = this.props

    if (this.state.showForm) {
      return (
        <div>
        <input
          className="form-control"
          name="password"
          type="password"
          value={user.password || ''}
          placeholder="Password"
          onChange={this.handleEdit(user)}
          onKeyPress={this.handleKeyPress(user)}
        /> :
        <ConfirmButtons
          onConfirm={onSave}
          item={user}
          onCancel={this.handleCancel}
        />
        </div>
      )
    }

    return (
      <button
        className="btn btn-xs btn-info admin-table--hidden"
        onClick={this.showForm}
      >
        Change Password
      </button>
    )
  }
}

const {shape, func} = PropTypes

ChangePassRow.propTypes = {
  user: shape().isRequired,
  onSave: func.isRequired,
  onEdit: func.isRequired,
}

export default OnClickOutside(ChangePassRow);
