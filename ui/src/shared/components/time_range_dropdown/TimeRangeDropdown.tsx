import React, {Component} from 'react'
import moment from 'moment'

import Dropdown from 'src/reusable_ui/components/dropdowns/Dropdown'
import DropdownItem from 'src/reusable_ui/components/dropdowns/DropdownItem'
import DropdownDivider from 'src/reusable_ui/components/dropdowns/DropdownDivider'
import {DropdownMenuColor} from 'src/reusable_ui/types'

import {IconFont} from 'src/reusable_ui/types'

import AbsoluteTime from 'src/shared/components/time_range_dropdown/AbsoluteTime'

import {
  timeRanges,
  CUSTOM_TIME_OPTION,
  CUSTOM_TIME_ABSOLUTE,
} from 'src/shared/data/timeRanges'
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
  menuColor?: DropdownMenuColor
}

interface State {
  isSelectingAbsolute: boolean
}

@ErrorHandling
class TimeRangeDropdown extends Component<Props, State> {
  public static defaultProps = {
    preventCustomTimeRange: false,
    disableNowButton: false,
    menuColor: DropdownMenuColor.Sapphire,
  }

  constructor(props: Props) {
    super(props)

    this.state = {
      isSelectingAbsolute: false,
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
          onChange={this.handleRelativeSelection}
          menuColor={menuColor}
        >
          {this.absoluteTimes}
          {timeRanges.map(option => (
            <DropdownItem
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
      return <DropdownDivider text="Global Time" />
    }

    return (
      <>
        <DropdownDivider text="Absolute Time" />
        <DropdownItem text="Date Picker" value={CUSTOM_TIME_OPTION} />
        <DropdownDivider text="Relative Time" />
      </>
    )
  }

  private get absoluteTimePicker(): JSX.Element {
    const {isSelectingAbsolute} = this.state
    const {selected, disableNowButton} = this.props

    if (isSelectingAbsolute) {
      return (
        <AbsoluteTime
          onSelect={this.handleAbsoluteSelection}
          onDismiss={this.handleCollapseAbsolute}
          timeRange={selected}
          disableNowButton={disableNowButton}
        />
      )
    }

    return null
  }

  private handleCollapseAbsolute = (): void => {
    this.setState({isSelectingAbsolute: false})
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
      return 117
    }

    if (selected.upper === 'now()') {
      return 216
    }

    return 297
  }

  private handleAbsoluteSelection = (selected: TimeRange): void => {
    const {onChooseTimeRange} = this.props

    onChooseTimeRange(selected)
  }

  private handleRelativeSelection = (selected: TimeRangeOption) => {
    if (selected.menuOption === CUSTOM_TIME_ABSOLUTE) {
      return this.setState({isSelectingAbsolute: true})
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
