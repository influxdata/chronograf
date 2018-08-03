// Libraries
import React, {Component} from 'react'
import classnames from 'classnames'

interface Props {
  children: JSX.Element | string | number
  value: any
  id: string
  active?: boolean
  disabled?: boolean
  onClick?: (value: any) => void
}

class RadioButton extends Component<Props> {
  public static defaultProps = {
    disabled: false,
    active: false,
  }

  public render() {
    const {children, disabled} = this.props

    return (
      <button
        className={this.className}
        onClick={this.handleClick}
        disabled={disabled}
      >
        {children}
      </button>
    )
  }

  private handleClick = (): void => {
    const {value, onClick} = this.props

    onClick(value)
  }
  private get className(): string {
    const {active} = this.props

    return classnames('radio--buttion', {active})
  }
}

export default RadioButton
