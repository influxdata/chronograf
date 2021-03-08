import React, {Component} from 'react'
import PropTypes from 'prop-types'
import rome from 'rome'
import moment from 'moment'
import {connect} from 'react-redux'
import _ from 'lodash'

import {formatTimeRange} from 'shared/utils/time'
import shortcuts from 'shared/data/timeRangeShortcuts'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {TimeZones} from 'src/types'
const dateFormat = 'YYYY-MM-DD HH:mm'

class CustomTimeRange extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isNow: this.props.timeRange.upper === 'now()',
    }
  }

  componentDidMount() {
    const {timeRange, timeInterval} = this.props

    const lower = rome(this.lower, {
      dateValidator: rome.val.beforeEq(this.upper),
      appendTo: this.lowerContainer,
      initialValue: this.getInitialDate(timeRange.lower),
      autoClose: false,
      autoHideOnBlur: false,
      autoHideOnClick: false,
      timeInterval,
    })

    const upper = rome(this.upper, {
      dateValidator: rome.val.afterEq(this.lower),
      appendTo: this.upperContainer,
      autoClose: false,
      initialValue: this.getInitialDate(timeRange.upper),
      autoHideOnBlur: false,
      autoHideOnClick: false,
      timeInterval,
    })

    this.lowerCal = lower
    this.upperCal = upper

    this.lowerCal.show()
    this.upperCal.show()
  }

  componentWillReceiveProps(nextProps) {
    const {lower, upper} = nextProps.timeRange
    if (lower) {
      const momentVal = this._toMoment(lower)
      this.lowerCal.setValue(momentVal)
      this.lower.value = momentVal.format(dateFormat)
    }

    if (upper) {
      const momentVal = this._toMoment(upper)
      this.upperCal.setValue(momentVal)
      this.upper.value = momentVal.format(dateFormat)
    }
  }

  getInitialDate = (time) => {
    const {upper, lower} = this.props.timeRange

    if (upper || lower) {
      return this._toMoment(time)
    }

    return this.timeZoned(moment())
  }

  timeZoned = (momentVal) => {
    if (this.props.timeZone === TimeZones.UTC) {
      return momentVal.utc()
    }
    return momentVal
  }

  handleRefreshCals = () => {
    this.lowerCal.refresh()
    this.upperCal.refresh()
  }

  handleToggleNow = () => {
    this.setState({isNow: !this.state.isNow})
  }

  handleNowOff = () => {
    this.setState({isNow: false})
  }

  /*
   * Upper and lower time ranges are passed in with single quotes as part of
   * the string literal, i.e. "'2015-09-23T18:00:00.000Z'".  Remove them
   * before passing the string to be parsed. Additionally, return the moment
   * in the timeZone so that it is formatted well.
   */
  _toMoment = (timeRange) => {
    const strVal = formatTimeRange(timeRange)
    const retVal = moment(strVal, dateFormat)
    if (this.props.timeZone === TimeZones.UTC) {
      retVal.utc()
    }
    return retVal
  }

  handleClick = () => {
    const {onApplyTimeRange, onClose} = this.props
    const {isNow} = this.state

    const lowerMoment = this.lowerCal.getMoment()
    const upperMoment = this.upperCal.getMoment()
    if (this.props.timeZone === TimeZones.UTC) {
      // rome calendar does not respect that UTC moment was set
      if (!lowerMoment.creationData().isUTC) {
        lowerMoment.utc(true)
      }
      if (!upperMoment.creationData().isUTC) {
        upperMoment.utc(true)
      }
    }
    const lower = lowerMoment.toDate().toISOString()
    const upper = upperMoment.toDate().toISOString()
    if (isNow) {
      onApplyTimeRange({lower, upper: 'now()'})
    } else {
      onApplyTimeRange({lower, upper})
    }

    if (onClose) {
      onClose()
    }
  }

  handleTimeRangeShortcut = (shortcut) => {
    return () => {
      let lower
      const upper = this.timeZoned(moment())

      switch (shortcut) {
        case 'pastWeek': {
          lower = moment(upper).subtract(1, 'week')
          break
        }
        case 'pastMonth': {
          lower = moment(upper).subtract(1, 'month')
          break
        }
        case 'pastYear': {
          lower = moment(upper).subtract(1, 'year')
          break
        }
        case 'thisWeek': {
          lower = moment(upper).startOf('week')
          break
        }
        case 'thisMonth': {
          lower = moment(upper).startOf('month')
          break
        }
        case 'thisYear': {
          lower = moment(upper).startOf('year')
          break
        }
      }

      this.lower.value = lower.format(dateFormat)
      this.upper.value = upper.format(dateFormat)

      this.lowerCal.setValue(lower)
      this.upperCal.setValue(upper)

      this.handleRefreshCals()
    }
  }

  render() {
    const {isNow} = this.state
    const {page} = this.props
    const isNowDisplayed = page !== 'DataExplorer'

    return (
      <div className="custom-time--container">
        <div className="custom-time--shortcuts">
          <div className="custom-time--shortcuts-header">Shortcuts</div>
          {shortcuts.map(({id, name}) => (
            <div
              key={id}
              className="custom-time--shortcut"
              onClick={this.handleTimeRangeShortcut(id)}
            >
              {name}
            </div>
          ))}
        </div>
        <div className="custom-time--wrap">
          <div className="custom-time--dates" onClick={this.handleRefreshCals}>
            <div
              className="custom-time--lower-container"
              ref={(r) => (this.lowerContainer = r)}
            >
              <input
                className="custom-time--lower form-control input-sm"
                ref={(r) => (this.lower = r)}
                placeholder="from"
                onKeyUp={this.handleRefreshCals}
              />
            </div>
            <div
              className="custom-time--upper-container"
              ref={(r) => (this.upperContainer = r)}
              disabled={isNow}
            >
              {isNowDisplayed ? (
                <div
                  className={`btn btn-xs custom-time--now ${
                    isNow ? 'btn-primary' : 'btn-default'
                  }`}
                  onClick={this.handleToggleNow}
                >
                  Now
                </div>
              ) : null}
              <input
                className="custom-time--upper form-control input-sm"
                ref={(r) => (this.upper = r)}
                placeholder="to"
                onKeyUp={this.handleRefreshCals}
                disabled={isNow}
              />
              {isNow && page !== 'DataExplorer' ? (
                <div
                  className="custom-time--mask"
                  onClick={this.handleNowOff}
                />
              ) : null}
            </div>
          </div>
          <div
            className="custom-time--apply btn btn-sm btn-primary"
            onClick={this.handleClick}
          >
            Apply
          </div>
        </div>
      </div>
    )
  }
}

CustomTimeRange.defaultProps = {
  timeInterval: 1800,
}

const {func, shape, string, number} = PropTypes

CustomTimeRange.propTypes = {
  onApplyTimeRange: func.isRequired,
  timeRange: shape({
    lower: string.isRequired,
    upper: string,
  }).isRequired,
  timeInterval: number,
  onClose: func,
  page: string,
  timeZone: string,
}
const mstp = (state) => ({
  timeZone: _.get(state, ['app', 'persisted', 'timeZone']),
})
export default ErrorHandling(connect(mstp)(CustomTimeRange))
