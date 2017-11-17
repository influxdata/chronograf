import * as React from 'react'
import * as classnames from 'classnames'
import * as moment from 'moment'

import onClickOutside from 'shared/components/onClickOutside'
import FancyScrollbar from 'shared/components/FancyScrollbar'
import CustomTimeRangeOverlay from 'shared/components/CustomTimeRangeOverlay'

import timeRanges from 'shared/data/timeRanges'
import {DROPDOWN_MENU_MAX_HEIGHT} from 'shared/constants/index'

import {TimeRange} from 'src/types'
import {eFunc} from 'src/types/funcs'

const dateFormat = 'YYYY-MM-DD HH:mm'
const emptyTime = {lower: '', upper: ''}
const format = t => moment(t.replace(/\'/g, '')).format(dateFormat)

export interface TimeRangeDropdownProps {
  selected: TimeRange
  onChooseTimeRange: eFunc
  preventCustomTimeRange?: boolean
  page?: string
}

export interface TimeRangeDropdownState {
  autobind: boolean
  isOpen: boolean
  isCustomTimeRangeOpen: boolean
  customTimeRange: TimeRange
}

class TimeRangeDropdown extends React.Component<
  TimeRangeDropdownProps,
  TimeRangeDropdownState
> {
  public static defaultProps = {
    page: 'default',
  }

  constructor(props: TimeRangeDropdownProps) {
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

  public findTimeRangeInputValue = ({upper, lower}: TimeRange) => {
    if (upper && lower) {
      if (upper === 'now()') {
        return `${format(lower)} - Now`
      }

      return `${format(lower)} - ${format(upper)}`
    }

    const selected = timeRanges.find(range => range.lower === lower)
    return selected ? selected.inputValue : 'Custom'
  }

  public handleClickOutside = () => {
    this.setState({isOpen: false})
  }

  public handleSelection = timeRange => () => {
    this.props.onChooseTimeRange(timeRange)
    this.setState({customTimeRange: emptyTime, isOpen: false})
  }

  public toggleMenu = () => {
    this.setState({isOpen: !this.state.isOpen})
  }

  public showCustomTimeRange = () => {
    this.setState({isCustomTimeRangeOpen: true})
  }

  public handleApplyCustomTimeRange = customTimeRange => {
    this.props.onChooseTimeRange({...customTimeRange})
    this.setState({customTimeRange, isOpen: false})
  }

  public handleToggleCustomTimeRange = () => {
    this.setState({isCustomTimeRangeOpen: !this.state.isCustomTimeRangeOpen})
  }

  public handleCloseCustomTimeRange = () => {
    this.setState({isCustomTimeRangeOpen: false})
  }

  public render() {
    const {selected, preventCustomTimeRange, page} = this.props
    const {isOpen, customTimeRange, isCustomTimeRangeOpen} = this.state
    const isRelativeTimeRange = selected.upper === null
    const isNow = selected.upper === 'now()'

    return (
      <div className="time-range-dropdown">
        <div
          className={classnames('dropdown', {
            'dropdown-160': isRelativeTimeRange,
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
              {this.findTimeRangeInputValue(selected)}
            </span>
            <span className="caret" />
          </div>
          <ul className="dropdown-menu">
            <FancyScrollbar
              autoHide={false}
              autoHeight={true}
              maxHeight={DROPDOWN_MENU_MAX_HEIGHT}
            >
              {preventCustomTimeRange && (
                <div>
                  <li className="dropdown-header">Absolute Time Ranges</li>
                  <li
                    className={
                      isCustomTimeRangeOpen
                        ? 'active dropdown-item custom-timerange'
                        : 'dropdown-item custom-timerange'
                    }
                  >
                    <a href="#" onClick={this.showCustomTimeRange}>
                      Custom Date Picker
                    </a>
                  </li>
                </div>
              )}
              <li className="dropdown-header">
                {preventCustomTimeRange ? '' : 'Relative '}Time Ranges
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
        {isCustomTimeRangeOpen && (
          <CustomTimeRangeOverlay
            onApplyTimeRange={this.handleApplyCustomTimeRange}
            timeRange={customTimeRange}
            isVisible={isCustomTimeRangeOpen}
            onToggle={this.handleToggleCustomTimeRange}
            onClose={this.handleCloseCustomTimeRange}
            page={page}
          />
        )}
      </div>
    )
  }
}

export default onClickOutside<TimeRangeDropdownProps>(TimeRangeDropdown)
