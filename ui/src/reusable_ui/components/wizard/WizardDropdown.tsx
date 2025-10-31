import React, {PureComponent} from 'react'
import Dropdown from 'src/shared/components/Dropdown'
import {DropdownItem} from 'src/types'
import {ErrorHandling} from 'src/shared/decorators/errors'

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

class WizardDropdown extends PureComponent<Props> {
  public render() {
    const {label, subtext, halfWidth, testId} = this.props

    return (
      <div className={'form-group ' + (halfWidth ? 'col-xs-6' : 'col-xs-12')}>
        <label htmlFor={`wizard-dropdown-${testId}`}>{label}</label>
        <Dropdown
          items={this.dropdownItems}
          selected={this.selectedText}
          onChoose={this.handleChoose}
          className="dropdown-stretch"
          data-testid={testId}
        />
        {subtext && <span className="wizard-dropdown--subtext">{subtext}</span>}
      </div>
    )
  }

  private get dropdownItems(): DropdownItem[] {
    return this.props.options.map(option => ({
      text: option.label,
    }))
  }

  private get selectedText(): string {
    const {value, options, placeholder = 'Select option...'} = this.props
    const selectedOption = options.find(opt => opt.value === value)
    return selectedOption ? selectedOption.label : placeholder
  }

  private handleChoose = (item: DropdownItem) => {
    const {options, onChange} = this.props
    const selectedOption = options.find(opt => opt.label === item.text)
    if (selectedOption) {
      onChange(selectedOption.value)
    }
  }
}

export default ErrorHandling(WizardDropdown)
