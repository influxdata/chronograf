// Libraries
import React, {Component, CSSProperties} from 'react'
import classnames from 'classnames'

// Components
import {ClickOutside} from 'src/shared/components/ClickOutside'
import DropdownDivider from 'src/reusable_ui/components/dropdowns/DropdownDivider'
import DropdownItem from 'src/reusable_ui/components/dropdowns/DropdownItem'
import DropdownButton from 'src/reusable_ui/components/dropdowns/DropdownButton'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'

// Types
import {
  ComponentColor,
  ComponentSize,
  IconFont,
  DropdownMenuColors,
} from 'src/reusable_ui/types'

// Styles
import './Dropdown.scss'

import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  children: JSX.Element[]
  onChange: (value: any) => void
  selectedItemKey: string
  buttonColor?: ComponentColor
  buttonSize?: ComponentSize
  menuColor?: DropdownMenuColors
  disabled?: boolean
  widthPixels?: number
  icon?: IconFont
  wrapText?: boolean
  customClass?: string
  maxMenuHeight?: number
}

interface State {
  expanded: boolean
}

@ErrorHandling
class Dropdown extends Component<Props, State> {
  public static defaultProps: Partial<Props> = {
    buttonColor: ComponentColor.Default,
    size: ComponentSize.Small,
    disabled: false,
    width: 120,
    wrapText: false,
    maxMenuHeight: 250,
    menuColor: DropdownMenuColors.Sapphire,
  }

  public static Button = DropdownButton
  public static Item = DropdownItem
  public static Divider = DropdownDivider

  constructor(props: Props) {
    super(props)

    this.state = {
      expanded: false,
    }
  }

  public render() {
    const width = `${this.props.width}px`

    this.validateChildren()

    return (
      <ClickOutside onClickOutside={this.collapseMenu}>
        <div className={this.containerClassName} style={{width}}>
          {this.button}
          {this.menuItems}
        </div>
      </ClickOutside>
    )
  }

  private toggleMenu = (): void => {
    this.setState({expanded: !this.state.expanded})
  }

  private collapseMenu = (): void => {
    this.setState({expanded: false})
  }

  private get containerClassName(): string {
    const {buttonColor, size, disabled, wrapText, customClass} = this.props

    return classnames(`dropdown dropdown-${size} dropdown-${buttonColor}`, {
      disabled,
      'dropdown-wrap': wrapText,
      [customClass]: customClass,
    })
  }

  private get button(): JSX.Element {
    const {
      selectedItemKey,
      disabled,
      buttonColor,
      size,
      icon,
      children,
    } = this.props
    const {expanded} = this.state

    const selectedChild = children.find(
      child => child.props.itemKey === selectedItemKey
    )

    return (
      <DropdownButton
        active={expanded}
        color={buttonColor}
        size={size}
        icon={icon}
        disabled={disabled}
        onClick={this.toggleMenu}
      >
        {selectedChild.props.children}
      </DropdownButton>
    )
  }

  private get menuItems(): JSX.Element {
    const {selectedItemKey, maxMenuHeight, menuColor, children} = this.props
    const {expanded} = this.state

    if (expanded) {
      return (
        <div
          className={`dropdown--menu-container dropdown--${menuColor}`}
          style={this.menuStyle}
        >
          <FancyScrollbar
            autoHide={false}
            autoHeight={true}
            maxHeight={maxMenuHeight}
          >
            <div className="dropdown--menu">
              {React.Children.map(children, (child: JSX.Element) =>
                React.cloneElement(child, {
                  ...child.props,
                  key: child.props.itemKey,
                  selected: child.props.itemKey === selectedItemKey,
                  onClick: this.handleItemClick,
                })
              )}
            </div>
          </FancyScrollbar>
        </div>
      )
    }

    return null
  }

  private get menuStyle(): CSSProperties {
    const {wrapText, width} = this.props

    if (wrapText) {
      return {
        width: `${width}px`,
      }
    }

    return {
      minWidth: `${width}px`,
    }
  }

  private handleItemClick = (value: any): void => {
    const {onChange} = this.props
    onChange(value)
    this.collapseMenu()
  }

  private validateChildren = (): void => {
    const {children} = this.props

    if (React.Children.count(children) === 0) {
      throw new Error(
        'Dropdowns require at least 1 child element. We recommend using Dropdown.Item and/or Dropdown.Divider.'
      )
    }
  }
}

export default Dropdown
