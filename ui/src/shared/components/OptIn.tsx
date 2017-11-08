import * as React from 'react'
import * as classnames from 'classnames'

import * as uuidv4 from 'uuid/v4'

import ClickOutsideInput from 'shared/components/ClickOutsideInput'

import {OptInType} from 'src/types'

export interface OptInProps {
  min?: string
  fixedValue?: string
  fixedPlaceholder?: string
  customValue?: string
  customPlaceholder?: string
  onSetValue: (value: string) => void
  type: OptInType
}

export interface OptInState {
  useCustomValue: boolean
  fixedValue: string
  customValue: string
}

class OptIn extends React.Component<OptInProps, OptInState> {
  private id = uuidv4()
  private isCustomValueInputFocused = false
  private customValueInput
  private grooveKnobContainer
  private grooveKnob

  public defaultProps = {
    fixedValue: '',
    fixedPlaceholder: 'auto',
    customValue: '',
    customPlaceholder: 'Custom Value',
  }

  constructor(props: OptInProps) {
    super(props)

    const {customValue, fixedValue} = props

    this.state = {
      useCustomValue: customValue !== '',
      fixedValue,
      customValue,
    }
  }

  public useFixedValue = () => {
    this.setState({useCustomValue: false, customValue: ''}, () =>
      this.setValue()
    )
  }

  public useCustomValue = () => {
    this.setState({useCustomValue: true}, () => this.setValue())
  }

  public handleClickToggle = () => {
    const useCustomValueNext = !this.state.useCustomValue
    if (useCustomValueNext) {
      this.useCustomValue()
      this.customValueInput.focus()
    } else {
      this.useFixedValue()
    }
  }

  public handleFocusCustomValueInput = () => {
    this.isCustomValueInputFocused = true
    this.useCustomValue()
  }

  public handleChangeCustomValue = e => {
    this.setCustomValue(e.target.value)
  }

  public handleKeyDownCustomValueInput = e => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      if (e.key === 'Enter') {
        this.customValueInput.blur()
      }
      this.considerResetCustomValue()
    }
  }

  public handleClickOutsideInput = e => {
    if (
      e.target.id !== this.grooveKnob.id &&
      e.target.id !== this.grooveKnobContainer.id &&
      this.isCustomValueInputFocused
    ) {
      this.considerResetCustomValue()
    }
  }

  public considerResetCustomValue = () => {
    const customValue = this.customValueInput.value.trim()

    this.setState({customValue})

    if (customValue === '') {
      this.useFixedValue()
    }

    this.isCustomValueInputFocused = false
  }

  public setCustomValue = value => {
    this.setState({customValue: value}, this.setValue)
  }

  public setValue = () => {
    const {onSetValue} = this.props
    const {useCustomValue, fixedValue, customValue} = this.state

    if (useCustomValue) {
      onSetValue(customValue)
    } else {
      onSetValue(fixedValue)
    }
  }

  public handleInputRef = el => (this.customValueInput = el)

  public render() {
    const {fixedPlaceholder, customPlaceholder, type, min} = this.props
    const {useCustomValue, customValue} = this.state

    return (
      <div
        className={classnames('opt-in', {
          'right-toggled': useCustomValue,
        })}
      >
        <ClickOutsideInput
          id={this.id}
          min={min}
          type={type}
          customValue={customValue}
          onGetRef={this.handleInputRef}
          customPlaceholder={customPlaceholder}
          onChange={this.handleChangeCustomValue}
          onFocus={this.handleFocusCustomValueInput}
          onKeyDown={this.handleKeyDownCustomValueInput}
          handleClickOutsideInput={this.handleClickOutsideInput}
        />
        <div
          className="opt-in--groove-knob-container"
          id={this.id}
          ref={el => (this.grooveKnobContainer = el)}
          onClick={this.handleClickToggle}
        >
          <div
            className="opt-in--groove-knob"
            id={this.id}
            ref={el => (this.grooveKnob = el)}
          />
        </div>
        <div className="opt-in--left-label" onClick={this.useFixedValue}>
          {fixedPlaceholder}
        </div>
      </div>
    )
  }
}

export default OptIn
