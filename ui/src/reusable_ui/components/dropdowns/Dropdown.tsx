<<<<<<< HEAD
import React, {Component, CSSProperties} from 'react'
import classnames from 'classnames'
import {ClickOutside} from 'src/shared/components/ClickOutside'
import {ComponentColor, ComponentSize, IconFont} from 'src/reusable_ui/types'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import {ErrorHandling} from 'src/shared/decorators/errors'
import './Dropdown.scss'

interface Props {
  children: Array<JSX.Element | JSX.Element[]>
  onChange: (value: any) => void
  selectedItem: string
  color?: ComponentColor
  size?: ComponentSize
  disabled?: boolean
  width?: number
  icon?: IconFont
  wrapText?: boolean
=======
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
>>>>>>> WIP Introduce new components for dropdowns
}

interface State {
  expanded: boolean
}

<<<<<<< HEAD
=======
export const DropdownContext = React.createContext()

>>>>>>> WIP Introduce new components for dropdowns
@ErrorHandling
class Dropdown extends Component<Props, State> {
  public static defaultProps = {
    color: ComponentColor.Default,
    size: ComponentSize.Small,
    disabled: false,
    width: 120,
<<<<<<< HEAD
    wrapText: false,
  }

  private containerRef: HTMLElement

=======
  }

>>>>>>> WIP Introduce new components for dropdowns
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
<<<<<<< HEAD
        <div
          className={this.containerClassName}
          style={{width}}
          ref={el => (this.containerRef = el)}
        >
          {this.button}
          {this.menu}
        </div>
=======
        <DropdownContext.Provider value={width}>
          <div className={this.containerClassName} style={{width}}>
            {this.button}
            {this.menu}
          </div>
        </DropdownContext.Provider>
>>>>>>> WIP Introduce new components for dropdowns
      </ClickOutside>
    )
  }

<<<<<<< HEAD
  private toggleMenu = (): void => {
    this.setState({expanded: !this.state.expanded})
=======
  private expandMenu = (): void => {
    this.setState({expanded: true})
>>>>>>> WIP Introduce new components for dropdowns
  }

  private collapseMenu = (): void => {
    this.setState({expanded: false})
  }

  private get containerClassName(): string {
<<<<<<< HEAD
    const {color, size, disabled, wrapText} = this.props

    return classnames(`dropdown dropdown-${size} dropdown-${color}`, {
      disabled,
      'dropdown-wrap': wrapText,
    })
  }

  private get button(): JSX.Element {
    const {selectedItem, disabled, color, size} = this.props
    const {expanded} = this.state

    const className = classnames(
      `dropdown--button btn btn-${color} btn-${size}`,
      {
        disabled,
        active: expanded,
      }
    )

    return (
      <div className={className} onClick={this.toggleMenu}>
        {this.icon}
        <span className="dropdown--selected">{selectedItem}</span>
        <span className="dropdown--caret icon caret-down" />
=======
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
>>>>>>> WIP Introduce new components for dropdowns
      </div>
    )
  }

  private get icon(): JSX.Element {
    const {icon} = this.props

    if (icon) {
<<<<<<< HEAD
      return <span className={`dropdown--icon icon ${icon}`} />
=======
      return <span className={`icon ${icon}`} />
>>>>>>> WIP Introduce new components for dropdowns
    }

    return null
  }

  private get menu(): JSX.Element {
<<<<<<< HEAD
    const {children, selectedItem} = this.props
    const {expanded} = this.state

    if (expanded) {
      return (
        <div className="dropdown--menu-container" style={this.menuStyle}>
          <FancyScrollbar autoHide={false} autoHeight={true} maxHeight={240}>
            <div className="dropdown--menu">
              {React.Children.map(children, (child: JSX.Element) =>
                React.cloneElement(child, {
                  ...child.props,
                  selected: child.props.text === selectedItem,
                  onClick: this.handleItemClick(child.props.text),
                })
              )}
            </div>
          </FancyScrollbar>
        </div>
      )
=======
    const {children} = this.props
    const {expanded} = this.state

    if (expanded) {
      return <div className="dropdown--menu">{children}</div>
>>>>>>> WIP Introduce new components for dropdowns
    }

    return null
  }
<<<<<<< HEAD

  private get menuStyle(): CSSProperties {
    const {wrapText} = this.props
    const {width, top, height, left} = this.containerRef.getBoundingClientRect()

    if (wrapText) {
      return {
        top: `${top + height}px`,
        left: `${left}px`,
        width: `${width}px`,
      }
    }

    return {
      top: `${top + height}px`,
      left: `${left}px`,
      minWidth: `${width}px`,
    }
  }

  private handleItemClick = (value: any) => () => {
    const {onChange} = this.props
    onChange(value)
    this.collapseMenu()
  }
=======
>>>>>>> WIP Introduce new components for dropdowns
}

export default Dropdown
