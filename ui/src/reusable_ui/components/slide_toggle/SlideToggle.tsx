// Libraries
import React, {Component} from 'react'
import classnames from 'classnames'

// Types
import {ComponentColor, ComponentSize} from 'src/reusable_ui/types'

import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  onChange: () => void
  active: boolean
  size?: ComponentSize
  color?: ComponentColor
  disabled?: boolean
  tooltipText?: string
  entity?: string
}

@ErrorHandling
class SlideToggle extends Component<Props> {
  public static defaultProps: Partial<Props> = {
    size: ComponentSize.Small,
    color: ComponentColor.Primary,
    tooltipText: '',
    disabled: false,
  }

  public render() {
    const {tooltipText} = this.props

    return (
      <div
        className={this.className}
        onClick={this.handleClick}
        title={tooltipText}
        data-test={this.dataTest}
      >
        <div className="slide-toggle--knob" />
      </div>
    )
  }

  public handleClick = () => {
    const {onChange, disabled} = this.props

    if (disabled) {
      return
    }

    onChange()
  }

  private get className(): string {
    const {size, color, disabled, active} = this.props

    return classnames(
      `slide-toggle slide-toggle-${size} slide-toggle-${color}`,
      {active, disabled}
    )
  }

  private get dataTest(): string {
    const {active, entity} = this.props

    return active ? `turn-off-${entity}--toggle` : `turn-on-${entity}--toggle`
  }
}

export default SlideToggle
