import * as React from 'react'
import {Link} from 'react-router-dom'
import * as _ from 'lodash'
import * as classnames from 'classnames'
import onClickOutside from 'shared/components/onClickOutside'

import {DashboardName} from 'src/types'

export interface DashboardSwitcherProps {
  activeDashboard: string
  names: DashboardName[]
}

export interface DashboardSwitcherState {
  isOpen: boolean
}

class DashboardSwitcher extends React.Component<
  DashboardSwitcherProps,
  DashboardSwitcherState
> {
  public state = {
    isOpen: false,
  }

  private handleToggleMenu = () => {
    this.setState({isOpen: !this.state.isOpen})
  }

  private handleCloseMenu = () => {
    this.setState({isOpen: false})
  }

  public handleClickOutside = () => {
    this.setState({isOpen: false})
  }

  public render() {
    const {activeDashboard, names} = this.props
    const {isOpen} = this.state
    const sorted = _.sortBy(names, ({name}) => name.toLowerCase())

    return (
      <div
        className={classnames('dropdown dashboard-switcher', {open: isOpen})}
      >
        <button
          className="btn btn-square btn-default btn-sm dropdown-toggle"
          onClick={this.handleToggleMenu}
        >
          <span className="icon dash-f" />
        </button>
        <ul className="dropdown-menu">
          {sorted.map(({name, link}) => (
            <NameLink
              key={link}
              name={name}
              link={link}
              activeName={activeDashboard}
              onClose={this.handleCloseMenu}
            />
          ))}
        </ul>
      </div>
    )
  }
}

export interface NameLinkProps {
  name: string
  link: string
  activeName: string
  onClose: () => void
}

const NameLink: React.SFC<NameLinkProps> = ({
  name,
  link,
  activeName,
  onClose,
}) => (
  <li
    className={classnames('dropdown-item', {
      active: name === activeName,
    })}
  >
    <Link to={link} onClick={onClose}>
      {name}
    </Link>
  </li>
)

export default onClickOutside(DashboardSwitcher)
