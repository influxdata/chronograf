// Libraries
import React, {Component} from 'react'
import classnames from 'classnames'

// Components
import RadioButton from 'src/reusable_ui/components/RadioButtons/RadioButton'

// Types
import {ComponentColor, ComponentSize, ButtonShape} from 'src/reusable_ui'

interface Props {
  children: JSX.Element[]
  customClass?: string
  color?: ComponentColor
  size?: ComponentSize
  shape?: ButtonShape
  selectedID: string
  onChange: (value: any) => void
}

class Radio extends Component<Props> {
  public static defaultProps = {
    color: ComponentColor.Default,
    size: ComponentSize.Small,
    shape: ButtonShape.Default,
  }

  public static Button = RadioButton

  public render() {
    return <div className={this.className}>{this.buttons}</div>
  }

  private get buttons(): JSX.Element[] {
    const {children, selectedID} = this.props

    return React.Children.map(children, (child: JSX.Element) => {
      if (this.childTypeIsValid(child)) {
        return (
          <RadioButton
            {...child.props}
            key={child.props.id}
            active={child.props.id === selectedID}
            onClick={this.handleButtonClick}
          >
            {child.props.children}
          </RadioButton>
        )
      }

      throw new Error('<Radio> expected children of type <Radio.Button>')
    })
  }

  private get className(): string {
    const {color, size, shape, customClass} = this.props

    return classnames(
      `radio-buttons radio-buttons-${color} radio-buttons-${size}`,
      {
        'radio-buttons-square': shape === ButtonShape.Square,
        'radio-buttons-stretch': shape === ButtonShape.StretchToFit,
        [customClass]: customClass,
      }
    )
  }

  private handleButtonClick = (value: any): void => {
    this.props.onChange(value)
  }

  private childTypeIsValid = (child: JSX.Element): boolean =>
    child.type === RadioButton
}

export default Radio
