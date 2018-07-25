import React, {SFC} from 'react'
import uuid from 'uuid'

import {PERIODS} from 'src/kapacitor/constants'
import Dropdown from 'src/reusable_ui/components/dropdowns/Dropdown'
import DropdownItem from 'src/reusable_ui/components/dropdowns/DropdownItem'
import {DropdownMenuColors} from 'src/reusable_ui/types'

import {AlertRule} from 'src/types'

const periods = PERIODS.map(text => {
  return {text}
})

interface Item {
  text: string
}

interface Props {
  rule: AlertRule
  onChange: (item: Item) => void
}

const Deadman: SFC<Props> = ({rule, onChange}) => (
  <div className="rule-section--row rule-section--row-first rule-section--row-last">
    <p>Send Alert if Data is missing for</p>
    <Dropdown
      width={70}
      selectedItem={rule.values.period}
      onChange={onChange}
      menuColor={DropdownMenuColors.Malachite}
    >
      {periods.map(option => (
        <DropdownItem key={uuid.v4()} text={option.text} value={option} />
      ))}
    </Dropdown>
  </div>
)

export default Deadman
