import * as React from 'react'

import onClickOutside from 'shared/components/onClickOutside'
import ConfirmButtons from 'shared/components/ConfirmButtons'

import {User} from 'src/types'

export interface ChangePassRowProps {
  user: User
  onApply: (user: User) => void
  onEdit: (user: User, edits: {}) => void
  buttonSize: string
}

export interface ChangePassRowState {
  showForm: boolean
}

class ChangePassRow extends React.Component<
  ChangePassRowProps,
  ChangePassRowState
> {
  constructor(props: ChangePassRowProps) {
    super(props)
    this.state = {
      showForm: false,
    }
  }

  private showForm = () => {
    this.setState({showForm: true})
  }

  private handleCancel = () => {
    this.setState({showForm: false})
  }

  private handleSubmit = user => {
    this.props.onApply(user)
    this.setState({showForm: false})
  }

  private handleKeyPress = user => {
    return e => {
      if (e.key === 'Enter') {
        this.handleSubmit(user)
      }
    }
  }

  private handleEdit = user => {
    return e => {
      this.props.onEdit(user, {[e.target.name]: e.target.value})
    }
  }

  public handleClickOutside = () => {
    this.setState({showForm: false})
  }

  public render() {
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

export default onClickOutside(ChangePassRow)
