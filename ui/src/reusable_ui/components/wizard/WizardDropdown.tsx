import React, {useMemo, useCallback} from 'react'
import Dropdown from 'src/shared/components/Dropdown'
import {DropdownItem} from 'src/types'

interface DropdownOption {
  value: string
  label: string
}

interface Props {
  value?: string
  options: DropdownOption[]
  placeholder?: string
  label: string
  subtext?: string
  onChange: (value: string) => void
  halfWidth?: boolean
  testId?: string
}

const WizardDropdown: React.FC<Props> = ({
  value,
  options,
  placeholder = 'Select option...',
  label,
  subtext,
  onChange,
  halfWidth,
  testId,
}) => {
  const dropdownItems = useMemo(
    () =>
      options.map(option => ({
        text: option.label,
      })),
    [options]
  )

  const selectedText = useMemo(() => {
    const selectedOption = options.find(opt => opt.value === value)
    return selectedOption ? selectedOption.label : placeholder
  }, [value, options, placeholder])

  const handleChoose = useCallback(
    (item: DropdownItem) => {
      const selectedOption = options.find(opt => opt.label === item.text)
      if (selectedOption) {
        onChange(selectedOption.value)
      }
    },
    [options, onChange]
  )

  return (
    <div className={'form-group ' + (halfWidth ? 'col-xs-6' : 'col-xs-12')}>
      <label htmlFor={`wizard-dropdown-${testId}`}>{label}</label>
      <Dropdown
        items={dropdownItems}
        selected={selectedText}
        onChoose={handleChoose}
        className="dropdown-stretch"
        data-testid={testId}
      />
      {subtext && <span className="wizard-dropdown--subtext">{subtext}</span>}
    </div>
  )
}

export default WizardDropdown
