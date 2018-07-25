import React, {Component} from 'react'
import moment from 'moment'

import {ClickOutside} from 'src/shared/components/ClickOutside'
import {IconFont} from 'src/reusable_ui/types'
import DropdownButton from 'src/reusable_ui/components/dropdowns/DropdownButton'
import CalendarSelector from 'src/shared/components/calendar_selector/CalendarSelector'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {TimeRange} from 'src/types'
import {dateFormat} from 'src/shared/utils/time'

import './CalendarDropdown.scss'

interface State {
  expanded: boolean
}

interface Props {
  timeRange: TimeRange
  onCalendarUpdated: (tr: TimeRange) => void
}

@ErrorHandling
class CustomTimeRangeDropdown extends Component<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      expanded: false,
    }
  }

  public render() {
    const {expanded} = this.state

    return (
      <div className="calendar-dropdown" style={{width: this.buttonWidth}}>
        <DropdownButton
          icon={IconFont.Clock}
          label={this.dropdownLabel}
          active={expanded}
          onClick={this.handleToggleCalendar}
        />
        {this.calendarSelector}
      </div>
    )
  }

  private handleCalendarUpdated = (timeRange: TimeRange): void => {
    const {onCalendarUpdated} = this.props

    onCalendarUpdated(timeRange)
    this.handleCollapseCalendar()
  }

  private get calendarSelector(): JSX.Element {
    const {timeRange} = this.props
    const {expanded} = this.state

    if (expanded) {
      return (
        <ClickOutside onClickOutside={this.handleCollapseCalendar}>
          <div className="calendar-dropdown--container">
            <CalendarSelector
              onCalendarUpdated={this.handleCalendarUpdated}
              timeRange={timeRange}
            />
          </div>
        </ClickOutside>
      )
    }

    return null
  }

  private get dropdownLabel(): string {
    const {timeRange} = this.props

    const lower = moment(timeRange.lower).format(dateFormat)

    if (timeRange.upper === 'now()') {
      return `${lower} — Now`
    }

    const upper = moment(timeRange.upper).format(dateFormat)

    return `${lower} —  ${upper}`
  }

  private get buttonWidth(): number {
    const {timeRange} = this.props

    if (timeRange.upper === null) {
      return 117
    }

    if (timeRange.upper === 'now()') {
      return 216
    }

    return 297
  }

  private handleToggleCalendar = () => {
    this.setState({expanded: !this.state.expanded})
  }

  private handleCollapseCalendar = () => {
    this.setState({expanded: false})
  }
}

export default CustomTimeRangeDropdown
