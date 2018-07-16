import React, {Component} from 'react'
import classnames from 'classnames'
import {ClickOutside} from 'src/shared/components/ClickOutside'
import {ComponentColor, ComponentSize, IconFont} from 'src/reusable_ui/types'
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  color?: ComponentColor
  size?: ComponentSize
  disabled?: boolean
  children: JSX.Element
  width?: number
  icon?: IconFont
  selectedItems: string
}

interface State {
  expanded: boolean
}

export const DropdownContext = React.createContext()

@ErrorHandling
class Dropdown extends Component<Props, State> {
  public static defaultProps = {
    color: ComponentColor.Default,
    size: ComponentSize.Small,
    disabled: false,
    width: 120,
  }

  constructor(props: Props) {
    super(props)

    this.state = {
      expanded: false,
    }
  }

  public render() {
    const width = `${this.props.width}px`

    return (
      <ClickOutside onClickOutside={this.collapseMenu}>
        <DropdownContext.Provider value={width}>
          <div className={this.containerClassName} style={{width}}>
            {this.button}
            {this.menu}
          </div>
        </DropdownContext.Provider>
      </ClickOutside>
    )
  }

  private expandMenu = (): void => {
    this.setState({expanded: true})
  }

  private collapseMenu = (): void => {
    this.setState({expanded: false})
  }

  private get containerClassName(): string {
    const {color, size, disabled} = this.props

    return classnames(`dropdown dropdown-${size} dropdown-${color}`, {disabled})
  }

  private get button(): JSX.Element {
    const {selectedItems, disabled, color, size} = this.props
    const className = classnames(
      `dropdown-button btn btn-${color} btn-${size}`,
      {disabled}
    )

    return (
      <div className={className} onClick={this.expandMenu}>
        {this.icon}
        <span className="dropdown--selected">{selectedItems}</span>
        <span className="dropdown--caret" />
      </div>
    )
  }

  private get icon(): JSX.Element {
    const {icon} = this.props

    if (icon) {
      return <span className={`icon ${icon}`} />
    }

    return null
  }

  private get menu(): JSX.Element {
    const {children} = this.props
    const {expanded} = this.state

    if (expanded) {
      return <div className="dropdown--menu">{children}</div>
    }

    return null
  }
}

export default Dropdown
