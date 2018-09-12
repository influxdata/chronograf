// Libraries
import React, {Component, MouseEvent} from 'react'
import classnames from 'classnames'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  index: number
  onMouseDown: (index: number, e: MouseEvent<HTMLDivElement>) => void
  hoverEnabled: boolean
  color: string
  label: string
  enabled?: boolean
}

@ErrorHandling
class StaticLegend extends Component<Props> {
  public static defaultProps: Partial<Props> = {
    enabled: true,
  }

  public render() {
    const {color, label} = this.props

    return (
      <div className={this.className} onMouseDown={this.handleMouseDown}>
        <span style={{color}}>{label}</span>
      </div>
    )
  }

  private handleMouseDown = (e: MouseEvent<HTMLDivElement>): void => {
    const {onMouseDown, index} = this.props

    onMouseDown(index, e)
  }

  private get className(): string {
    const {enabled, hoverEnabled} = this.props

    return classnames('', {
      disabled: !enabled,
      'static-legend--item': hoverEnabled,
      'static-legend--single': !hoverEnabled,
    })
  }
}

export default StaticLegend
