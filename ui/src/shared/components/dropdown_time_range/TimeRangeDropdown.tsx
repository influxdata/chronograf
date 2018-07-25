import React, {Component} from 'react'
import moment from 'moment'

import Dropdown from 'src/reusable_ui/components/dropdowns/Dropdown'
import {DropdownMenuColors} from 'src/reusable_ui/types'

import {IconFont} from 'src/reusable_ui/types'

import DatePickerContainer from 'src/shared/components/dropdown_time_range/DatePickerContainer'

import {
  timeRanges,
  CUSTOM_TIME_OPTION,
  CUSTOM_TIME_ABSOLUTE,
} from 'src/shared/data/timeRanges'
import {TimeRangeSizes} from 'src/shared/components/dropdown_time_range/TimeRangeSizes'
import {TimeRange} from 'src/types'
import {TimeRangeOption} from 'src/types/queries'
import {dateFormat} from 'src/shared/utils/time'
import {ErrorHandling} from 'src/shared/decorators/errors'

import './TimeRangeDropdown.scss'

interface Props {
  selected: TimeRange
  preventCustomTimeRange?: boolean
  onChooseTimeRange: (timeRange: TimeRange) => void
  disableNowButton?: boolean
  menuColor?: DropdownMenuColors
}

interface State {
  datePickerVisible: boolean
}

@ErrorHandling
class TimeRangeDropdown extends Component<Props, State> {
  public static defaultProps = {
    preventCustomTimeRange: false,
    disableNowButton: false,
    menuColor: DropdownMenuColors.Sapphire,
  }

  constructor(props: Props) {
    super(props)

    this.state = {
      datePickerVisible: false,
    }
  }

  public render() {
    const {menuColor} = this.props

    return (
      <div className="time-range-dropdown">
        {this.absoluteTimePicker}
        <Dropdown
          selectedItem={this.dropdownLabel}
          width={this.dropdownWidth}
          icon={IconFont.Clock}
          onChange={this.handleRelativeTimeSelected}
          menuColor={menuColor}
        >
          {this.absoluteTimes}
          {timeRanges.map(option => (
            <Dropdown.Item
              key={option.lower}
              text={option.menuOption}
              value={option}
            />
          ))}
        </Dropdown>
      </div>
    )
  }

  private get absoluteTimes(): JSX.Element {
    const {preventCustomTimeRange} = this.props

    if (preventCustomTimeRange) {
      return <Dropdown.Divider text="Global Time" />
    }

    return (
      <>
        <Dropdown.Divider text="Absolute Time" />
        <Dropdown.Item text="Date Picker" value={CUSTOM_TIME_OPTION} />
        <Dropdown.Divider text="Relative Time" />
      </>
    )
  }

  private get absoluteTimePicker(): JSX.Element {
    const {datePickerVisible} = this.state
    const {selected, disableNowButton} = this.props

    if (datePickerVisible) {
      return (
        <DatePickerContainer
          onSelect={this.handleAbsoluteTimeSelected}
          onDismiss={this.handleCollapseAbsolute}
          timeRange={selected}
          disableNowButton={disableNowButton}
        />
      )
    }

    return null
  }

  private handleCollapseAbsolute = (): void => {
    this.setState({datePickerVisible: false})
  }

  private get dropdownLabel(): string {
    const {selected} = this.props

    if (selected.upper === null) {
      const isolateTime = selected.lower.split(' ').pop()
      return `Past ${isolateTime}`
    }

    const lower = this.formatTimestamp(selected.lower)

    if (selected.upper === 'now()') {
      return `${lower} — Now`
    }

    const upper = this.formatTimestamp(selected.upper)

    return `${lower} — ${upper}`
  }

  private get dropdownWidth(): number {
    const {selected} = this.props

    if (selected.upper === null) {
      return TimeRangeSizes.Relative
    }

    if (selected.upper === 'now()') {
      return TimeRangeSizes.AbsoluteNow
    }

    return TimeRangeSizes.Absolute
  }

  private handleAbsoluteTimeSelected = (selected: TimeRange): void => {
    const {onChooseTimeRange} = this.props

    onChooseTimeRange(selected)
  }

  private handleRelativeTimeSelected = (selected: TimeRangeOption) => {
    if (selected.menuOption === CUSTOM_TIME_ABSOLUTE) {
      return this.setState({datePickerVisible: true})
    }

    const {onChooseTimeRange} = this.props
    const {lower, upper, seconds} = selected

    onChooseTimeRange({lower, upper, seconds})
  }

  private formatTimestamp = (timestamp: string): string => {
    return moment(timestamp.replace(/\'/g, '')).format(dateFormat)
  }
}

export default TimeRangeDropdown
