import React, {Component} from 'react'
import classnames from 'classnames'
import {ComponentColor, ComponentSize, IconFont} from 'src/reusable_ui/types'
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  onClick: () => void
  disabled?: boolean
  active?: boolean
  color?: ComponentColor
  size?: ComponentSize
  icon?: IconFont
  label: string
}

@ErrorHandling
class DropdownButton extends Component<Props> {
  public static defaultProps = {
    color: ComponentColor.Default,
    size: ComponentSize.Small,
    disabled: false,
    active: false,
  }

  public render() {
    const {onClick, disabled, label} = this.props
    return (
      <button className={this.classname} onClick={onClick} disabled={disabled}>
        {this.icon}
        <span className="dropdown--selected">{label}</span>
        <span className="dropdown--caret icon caret-down" />
      </button>
    )
  }

  private get classname(): string {
    const {disabled, active, color, size} = this.props

    return classnames(`dropdown--button btn btn-${color} btn-${size}`, {
      disabled,
      active,
    })
  }

  private get icon(): JSX.Element {
    const {icon} = this.props

    if (icon) {
      return <span className={`dropdown--icon icon ${icon}`} />
    }

    return null
  }
}

export default DropdownButton
