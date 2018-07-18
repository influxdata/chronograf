<<<<<<< HEAD
<<<<<<< HEAD
import React, {Component} from 'react'
import classnames from 'classnames'

interface Props {
  text: string
  selected?: boolean
  checkbox?: boolean
  onClick?: (value: any) => void
  value: any
}

class DropdownItem extends Component<Props> {
  public static defaultProps = {
    checkbox: false,
    selected: false,
  }

  public render() {
    const {text, selected, checkbox} = this.props

    return (
      <div
        className={classnames('dropdown--item', {
          active: selected,
          'multi-select--item': checkbox,
        })}
        onClick={this.handleClick}
      >
        {this.checkBox}
        {this.dot}
        {text}
      </div>
    )
  }

  private handleClick = () => {
    const {onClick, value} = this.props

    onClick(value)
  }

  private get checkBox(): JSX.Element {
    const {checkbox} = this.props

    if (checkbox) {
      return <div className="dropdown-item--checkbox" />
    }

    return null
  }

  private get dot(): JSX.Element {
    const {checkbox, selected} = this.props

    if (selected && !checkbox) {
      return <div className="dropdown-item--dot" />
    }
  }
}
=======
import React, {SFC} from 'react'
import {DropdownContext} from 'src/reusable_ui/components/dropdowns/Dropdown'
=======
import React, {Component} from 'react'
import classnames from 'classnames'
>>>>>>> WIP use wrapper and children for configuring dropdowns

interface Props {
  text: string
  selected?: boolean
  checkbox?: boolean
  onClick?: () => void
}

class DropdownItem extends Component<Props> {
  public static defaultProps = {
    checkbox: true,
    selected: false,
  }

  public render() {
    const {text, selected, onClick, checkbox} = this.props

    return (
      <div
        className={classnames('dropdown--item', {
          active: selected,
          'multi-select--item': checkbox,
        })}
        onClick={onClick}
      >
        {this.checkBox}
        {this.dot}
        {text}
      </div>
<<<<<<< HEAD
    )}
  </DropdownContext.Consumer>
)
>>>>>>> WIP Introduce new components for dropdowns
=======
    )
  }

  private get checkBox(): JSX.Element {
    const {checkbox} = this.props

    if (checkbox) {
      return <div className="dropdown-item--checkbox" />
    }

    return null
  }

  private get dot(): JSX.Element {
    const {checkbox, selected} = this.props

    if (selected && !checkbox) {
      return <div className="dropdown-item--dot" />
    }
  }
}
>>>>>>> WIP use wrapper and children for configuring dropdowns

export default DropdownItem
