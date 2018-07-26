import React, {SFC} from 'react'

import {GroupBy, TimeShift} from 'src/types'

import GroupByTimeDropdown from 'src/shared/components/dropdown_group_by_time/GroupByTimeDropdown'
import TimeShiftDropdown from 'src/shared/components/dropdown_time_shift/TimeShiftDropdown'
import FillQueryDropdown from 'src/shared/components/dropdown_fill_query/FillQueryDropdown'
import {DropdownMenuColors} from 'src/reusable_ui/types'

interface Props {
  fill: string
  onFill: (fill: string) => void
  groupBy: GroupBy
  shift: TimeShift
  onGroupByTime: (groupBy: GroupBy) => void
  isKapacitorRule: boolean
  onTimeShift: (shift: TimeShift) => void
  isDisabled: boolean
}

const QueryOptions: SFC<Props> = ({
  fill,
  shift,
  onFill,
  groupBy,
  onTimeShift,
  onGroupByTime,
  isKapacitorRule,
  isDisabled,
}) => (
  <div className="query-builder--field-options">
    <GroupByTimeDropdown
      selected={groupBy.time}
      onChooseGroupByTime={onGroupByTime}
      isDisabled={isDisabled}
      excludeAutoOption={isKapacitorRule}
      menuColor={
        isKapacitorRule
          ? DropdownMenuColors.Malachite
          : DropdownMenuColors.Sapphire
      }
    />
    {isKapacitorRule ? null : (
      <TimeShiftDropdown
        selected={shift && shift.label}
        onChooseTimeShift={onTimeShift}
        isDisabled={isDisabled}
      />
    )}
    {isKapacitorRule ? null : (
      <FillQueryDropdown
        selected={fill}
        onChooseFill={onFill}
        isDisabled={isDisabled}
      />
    )}
  </div>
)

export default QueryOptions
