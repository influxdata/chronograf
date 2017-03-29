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
        console.log("keypress: ", user)
        // console.log(this.props.onSave)
        // this.props.onSave(user)
        // this.setState({showForm: false})
      }
    }
  }

  handleEdit(user) {
    return (e) => {
      this.props.onEdit(user, {[e.target.name]: e.target.value})
    }
  }

  render() {
    const {user, onUpdatePassword} = this.props

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
          autoFocus={true}
        />
        <ConfirmButtons
          onConfirm={onUpdatePassword}
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
  onUpdatePassword: func.isRequired,
  onEdit: func.isRequired,
}

export default OnClickOutside(ChangePassRow);
