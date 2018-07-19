import React, {SFC} from 'react'
import uuid from 'uuid'

import Dropdown from 'src/reusable_ui/components/dropdowns/Dropdown'
import DropdownItem from 'src/reusable_ui/components/dropdowns/DropdownItem'
import {ComponentColor} from 'src/reusable_ui/types'

import {TIME_SHIFTS} from 'src/shared/components/time_shift_dropdown/timeShiftOptions'
import {TimeShift} from 'src/types'

import './TimeShiftDropdown.scss'

interface Props {
  selected: string
  onChooseTimeShift: (timeShift: TimeShift) => void
  isDisabled: boolean
}

const TimeShiftDropdown: SFC<Props> = ({
  selected,
  onChooseTimeShift,
  isDisabled,
}) => (
  <div className="time-shift">
    <label className="time-shift--label">Compare:</label>
    <Dropdown
      color={ComponentColor.Primary}
      onChange={onChooseTimeShift}
      selectedItem={selected || 'none'}
      disabled={isDisabled}
      width={73}
    >
      {TIME_SHIFTS.map(option => (
        <DropdownItem key={uuid.v4()} text={option.label} value={option} />
      ))}
    </Dropdown>
  </div>
)

export default TimeShiftDropdown
