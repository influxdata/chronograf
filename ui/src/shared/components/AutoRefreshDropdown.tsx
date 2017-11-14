import * as React from 'react'
import * as classnames from 'classnames'
import onClickOutside from 'shared/components/onClickOutside'

import autoRefreshItems from 'shared/data/autoRefreshes'

export interface AutoRefreshDropdownProps {
  selected: number
  onChoose: (milliseconds: number) => void
  onManualRefresh: () => void
}

class AutoRefreshDropdown extends React.Component<AutoRefreshDropdownProps> {
  public state = {
    isOpen: false,
  }

  private findAutoRefreshItem(milliseconds: number) {
    return autoRefreshItems.find(values => values.milliseconds === milliseconds)
  }

  private handleSelection = milliseconds => () => {
    this.props.onChoose(milliseconds)
    this.setState({isOpen: false})
  }

  private toggleMenu = () => this.setState({isOpen: !this.state.isOpen})

  public handleClickOutside() {
    this.setState({isOpen: false})
  }

  public render() {
    const {selected, onManualRefresh} = this.props
    const {isOpen} = this.state
    const {milliseconds, inputValue} = this.findAutoRefreshItem(selected)

    return (
      <div
        className={classnames('autorefresh-dropdown', {
          paused: +milliseconds === 0,
        })}
      >
        <div className={classnames('dropdown dropdown-160', {open: isOpen})}>
          <div
            className="btn btn-sm btn-default dropdown-toggle"
            onClick={this.toggleMenu}
          >
            <span
              className={classnames(
                'icon',
                +milliseconds > 0 ? 'refresh' : 'pause'
              )}
            />
            <span className="dropdown-selected">{inputValue}</span>
            <span className="caret" />
          </div>
          <ul className="dropdown-menu">
            <li className="dropdown-header">AutoRefresh Interval</li>
            {autoRefreshItems.map(item => (
              <li className="dropdown-item" key={item.menuOption}>
                <a href="#" onClick={this.handleSelection(item.milliseconds)}>
                  {item.menuOption}
                </a>
              </li>
            ))}
          </ul>
        </div>
        {+milliseconds === 0 ? (
          <div
            className="btn btn-sm btn-default btn-square"
            onClick={onManualRefresh}
          >
            <span className="icon refresh" />
          </div>
        ) : null}
      </div>
    )
  }
}

export default onClickOutside(AutoRefreshDropdown)
