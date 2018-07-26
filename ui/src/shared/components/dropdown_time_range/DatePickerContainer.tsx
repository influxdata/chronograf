import React, {Component} from 'react'
import moment from 'moment'

import CalendarSelector from 'src/shared/components/calendar_selector/CalendarSelector'
import {ClickOutside} from 'src/shared/components/ClickOutside'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {TimeRange} from 'src/types'

interface Props {
  timeRange: TimeRange
  onDismiss: () => void
  onSelect: (timeRange: TimeRange) => void
  disableNowButton: boolean
}

@ErrorHandling
class AbsoluteTime extends Component<Props> {
  public render() {
    const {onDismiss, disableNowButton} = this.props

    return (
      <ClickOutside onClickOutside={onDismiss}>
        <div className="time-range-dropdown--custom">
          <CalendarSelector
            onCalendarUpdated={this.handleCalendarUpdated}
            timeRange={this.validatedTime}
            disableNowButton={disableNowButton}
          />
        </div>
      </ClickOutside>
    )
  }

  private handleCalendarUpdated = (timeRange: TimeRange): void => {
    const {onSelect, onDismiss} = this.props

    onSelect(timeRange)
    onDismiss()
  }

  private get validatedTime(): TimeRange {
    const {
      timeRange: {upper, lower},
    } = this.props

    const valid = moment(upper).isValid() && moment(lower).isValid()

    if (valid) {
      return {upper, lower}
    }

    return {
      upper: '',
      lower: '',
    }
  }
}

export default AbsoluteTime
