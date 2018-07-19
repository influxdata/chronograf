import React, {SFC} from 'react'

import {GroupBy, TimeShift} from 'src/types'

import GroupByTimeDropdown from 'src/shared/components/group_by_time_dropdown/GroupByTimeDropdown'
import TimeShiftDropdown from 'src/shared/components/time_shift_dropdown/TimeShiftDropdown'
import FillQuery from 'src/shared/components/FillQuery'

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
    />
    {isKapacitorRule ? null : (
      <TimeShiftDropdown
        selected={shift && shift.label}
        onChooseTimeShift={onTimeShift}
        isDisabled={isDisabled}
      />
    )}
    {isKapacitorRule ? null : (
      <FillQuery value={fill} onChooseFill={onFill} isDisabled={isDisabled} />
    )}
  </div>
)

export default QueryOptions
