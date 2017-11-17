import * as React from 'react'
import {
  DASHBOARD_NAME_MAX_LENGTH,
  NEW_DASHBOARD,
} from 'dashboards/constants/index'

import {func} from 'src/types/funcs'

export interface DashboardEditHeaderProps {
  activeDashboard: string
  onSave: (name: string) => void
  onCancel: func
  isEditMode: boolean
  onEditDashboard: func
}

export interface DashboardEditHeaderState {
  reset: boolean
}

class DashboardEditHeader extends React.Component<
  DashboardEditHeaderProps,
  DashboardEditHeaderState
> {
  private inputRef

  public state = {
    reset: false,
  }

  public handleInputBlur = e => {
    const {onSave, onCancel} = this.props
    const {reset} = this.state

    if (reset) {
      onCancel()
    } else {
      const newName = e.target.value || NEW_DASHBOARD.name
      onSave(newName)
    }
    this.setState({reset: false})
  }

  public handleKeyDown = e => {
    if (e.key === 'Enter') {
      this.inputRef.blur()
    }
    if (e.key === 'Escape') {
      this.inputRef.value = this.props.activeDashboard
      this.setState({reset: true}, () => this.inputRef.blur())
    }
  }

  public handleFocus = e => {
    e.target.select()
  }

  public render() {
    const {onEditDashboard, isEditMode, activeDashboard} = this.props

    return (
      <div className="dashboard-title">
        {isEditMode ? (
          <input
            maxLength={DASHBOARD_NAME_MAX_LENGTH}
            type="text"
            className="dashboard-title--input form-control input-sm"
            defaultValue={activeDashboard}
            autoComplete="off"
            autoFocus={true}
            spellCheck={false}
            onBlur={this.handleInputBlur}
            onKeyDown={this.handleKeyDown}
            onFocus={this.handleFocus}
            placeholder="Name this Dashboard"
            ref={r => (this.inputRef = r)}
          />
        ) : (
          <h1 onClick={onEditDashboard}>{activeDashboard}</h1>
        )}
      </div>
    )
  }
}

export default DashboardEditHeader
