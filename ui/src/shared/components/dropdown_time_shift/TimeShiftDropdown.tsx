import React, {SFC} from 'react'

import Dropdown from '../../../reusable_ui/components/dropdowns/Dropdown'
import {ComponentColor} from '../../../reusable_ui/types'

import {TIME_SHIFTS} from './timeShiftOptions'
import {TimeShift} from '../../../types'

import './TimeShiftDropdown.scss'

const TIME_SHIFT_DROPDOWN_WIDTH = 73

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
      width={TIME_SHIFT_DROPDOWN_WIDTH}
    >
      {TIME_SHIFTS.map(option => (
        <Dropdown.Item
          key={`time-shift-option-${option.label}`}
          text={option.label}
          value={option}
        />
      ))}
    </Dropdown>
  </div>
)

export default TimeShiftDropdown
