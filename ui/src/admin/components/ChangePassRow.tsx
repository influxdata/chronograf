import * as React from 'react'
import * as PropTypes from 'prop-types'

import onClickOutside from 'shared/components/onClickOutside'
import ConfirmButtons from 'shared/components/ConfirmButtons'

class ChangePassRow extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      showForm: false,
    }
  }

  showForm = () => {
    this.setState({showForm: true})
  }

  handleCancel = () => {
    this.setState({showForm: false})
  }

  handleClickOutside = () => {
    this.setState({showForm: false})
  }

  handleSubmit = (user) => {
    this.props.onApply(user)
    this.setState({showForm: false})
  }

  handleKeyPress = (user) => {
    return e => {
      if (e.key === 'Enter') {
        this.handleSubmit(user)
      }
    }
  }

  handleEdit = (user) => {
    return e => {
      this.props.onEdit(user, {[e.target.name]: e.target.value})
    }
  }

  render() {
    const {user, buttonSize} = this.props

    if (this.state.showForm) {
      return (
        <div className="admin-table--change-pw">
          <input
            className="form-control input-xs"
            name="password"
            type="password"
            value={user.password || ''}
            placeholder="New password"
            onChange={this.handleEdit(user)}
            onKeyPress={this.handleKeyPress(user)}
            autoFocus={true}
          />
          <ConfirmButtons
            onConfirm={this.handleSubmit}
            item={user}
            onCancel={this.handleCancel}
            buttonSize={buttonSize}
          />
        </div>
      )
    }

    return (
      <div className="admin-table--change-pw">
        <a href="#" onClick={this.showForm}>
          Change
        </a>
      </div>
    )
  }
}

const {func, shape, string} = PropTypes

ChangePassRow.propTypes = {
  user: shape().isRequired,
  onApply: func.isRequired,
  onEdit: func.isRequired,
  buttonSize: string,
}

export default onClickOutside(ChangePassRow)
