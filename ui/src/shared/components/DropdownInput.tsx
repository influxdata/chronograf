import React, {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useMemo,
  useRef,
} from 'react'
import {CSSProperties} from 'react'

const disabledClass = (disabled: boolean) => (disabled ? ' disabled' : '')

type OnFilterChangeHandler = (e: ChangeEvent<HTMLInputElement>) => void
type OnFilterKeyPress = (e: KeyboardEvent<HTMLInputElement>) => void

const selectAllTextInInput = (event: ChangeEvent<HTMLInputElement>) => {
  event.target.select()
}
interface Props {
  searchTerm: string
  buttonSize: string
  buttonColor: string
  selectedValue?: string
  toggleStyle?: CSSProperties
  disabled?: boolean
  placeholder?: string
  onFilterChange: OnFilterChangeHandler
  onFilterKeyPress: OnFilterKeyPress
}

const DropdownInput = ({
  searchTerm,
  buttonSize,
  buttonColor,
  selectedValue = '',
  toggleStyle,
  disabled,
  onFilterChange,
  onFilterKeyPress,
  placeholder = 'Filter items...',
}: Props) => {
  // show actually selected value only if search term is empty
  const renderSelected = useRef(!searchTerm)
  const value = useMemo(() => {
    if (searchTerm) {
      return searchTerm
    }
    return renderSelected.current ? selectedValue : ''
  }, [searchTerm, renderSelected.current])
  const onChange: OnFilterChangeHandler = useCallback(
    e => {
      renderSelected.current = false
      onFilterChange(e)
    },
    [onFilterChange]
  )
  const onKeyPress: OnFilterKeyPress = useCallback(
    e => {
      renderSelected.current = false
      onFilterKeyPress(e)
    },
    [onFilterKeyPress]
  )

  return (
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
        placeholder={placeholder}
        spellCheck={false}
        onChange={onChange}
        onKeyDown={onKeyPress}
        onFocus={selectAllTextInInput}
        value={value}
      />
      <span className="caret" />
    </div>
  )
}

export default DropdownInput
