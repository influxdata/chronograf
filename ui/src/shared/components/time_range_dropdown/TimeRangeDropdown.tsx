import React, {Component} from 'react'
import moment from 'moment'

import Dropdown from 'src/reusable_ui/components/dropdowns/Dropdown'
import DropdownItem from 'src/reusable_ui/components/dropdowns/DropdownItem'
import DropdownDivider from 'src/reusable_ui/components/dropdowns/DropdownDivider'
import {IconFont} from 'src/reusable_ui/types'

// import CustomTimeRangeOverlay from 'src/shared/components/CustomTimeRangeOverlay'

import {timeRanges} from 'src/shared/data/timeRanges'
import {TimeRange} from 'src/types'
import {TimeRangeOption} from 'src/types/queries'

import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  selected: TimeRange
  preventCustomTimeRange?: boolean
  onChooseTimeRange: (timeRange: TimeRange) => void
  page?: string
}

@ErrorHandling
class TimeRangeDropdown extends Component<Props> {
  public static defaultProps = {
    preventCustomTimeRange: false,
    page: 'default',
  }

  public render() {
    return (
      <Dropdown
        selectedItem={this.dropdownLabel}
        width={this.dropdownWidth}
        icon={IconFont.Clock}
        onChange={this.handleSelection}
      >
        {this.absoluteTimeRange}
        <DropdownDivider text={this.relativeTimeDivider} />
        {this.relativeTimeRanges}
      </Dropdown>
    )
    //   <div className="time-range-dropdown">
    //     <div
    //       className={classnames('dropdown', {
    //         'dropdown-120': isRelativeTimeRange,
    //         'dropdown-210': isNow,
    //         'dropdown-290': !isRelativeTimeRange && !isNow,
    //         open: isOpen,
    //       })}
    //     >
    //       <div
    //         className="btn btn-sm btn-default dropdown-toggle"
    //         onClick={this.toggleMenu}
    //       >
    //         <span className="icon clock" />
    //         <span className="dropdown-selected">
    //           {this.findTimeRangeInputValue(selected)}
    //         </span>
    //         <span className="caret" />
    //       </div>
    //       <ul className="dropdown-menu">
    //           {preventCustomTimeRange ? null : (
    //             <div>
    //               <li className="dropdown-header">Absolute Time</li>
    //               <li
    //                 className={
    //                   isCustomTimeRangeOpen
    //                     ? 'active dropdown-item custom-timerange'
    //                     : 'dropdown-item custom-timerange'
    //                 }
    //               >
    //                 <a href="#" onClick={this.showCustomTimeRange}>
    //                   Date Picker
    //                 </a>
    //               </li>
    //             </div>
    //           )}
    //           <li className="dropdown-header">
    //             {preventCustomTimeRange ? '' : 'Relative '}Time
    //           </li>
    //           {timeRanges.map(item => {
    //             return (
    //               <li className="dropdown-item" key={item.menuOption}>
    //                 <a href="#" onClick={this.handleSelection(item)}>
    //                   {item.menuOption}
    //                 </a>
    //               </li>
    //             )
    //           })}
    //       </ul>
    //     </div>
    //     {isCustomTimeRangeOpen ? (
    //       <CustomTimeRangeOverlay
    //         onApplyTimeRange={this.handleApplyCustomTimeRange}
    //         timeRange={customTimeRange}
    //         isVisible={isCustomTimeRangeOpen}
    //         onToggle={this.handleToggleCustomTimeRange}
    //         onClose={this.handleCloseCustomTimeRange}
    //         page={page}
    //       />
    //     ) : null}
    //   </div>
    // )
  }

  private get dropdownLabel(): string {
    const {selected} = this.props

    if (selected.upper === null) {
      const isolateTime = selected.lower.split(' ').pop()
      return `Past ${isolateTime}`
    }

    const upper = this.formatTimestamp(selected.upper)
    const lower = this.formatTimestamp(selected.lower)

    return `${lower} - ${upper}`
  }

  private get dropdownWidth(): number {
    const {selected} = this.props

    if (selected.upper === null) {
      return 120
    }

    return 290
  }

  private get absoluteTimeRange(): JSX.Element {
    const {preventCustomTimeRange} = this.props

    if (preventCustomTimeRange) {
      return <></>
    }

    return (
      <>
        <DropdownDivider text="Absolute Time" />
      </>
    )
  }

  private get relativeTimeRanges(): JSX.Element[] {
    return timeRanges.map(option => (
      <DropdownItem
        key={option.lower}
        text={option.menuOption}
        value={option}
      />
    ))
  }

  private get relativeTimeDivider(): string {
    const {preventCustomTimeRange} = this.props

    if (preventCustomTimeRange) {
      return 'Global Time'
    }

    return 'Relative Time'
  }

  // private findTimeRangeInputValue = ({upper, lower}) => {
  //   if (upper && lower) {
  //     if (upper === 'now()') {
  //       return `${format(lower)} - Now`
  //     }

  //     return `${format(lower)} - ${format(upper)}`
  //   }

  //   const selected = timeRanges.find(range => range.lower === lower)
  //   return selected ? selected.inputValue : 'Custom'
  // }

  private handleSelection = (selected: TimeRangeOption) => {
    const {onChooseTimeRange} = this.props
    const timeRange = this.validateTimeSelection(selected)

    onChooseTimeRange(timeRange)
  }

  // private handleApplyCustomTimeRange = customTimeRange => {
  //   this.props.onChooseTimeRange({...customTimeRange})
  //   this.setState({customTimeRange, isOpen: false})
  // }

  private validateTimeSelection = (selected: TimeRangeOption): TimeRange => {
    const {upper, lower, seconds} = selected

    if (upper === null) {
      return {
        upper,
        lower,
        seconds,
      }
    }

    const timeIsValid = moment(upper).isValid() && moment(lower).isValid()

    if (timeIsValid) {
      return {
        upper,
        lower,
      }
    }

    return {
      upper: timeRanges[0].upper,
      lower: timeRanges[0].lower,
      seconds: timeRanges[0].seconds,
    }
  }

  private formatTimestamp = (timestamp: string): string => {
    const dateFormat = 'YYYY-MM-DD HH:mm'

    return moment(timestamp.replace(/\'/g, '')).format(dateFormat)
  }
}

export default TimeRangeDropdown
