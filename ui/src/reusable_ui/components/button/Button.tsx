// Libraries
import React, {Component} from 'react'
import classnames from 'classnames'

// Types
import {ComponentColor, ComponentSize, ButtonShape} from 'src/reusable_ui/types'
import {RemoteDataState} from 'src/types/flux'

// Styles
import './Button.scss'

interface Props {
  text: string
  onClick?: () => void
  color?: ComponentColor
  size?: ComponentSize
  shape?: ButtonShape
  icon?: string // TODO: Replace with enum when Dropdown PR gets merged
  disabled?: boolean
  status?: RemoteDataState
  titleText?: string
}

class Button extends Component<Props> {
  public static defaultProps: Partial<Props> = {
    color: ComponentColor.Default,
    size: ComponentSize.Small,
    shape: ButtonShape.Default,
    disabled: false,
    status: RemoteDataState.Done,
  }

  public render() {
    const {disabled, onClick, text, titleText} = this.props

    return (
      <button
        className={this.className}
        disabled={disabled}
        onClick={onClick}
        title={titleText || text}
      >
        {this.icon}
        {this.text}
        {this.statusIndicator}
      </button>
    )
  }

  private get icon(): JSX.Element {
    const {icon} = this.props

    if (icon) {
      return <span className={`button-icon icon ${icon}`} />
    }

    return null
  }

  private get text(): string {
    const {text, shape} = this.props

    if (shape === ButtonShape.Square) {
      return null
    }

    return text
  }

  private get statusIndicator(): JSX.Element {
    const {status, size} = this.props

    if (status === RemoteDataState.Loading) {
      return <div className={`button-spinner button-spinner--${size}`} />
    }

    if (status === RemoteDataState.Error) {
      return <div className="button--error" />
    }

    return null
  }

  private get className(): string {
    const {color, size, shape, status} = this.props

    return classnames(`button button-${size} button-${color}`, {
      'button-square': shape === ButtonShape.Square,
      'button-stretch': shape === ButtonShape.StretchToFit,
      'button--loading': status === RemoteDataState.Loading,
      'button--error': status === RemoteDataState.Error,
    })
  }
}

export default Button
