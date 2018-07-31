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
  DropdownMenuColors,
  ComponentStatus,
  ComponentColor,
  ComponentSize,
  IconFont,
} from 'src/reusable_ui/types'

// Styles
import './Dropdown.scss'

import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  children: JSX.Element[]
  onChange: (value: any) => void
  selectedID: string
  buttonColor?: ComponentColor
  buttonSize?: ComponentSize
  menuColor?: DropdownMenuColors
  status?: ComponentStatus
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
    buttonSize: ComponentSize.Small,
    status: ComponentStatus.Default,
    widthPixels: 120,
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
    const width = `${this.props.widthPixels}px`

    this.validateChildCount()

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
    const {buttonColor, buttonSize, status, wrapText, customClass} = this.props

    return classnames(
      `dropdown dropdown-${buttonSize} dropdown-${buttonColor}`,
      {
        disabled: status === ComponentStatus.Disabled,
        'dropdown-wrap': wrapText,
        [customClass]: customClass,
      }
    )
  }

  private get button(): JSX.Element {
    const {
      selectedID,
      status,
      buttonColor,
      buttonSize,
      icon,
      children,
    } = this.props
    const {expanded} = this.state

    const selectedChild = children.find(child => child.props.id === selectedID)

    return (
      <DropdownButton
        active={expanded}
        color={buttonColor}
        size={buttonSize}
        icon={icon}
        onClick={this.toggleMenu}
        status={status}
      >
        {selectedChild.props.children}
      </DropdownButton>
    )
  }

  private get menuItems(): JSX.Element {
    const {selectedID, maxMenuHeight, menuColor, children} = this.props
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
              {React.Children.map(children, (child: JSX.Element) => {
                if (this.childTypeIsValid(child)) {
                  if (child.type === DropdownItem) {
                    return (
                      <DropdownItem
                        {...child.props}
                        key={child.props.id}
                        selected={child.props.id === selectedID}
                        onClick={this.handleItemClick}
                      >
                        {child.props.children}
                      </DropdownItem>
                    )
                  }

                  return (
                    <DropdownDivider {...child.props} key={child.props.id} />
                  )
                } else {
                  throw new Error(
                    'Expected children of type <Dropdown.Item /> or <Dropdown.Divider />'
                  )
                }
              })}
            </div>
          </FancyScrollbar>
        </div>
      )
    }

    return null
  }

  private get menuStyle(): CSSProperties {
    const {wrapText, widthPixels} = this.props

    if (wrapText) {
      return {
        width: `${widthPixels}px`,
      }
    }

    return {
      minWidth: `${widthPixels}px`,
    }
  }

  private handleItemClick = (value: any): void => {
    const {onChange} = this.props
    onChange(value)
    this.collapseMenu()
  }

  private validateChildCount = (): void => {
    const {children} = this.props

    if (React.Children.count(children) === 0) {
      throw new Error(
        'Dropdowns require at least 1 child element. We recommend using Dropdown.Item and/or Dropdown.Divider.'
      )
    }
  }

  private childTypeIsValid = (child: JSX.Element): boolean =>
    child.type === DropdownItem || child.type === DropdownDivider
}

export default Dropdown
