import React, {PureComponent, ChangeEvent, KeyboardEvent} from 'react'
import uuid from 'uuid'

import Dropdown from 'src/reusable_ui/components/dropdowns/Dropdown'
import DropdownItem from 'src/reusable_ui/components/dropdowns/DropdownItem'
import {ComponentColor} from 'src/reusable_ui/types'

import {
  fillQueryOptions,
  FillQueryOption,
  NULL_STRING,
  NUMBER,
} from 'src/shared/components/fill_query_dropdown/fillQueryOptions'

import './FillQueryDropdown.scss'

import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  onChooseFill: (text: string) => void
  selected: string
  isDisabled?: boolean
}

interface State {
  selected: FillQueryOption
  customNumber: string
}

@ErrorHandling
class FillQuery extends PureComponent<Props, State> {
  public static defaultProps: Partial<Props> = {
    selected: NULL_STRING,
  }

  private numberInput: HTMLElement

  constructor(props) {
    super(props)

    const selected = fillQueryOptions.find(fill => fill.type === NUMBER)

    this.state = {
      selected,
      customNumber: selected.inputValue,
    }
  }

  public render() {
    const {isDisabled} = this.props
    const {selected} = this.state

    return (
      <div className="fill-query">
        <label className="fill-query--label">Fill:</label>
        <Dropdown
          selectedItem={selected.label}
          width={100}
          color={ComponentColor.Primary}
          onChange={this.handleDropdown}
          disabled={isDisabled}
        >
          {fillQueryOptions.map(option => (
            <DropdownItem key={uuid.v4()} text={option.label} value={option} />
          ))}
        </Dropdown>
        {this.customNumberInput}
      </div>
    )
  }

  private get customNumberInput(): JSX.Element {
    const {selected, customNumber} = this.state

    if (selected.type === NUMBER) {
      return (
        <input
          ref={r => (this.numberInput = r)}
          type="number"
          className="form-control input-sm fill-query--input"
          placeholder="Custom Value"
          autoFocus={true}
          value={customNumber}
          onKeyDown={this.handleKeyDown}
          onChange={this.handleInputChange}
          onBlur={this.handleInputBlur}
        />
      )
    }

    return null
  }

  private handleDropdown = (selected: FillQueryOption): void => {
    const {onChooseFill} = this.props

    onChooseFill(selected.inputValue)
    this.setState({selected})
  }

  private handleInputBlur = (): void => {
    const {onChooseFill} = this.props
    const {customNumber} = this.state

    onChooseFill(customNumber)
  }

  private handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    this.setState({customNumber: e.target.value})
  }

  private handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      this.numberInput.blur()
    }
  }
}

export default FillQuery
