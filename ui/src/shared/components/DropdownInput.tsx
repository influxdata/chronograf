import React, {FunctionComponent, ChangeEvent, KeyboardEvent} from 'react'
import {CSSProperties} from 'react'

const disabledClass = (disabled: boolean) => (disabled ? ' disabled' : '')

type OnFilterChangeHandler = (e: ChangeEvent<HTMLInputElement>) => void
type OnFilterKeyPress = (e: KeyboardEvent<HTMLInputElement>) => void

interface Props {
  searchTerm: string
  buttonSize: string
  buttonColor: string
  toggleStyle?: CSSProperties
  disabled?: boolean
  onFilterChange: OnFilterChangeHandler
  onFilterKeyPress: OnFilterKeyPress
}

const DropdownInput: FunctionComponent<Props> = ({
  searchTerm,
  buttonSize,
  buttonColor,
  toggleStyle,
  disabled,
  onFilterChange,
  onFilterKeyPress,
}) => (
  <div
    className={`dropdown-autocomplete dropdown-toggle ${buttonSize} ${buttonColor}${disabledClass(
      disabled
    )}`}
    style={toggleStyle}
  >
    <input
      className="dropdown-autocomplete--input"
      type="text"
      autoFocus={true}
      placeholder="Filter items..."
      spellCheck={false}
      onChange={onFilterChange}
      onKeyDown={onFilterKeyPress}
      value={searchTerm}
    />
    <span className="caret" />
  </div>
)

export default DropdownInput
