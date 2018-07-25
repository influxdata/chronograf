import React, {SFC, ChangeEvent} from 'react'

import {CHANGES, RELATIVE_OPERATORS, SHIFTS} from 'src/kapacitor/constants'
import Dropdown from 'src/reusable_ui/components/dropdowns/Dropdown'
import DropdownItem from 'src/reusable_ui/components/dropdowns/DropdownItem'
import {DropdownMenuColors} from 'src/reusable_ui/types'

import {AlertRule} from 'src/types'

const mapToItems = (arr: string[], type: string) =>
  arr.map(text => ({text, type}))

const changes = mapToItems(CHANGES, 'change')
const shifts = mapToItems(SHIFTS, 'shift')
const operators = mapToItems(RELATIVE_OPERATORS, 'operator')

interface TypeItem {
  type: string
  text: string
}
interface Props {
  onRuleTypeInputChange: (e: ChangeEvent<HTMLInputElement>) => void
  onDropdownChange: (item: TypeItem) => void
  rule: AlertRule
}

const Relative: SFC<Props> = ({
  onRuleTypeInputChange,
  onDropdownChange,
  rule: {
    values: {change, shift, operator, value},
  },
}) => (
  <div className="rule-section--row rule-section--row-first rule-section--border-bottom">
    <p>Send Alert when</p>
    <Dropdown
      width={110}
      selectedItem={change}
      onChange={onDropdownChange}
      menuColor={DropdownMenuColors.Malachite}
    >
      {changes.map(option => (
        <DropdownItem
          key={`relative-changes-${option.text}`}
          text={option.text}
          value={option}
        />
      ))}
    </Dropdown>
    <p>compared to previous</p>
    <Dropdown
      width={80}
      selectedItem={shift}
      onChange={onDropdownChange}
      menuColor={DropdownMenuColors.Malachite}
    >
      {shifts.map(option => (
        <DropdownItem
          key={`relative-shifts-${option.text}`}
          text={option.text}
          value={option}
        />
      ))}
    </Dropdown>
    <p>is</p>
    <Dropdown
      width={160}
      selectedItem={operator}
      onChange={onDropdownChange}
      menuColor={DropdownMenuColors.Malachite}
    >
      {operators.map(option => (
        <DropdownItem
          key={`relative-operators-${option.text}`}
          text={option.text}
          value={option}
        />
      ))}
    </Dropdown>
    <form style={{display: 'flex'}}>
      <input
        className="form-control input-sm form-malachite monotype"
        style={{width: '160px', marginLeft: '6px'}}
        type="text"
        name="lower"
        spellCheck={false}
        value={value}
        onChange={onRuleTypeInputChange}
        required={true}
      />
    </form>
    {change === CHANGES[1] ? <p>%</p> : null}
  </div>
)

export default Relative
