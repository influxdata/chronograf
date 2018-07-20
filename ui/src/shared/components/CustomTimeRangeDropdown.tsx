import React, {PureComponent} from 'react'
import moment from 'moment'

import {ClickOutside} from 'src/shared/components/ClickOutside'
import {IconFont} from 'src/reusable_ui/types'
import DropdownButton from 'src/reusable_ui/components/dropdowns/DropdownButton'
import CalendarSelector from 'src/shared/components/calendar_selector/CalendarSelector'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {TimeRange} from 'src/types'
import {dateFormat} from 'src/shared/utils/time'

interface State {
  expanded: boolean
}

interface Props {
  timeRange: TimeRange
  onApplyTimeRange: (tr: TimeRange) => void
}

@ErrorHandling
class CustomTimeRangeDropdown extends PureComponent<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      expanded: false,
    }
  }

  public render() {
    const {expanded} = this.state

    return (
      <div
        className="calendar-dropdown"
        style={{width: this.buttonWidth, position: 'relative'}}
      >
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

  private handleApplyTimeRange = (timeRange: TimeRange): void => {
    const {onApplyTimeRange} = this.props

    onApplyTimeRange(timeRange)
    this.handleCollapseCalendar()
  }

  private get calendarSelector(): JSX.Element {
    const {timeRange} = this.props
    const {expanded} = this.state

    if (expanded) {
      return (
        <ClickOutside onClickOutside={this.handleCollapseCalendar}>
          <div
            className="calendar-dropdown--container"
            style={{position: 'absolute', top: '100%', right: '0', zIndex: 500}}
          >
            <CalendarSelector
              onApplyTimeRange={this.handleApplyTimeRange}
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

  // private get upperTimeRange(): string {
  //   const {
  //     timeRange: {upper},
  //   } = this.props

  //   if (upper === 'now()') {
  //     return moment().format(this.timeFormat)
  //   }

  //   return moment(upper).format(this.timeFormat)
  // }

  // private get lowerTimeRange(): string {
  //   const {
  //     timeRange: {lower},
  //   } = this.props
  //   return moment(lower).format(this.timeFormat)
  // }

  // private get timeFormat(): string {
  //   return 'MMM Do HH:mm'
  // }

  private handleToggleCalendar = () => {
    this.setState({expanded: !this.state.expanded})
  }

  private handleCollapseCalendar = () => {
    this.setState({expanded: false})
  }
}

export default CustomTimeRangeDropdown
