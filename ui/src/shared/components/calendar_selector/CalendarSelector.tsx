import React, {Component} from 'react'
import classnames from 'classnames'
import rome from 'rome'
import moment from 'moment'

import {formatTimeRange} from 'src/shared/utils/time'
import {
  calendarShortcuts,
  CalendarShortcut,
} from 'src/shared/components/calendar_selector/calendarShortcuts'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {TimeRange} from 'src/types'
import {dateFormat} from 'src/shared/utils/time'

import './CalendarSelector.scss'

interface Props {
  timeRange: TimeRange
  timeInterval?: number
  onCalendarUpdated: (timeRange: TimeRange) => void
  disableNowButton?: boolean
  disableShortcuts?: boolean
}

interface State {
  isNow: boolean
}

@ErrorHandling
class CalendarSelector extends Component<Props, State> {
  public static defaultProps: Partial<Props> = {
    timeInterval: 1800,
    disableNowButton: false,
    disableShortcuts: false,
  }

  private lowerContainerRef: HTMLDivElement
  private upperContainerRef: HTMLDivElement
  private lowerInputRef: HTMLInputElement
  private upperInputRef: HTMLInputElement
  private lowerRomeRef: rome
  private upperRomeRef: rome

  constructor(props: Props) {
    super(props)
    this.state = {
      isNow: this.props.timeRange.upper === 'now()',
    }
  }

  public componentDidMount() {
    const {timeRange, timeInterval} = this.props

    this.lowerRomeRef = rome(this.lowerInputRef, {
      dateValidator: rome.val.beforeEq(this.upperInputRef),
      appendTo: this.lowerContainerRef,
      initialValue: this.getInitialDate(timeRange.lower),
      autoClose: false,
      autoHideOnBlur: false,
      autoHideOnClick: false,
      timeInterval,
    })

    this.upperRomeRef = rome(this.upperInputRef, {
      dateValidator: rome.val.afterEq(this.lowerInputRef),
      appendTo: this.upperContainerRef,
      autoClose: false,
      initialValue: this.getInitialDate(timeRange.upper),
      autoHideOnBlur: false,
      autoHideOnClick: false,
      timeInterval,
    })

    this.lowerRomeRef.show()
    this.upperRomeRef.show()
  }

  public render() {
    return (
      <div className="calendar-selector">
        {this.shortcutsPanel}
        <div className="calendar-selector--container">
          <div
            className="calendar-selector--dates"
            onClick={this.handleRefreshCalendars}
          >
            {this.calendarLower}
            {this.calendarUpper}
          </div>
          <button
            className="calendar-selector--apply btn btn-sm btn-primary"
            onClick={this.handleClick}
          >
            Apply
          </button>
        </div>
      </div>
    )
  }

  private get calendarLower(): JSX.Element {
    return (
      <div
        className="calendar-selector--month"
        ref={r => (this.lowerContainerRef = r)}
      >
        <input
          className="calendar-selector--input form-control input-sm"
          ref={r => (this.lowerInputRef = r)}
          data-test="calendar-input-lower"
          placeholder="from"
          onKeyUp={this.handleRefreshCalendars}
        />
      </div>
    )
  }

  private get calendarUpper(): JSX.Element {
    const {isNow} = this.state

    return (
      <div
        className="calendar-selector--month"
        ref={r => (this.upperContainerRef = r)}
      >
        {this.nowButton}
        <input
          className="calendar-selector--input form-control input-sm"
          ref={r => (this.upperInputRef = r)}
          data-test="calendar-input-upper"
          placeholder="to"
          onKeyUp={this.handleRefreshCalendars}
          disabled={isNow}
        />
        {this.nowMask}
      </div>
    )
  }

  private get nowButton(): JSX.Element {
    const {disableNowButton} = this.props
    const {isNow} = this.state

    if (disableNowButton) {
      return null
    }

    return (
      <div
        className={classnames('btn btn-xs calendar-selector--now', {
          'btn-warning': isNow,
          'btn-default': !isNow,
        })}
        onClick={this.handleToggleNow}
      >
        Now
      </div>
    )
  }

  private get nowMask(): JSX.Element {
    const {disableNowButton} = this.props
    const {isNow} = this.state

    if (isNow && !disableNowButton) {
      return (
        <div className="calendar-selector--mask" onClick={this.handleNowOff} />
      )
    }

    return null
  }

  private getInitialDate = (time: string) => {
    const {upper, lower} = this.props.timeRange

    if (upper || lower) {
      return formatTimeRange(time)
    }

    return moment(new Date()).format(dateFormat)
  }

  private handleRefreshCalendars = (): void => {
    this.lowerRomeRef.refresh()
    this.upperRomeRef.refresh()
  }

  private handleToggleNow = (): void => {
    this.setState({isNow: !this.state.isNow})
  }

  private handleNowOff = (): void => {
    this.setState({isNow: false})
  }

  private handleClick = (): void => {
    const {onCalendarUpdated} = this.props
    const {isNow} = this.state

    const lower = this.lowerRomeRef.getDate().toISOString()
    const upper = this.upperRomeRef.getDate().toISOString()

    if (isNow) {
      onCalendarUpdated({lower, upper: 'now()'})
    } else {
      onCalendarUpdated({lower, upper})
    }
  }

  private get shortcutsPanel(): JSX.Element {
    const {disableShortcuts} = this.props

    if (disableShortcuts) {
      return null
    }

    return (
      <div className="calendar-selector--shortcuts">
        <div className="calendar-selector--shortcuts-header">Shortcuts</div>
        {calendarShortcuts.map(shortcut => (
          <div
            key={shortcut.id}
            className="calendar-selector--shortcut"
            onClick={this.handleShortcutClick(shortcut)}
          >
            {shortcut.name}
          </div>
        ))}
      </div>
    )
  }

  private handleShortcutClick = (
    shortcut: CalendarShortcut
  ): (() => void) => (): void => {
    const {lower} = shortcut
    const upper = moment()

    this.lowerInputRef.value = lower.format(dateFormat)
    this.upperInputRef.value = upper.format(dateFormat)

    this.lowerRomeRef.setValue(lower)
    this.upperRomeRef.setValue(upper)

    this.handleRefreshCalendars()
  }
}

export default CalendarSelector
