import React, {ChangeEvent, KeyboardEvent, PureComponent} from 'react'
import {ErrorHandling} from 'src/shared/decorators/errors'
import './wizard-text-input.scss'

interface Validation {
  status: boolean
  reason: string
}

interface Props {
  value: string
  label: string
  onBlur?: (value: string) => void
  isValid?: (value) => Validation
  isDisabled?: boolean
  onChange?: (value: string) => void
  valueModifier?: (value: string) => string
  placeholder?: string
  autoFocus?: boolean
}

interface State {
  initialValue: string
}

@ErrorHandling
class WizardTextInput extends PureComponent<Props, State> {
  public static defaultProps: Partial<Props> = {
    isDisabled: false,
    isValid: () => ({
      status: true,
      reason: 'this is the reason your input is bad',
    }),
    valueModifier: x => x,
    autoFocus: false,
  }

  constructor(props) {
    super(props)

    this.state = {
      initialValue: this.props.value,
    }
  }

  public render() {
    const {
      isDisabled,
      placeholder,
      isValid,
      value,
      autoFocus,
      label,
    } = this.props

    let inputClass = ''
    let errorText = ''
    const validation = isValid(value)
    if (validation.status === false) {
      inputClass = 'form-volcano'
      errorText = validation.reason
      console.log('false')
    }
    console.log(value)

    return (
      <div className="form-group col-xs-12 wizard-input">
        <label htmlFor={label}>{label}</label>
        <input
          type="text"
          id={label}
          className={`form-control input-sm wizard-input ${inputClass}`}
          defaultValue={value}
          placeholder={placeholder}
          onBlur={this.handleBlur}
          onKeyDown={this.handleKeyDown}
          onChange={this.handleChange}
          disabled={isDisabled}
          autoFocus={autoFocus}
          spellCheck={false}
          autoComplete={'off'}
        />
        {errorText}
      </div>
    )
  }

  private handleBlur = (e: ChangeEvent<HTMLInputElement>) => {
    const {onBlur, value, valueModifier} = this.props

    const newValue = valueModifier(e.target.value)

    if (value !== newValue) {
      onBlur(newValue)
    }

    this.setState({
      initialValue: newValue,
    })
  }

  private handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const {onChange, valueModifier} = this.props
    if (onChange) {
      onChange(valueModifier(e.target.value))
    }
  }

  private handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const {onBlur, value, valueModifier} = this.props
    if (e.key === 'Enter') {
      const newValue = valueModifier(e.currentTarget.value) // could this be target instead?
      if (value !== newValue) {
        onBlur(newValue)
      }

      this.setState({
        initialValue: newValue,
      })
    }
    if (e.key === 'Escape') {
      this.handleEscape()
    }
  }

  private handleEscape = () => {
    const {onBlur} = this.props
    const {initialValue} = this.state

    onBlur(initialValue)
  }
}

export default WizardTextInput
