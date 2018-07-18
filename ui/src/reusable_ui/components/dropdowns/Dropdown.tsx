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
}

interface State {
  expanded: boolean
}

@ErrorHandling
class Dropdown extends Component<Props, State> {
  public static defaultProps = {
    color: ComponentColor.Default,
    size: ComponentSize.Small,
    disabled: false,
    width: 120,
    wrapText: false,
  }

  private containerRef: HTMLElement

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
        <div
          className={this.containerClassName}
          style={{width}}
          ref={el => (this.containerRef = el)}
        >
          {this.button}
          {this.menu}
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
      </div>
    )
  }

  private get icon(): JSX.Element {
    const {icon} = this.props

    if (icon) {
      return <span className={`dropdown--icon icon ${icon}`} />
    }

    return null
  }

  private get menu(): JSX.Element {
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
    }

    return null
  }

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
}

export default Dropdown
