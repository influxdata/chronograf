import * as React from 'react'

import onClickOutside from 'shared/components/onClickOutside'

import {OptInType} from 'src/types'

export interface ClickOutsideInputProps {
  min?: string
  id: string
  type: OptInType
  customPlaceholder: string
  customValue: string
  onGetRef: (el: {}) => void
  onFocus: (e: {}) => void
  onChange: (e: {}) => void
  onKeyDown: (e: {}) => void
  handleClickOutsideInput: (e: {}) => void
}

class ClickOutsideInput extends React.Component<ClickOutsideInputProps> {
  public handleClickOutside = e => {
    this.props.handleClickOutsideInput(e)
  }

  public render() {
    const {
      id,
      min,
      type,
      onFocus,
      onChange,
      onGetRef,
      onKeyDown,
      customValue,
      customPlaceholder,
    } = this.props

    return (
      <input
        className="form-control input-sm"
        id={id}
        min={min}
        type={type}
        name={customPlaceholder}
        ref={onGetRef}
        value={customValue}
        onFocus={onFocus}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={customPlaceholder}
      />
    )
  }
}

export default onClickOutside<ClickOutsideInputProps>(ClickOutsideInput)
