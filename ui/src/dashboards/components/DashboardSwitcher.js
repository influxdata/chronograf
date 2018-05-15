import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {Link} from 'react-router'
import _ from 'lodash'
import classnames from 'classnames'
import OnClickOutside from 'shared/components/OnClickOutside'
import {ErrorHandling} from 'src/shared/decorators/errors'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import {DROPDOWN_MENU_MAX_HEIGHT} from 'src/shared/constants/index'

@ErrorHandling
class DashboardSwitcher extends Component {
  constructor(props) {
    super(props)

    this.state = {
      isOpen: false,
    }
  }

  handleToggleMenu = () => {
    if (!this.state.isOpen && this.props.onOpen) {
      this.props.onOpen()
    }
    this.setState({isOpen: !this.state.isOpen})
  }

  handleCloseMenu = () => {
    this.setState({isOpen: false})
  }

  handleClickOutside = () => {
    this.setState({isOpen: false})
  }

  render() {
    const {activeDashboard} = this.props
    const {isOpen} = this.state

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
          <FancyScrollbar
            autoHeight={true}
            maxHeight={DROPDOWN_MENU_MAX_HEIGHT}
          >
            {this.sortedList.map(({name, link, isClickable}) => (
              <NameLink
                key={link}
                name={name}
                link={link}
                isClickable={isClickable}
                activeName={activeDashboard}
                onClose={this.handleCloseMenu}
              />
            ))}
          </FancyScrollbar>
        </ul>
      </div>
    )
  }

  get sortedList() {
    const {names} = this.props
    return _.sortBy(names, ({name}) => name.toLowerCase())
  }
}

const NameLink = ({name, link, isClickable = true, activeName, onClose}) => {
  let item
  if (isClickable) {
    item = (
      <Link to={link} onClick={onClose}>
        {name}
      </Link>
    )
  } else {
    item = <span>{name}</span>
  }
  return (
    <li
      className={classnames('dropdown-item', {
        active: name === activeName,
      })}
    >
      {item}
    </li>
  )
}

const {arrayOf, bool, func, shape, string} = PropTypes

DashboardSwitcher.propTypes = {
  activeDashboard: string.isRequired,
  names: arrayOf(
    shape({
      name: string.isRequired,
      link: string.isRequired,
      isClickable: bool, // optional
    })
  ).isRequired,
  onOpen: func, // optional
}

NameLink.propTypes = {
  name: string.isRequired,
  link: string.isRequired,
  isClickable: bool, // optional
  activeName: string.isRequired,
  onClose: func.isRequired,
}

export default OnClickOutside(DashboardSwitcher)
