import React, {Component} from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import moment from 'moment'

import OnClickOutside from 'shared/components/OnClickOutside'
import FancyScrollbar from 'shared/components/FancyScrollbar'
import CustomTimeRangeOverlay from 'shared/components/CustomTimeRangeOverlay'

import {timeRanges} from 'shared/data/timeRanges'
import {DROPDOWN_MENU_MAX_HEIGHT} from 'shared/constants/index'
import {ErrorHandling} from 'src/shared/decorators/errors'
import TimeRangeLabel from './TimeRangeLabel'
const emptyTime = {lower: '', upper: ''}

let timeoutHandle
export function hightlightDropdown(e) {
  if (e && e.preventDefault) {
    e.preventDefault()
  }
  const el1 = document.getElementsByClassName('time-range-dropdown')[0]
  if (el1) {
    el1.classList.add('highlight')
    if (timeoutHandle) {
      clearTimeout(timeoutHandle)
    }
    timeoutHandle = setTimeout(() => {
      const el2 = document.getElementsByClassName('time-range-dropdown')[0]
      if (el2) {
        el2.classList.remove('highlight')
      }
      timeoutHandle = undefined
    }, 1000)
  }
}

class TimeRangeDropdown extends Component {
  constructor(props) {
    super(props)
    const {lower, upper} = props.selected

    const isTimeValid = moment(upper).isValid() && moment(lower).isValid()
    const customTimeRange = isTimeValid ? {lower, upper} : emptyTime

    this.state = {
      autobind: false,
      isOpen: false,
      isCustomTimeRangeOpen: false,
      customTimeRange,
    }
  }

  handleClickOutside = () => {
    this.setState({isOpen: false})
  }

  handleSelection = timeRange => () => {
    this.setState({customTimeRange: emptyTime, isOpen: false}, () => {
      window.setTimeout(() => {
        this.props.onChooseTimeRange(timeRange)
      }, 0)
    })
  }

  toggleMenu = () => {
    this.setState({isOpen: !this.state.isOpen})
  }

  showCustomTimeRange = () => {
    this.setState({isCustomTimeRangeOpen: true})
  }

  handleApplyCustomTimeRange = customTimeRange => {
    this.props.onChooseTimeRange({...customTimeRange})
    this.setState({customTimeRange, isOpen: false})
  }

  handleToggleCustomTimeRange = () => {
    this.setState({isCustomTimeRangeOpen: !this.state.isCustomTimeRangeOpen})
  }

  handleCloseCustomTimeRange = () => {
    this.setState({isCustomTimeRangeOpen: false})
  }

  render() {
    const {selected, preventCustomTimeRange, page} = this.props
    const {isOpen, customTimeRange, isCustomTimeRangeOpen} = this.state
    const isRelativeTimeRange = selected.upper === null
    const isNow = selected.upper === 'now()'

    return (
      <div className="time-range-dropdown">
        <div
          className={classnames('dropdown', {
            'dropdown-120': isRelativeTimeRange,
            'dropdown-210': isNow,
            'dropdown-290': !isRelativeTimeRange && !isNow,
            open: isOpen,
          })}
        >
          <div
            className="btn btn-sm btn-default dropdown-toggle"
            onClick={this.toggleMenu}
          >
            <span className="icon clock" />
            <span className="dropdown-selected">
              <TimeRangeLabel timeRange={selected} />
            </span>
            <span className="caret" />
          </div>
          <ul className="dropdown-menu">
            <FancyScrollbar
              autoHide={false}
              autoHeight={true}
              maxHeight={DROPDOWN_MENU_MAX_HEIGHT}
            >
              {preventCustomTimeRange ? null : (
                <div>
                  <li className="dropdown-header">Absolute Time</li>
                  <li
                    className={
                      isCustomTimeRangeOpen
                        ? 'active dropdown-item custom-timerange'
                        : 'dropdown-item custom-timerange'
                    }
                  >
                    <a href="#" onClick={this.showCustomTimeRange}>
                      Date Picker
                    </a>
                  </li>
                </div>
              )}
              <li className="dropdown-header">
                {preventCustomTimeRange ? '' : 'Relative '}Time
              </li>
              {timeRanges.map(item => {
                return (
                  <li className="dropdown-item" key={item.menuOption}>
                    <a href="#" onClick={this.handleSelection(item)}>
                      {item.menuOption}
                    </a>
                  </li>
                )
              })}
            </FancyScrollbar>
          </ul>
        </div>
        {isCustomTimeRangeOpen ? (
          <CustomTimeRangeOverlay
            onApplyTimeRange={this.handleApplyCustomTimeRange}
            timeRange={customTimeRange}
            isVisible={isCustomTimeRangeOpen}
            onToggle={this.handleToggleCustomTimeRange}
            onClose={this.handleCloseCustomTimeRange}
            page={page}
          />
        ) : null}
      </div>
    )
  }
}

const {bool, func, shape, string} = PropTypes

TimeRangeDropdown.defaultProps = {
  page: 'default',
}

TimeRangeDropdown.propTypes = {
  selected: shape({
    lower: string,
    upper: string,
  }).isRequired,
  onChooseTimeRange: func.isRequired,
  preventCustomTimeRange: bool,
  page: string,
}

export default OnClickOutside(ErrorHandling(TimeRangeDropdown))
